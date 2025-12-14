// src/lib/bookings.ts
import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import type { BookingDoc, BookingStatus, PartyStatus } from "@/types/bookings";

const FINAL_STATUSES: BookingStatus[] = ["completed", "cancelled", "declined"];

/**
 * Returns the most recent "open" booking for this conversation, if any.
 * "Open" = not completed/cancelled/declined.
 */
export async function getOpenBookingForConversation(conversationId: string) {
  const snap = await getDocs(
    query(collection(db, "bookings"), where("conversationId", "==", conversationId))
  );

  const list = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  })) as BookingDoc[];

  const open = list
    .filter((b) => !FINAL_STATUSES.includes(b.status))
    .sort((a: any, b: any) => {
      const at = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
      const bt = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    })[0];

  return open ?? null;
}

/**
 * Create a new booking request (guest -> host).
 * Blocks if there is already an open booking in the same conversation.
 */
export async function createBooking(input: {
  offerId: string;
  offerTitle?: string;
  conversationId: string;

  hostUid: string;
  guestUid: string;

  scheduledAt: Date;
  addressText: string;
  requirementsText: string;
}) {
  // ✅ Block creating multiple open bookings in same conversation
  const existingOpen = await getOpenBookingForConversation(input.conversationId);
  if (existingOpen) {
    const err: any = new Error(
      "A booking already exists for this conversation. Finish or cancel it before creating a new one."
    );
    err.code = "booking-open-exists";
    err.bookingId = existingOpen.id;
    throw err;
  }

  const bookingBase = {
    offerId: input.offerId,
    conversationId: input.conversationId,
    hostUid: input.hostUid,
    guestUid: input.guestUid,
    participantIds: [input.hostUid, input.guestUid],

    scheduledAt: Timestamp.fromDate(input.scheduledAt),
    addressText: input.addressText.trim(),
    requirementsText: input.requirementsText.trim(),

    offerSnapshot: {
      title: input.offerTitle ?? "",
      coverImageURL: null,
    },

    // ✅ starts as requested until seller accepts
    status: "requested" as BookingStatus,
    guestStatus: "requested" as PartyStatus,
    hostStatus: "requested" as PartyStatus,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "bookings"), bookingBase);

  // optional convenience
  await updateDoc(doc(db, "conversations", input.conversationId), {
    latestBookingId: ref.id,
    updatedAt: serverTimestamp(),
  });

  console.log("[booking] created:", ref.id);
  return ref.id;
}

/**
 * Host accepts a requested booking -> becomes scheduled (active)
 */
export async function acceptBooking(params: { bookingId: string; uid: string }) {
  const { bookingId, uid } = params;

  const ref = doc(db, "bookings", bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");

  const b = snap.data() as BookingDoc;

  if (uid !== b.hostUid) throw new Error("Only the seller (host) can accept.");
  if (b.status !== "requested") throw new Error("Booking is not in requested state.");
  if (FINAL_STATUSES.includes(b.status)) throw new Error("Booking is already final.");

  await updateDoc(ref, {
    status: "scheduled" as BookingStatus,
    hostStatus: "scheduled" as PartyStatus,
    guestStatus: "scheduled" as PartyStatus,
    updatedAt: serverTimestamp(),
  });

  console.log("[booking] accepted:", bookingId);
}

/**
 * Host declines a requested booking -> declined (final)
 */
export async function declineBooking(params: { bookingId: string; uid: string }) {
  const { bookingId, uid } = params;

  const ref = doc(db, "bookings", bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");

  const b = snap.data() as BookingDoc;

  if (uid !== b.hostUid) throw new Error("Only the seller (host) can decline.");
  if (b.status !== "requested") throw new Error("Booking is not in requested state.");
  if (FINAL_STATUSES.includes(b.status)) throw new Error("Booking is already final.");

  await updateDoc(ref, {
    status: "declined" as BookingStatus,
    updatedAt: serverTimestamp(),
  });

  console.log("[booking] declined:", bookingId);
}

/**
 * Either party cancels a booking (requested or scheduled).
 * Cancelled is final.
 */
export async function cancelBooking(params: { bookingId: string; uid: string }) {
  const { bookingId, uid } = params;

  const ref = doc(db, "bookings", bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");

  const b = snap.data() as BookingDoc;

  const isGuest = uid === b.guestUid;
  const isHost = uid === b.hostUid;
  if (!isGuest && !isHost) throw new Error("Not allowed");

  if (FINAL_STATUSES.includes(b.status)) {
    throw new Error("Booking is already final.");
  }

  await updateDoc(ref, {
    status: "cancelled" as BookingStatus,
    guestStatus: "cancelled" as PartyStatus,
    hostStatus: "cancelled" as PartyStatus,
    updatedAt: serverTimestamp(),
  });

  console.log("[booking] cancelled:", bookingId);
}

/**
 * After scheduled time has passed, each party can confirm completion.
 * - First confirmation -> completed_pending_confirmation
 * - Second confirmation -> completed
 */
export async function confirmBookingCompleted(params: {
  bookingId: string;
  uid: string;
}) {
  const { bookingId, uid } = params;

  const ref = doc(db, "bookings", bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found");

  const b = snap.data() as BookingDoc;

  const isGuest = uid === b.guestUid;
  const isHost = uid === b.hostUid;
  if (!isGuest && !isHost) throw new Error("Not allowed");

  if (FINAL_STATUSES.includes(b.status)) {
    throw new Error("Booking is already final.");
  }

  if (b.status !== "scheduled" && b.status !== "completed_pending_confirmation") {
    throw new Error("Booking must be scheduled to confirm completion.");
  }

  const nextGuestStatus: PartyStatus =
    isGuest ? "completed" : (b.guestStatus ?? "scheduled");
  const nextHostStatus: PartyStatus =
    isHost ? "completed" : (b.hostStatus ?? "scheduled");

  const bothCompleted = nextGuestStatus === "completed" && nextHostStatus === "completed";

  await updateDoc(ref, {
    guestStatus: nextGuestStatus,
    hostStatus: nextHostStatus,
    status: (bothCompleted
      ? "completed"
      : "completed_pending_confirmation") as BookingStatus,
    updatedAt: serverTimestamp(),
  });

  console.log("[booking] completion confirmed:", bookingId, "both?", bothCompleted);
}

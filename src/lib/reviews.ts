// src/lib/reviews.ts
import { db } from "@/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export type ReviewRole = "buyer" | "seller";

export async function submitBookingReview(params: {
  bookingId: string;
  offerId: string;
  authorUid: string;
  targetUid: string;
  role: ReviewRole; // role of the author in the booking
  rating: number; // 1..5
  comment: string;
}) {
  const { bookingId, offerId, authorUid, targetUid, role, rating, comment } =
    params;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const trimmed = comment.trim();
  if (!trimmed) throw new Error("Comment cannot be empty.");

  const bookingRef = doc(db, "bookings", bookingId);
  const reviewsCol = collection(db, "reviews");
  const reviewRef = doc(reviewsCol); // create ID client-side

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists()) throw new Error("Booking not found.");

    const b = snap.data() as any;

    // Must be completed before reviews are allowed
    if (b.status !== "completed") {
      throw new Error("Booking must be completed before leaving a review.");
    }

    // Determine which booking field to lock
    const reviewField = role === "buyer" ? "buyerReviewId" : "sellerReviewId";

    if (b[reviewField]) {
      throw new Error("You already submitted a review for this booking.");
    }

    // Safety: author must match booking side
    const isBuyer = authorUid === b.guestUid;
    const isSeller = authorUid === b.hostUid;

    if (role === "buyer" && !isBuyer) throw new Error("Not allowed.");
    if (role === "seller" && !isSeller) throw new Error("Not allowed.");

    tx.set(reviewRef, {
      bookingId,
      offerId,
      authorUid,
      targetUid,
      role, // buyer or seller (author’s role)
      rating,
      comment: trimmed,
      createdAt: serverTimestamp(),
    });

    tx.update(bookingRef, {
      [reviewField]: reviewRef.id,  
      updatedAt: serverTimestamp(),
    });
  });

  return reviewRef.id;
}

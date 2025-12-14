// src/types/bookings.ts
import type { Timestamp } from "firebase/firestore";

export type BookingStatus =
  | "requested"
  | "scheduled"
  | "declined"
  | "cancelled"
  | "completed_pending_confirmation"
  | "completed";

export type PartyStatus = "requested" | "scheduled" | "cancelled" | "completed";

export type BookingDoc = {
  id: string;

  offerId: string;
  conversationId: string;

  hostUid: string;
  guestUid: string;
  participantIds: string[];

  // booking content
  scheduledAt: Timestamp;
  addressText: string;
  requirementsText: string;

  // denormalized display (optional, but nice)
  offerSnapshot?: {
    title?: string;
    coverImageURL?: string | null;
  };

  status: BookingStatus;

  guestStatus: PartyStatus;
  hostStatus: PartyStatus;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

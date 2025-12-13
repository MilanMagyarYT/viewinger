import type { Timestamp } from "firebase/firestore";

export type ConversationStatus = "open" | "archived" | "blocked";

export type ConversationDoc = {
  id: string;

  hostUid: string;
  guestUid: string;
  participantIds: string[]; // [hostUid, guestUid]

  offerId: string;
  offerTitle: string;
  offerCoverImageURL: string | null;

  lastMessageText: string;
  lastMessageSenderUid: string | null;
  lastMessageAt: Timestamp | null;

  unreadCountByUser: Record<string, number>;

  status: ConversationStatus;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type MessageDoc = {
  id: string;
  conversationId: string;
  senderUid: string;
  text: string;
  createdAt: Timestamp | null;
};

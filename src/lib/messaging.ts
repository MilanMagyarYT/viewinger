"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  increment,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { ConversationDoc, MessageDoc } from "@/types/messaging";

type CreateConversationInput = {
  offerId: string;
  offerTitle: string;
  offerCoverImageURL?: string | null;
  hostUid: string;
  guestUid: string;
};

export async function getOrCreateConversation({
  offerId,
  offerTitle,
  offerCoverImageURL = null,
  hostUid,
  guestUid,
}: CreateConversationInput): Promise<string> {
  // 1) Find existing conversation for (offerId, hostUid, guestUid)
  const convQ = query(
    collection(db, "conversations"),
    where("offerId", "==", offerId),
    where("hostUid", "==", hostUid),
    where("guestUid", "==", guestUid),
    limit(1)
  );

  const existing = await getDocs(convQ);
  if (!existing.empty) return existing.docs[0].id;

  // 2) Create new conversation
  const created = await addDoc(collection(db, "conversations"), {
    hostUid,
    guestUid,
    participantIds: [hostUid, guestUid],

    offerId,
    offerTitle: offerTitle || "Offer",
    offerCoverImageURL: offerCoverImageURL || null,

    lastMessageText: "",
    lastMessageSenderUid: null,
    lastMessageAt: null,

    unreadCountByUser: {
      [hostUid]: 0,
      [guestUid]: 0,
    },

    status: "open",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function sendMessage(args: {
  conversationId: string;
  senderUid: string;
  text: string;
  otherUid: string;
}) {
  const trimmed = args.text.trim();
  if (!trimmed) return;

  const convRef = doc(db, "conversations", args.conversationId);
  const msgRef = doc(collection(db, "conversations", args.conversationId, "messages"));

  const batch = writeBatch(db);

  batch.set(msgRef, {
    conversationId: args.conversationId,
    senderUid: args.senderUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  batch.update(convRef, {
    lastMessageText: trimmed,
    lastMessageSenderUid: args.senderUid,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCountByUser.${args.otherUid}`]: increment(1),
  });

  await batch.commit();
}

export async function markConversationRead(conversationId: string, uid: string) {
  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    [`unreadCountByUser.${uid}`]: 0,
  });
}

/** Optional: convenience listener for messages */
export function listenMessages(
  conversationId: string,
  onData: (messages: MessageDoc[]) => void
): Unsubscribe {
  const qMsgs = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(qMsgs, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MessageDoc[];
    onData(list);
  });
}

/** Optional: convenience listener for conversations */
export function listenConversations(
  uid: string,
  onData: (conversations: ConversationDoc[]) => void
): Unsubscribe {
  const qConvs = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(qConvs, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ConversationDoc[];
    onData(list);
  });
}

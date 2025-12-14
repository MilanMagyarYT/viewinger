// src/app/message/[conversationId]/page.tsx
"use client";

import * as React from "react";
import { Box, Container, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

import MessagesLayout from "../MessageLayout";
import ConversationsList from "../ConversationsList";
import ChatThread from "../ChatThread";
import MessageComposer from "../MessageComposer";
import { markConversationRead, sendMessage } from "@/lib/messaging";
import type { ConversationDoc } from "@/types/messaging";
import BookOfferDialog from "../BookOfferDialog";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const router = useRouter();
  const { conversationId } = React.use(params);

  const [uid, setUid] = React.useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  const [conversation, setConversation] =
    React.useState<ConversationDoc | null>(null);
  const [loadingConv, setLoadingConv] = React.useState(true);

  const [text, setText] = React.useState("");

  // booking dialog
  const [bookOpen, setBookOpen] = React.useState(false);
  const [offerTitle, setOfferTitle] = React.useState<string | undefined>(
    undefined
  );

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/authentication/sign-in");
      } else {
        setUid(u.uid);
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [router]);

  React.useEffect(() => {
    if (!uid) return;

    const load = async () => {
      setLoadingConv(true);
      try {
        const snap = await getDoc(doc(db, "conversations", conversationId));
        if (!snap.exists()) {
          setConversation(null);
          return;
        }
        const c = { id: snap.id, ...(snap.data() as any) } as ConversationDoc;

        if (!c.participantIds?.includes(uid)) {
          router.replace("/messages");
          return;
        }

        setConversation(c);

        // mark as read on open
        await markConversationRead(conversationId, uid);

        // optional: fetch offer title for booking dialog
        if (c.offerId) {
          const offerSnap = await getDoc(doc(db, "offers", c.offerId));
          if (offerSnap.exists()) {
            const d = offerSnap.data() as any;
            setOfferTitle(d.title ?? undefined);
          }
        }
      } finally {
        setLoadingConv(false);
      }
    };

    load();
  }, [conversationId, uid, router]);

  if (loadingAuth || !uid || loadingConv) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!conversation) {
    return (
      <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: COLORS.white }}>
        <MenuBar />
        <Container maxWidth="lg" sx={{ mt: 16 }}>
          Conversation not found.
        </Container>
      </Box>
    );
  }

  const otherUid =
    uid === conversation.hostUid ? conversation.guestUid : conversation.hostUid;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");
    await sendMessage({
      conversationId,
      senderUid: uid,
      otherUid,
      text: trimmed,
    });
  };

  const canBook = uid === conversation.guestUid; // guest initiates booking (MVP)

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: COLORS.white,
        overflowX: "hidden",
      }}
    >
      <MenuBar />

      <Box sx={{ bgcolor: COLORS.navyDark, pt: 6, pb: 4, mt: "3rem" }}>
        <Container maxWidth="lg">
          <SearchBreadcrumb current={`Messages`} />
        </Container>
      </Box>

      <Container maxWidth="lg">
        <MessagesLayout
          left={<ConversationsList activeConversationId={conversationId} />}
          right={
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <ChatThread
                conversationId={conversationId}
                currentUid={uid}
                offerId={conversation.offerId}
                onBookClick={canBook ? () => setBookOpen(true) : undefined}
              />
              <MessageComposer
                value={text}
                onChange={setText}
                onSend={handleSend}
                disabled={!text.trim()}
              />
            </Box>
          }
        />
      </Container>

      <BookOfferDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        conversation={conversation}
        currentUid={uid}
        offerTitle={offerTitle}
      />
    </Box>
  );
}

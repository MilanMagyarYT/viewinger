"use client";

import * as React from "react";
import { Box, Typography, Divider, Stack, Button } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useRouter } from "next/navigation";
import type { MessageDoc } from "@/types/messaging";
import { listenMessages } from "@/lib/messaging";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

function MessageBubble({ mine, text }: { mine: boolean; text: string }) {
  return (
    <Box
      sx={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "78%",
        bgcolor: mine ? COLORS.navyDark : "rgba(0,0,0,0.05)",
        color: mine ? "#fff" : COLORS.navyDark,
        borderRadius: "16px",
        px: 2,
        py: 1.25,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function ChatThread({
  conversationId,
  currentUid,
  offerId,
}: {
  conversationId: string;
  currentUid: string;
  offerId?: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<MessageDoc[]>([]);

  React.useEffect(() => {
    const unsub = listenMessages(conversationId, setMessages);
    return () => unsub();
  }, [conversationId]);

  const handleViewOffer = () => {
    if (!offerId) return;
    window.open(
      `/search-for-offers/${offerId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <Box
      sx={{
        height: { xs: "60vh", md: "72vh" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: COLORS.navyDark }}>
              Conversation
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              Text-only messaging
            </Typography>
          </Box>

          <Button
            onClick={handleViewOffer}
            disabled={!offerId}
            startIcon={<OpenInNewRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "999px",
              px: 2,
              whiteSpace: "nowrap",
              color: COLORS.navyDark,
              bgcolor: "rgba(45,50,80,0.06)",
              "&:hover": { bgcolor: "rgba(45,50,80,0.10)" },
            }}
          >
            View Offer
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "#fff",
        }}
      >
        <Stack spacing={1.25}>
          {messages.length === 0 ? (
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              No messages yet — say hello 👋
            </Typography>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                mine={m.senderUid === currentUid}
                text={m.text}
              />
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
}

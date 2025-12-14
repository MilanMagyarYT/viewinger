// src/app/message/ChatThread.tsx
"use client";

import * as React from "react";
import { Box, Typography, Divider, Stack, Button } from "@mui/material";
import type { MessageDoc } from "@/types/messaging";
import { listenMessages } from "@/lib/messaging";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoDisturbOnRoundedIcon from "@mui/icons-material/DoDisturbOnRounded";

import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import type { BookingDoc, BookingStatus } from "@/types/bookings";
import { acceptBooking, declineBooking } from "@/lib/bookings";

const FINAL_STATUSES: BookingStatus[] = ["completed", "cancelled", "declined"];

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

function pickOpenBooking(list: BookingDoc[]) {
  const open = list
    .filter((b) => !FINAL_STATUSES.includes(b.status))
    .sort((a: any, b: any) => {
      const at = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
      const bt = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    })[0];

  return open ?? null;
}

function prettyStatus(status?: BookingStatus | null) {
  switch (status) {
    case "requested":
      return "Requested";
    case "scheduled":
      return "Active";
    case "completed_pending_confirmation":
      return "Pending confirmation";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "declined":
      return "Declined";
    default:
      return "—";
  }
}

export default function ChatThread({
  conversationId,
  currentUid,
  offerId,
  onBookClick,
}: {
  conversationId: string;
  currentUid: string;
  offerId?: string | null;
  onBookClick?: () => void;
}) {
  const [messages, setMessages] = React.useState<MessageDoc[]>([]);

  // conversation meta (to know if current user is seller/host)
  const [hostUid, setHostUid] = React.useState<string | null>(null);
  const [guestUid, setGuestUid] = React.useState<string | null>(null);

  // booking state (live)
  const [openBooking, setOpenBooking] = React.useState<BookingDoc | null>(null);

  const [acting, setActing] = React.useState(false);

  React.useEffect(() => {
    const unsub = listenMessages(conversationId, setMessages);
    return () => unsub();
  }, [conversationId]);

  // Load conversation meta once (hostUid/guestUid)
  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "conversations", conversationId));
        if (!alive) return;
        if (snap.exists()) {
          const c = snap.data() as any;
          setHostUid(c.hostUid ?? null);
          setGuestUid(c.guestUid ?? null);
        } else {
          setHostUid(null);
          setGuestUid(null);
        }
      } catch (e) {
        console.error("Failed to load conversation meta:", e);
        if (!alive) return;
        setHostUid(null);
        setGuestUid(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [conversationId]);

  // Live listen to bookings for this conversation
  React.useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("conversationId", "==", conversationId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as BookingDoc[];

        setOpenBooking(pickOpenBooking(list));
      },
      (err) => {
        console.error("Failed to listen bookings:", err);
        setOpenBooking(null);
      }
    );

    return () => unsub();
  }, [conversationId]);

  const isHost = !!hostUid && currentUid === hostUid;
  const isGuest = !!guestUid && currentUid === guestUid;

  const handleViewOffer = () => {
    if (!offerId) return;
    window.open(
      `/search-for-offers/${offerId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const bookingBlocksNew =
    !!openBooking &&
    !FINAL_STATUSES.includes(openBooking.status) &&
    (openBooking.status === "requested" ||
      openBooking.status === "scheduled" ||
      openBooking.status === "completed_pending_confirmation");

  const showHostRequestActions = isHost && openBooking?.status === "requested";

  const handleAccept = async () => {
    if (!openBooking) return;
    try {
      setActing(true);
      await acceptBooking({ bookingId: openBooking.id, uid: currentUid });
    } catch (e) {
      console.error("Accept booking failed:", e);
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!openBooking) return;
    try {
      setActing(true);
      await declineBooking({ bookingId: openBooking.id, uid: currentUid });
    } catch (e) {
      console.error("Decline booking failed:", e);
    } finally {
      setActing(false);
    }
  };

  return (
    <Box
      sx={{
        height: { xs: "60vh", md: "72vh" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.navyDark }}>
              Conversation
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              Text-only messaging
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              onClick={handleViewOffer}
              disabled={!offerId}
              startIcon={<VisibilityOutlinedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "999px",
                color: COLORS.navyDark,
                border: `1px solid rgba(0,0,0,0.12)`,
                px: 2,
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              }}
              variant="outlined"
            >
              View Offer
            </Button>

            {/* Guest: Book Offer (disabled if open booking exists) */}
            {isGuest && (
              <Button
                onClick={onBookClick}
                startIcon={<EventAvailableOutlinedIcon />}
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: "999px",
                  px: 2,
                  backgroundColor: COLORS.accent,
                  color: COLORS.navyDark,
                  "&:hover": { backgroundColor: "#f6a76a" },
                }}
                disabled={!onBookClick || bookingBlocksNew}
              >
                {bookingBlocksNew
                  ? `Booking ${prettyStatus(openBooking?.status)}`
                  : "Book Offer"}
              </Button>
            )}

            {/* Host: Accept/Decline when there is a request */}
            {isHost && showHostRequestActions && (
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={handleAccept}
                  startIcon={<CheckRoundedIcon />}
                  variant="contained"
                  disabled={acting}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: "999px",
                    px: 2,
                    backgroundColor: COLORS.accent,
                    color: COLORS.navyDark,
                    "&:hover": { backgroundColor: "#f6a76a" },
                  }}
                >
                  Accept
                </Button>

                <Button
                  onClick={handleDecline}
                  startIcon={<DoDisturbOnRoundedIcon />}
                  variant="outlined"
                  disabled={acting}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    borderRadius: "999px",
                    px: 2,
                    color: COLORS.navyDark,
                    border: `1px solid rgba(0,0,0,0.12)`,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                  }}
                >
                  Decline
                </Button>
              </Stack>
            )}

            {/* Host: if there is an open booking but not a request, show a disabled status pill */}
            {isHost && !showHostRequestActions && openBooking && (
              <Button
                disabled
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  borderRadius: "999px",
                  px: 2,
                  color: "rgba(45,50,80,0.65)",
                  border: `1px solid rgba(0,0,0,0.10)`,
                }}
              >
                Booking {prettyStatus(openBooking.status)}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      <Divider />

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

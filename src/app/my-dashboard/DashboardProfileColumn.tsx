"use client";

import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useRouter } from "next/navigation";

import { auth, db } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export type DashboardProfileState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  languages: string;
  yearsOfExperience: string;
  bio: string;
  profileImage: string;
};

type Props = {
  profile: DashboardProfileState;
  isVerified: boolean;
  onEditProfile: () => void;
  onVerifyClick: () => void;
};

type ConversationListItem = {
  id: string;
  otherName: string;
  otherPhoto?: string;
  lastText: string;
  updatedAtLabel: string;
  unreadCount?: number;
};

function formatRelative(ts: any): string {
  try {
    const d: Date | null =
      ts?.toDate?.() instanceof Date
        ? (ts.toDate() as Date)
        : ts instanceof Date
        ? ts
        : null;

    if (!d) return "";

    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    const hr = Math.floor(diffMs / 3600000);
    const day = Math.floor(diffMs / 86400000);

    if (min < 60) return `${Math.max(1, min)}m`;
    if (hr < 24) return `${hr}h`;
    if (day < 7) return `${day}d`;

    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function DashboardProfileColumn({
  profile,
  isVerified,
  onEditProfile,
  onVerifyClick,
}: Props) {
  const router = useRouter();

  const [uid, setUid] = React.useState<string | null>(null);
  const [convos, setConvos] = React.useState<ConversationListItem[]>([]);

  // --- Watch auth (so this component can load conversations itself) ---
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  // --- Listen to latest conversations ---
  React.useEffect(() => {
    if (!uid) {
      setConvos([]);
      return;
    }

    // Needs index: participantIds (array-contains) + updatedAt desc
    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", uid),
      orderBy("updatedAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: ConversationListItem[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;

          const participants: any[] = Array.isArray(data.participants)
            ? data.participants
            : [];

          const other =
            participants.find((p) => p?.uid && p.uid !== uid) ?? null;

          const otherName =
            other?.name ||
            other?.displayName ||
            data.otherUserName ||
            "Conversation";

          const otherPhoto =
            other?.profileImage || other?.photoURL || data.otherUserPhoto || "";

          const lastText =
            data.lastMessageText ||
            data.lastMessagePreview ||
            data.lastMessage ||
            "No messages yet.";

          // unread counts map (supports a few names)
          const unreadMap =
            data.unreadCounts || data.unreadCountByUser || data.unreadCountMap;
          const unreadCount =
            typeof unreadMap?.[uid] === "number" ? unreadMap[uid] : 0;

          const updatedAtLabel = formatRelative(data.updatedAt);

          return {
            id: docSnap.id,
            otherName,
            otherPhoto,
            lastText,
            updatedAtLabel,
            unreadCount,
          };
        });

        setConvos(rows);
      },
      (err) => {
        console.error("Conversations listener error:", err);
        setConvos([]);
      }
    );

    return () => unsub();
  }, [uid]);

  const visibleConvos = convos.slice(0, 20);

  return (
    <Box>
      {/* Profile card */}
      <Paper
        elevation={6}
        sx={{
          borderRadius: "20px",
          p: 3,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
          mb: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: "999px",
            overflow: "hidden",
            mb: 2,
            bgcolor: COLORS.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            src={profile.profileImage || ""}
            alt={profile.name}
            sx={{
              width: "100%",
              height: "100%",
              fontSize: 40,
            }}
          >
            {profile.name?.charAt(0)}
          </Avatar>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {profile.name || "Your name"}
          </Typography>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: COLORS.accent,
            }}
          >
            <VerifiedIcon
              sx={{
                fontSize: 20,
              }}
            />
          </Box>
        </Stack>

        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}
        >
          {profile.email}
        </Typography>

        <Button
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            px: 3,
            mb: 1.5,
            backgroundColor: COLORS.accent,
            color: COLORS.navyDark,
            fontWeight: 600,
            "&:hover": { backgroundColor: "#f6a76a" },
          }}
          onClick={onEditProfile}
        >
          View profile
        </Button>

        <Button
          variant="outlined"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            px: 3,
            borderColor: COLORS.muted,
            color: COLORS.white,
            fontWeight: 500,
            "&:hover": {
              borderColor: COLORS.accent,
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
          onClick={onVerifyClick}
        >
          {isVerified ? "Verification details" : "Get verified"}
        </Button>
      </Paper>

      {/* Account overview placeholder */}
      <Paper
        elevation={4}
        sx={{
          borderRadius: "20px",
          p: 2.5,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Account overview
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          We’ll show your account stats here in a future update (views,
          bookings, response rate, etc.).
        </Typography>
      </Paper>

      {/* ✅ Conversations bubble */}
      <Paper
        elevation={4}
        sx={{
          borderRadius: "20px",
          p: 2.5,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
        }}
      >
        {/* Header row */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Conversations
          </Typography>

          <Button
            onClick={() => router.push("/messages")}
            sx={{
              textTransform: "none",
              color: COLORS.accent,
              fontWeight: 600,
              px: 1,
              minWidth: "auto",
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            View All
          </Button>
        </Stack>

        <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.14)" }} />

        {/* List area: fits ~3 rows, scroll if more */}
        <Box
          sx={{
            maxHeight: 210, // ~3 items
            overflowY: visibleConvos.length > 3 ? "auto" : "hidden",
            pr: visibleConvos.length > 3 ? 0.5 : 0,
          }}
        >
          {visibleConvos.length === 0 ? (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
              No conversations yet.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {visibleConvos.map((c) => {
                const hasUnread = (c.unreadCount ?? 0) > 0;

                return (
                  <Box
                    key={c.id}
                    onClick={() => router.push(`/messages/${c.id}`)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: "14px",
                      px: 1.25,
                      py: 1.1,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box sx={{ position: "relative", flexShrink: 0 }}>
                        <Avatar
                          src={c.otherPhoto || undefined}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: COLORS.navy,
                          }}
                        >
                          {c.otherName?.charAt(0) || "U"}
                        </Avatar>

                        {/* small unread dot */}
                        {hasUnread && (
                          <Box
                            sx={{
                              position: "absolute",
                              right: -1,
                              bottom: -1,
                              width: 12,
                              height: 12,
                              borderRadius: "999px",
                              bgcolor: COLORS.accent,
                              border: `2px solid ${COLORS.navyDark}`,
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="baseline"
                          spacing={1}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: hasUnread ? 700 : 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {c.otherName}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            {c.updatedAtLabel}
                          </Typography>
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255,255,255,0.75)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: hasUnread ? 600 : 400,
                          }}
                        >
                          {c.lastText}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

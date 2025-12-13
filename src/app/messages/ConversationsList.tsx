"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Divider,
  Stack,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { listenConversations } from "@/lib/messaging";
import type { ConversationDoc } from "@/types/messaging";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

type UserMini = { name: string; profileImage?: string };

export default function ConversationsList({
  activeConversationId,
}: {
  activeConversationId?: string | null;
}) {
  const router = useRouter();
  const [uid, setUid] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<ConversationDoc[]>(
    []
  );
  const userCacheRef = React.useRef<Map<string, UserMini>>(new Map());

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!uid) return;

    const unsub = listenConversations(uid, setConversations);
    return () => unsub();
  }, [uid]);

  const getOtherUid = (c: ConversationDoc) => {
    if (!uid) return c.hostUid;
    return uid === c.hostUid ? c.guestUid : c.hostUid;
  };

  const [tick, setTick] = React.useState(0);
  const ensureUser = React.useCallback(async (targetUid: string) => {
    if (userCacheRef.current.has(targetUid)) return;
    try {
      const snap = await getDoc(doc(db, "users", targetUid));
      if (snap.exists()) {
        const d = snap.data() as any;
        userCacheRef.current.set(targetUid, {
          name: d.name ?? d.displayName ?? d.legalName ?? "User",
          profileImage: d.profileImage ?? d.photoURL ?? "",
        });
      } else {
        userCacheRef.current.set(targetUid, { name: "User" });
      }
    } catch {
      userCacheRef.current.set(targetUid, { name: "User" });
    } finally {
      setTick((x) => x + 1);
    }
  }, []);

  React.useEffect(() => {
    if (!uid) return;
    conversations.forEach((c) => {
      const otherUid = getOtherUid(c);
      ensureUser(otherUid);
    });
  }, [conversations, uid, ensureUser]);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (!uid) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.navyDark }}>
          Messages
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.muted, mt: 1 }}>
          Please sign in to view your messages.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 800, color: COLORS.navyDark }}>
          Messages
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.muted }}>
          Your conversations
        </Typography>
      </Box>
      <Divider />

      {conversations.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            No conversations yet.
          </Typography>
        </Box>
      ) : (
        <Stack>
          {conversations.map((c) => {
            const otherUid = getOtherUid(c);
            const other = userCacheRef.current.get(otherUid);
            const unread = (c.unreadCountByUser?.[uid] ?? 0) > 0;

            const isActive = c.id === activeConversationId;

            return (
              <Box
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                sx={{
                  cursor: "pointer",
                  px: 2,
                  py: 1.5,
                  borderLeft: isActive
                    ? `4px solid ${COLORS.accent}`
                    : "4px solid transparent",
                  bgcolor: isActive ? "rgba(0,0,0,0.03)" : "transparent",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={other?.profileImage || undefined}
                    sx={{ width: 40, height: 40, bgcolor: COLORS.navy }}
                  >
                    {(other?.name?.charAt(0) || "U").toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        sx={{
                          fontWeight: unread ? 800 : 700,
                          color: COLORS.navyDark,
                        }}
                      >
                        {other?.name || "User"}
                      </Typography>

                      {unread && (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: COLORS.accent,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.offerTitle || "Offer"} ·{" "}
                      {c.lastMessageText
                        ? c.lastMessageText
                        : "No messages yet"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

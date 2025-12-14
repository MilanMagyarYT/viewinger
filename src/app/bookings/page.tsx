// src/app/bookings/page.tsx
"use client";

import * as React from "react";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Button,
} from "@mui/material";
import MenuBar from "@/components/MenuBar";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  getFirestore,
} from "firebase/firestore";

import VisibilityIcon from "@mui/icons-material/Visibility";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoDisturbOnRoundedIcon from "@mui/icons-material/DoDisturbOnRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

import LeaveReviewDialog from "./LeaveReviewDialog";

import {
  acceptBooking,
  declineBooking,
  cancelBooking,
  confirmBookingCompleted,
} from "@/lib/bookings";
import { submitBookingReview } from "@/lib/reviews";

type BookingStatus =
  | "requested"
  | "scheduled"
  | "declined"
  | "cancelled"
  | "completed_pending_confirmation"
  | "completed";

type PartyStatus = "requested" | "scheduled" | "cancelled" | "completed";

type BookingDoc = {
  id: string;
  offerId: string;
  conversationId: string;
  hostUid: string;
  guestUid: string;
  participantIds: string[];

  status?: BookingStatus;

  // NEW FIELDS
  guestStatus?: PartyStatus;
  hostStatus?: PartyStatus;

  // review fields (your reviews.ts writes these)
  buyerReviewId?: string | null;
  sellerReviewId?: string | null;

  scheduledAt?: any; // Firestore Timestamp
  updatedAt?: any;
  createdAt?: any;

  offerSnapshot?: { title?: string; coverImageURL?: string | null };
};

function toMillis(ts: any) {
  return ts?.toMillis?.() ?? 0;
}

function formatWhen(b: BookingDoc) {
  const d = b.scheduledAt?.toDate?.() as Date | undefined;
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status?: BookingStatus) {
  switch (status) {
    case "requested":
      return "Requested";
    case "scheduled":
      return "Scheduled";
    case "completed_pending_confirmation":
      return "Pending confirmation";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "declined":
      return "Declined";
    default:
      return status ? String(status) : "—";
  }
}

function isAfterScheduledPlusHours(b: BookingDoc, hours: number) {
  const ms = b.scheduledAt?.toMillis?.();
  if (!ms) return false;
  const cutoff = ms + hours * 60 * 60 * 1000;
  return Date.now() >= cutoff;
}

export default function BookingsPage() {
  const router = useRouter();
  const db = getFirestore();

  const [uid, setUid] = React.useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = React.useState(true);

  const [bookings, setBookings] = React.useState<BookingDoc[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [tab, setTab] = React.useState<
    "requested" | "active" | "completed" | "cancelled" | "declined"
  >("active");

  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] =
    React.useState<BookingDoc | null>(null);

  const refreshBookings = React.useCallback(
    async (currentUid: string) => {
      const snap = await getDocs(
        query(
          collection(db, "bookings"),
          where("participantIds", "array-contains", currentUid)
        )
      );

      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) } as BookingDoc))
        .sort(
          (a, b) =>
            (toMillis(b.updatedAt) || toMillis(b.createdAt)) -
            (toMillis(a.updatedAt) || toMillis(a.createdAt))
        );

      setBookings(list);
    },
    [db]
  );

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/authentication/sign-in");
      else setUid(u.uid);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [router]);

  React.useEffect(() => {
    if (!uid) return;

    const load = async () => {
      setLoading(true);
      try {
        await refreshBookings(uid);
      } catch (e) {
        console.error("Error loading bookings:", e);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [uid, refreshBookings]);

  if (loadingAuth || !uid || loading) {
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

  const requested = bookings.filter((b) => (b.status || "") === "requested");
  const active = bookings.filter((b) =>
    ["scheduled", "completed_pending_confirmation"].includes(b.status || "")
  );
  const completed = bookings.filter((b) => (b.status || "") === "completed");
  const cancelled = bookings.filter((b) => (b.status || "") === "cancelled");
  const declined = bookings.filter((b) => (b.status || "") === "declined");

  const visible =
    tab === "requested"
      ? requested
      : tab === "active"
      ? active
      : tab === "completed"
      ? completed
      : tab === "cancelled"
      ? cancelled
      : declined;

  const roleOf = (b: BookingDoc) =>
    (uid === b.hostUid ? "Seller" : "Buyer") as "Seller" | "Buyer";

  const canLeaveReview = (b: BookingDoc) => {
    if (b.status !== "completed") return false;
    const isBuyer = uid === b.guestUid;
    const isSeller = uid === b.hostUid;
    if (isBuyer) return !b.buyerReviewId;
    if (isSeller) return !b.sellerReviewId;
    return false;
  };

  const reviewTargetName = (b: BookingDoc) => {
    return uid === b.guestUid ? "Seller" : "Buyer";
  };

  const openReviewDialog = (b: BookingDoc) => {
    setSelectedReviewBooking(b);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async (payload: {
    rating: number;
    comment: string;
  }) => {
    if (!selectedReviewBooking) return;

    const b = selectedReviewBooking;
    const isBuyer = uid === b.guestUid;
    const isSeller = uid === b.hostUid;

    const role = isBuyer ? "buyer" : "seller";
    const targetUid = isBuyer ? b.hostUid : b.guestUid;

    await submitBookingReview({
      bookingId: b.id,
      offerId: b.offerId,
      authorUid: uid,
      targetUid,
      role,
      rating: payload.rating,
      comment: payload.comment,
    });

    await refreshBookings(uid);
  };

  // ---- Booking actions ----
  const handleAccept = async (b: BookingDoc) => {
    try {
      await acceptBooking({ bookingId: b.id, uid });
      await refreshBookings(uid);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || "Could not accept booking.");
    }
  };

  const handleDecline = async (b: BookingDoc) => {
    if (!confirm("Decline this booking request?")) return;
    try {
      await declineBooking({ bookingId: b.id, uid });
      await refreshBookings(uid);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || "Could not decline booking.");
    }
  };

  const handleCancel = async (b: BookingDoc) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await cancelBooking({ bookingId: b.id, uid });
      await refreshBookings(uid);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || "Could not cancel booking.");
    }
  };

  const handleConfirmCompleted = async (b: BookingDoc) => {
    try {
      await confirmBookingCompleted({ bookingId: b.id, uid });
      await refreshBookings(uid);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || "Could not confirm completion.");
    }
  };

  const hasConfirmedCompletion = (b: BookingDoc) => {
    if (uid === b.guestUid) return b.guestStatus === "completed";
    if (uid === b.hostUid) return b.hostStatus === "completed";
    return false;
  };

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
          <SearchBreadcrumb current="Bookings" />
          <Typography
            variant="h4"
            sx={{ color: COLORS.white, fontWeight: 800, mt: 1 }}
          >
            Bookings
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            Manage requests, active bookings, confirmations, and reviews.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper
          elevation={6}
          sx={{
            borderRadius: "20px",
            px: 3,
            py: 2,
            bgcolor: COLORS.navyDark,
            color: COLORS.white,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v)}
            textColor="inherit"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                minHeight: 0,
                py: 1,
              },
              "& .MuiTabs-indicator": {
                backgroundColor: COLORS.accent,
                height: 3,
                borderRadius: "999px",
              },
            }}
          >
            <Tab value="requested" label={`Requested (${requested.length})`} />
            <Tab value="active" label={`Active (${active.length})`} />
            <Tab value="completed" label={`Completed (${completed.length})`} />
            <Tab value="cancelled" label={`Cancelled (${cancelled.length})`} />
            <Tab value="declined" label={`Declined (${declined.length})`} />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {visible.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.muted }}>
                No bookings in this category.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {visible.map((b) => {
                  const title =
                    b.offerSnapshot?.title?.trim() ||
                    `Offer ${b.offerId || "—"}`;

                  const isSeller = uid === b.hostUid;
                  const isBuyer = uid === b.guestUid;

                  const showAcceptDecline =
                    isSeller && b.status === "requested";
                  const showCancel =
                    (b.status === "requested" || b.status === "scheduled") &&
                    (isSeller || isBuyer);

                  const canConfirm =
                    (b.status === "scheduled" ||
                      b.status === "completed_pending_confirmation") &&
                    isAfterScheduledPlusHours(b, 3);

                  const alreadyConfirmed = hasConfirmedCompletion(b);

                  const alreadyReviewed =
                    (uid === b.guestUid && !!b.buyerReviewId) ||
                    (uid === b.hostUid && !!b.sellerReviewId);

                  return (
                    <Paper
                      key={b.id}
                      elevation={0}
                      sx={{
                        borderRadius: "18px",
                        bgcolor: "#4b5285",
                        p: 1.75,
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontSize: 16, color: COLORS.white }}
                          >
                            Booking{" "}
                            <Box
                              component="span"
                              sx={{ color: COLORS.accent, fontWeight: 900 }}
                            >
                              #{b.id.slice(0, 6)}
                            </Box>
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {alreadyReviewed && (
                              <Chip
                                label="Reviewed"
                                size="small"
                                sx={{
                                  bgcolor: "rgba(246,167,106,0.20)",
                                  color: COLORS.white,
                                  fontWeight: 900,
                                  borderRadius: "999px",
                                }}
                              />
                            )}

                            <Chip
                              label={statusLabel(b.status)}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.10)",
                                color: COLORS.white,
                                fontWeight: 800,
                                borderRadius: "999px",
                              }}
                            />
                          </Stack>
                        </Stack>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900,
                            fontSize: 20,
                            color: COLORS.white,
                            mb: 0.25,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.85)" }}
                        >
                          {formatWhen(b)} • You are{" "}
                          <Box
                            component="span"
                            sx={{ color: COLORS.accent, fontWeight: 900 }}
                          >
                            {roleOf(b)}
                          </Box>
                        </Typography>

                        {/* Inline helper text for pending confirmation */}
                        {b.status === "completed_pending_confirmation" && (
                          <Typography
                            variant="body2"
                            sx={{ mt: 0.5, color: "rgba(255,255,255,0.75)" }}
                          >
                            One side confirmed completion. Waiting for the other
                            person.
                          </Typography>
                        )}
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexShrink: 0, alignItems: "center" }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: COLORS.white,
                            "&:hover": { color: COLORS.accent },
                          }}
                          onClick={() =>
                            router.push(`/search-for-offers/${b.offerId}`)
                          }
                          aria-label="View offer"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          sx={{
                            color: COLORS.white,
                            "&:hover": { color: COLORS.accent },
                          }}
                          onClick={() =>
                            router.push(`/message/${b.conversationId}`)
                          }
                          aria-label="Open chat"
                        >
                          <QuestionAnswerIcon fontSize="small" />
                        </IconButton>

                        {/* Seller: Accept / Decline request */}
                        {showAcceptDecline && (
                          <>
                            <Button
                              onClick={() => handleAccept(b)}
                              startIcon={<CheckRoundedIcon />}
                              variant="contained"
                              sx={{
                                ml: 0.5,
                                bgcolor: COLORS.accent,
                                color: COLORS.navyDark,
                                fontWeight: 900,
                                textTransform: "none",
                                borderRadius: "999px",
                                px: 2,
                                "&:hover": { bgcolor: "#f6a76a" },
                              }}
                            >
                              Accept
                            </Button>

                            <Button
                              onClick={() => handleDecline(b)}
                              startIcon={<DoDisturbOnRoundedIcon />}
                              variant="outlined"
                              sx={{
                                color: COLORS.white,
                                borderColor: "rgba(255,255,255,0.35)",
                                fontWeight: 900,
                                textTransform: "none",
                                borderRadius: "999px",
                                px: 2,
                                "&:hover": {
                                  borderColor: COLORS.accent,
                                  bgcolor: "rgba(255,255,255,0.06)",
                                },
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {/* Cancel (requested/scheduled) */}
                        {showCancel && (
                          <IconButton
                            size="small"
                            sx={{
                              color: "#ffb4b4",
                              "&:hover": { color: "#ff8a80" },
                            }}
                            onClick={() => handleCancel(b)}
                            aria-label="Cancel booking"
                          >
                            <CancelRoundedIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* Confirm completion (after scheduled time + 3 hours) */}
                        {canConfirm && b.status !== "completed" && (
                          <Button
                            onClick={() => handleConfirmCompleted(b)}
                            startIcon={<CheckRoundedIcon />}
                            variant="contained"
                            disabled={alreadyConfirmed}
                            sx={{
                              ml: 0.5,
                              bgcolor: COLORS.accent,
                              color: COLORS.navyDark,
                              fontWeight: 900,
                              textTransform: "none",
                              borderRadius: "999px",
                              px: 2,
                              "&:hover": { bgcolor: "#f6a76a" },
                            }}
                          >
                            {alreadyConfirmed ? "Confirmed" : "Mark completed"}
                          </Button>
                        )}

                        {/* Leave review only when COMPLETED and not reviewed by this side */}
                        {b.status === "completed" && canLeaveReview(b) && (
                          <Button
                            onClick={() => openReviewDialog(b)}
                            startIcon={<RateReviewIcon />}
                            variant="contained"
                            sx={{
                              ml: 0.5,
                              bgcolor: COLORS.accent,
                              color: COLORS.navyDark,
                              fontWeight: 900,
                              textTransform: "none",
                              borderRadius: "999px",
                              px: 2,
                              "&:hover": { bgcolor: "#f6a76a" },
                            }}
                          >
                            Leave review
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box sx={{ mt: 3, textAlign: "right" }}>
            <Button
              onClick={() => router.push("/messages")}
              variant="contained"
              sx={{
                backgroundColor: COLORS.accent,
                color: COLORS.navyDark,
                fontWeight: 900,
                textTransform: "none",
                borderRadius: "999px",
                px: 3,
                "&:hover": { backgroundColor: "#f6a76a" },
              }}
            >
              Go to messages
            </Button>
          </Box>
        </Paper>
      </Container>

      <LeaveReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={handleReviewSubmit}
        targetName={
          selectedReviewBooking
            ? reviewTargetName(selectedReviewBooking)
            : "User"
        }
        roleLabel={
          selectedReviewBooking ? roleOf(selectedReviewBooking) : "Buyer"
        }
      />
    </Box>
  );
}

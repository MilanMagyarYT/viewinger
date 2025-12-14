"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DoDisturbOnRoundedIcon from "@mui/icons-material/DoDisturbOnRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";

import type { BookingDoc, BookingStatus } from "@/types/bookings";
import {
  acceptBooking,
  cancelBooking,
  declineBooking,
  confirmBookingCompleted,
} from "@/lib/bookings";

type Props = {
  currentUid: string;
  bookings: BookingDoc[];
  loading: boolean;
  onViewAll: () => void;
  onOpenConversation: (conversationId: string) => void;
  onViewOffer: (offerId: string) => void;

  // ✅ so dashboard can refresh after actions
  onRefresh: () => Promise<void> | void;
};

function formatWhen(b: BookingDoc) {
  const d = (b as any).scheduledAt?.toDate?.() as Date | undefined;
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
      return status ? String(status) : "—";
  }
}

function isCompletionWindowOpen(b: BookingDoc) {
  const d = (b as any).scheduledAt?.toDate?.() as Date | undefined;
  if (!d) return false;

  // ✅ show completion button 3 hours after scheduled time
  const threeHoursMs = 3 * 60 * 60 * 1000;
  return Date.now() >= d.getTime() + threeHoursMs;
}

function BookingRow({
  b,
  currentUid,
  onViewOffer,
  onOpenConversation,
  onActionDone,
  onAskCancel,
}: {
  b: BookingDoc;
  currentUid: string;
  onViewOffer: (offerId: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onActionDone: () => Promise<void> | void;
  onAskCancel: (booking: BookingDoc) => void;
}) {
  const title = b.offerSnapshot?.title?.trim() || `Offer ${b.offerId || "—"}`;
  const isHost = currentUid === b.hostUid;
  const isGuest = currentUid === b.guestUid;

  const role = isHost ? "Seller" : "Buyer";

  const showAcceptDecline = isHost && b.status === "requested";
  const showCancel =
    (b.status === "requested" || b.status === "scheduled") &&
    (isHost || isGuest);

  const showCompleteBtn =
    (b.status === "scheduled" ||
      b.status === "completed_pending_confirmation") &&
    isCompletionWindowOpen(b);

  const iAlreadyConfirmed =
    (isGuest && b.guestStatus === "completed") ||
    (isHost && b.hostStatus === "completed");

  const handleAccept = async () => {
    await acceptBooking({ bookingId: b.id, uid: currentUid });
    await onActionDone();
  };

  const handleDecline = async () => {
    await declineBooking({ bookingId: b.id, uid: currentUid });
    await onActionDone();
  };

  const handleConfirmCompleted = async () => {
    await confirmBookingCompleted({ bookingId: b.id, uid: currentUid });
    await onActionDone();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "18px",
        bgcolor: "#4b5285",
        display: "flex",
        p: 1.75,
        gap: 2,
        overflow: "hidden",
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
              sx={{ color: COLORS.accent, fontWeight: 700 }}
            >
              #{b.id.slice(0, 6)}
            </Box>
          </Typography>

          <Chip
            label={statusLabel(b.status)}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.10)",
              color: COLORS.white,
              fontWeight: 600,
              borderRadius: "999px",
            }}
          />
        </Stack>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
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

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ color: "rgba(255,255,255,0.85)" }}
        >
          <Typography variant="body2" sx={{ color: COLORS.white }}>
            {formatWhen(b)}
          </Typography>
          <Box component="span" sx={{ color: "rgba(255,255,255,0.55)" }}>
            •
          </Box>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
            You are{" "}
            <Box
              component="span"
              sx={{ color: COLORS.accent, fontWeight: 700 }}
            >
              {role}
            </Box>
          </Typography>
        </Stack>

        {/* action buttons row */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap" }}>
          {showAcceptDecline && (
            <>
              <Button
                size="small"
                onClick={handleAccept}
                startIcon={<CheckRoundedIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: "999px",
                  px: 2,
                  fontWeight: 700,
                  bgcolor: COLORS.accent,
                  color: COLORS.navyDark,
                  "&:hover": { bgcolor: "#f6a76a" },
                }}
              >
                Accept
              </Button>

              <Button
                size="small"
                onClick={handleDecline}
                startIcon={<DoDisturbOnRoundedIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: "999px",
                  px: 2,
                  fontWeight: 700,
                  bgcolor: "rgba(255,255,255,0.10)",
                  color: COLORS.white,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
                }}
              >
                Decline
              </Button>
            </>
          )}

          {showCompleteBtn && (
            <Button
              size="small"
              onClick={handleConfirmCompleted}
              startIcon={<DoneAllRoundedIcon />}
              disabled={iAlreadyConfirmed}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                px: 2,
                fontWeight: 800,
                bgcolor: iAlreadyConfirmed
                  ? "rgba(255,255,255,0.10)"
                  : COLORS.accent,
                color: iAlreadyConfirmed
                  ? "rgba(255,255,255,0.75)"
                  : COLORS.navyDark,
                "&:hover": {
                  bgcolor: iAlreadyConfirmed
                    ? "rgba(255,255,255,0.10)"
                    : "#f6a76a",
                },
              }}
            >
              {iAlreadyConfirmed ? "Completed (waiting)" : "Is completed?"}
            </Button>
          )}

          {showCancel && (
            <Button
              size="small"
              onClick={() => onAskCancel(b)}
              startIcon={<CloseRoundedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: "999px",
                px: 2,
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.10)",
                color: COLORS.white,
                "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
              }}
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
        <IconButton
          size="small"
          sx={{ color: COLORS.white, "&:hover": { color: COLORS.accent } }}
          onClick={() => onViewOffer(b.offerId)}
          aria-label="View offer"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          sx={{ color: COLORS.white, "&:hover": { color: COLORS.accent } }}
          onClick={() => onOpenConversation(b.conversationId)}
          aria-label="Open chat"
        >
          <QuestionAnswerIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}

export default function DashboardBookingsColumn({
  currentUid,
  bookings,
  loading,
  onViewAll,
  onOpenConversation,
  onViewOffer,
  onRefresh,
}: Props) {
  const requested = bookings.filter((b) => b.status === "requested");
  const active = bookings.filter(
    (b) =>
      b.status === "scheduled" || b.status === "completed_pending_confirmation"
  );
  const cancelled = bookings.filter(
    (b) =>
      b.status === "cancelled" ||
      b.status === "declined" ||
      b.status === "completed"
  );

  const [cancelTarget, setCancelTarget] = React.useState<BookingDoc | null>(
    null
  );
  const [cancelSaving, setCancelSaving] = React.useState(false);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelSaving(true);
      await cancelBooking({ bookingId: cancelTarget.id, uid: currentUid });
      await onRefresh();
      setCancelTarget(null);
    } finally {
      setCancelSaving(false);
    }
  };

  return (
    <Box>
      {/* pill title */}
      <Box
        sx={{
          mb: 1.5,
          display: "inline-flex",
          px: 3,
          py: 1,
          borderRadius: "999px",
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
          Bookings
        </Typography>
      </Box>

      {/* main container */}
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
        {/* header row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </Typography>

          <Button
            variant="contained"
            onClick={onViewAll}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "999px",
              backgroundColor: COLORS.accent,
              color: COLORS.navyDark,
              fontWeight: 600,
              "&:hover": { backgroundColor: "#f6a76a" },
            }}
          >
            View All
          </Button>
        </Stack>

        {loading ? (
          <Box
            sx={{
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress sx={{ color: COLORS.accent }} />
          </Box>
        ) : bookings.length === 0 ? (
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            No bookings yet. When you book someone (or someone books you), it
            will show up here.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {/* Requested */}
            <Box>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                Requested{" "}
                <Box component="span" sx={{ color: COLORS.accent }}>
                  ({requested.length})
                </Box>
              </Typography>

              {requested.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  No requested bookings.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 3 * 150, overflowY: "auto", pr: 0.5 }}>
                  <Stack spacing={2}>
                    {requested.map((b) => (
                      <BookingRow
                        key={b.id}
                        b={b}
                        currentUid={currentUid}
                        onViewOffer={onViewOffer}
                        onOpenConversation={onOpenConversation}
                        onActionDone={onRefresh}
                        onAskCancel={setCancelTarget}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Active */}
            <Box sx={{ pt: 1 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                Active{" "}
                <Box component="span" sx={{ color: COLORS.accent }}>
                  ({active.length})
                </Box>
              </Typography>

              {active.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  No active bookings.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 3 * 150, overflowY: "auto", pr: 0.5 }}>
                  <Stack spacing={2}>
                    {active.map((b) => (
                      <BookingRow
                        key={b.id}
                        b={b}
                        currentUid={currentUid}
                        onViewOffer={onViewOffer}
                        onOpenConversation={onOpenConversation}
                        onActionDone={onRefresh}
                        onAskCancel={setCancelTarget}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Cancelled/Completed/Declined */}
            <Box sx={{ pt: 1 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                Cancelled / Completed{" "}
                <Box component="span" sx={{ color: COLORS.accent }}>
                  ({cancelled.length})
                </Box>
              </Typography>

              {cancelled.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  Nothing here yet.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 3 * 150, overflowY: "auto", pr: 0.5 }}>
                  <Stack spacing={2}>
                    {cancelled.map((b) => (
                      <BookingRow
                        key={b.id}
                        b={b}
                        currentUid={currentUid}
                        onViewOffer={onViewOffer}
                        onOpenConversation={onOpenConversation}
                        onActionDone={onRefresh}
                        onAskCancel={setCancelTarget}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Cancel confirm dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => (cancelSaving ? null : setCancelTarget(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.navyDark }}>
          Cancel booking?
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            Are you sure you want to cancel this booking? This action can’t be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setCancelTarget(null)}
            disabled={cancelSaving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: COLORS.navyDark,
            }}
          >
            Back
          </Button>
          <Button
            onClick={handleCancelConfirm}
            disabled={cancelSaving}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "999px",
              px: 3,
              bgcolor: COLORS.accent,
              color: COLORS.navyDark,
              "&:hover": { bgcolor: "#f6a76a" },
            }}
          >
            {cancelSaving ? "Cancelling..." : "Yes, cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

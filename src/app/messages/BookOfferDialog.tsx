// src/app/message/BookOfferDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { createBooking } from "@/lib/bookings";
import type { ConversationDoc } from "@/types/messaging";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function BookOfferDialog({
  open,
  onClose,
  conversation,
  currentUid,
  offerTitle,
}: {
  open: boolean;
  onClose: () => void;
  conversation: ConversationDoc;
  currentUid: string;
  offerTitle?: string;
}) {
  const isGuest = currentUid === conversation.guestUid;

  const [when, setWhen] = React.useState(() =>
    toDatetimeLocalValue(new Date())
  );
  const [address, setAddress] = React.useState("");
  const [requirements, setRequirements] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!isGuest) {
      setError("Only the guest can create a booking request.");
      return;
    }

    const dt = new Date(when);
    if (Number.isNaN(dt.getTime())) {
      setError("Please choose a valid date and time.");
      return;
    }
    if (!address.trim()) {
      setError("Please add the viewing address.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createBooking({
        offerId: conversation.offerId,
        offerTitle,
        conversationId: conversation.id,
        hostUid: conversation.hostUid,
        guestUid: conversation.guestUid,
        scheduledAt: dt,
        addressText: address,
        requirementsText: requirements,
      });

      onClose();
    } catch (e: any) {
      console.error(e);
      if (e?.code === "booking-open-exists") {
        setError(
          "There is already an open booking for this conversation. Please complete or cancel it before creating a new booking."
        );
      } else {
        setError("Could not create booking. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: COLORS.navyDark }}>
        Book offer
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            Fill in the details below. The seller will see this booking request.
          </Typography>

          <TextField
            label="Offer"
            value={offerTitle || `Offer ${conversation.offerId}`}
            fullWidth
            disabled
          />

          <TextField
            label="Date & time"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Viewing address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
          />

          <TextField
            label="Requirements / notes for the seller"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Anything important? (keys, questions, what to inspect, etc.)"
          />

          {error && (
            <Typography variant="body2" sx={{ color: "#B00020" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: COLORS.navyDark,
          }}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || !isGuest}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "999px",
            px: 3,
            backgroundColor: COLORS.accent,
            color: COLORS.navyDark,
            "&:hover": { backgroundColor: "#f6a76a" },
          }}
        >
          {saving ? "Booking..." : "Submit booking"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

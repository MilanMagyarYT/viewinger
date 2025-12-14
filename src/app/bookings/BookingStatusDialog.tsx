"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import type { BookingStatus } from "@/lib/bookings";

export default function BookingStatusDialog({
  open,
  onClose,
  onSubmit,
  currentStatus,
  roleLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (status: BookingStatus) => Promise<void> | void;
  currentStatus?: string;
  roleLabel: "Buyer" | "Seller";
}) {
  const [saving, setSaving] = React.useState(false);

  const handle = async (status: BookingStatus) => {
    try {
      setSaving(true);
      await onSubmit(status);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800, color: COLORS.navyDark }}>
        Update booking status
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.25 }}>
        <Typography sx={{ color: COLORS.muted, mb: 2 }}>
          You are the <b>{roleLabel}</b> in this booking.
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            Current status: <b>{currentStatus || "—"}</b>
          </Typography>

          <Typography variant="body2" sx={{ color: COLORS.muted, mt: 1 }}>
            Choose an action:
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: COLORS.navyDark,
          }}
        >
          Close
        </Button>

        <Button
          onClick={() => handle("cancelled")}
          disabled={saving}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "999px",
            borderColor: "rgba(0,0,0,0.15)",
            color: COLORS.navyDark,
            "&:hover": {
              borderColor: COLORS.accent,
              bgcolor: "rgba(246,167,106,0.12)",
            },
          }}
        >
          Cancel
        </Button>

        {roleLabel === "Seller" && (
          <Button
            onClick={() => handle("declined")}
            disabled={saving}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "999px",
              borderColor: "rgba(0,0,0,0.15)",
              color: "#B00020",
              "&:hover": {
                borderColor: "#B00020",
                bgcolor: "rgba(176,0,32,0.08)",
              },
            }}
          >
            Decline
          </Button>
        )}

        <Button
          onClick={() => handle("completed")}
          disabled={saving}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "999px",
            bgcolor: COLORS.accent,
            color: COLORS.navyDark,
            "&:hover": { bgcolor: "#f6a76a" },
          }}
        >
          Mark completed
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
  TextField,
  Rating,
  Box,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export default function LeaveReviewDialog({
  open,
  onClose,
  onSubmit,
  targetName,
  roleLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; comment: string }) => Promise<void>;
  targetName: string;
  roleLabel: "Buyer" | "Seller";
}) {
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Please write a short comment.");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({ rating, comment: trimmed });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Could not submit review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 900, color: COLORS.navyDark }}>
        Leave a review
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Typography sx={{ color: COLORS.muted }}>
            You are reviewing <b>{targetName}</b> as the <b>{roleLabel}</b>.
          </Typography>

          <Box>
            <Typography
              sx={{ fontWeight: 800, color: COLORS.navyDark, mb: 0.75 }}
            >
              Rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_e, val) => setRating(val || 5)}
              size="large"
            />
          </Box>

          <TextField
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder="How was the experience? What should others know?"
          />

          {error && (
            <Typography sx={{ color: "#B00020", fontWeight: 700 }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            color: COLORS.navyDark,
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 900,
            borderRadius: "999px",
            bgcolor: COLORS.accent,
            color: COLORS.navyDark,
            "&:hover": { bgcolor: "#f6a76a" },
            px: 3,
          }}
        >
          {saving ? "Submitting..." : "Submit review"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

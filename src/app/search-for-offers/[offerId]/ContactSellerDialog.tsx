// src/app/search-for-offers/[offerId]/ContactSellerDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { OfferDoc, HostProfile } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  offer: OfferDoc;
  host: HostProfile | null;
}

export default function ContactSellerDialog({
  open,
  onClose,
  offer,
  host,
}: Props) {
  const email = offer.contactEmail || host?.email;
  const phone = offer.contactPhone || host?.phone;
  const other = offer.contactOther;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: COLORS.navyDark }}>
        Contact {host?.name || "the seller"}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5, pb: 2 }}>
        <Typography variant="body2" sx={{ mb: 2, color: COLORS.muted }}>
          Use the contact details below to reach out about this offer and
          arrange your viewing.
        </Typography>

        <Stack spacing={1.5}>
          {email && (
            <Typography variant="body1">
              <strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a>
            </Typography>
          )}
          {phone && (
            <Typography variant="body1">
              <strong>Phone / WhatsApp:</strong>{" "}
              <a href={`tel:${phone}`}>{phone}</a>
            </Typography>
          )}
          {other && (
            <Typography variant="body1">
              <strong>Other details:</strong> {other}
            </Typography>
          )}
          {!email && !phone && !other && (
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              No specific contact information was saved with this offer. Please
              use the email address associated with this account.
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
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

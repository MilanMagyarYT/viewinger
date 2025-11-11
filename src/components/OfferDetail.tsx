"use client";

import * as React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

type Props = {
  offer: {
    id: string;
    name: string;
    title: string;
    description: string;
    city: string;
    area: number;
    price: number;
    currency: string;
    email: string;
    phone: string | null;
    imageURL: string;
    createdAt: import("firebase/firestore").Timestamp | null;
  };
};

export default function OfferDetail({ offer }: Props) {
  const created = offer.createdAt
    ? offer.createdAt.toDate().toLocaleDateString()
    : "";

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <Stack spacing={3}>
      {/* Hero card */}
      <Card>
        {!!offer.imageURL && (
          <CardMedia
            component="img"
            image={offer.imageURL}
            alt={`${offer.title || offer.name} — ${offer.city}`}
            sx={{ height: 360, objectFit: "cover" }}
          />
        )}
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h5">{offer.name || offer.title}</Typography>
            {offer.title && offer.name && (
              <Typography variant="subtitle1" color="text.secondary">
                {offer.title}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnIcon fontSize="small" />
                <Typography variant="body2">{offer.city}</Typography>
              </Stack>
              <Chip size="small" label={`+${offer.area} km`} />
              <Chip size="small" label={`${offer.price} ${offer.currency}`} />
              {created && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Listed: ${created}`}
                />
              )}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {offer.description}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Contact section */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Contact the lister</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Email */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flex: 1, minWidth: 260 }}
            >
              <EmailIcon fontSize="small" />
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {offer.email}
              </Typography>
              <Tooltip title="Copy email">
                <IconButton
                  size="small"
                  onClick={() => handleCopy(offer.email)}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="contained"
                href={`mailto:${
                  offer.email
                }?subject=Inquiry about ${encodeURIComponent(
                  offer.title || offer.name
                )}`}
              >
                Email
              </Button>
            </Stack>

            {/* Phone (optional) */}
            {offer.phone && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ flex: 1, minWidth: 260 }}
              >
                <PhoneIcon fontSize="small" />
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {offer.phone}
                </Typography>
                <Tooltip title="Copy phone">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(offer.phone!)}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  variant="outlined"
                  href={`tel:${offer.phone}`}
                >
                  Call
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}

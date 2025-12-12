// src/app/search-for-offers/[offerId]/OfferLeftColumn.tsx
"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { HostProfile, OfferDoc, PricingTier } from "./types";

const HARD_CODED_RATING = {
  score: 4.87,
  reviewsCount: 27,
};

const MOCK_REVIEWS = [
  {
    id: "r1",
    name: "James van Doren",
    country: "United Kingdom",
    rating: 5,
    avatarLetter: "J",
    comment:
      "Edina was incredibly thorough during my viewing. She noticed details I would have completely missed and sent me a very clear video report afterwards.",
    dateLabel: "February 2025",
  },
  {
    id: "r2",
    name: "Sara Müller",
    country: "Germany",
    rating: 4.8,
    avatarLetter: "S",
    comment:
      "Very responsive and friendly. I felt confident making a decision from abroad thanks to her notes and photos.",
    dateLabel: "January 2025",
  },
];

function formatPrice(price?: number | null) {
  if (price == null) return "";
  return `€${price}`;
}

interface Props {
  offer: OfferDoc;
  host: HostProfile | null;
  pricingTiers: PricingTier[];
  onContact: () => void;
}

export default function OfferLeftColumn({
  offer,
  host,
  pricingTiers,
  onContact,
}: Props) {
  const hostName = host?.name || "Host";

  const coverImageSrc =
    offer.portfolio?.coverImageURL ||
    offer.coverImageURL ||
    offer.imageURL ||
    "/images/placeholder-cover.jpg";

  const videoUrl = offer.portfolio?.videoURL ?? offer.videoUrl ?? null;

  return (
    <Box sx={{ flexBasis: { xs: "100%", md: "60%" }, flexGrow: 1 }}>
      {/* Title */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
      >
        {offer.title}
      </Typography>

      {/* Host summary */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: "16px",
          border: `1px solid rgba(0,0,0,0.06)`,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={host?.profileImage || undefined}
          alt={hostName}
          sx={{
            width: 56,
            height: 56,
            bgcolor: COLORS.navy,
            flexShrink: 0,
          }}
        >
          {(hostName && hostName.charAt(0)) || "H"}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: COLORS.muted, mb: 0.2 }}>
            Offer listed by
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {hostName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <StarRoundedIcon sx={{ fontSize: 18, color: "#FFC857" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {HARD_CODED_RATING.score.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              ({HARD_CODED_RATING.reviewsCount} reviews)
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {/* Cover image "carousel" */}
      <Box sx={{ mb: 4, position: "relative" }}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            component="img"
            src={coverImageSrc}
            alt={offer.title}
            sx={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Left/right buttons – no-op for now */}
          <IconButton
            sx={{
              position: "absolute",
              top: "50%",
              left: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(45,50,80,0.8)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(45,50,80,1)" },
            }}
            onClick={() => {}}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            sx={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(45,50,80,0.8)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(45,50,80,1)" },
            }}
            onClick={() => {}}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>

      {/* Reviews section (hard-coded for now) */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          What people wrote about this offer
        </Typography>

        {MOCK_REVIEWS.map((r) => (
          <Paper
            key={r.id}
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: `2px solid ${COLORS.navyDark}`,
              p: 2.5,
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: COLORS.navy,
                  flexShrink: 0,
                }}
              >
                {r.avatarLetter}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 0.5 }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {r.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      {r.country}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <StarRoundedIcon sx={{ fontSize: 18, color: "#FFC857" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.rating.toFixed(1)}
                    </Typography>
                  </Stack>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{
                    color: COLORS.muted,
                    mb: 1,
                  }}
                >
                  {r.comment}
                </Typography>

                <Typography variant="caption" sx={{ color: COLORS.muted }}>
                  {r.dateLabel}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      {/* About the offer */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1.5, color: COLORS.navyDark }}
        >
          About the offer
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 1.6,
            color: COLORS.muted,
            whiteSpace: "pre-line",
          }}
        >
          {offer.description}
        </Typography>
      </Box>

      {/* Get to know host */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          Get to know {hostName}
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 2 }}
          >
            <Avatar
              src={host?.profileImage || undefined}
              alt={hostName}
              sx={{
                width: 72,
                height: 72,
                bgcolor: COLORS.navy,
                flexShrink: 0,
              }}
            >
              {(hostName && hostName.charAt(0)) || "H"}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {hostName}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <StarRoundedIcon sx={{ fontSize: 20, color: "#FFC857" }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {HARD_CODED_RATING.score.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  ({HARD_CODED_RATING.reviewsCount} reviews)
                </Typography>
              </Stack>

              <Button
                variant="contained"
                sx={{
                  mt: 0.5,
                  backgroundColor: COLORS.accent,
                  color: COLORS.navyDark,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "999px",
                  px: 3,
                  "&:hover": { backgroundColor: "#f6a76a" },
                }}
                onClick={onContact}
              >
                Contact me
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="flex-start"
          >
            <Box sx={{ flexBasis: { sm: "40%" } }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                From
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {host?.baseCity && host?.baseCountry
                  ? `${host.baseCity}, ${host.baseCountry}`
                  : host?.baseCountry || host?.baseCity || "—"}
              </Typography>

              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Member since
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {host?.memberSinceLabel || "—"}
              </Typography>

              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Languages
              </Typography>
              <Typography variant="body1">
                {host?.languagesText || "—"}
              </Typography>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: "none", sm: "block" },
                borderColor: "rgba(0,0,0,0.08)",
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Personal description
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: COLORS.muted,
                  whiteSpace: "pre-line",
                }}
              >
                {host?.bio ||
                  "This host hasn’t written a bio yet, but they’re ready to help with your property viewing."}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Video introduction */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          Video introduction
        </Typography>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.08)",
            p: 2,
          }}
        >
          {videoUrl ? (
            <Box
              component="video"
              src={videoUrl}
              controls
              sx={{ width: "100%", borderRadius: "12px" }}
            />
          ) : (
            <Box
              sx={{
                height: 220,
                borderRadius: "12px",
                border: "2px dashed rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.muted,
                fontSize: 14,
              }}
            >
              Video introduction will appear here once added for this offer.
            </Box>
          )}
        </Paper>
      </Box>

      {/* Compare packages */}
      {pricingTiers.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
          >
            Compare packages
          </Typography>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.08)",
              p: 2,
            }}
          >
            <Stack spacing={2}>
              {pricingTiers.map((tier) => (
                <Box
                  key={tier.id}
                  sx={{
                    borderRadius: "12px",
                    px: 2,
                    py: 1.5,
                    bgcolor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    {(tier.name || tier.id).replace(/\b\w/g, (m) =>
                      m.toUpperCase()
                    )}{" "}
                    ·{" "}
                    <Box
                      component="span"
                      sx={{ color: COLORS.accent, fontWeight: 700 }}
                    >
                      {formatPrice(tier.price)}
                    </Box>
                  </Typography>
                  {tier.description && (
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      {tier.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 3, textAlign: "right" }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.navyDark,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "999px",
                  px: 4,
                  "&:hover": { backgroundColor: "#f6a76a" },
                }}
                onClick={onContact}
              >
                Contact seller
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

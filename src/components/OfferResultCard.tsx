// src/components/OfferResultCard.tsx
"use client";

import * as React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { StarRounded } from "@mui/icons-material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { OfferHit, ListerMeta } from "@/types/SearchPage";
import EuroIcon from "@mui/icons-material/Euro";

type OfferResultCardProps = {
  offer: OfferHit;
  meta?: ListerMeta;
  onOfferClick: () => void;
  onListerClick?: (uid: string | undefined) => void;
};

export default function OfferResultCard({
  offer,
  meta,
  onOfferClick,
  onListerClick,
}: OfferResultCardProps) {
  const isVerified = meta?.isVerified === true;
  const avatarSrc = meta?.profileImage || undefined;

  // placeholder rating UI
  const ratingValue = 4.5;
  const ratingCount = 27;

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onListerClick) onListerClick(offer.uid);
  };

  return (
    <Paper
      onClick={onOfferClick}
      sx={{
        backgroundColor: COLORS.navy,
        color: COLORS.white,
        borderRadius: "20px",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: 260, // reduced height (~25% less than the earlier tall card)
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        },
      }}
    >
      {/* Top 55%: cover image */}
      {offer.imageURL && (
        <Box
          component="img"
          src={offer.imageURL}
          alt={offer.title}
          sx={{
            width: "100%",
            height: "55%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Lister avatar overlay – sits on the border between image & content */}
      {avatarSrc && (
        <Box
          sx={{
            position: "absolute",
            right: 5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 76,
            height: 76,
            borderRadius: "50%",
            overflow: "hidden",
            border: `3px solid ${COLORS.navyDark}`,
            bgcolor: COLORS.navyDark,
          }}
        >
          <Box
            component="img"
            src={avatarSrc}
            alt={offer.listerName || "Lister"}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {/* Bottom 45%: content */}
      <Box
        sx={{
          flex: 1,
          px: 1.75,
          pt: 0.75,
          pb: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
        }}
      >
        {/* Name row with verification badge */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Verification icon styled similar to the design */}
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

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              cursor: onListerClick ? "pointer" : "default",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            onClick={onListerClick ? handleNameClick : undefined}
          >
            {offer.listerName}
          </Typography>
        </Stack>

        {/* Offer title / description */}
        <Typography
          variant="body2"
          sx={{
            color: COLORS.white,
            opacity: 0.9,
            lineHeight: 1.4,
            maxHeight: 44,
            overflow: "hidden",
          }}
        >
          {offer.title}
        </Typography>

        {/* Bottom row: rating on the left, price on the right */}
        <Box
          sx={{
            mt: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Rating */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <StarRounded fontSize="small" sx={{ color: COLORS.accent }} />
            <Typography
              variant="body2"
              sx={{ color: COLORS.accent, fontWeight: 600 }}
            >
              {ratingValue.toFixed(1)}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              ({ratingCount})
            </Typography>
          </Box>

          {/* Price */}
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 0.5,
            }}
          >
            <Typography variant="body2" sx={{ color: COLORS.muted }}>
              from
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: COLORS.accent,
                fontWeight: 700,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <EuroIcon
                sx={{
                  fontSize: "1.1rem", // roughly matches text height
                  mt: "1px", // tiny nudge so it aligns on the baseline
                }}
              />
              {offer.price}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

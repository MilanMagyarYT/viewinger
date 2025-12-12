// src/app/search-for-offers/[offerId]/OfferRightPricingCard.tsx
"use client";

import * as React from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  Typography,
  Button,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { PricingTier } from "./types";

function formatPrice(price?: number | null) {
  if (price == null) return "";
  return `€${price}`;
}

interface Props {
  pricingTiers: PricingTier[];
  selectedTierId: string | null;
  onSelectedTierChange: (id: string) => void;
  onContact: () => void;
}

export default function OfferRightPricingCard({
  pricingTiers,
  selectedTierId,
  onSelectedTierChange,
  onContact,
}: Props) {
  if (!pricingTiers.length) {
    return null;
  }

  const activeTier =
    pricingTiers.find((t) => t.id === selectedTierId) || pricingTiers[0];

  return (
    <Box
      sx={{
        flexBasis: { xs: "100%", md: "40%" },
        flexShrink: 0,
        position: { md: "sticky" },
        top: { md: 120 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          borderRadius: "20px",
          p: 2.5,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
        }}
      >
        {/* Tabs for Basic / Standard / Premium */}
        <Tabs
          value={activeTier.id}
          onChange={(_e, val) => onSelectedTierChange(val)}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              minHeight: 0,
              py: 1,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#f6a76a", // your custom color
              height: 3,
              borderRadius: "999px",
            },
          }}
        >
          {pricingTiers.map((tier) => (
            <Tab
              key={tier.id}
              label={(tier.name || tier.id).replace(/\b\w/g, (m) =>
                m.toUpperCase()
              )}
              value={tier.id}
            />
          ))}
        </Tabs>

        <Divider
          sx={{
            mb: 2,
            borderColor: "rgba(255,255,255,0.18)",
          }}
        />

        {/* Active tier content */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {formatPrice(activeTier.price)}
          </Typography>
          {activeTier.description && (
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.85)",
                mb: 1.5,
              }}
            >
              {activeTier.description}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            To come in contact with the seller, press the button below.
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 1,
            backgroundColor: COLORS.accent,
            color: COLORS.navyDark,
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "999px",
            py: 1,
            "&:hover": { backgroundColor: "#f6a76a" },
          }}
          onClick={onContact}
        >
          Contact seller
        </Button>
      </Paper>
    </Box>
  );
}

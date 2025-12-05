"use client";

import * as React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { OverviewState } from "./OfferOverviewStep";
import { PricingTier } from "./OfferPricingStep";
import { RequirementsState } from "./OfferRequirementsStep";
import { PortfolioState } from "./OfferPortfolioStep";

type Props = {
  overview: OverviewState;
  pricing: PricingTier[];
  requirements: RequirementsState;
  portfolio: PortfolioState;
};

export default function OfferPublishStep({
  overview,
  pricing,
  requirements,
  portfolio,
}: Props) {
  const enabledTiers = pricing.filter((t) => t.enabled);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Review & Publish
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Double-check the key details of your offer before publishing. You can
        always edit it later from your dashboard.
      </Typography>

      <Stack spacing={2.5}>
        {/* Overview summary */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Overview
          </Typography>
          <Typography variant="body2">
            <strong>Title:</strong> {overview.title || "—"}
          </Typography>
          <Typography variant="body2">
            <strong>Display name:</strong> {overview.displayName || "—"}
          </Typography>
          <Typography variant="body2">
            <strong>Location:</strong>{" "}
            {overview.city?.name
              ? `${overview.city.name}, ${overview.country?.name ?? ""}`
              : "—"}
          </Typography>
          <Typography variant="body2">
            <strong>Coverage radius:</strong>{" "}
            {overview.coverageRadiusKm.toFixed(1)} km
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {overview.description}
          </Typography>
        </Box>

        <Divider />

        {/* Pricing summary */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Pricing (EUR)
          </Typography>
          {enabledTiers.length === 0 ? (
            <Typography variant="body2">No pricing defined.</Typography>
          ) : (
            enabledTiers.map((tier) => (
              <Typography variant="body2" key={tier.id}>
                <strong>{tier.label}:</strong> {tier.price || "0"} €
                {tier.description ? ` – ${tier.description}` : ""}
              </Typography>
            ))
          )}
        </Box>

        <Divider />

        {/* Requirements */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Requirements
          </Typography>
          <Typography variant="body2">
            {requirements.requirementsText || "No specific requirements."}
          </Typography>
          {requirements.phone && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Contact phone:</strong> {requirements.phone}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Portfolio summary */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Portfolio
          </Typography>
          <Typography variant="body2">
            Cover image:{" "}
            {portfolio.coverImageFile || portfolio.coverImagePreviewUrl
              ? portfolio.coverImageFile?.name || "Selected"
              : "Not set"}
          </Typography>
          <Typography variant="body2">
            Intro video: {portfolio.videoFile ? portfolio.videoName : "None"}
          </Typography>
          <Typography variant="body2">
            PDF example: {portfolio.pdfFile ? portfolio.pdfName : "None"}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

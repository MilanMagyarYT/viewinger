"use client";

import * as React from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export type PricingTier = {
  id: "basic" | "standard" | "premium" | string;
  label: string;
  enabled: boolean;
  price: string; // keep as string for input
  description: string;
};

type Props = {
  tiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
};

export default function OfferPricingStep({ tiers, onChange }: Props) {
  const updateTier = (id: string, patch: Partial<PricingTier>) => {
    onChange(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const renderTier = (tier: PricingTier, required: boolean) => {
    const disabled = !tier.enabled && !required;

    return (
      <Paper
        key={tier.id}
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "16px",
          border: `1px solid ${
            tier.enabled || required ? COLORS.muted : "#E1E4F0"
          }`,
          backgroundColor: "#FFFFFF",
        }}
      >
        {!required && (
          <FormControlLabel
            control={
              <Checkbox
                checked={tier.enabled}
                onChange={(e) =>
                  updateTier(tier.id, { enabled: e.target.checked })
                }
              />
            }
            label={`Enable ${tier.label} package`}
          />
        )}

        <Box sx={{ mt: required ? 0 : 1.5 }}>
          <TextField
            label={`${tier.label} price (EUR)`}
            value={tier.price}
            onChange={(e) => updateTier(tier.id, { price: e.target.value })}
            type="number"
            fullWidth
            required={required}
            disabled={disabled}
          />

          <TextField
            label={`${tier.label} description`}
            value={tier.description}
            onChange={(e) =>
              updateTier(tier.id, { description: e.target.value })
            }
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1.5 }}
            disabled={disabled}
          />
        </Box>
      </Paper>
    );
  };

  const basic = tiers.find((t) => t.id === "basic")!;
  const standard = tiers.find((t) => t.id === "standard")!;
  const premium = tiers.find((t) => t.id === "premium")!;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Pricing
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Start with a Basic price. Optionally add Standard and Premium packages
        if you offer extra services.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          {renderTier(basic, true)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderTier(standard, false)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderTier(premium, false)}
        </Grid>
      </Grid>
    </Box>
  );
}

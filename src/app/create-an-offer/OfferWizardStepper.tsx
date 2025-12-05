"use client";

import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export const OFFER_STEPS = [
  { id: 0, label: "Overview" },
  { id: 1, label: "Pricing" },
  { id: 2, label: "Requirements" },
  { id: 3, label: "Portfolio" },
  { id: 4, label: "Publish" },
];

type Props = {
  activeStep: number;
};

export default function OfferWizardStepper({ activeStep }: Props) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {OFFER_STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isCompleted = step.id < activeStep;

        const circleBg = isActive
          ? "#F8BB84" // green accent for current step
          : isCompleted
          ? COLORS.white
          : "#D3D6E6";

        const circleColor = isActive
          ? "#ffffff"
          : isCompleted
          ? COLORS.navyDark
          : "#888CA5";

        const labelColor = isActive
          ? COLORS.navyDark
          : isCompleted
          ? COLORS.navyDark
          : "#A1A6BF";

        const labelWeight = isActive ? 700 : 500;

        return (
          <React.Fragment key={step.id}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  backgroundColor: circleBg,
                  color: circleColor,
                  border: isCompleted ? `2px solid #35c66b` : "none",
                }}
              >
                {step.id + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: labelColor,
                  fontWeight: labelWeight,
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {index < OFFER_STEPS.length - 1 && (
              <ChevronRightIcon sx={{ fontSize: 18, color: "#C3C7DA" }} />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

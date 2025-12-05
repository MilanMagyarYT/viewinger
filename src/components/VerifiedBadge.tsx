"use client";

import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type VerifiedBadgeProps = {
  isVerified: boolean;
  size?: "small" | "medium";
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = "small",
}) => {
  if (!isVerified) return null; // only render when verified

  const fontSize = size === "small" ? 11 : 13;
  const iconSize = size === "small" ? 16 : 18;
  const paddingX = size === "small" ? 0.75 : 1;
  const paddingY = size === "small" ? 0.1 : 0.25;

  return (
    <Tooltip title="Verified account: identity, contact and profile checked.">
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "999px",
          backgroundColor: "#E0F2FF",
          color: "#0F3EA3",
          px: paddingX,
          py: paddingY,
          gap: 0.5,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: iconSize }} />
        <Typography
          variant="caption"
          sx={{ fontSize, fontWeight: 600, textTransform: "uppercase" }}
        >
          Verified
        </Typography>
      </Box>
    </Tooltip>
  );
};

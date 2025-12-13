"use client";

import * as React from "react";
import { Box, Paper } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export default function MessagesLayout({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        mt: 2,
        mb: 4,
        alignItems: "stretch",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: { xs: "100%", md: 360 },
          flexShrink: 0,
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        {left}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          borderRadius: "16px",
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        {right}
      </Paper>
    </Box>
  );
}

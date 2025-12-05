"use client";

import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

type SearchErrorAlertProps = {
  error: string | null;
};

export default function SearchErrorAlert({ error }: SearchErrorAlertProps) {
  if (!error) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Paper
        sx={{
          p: 2,
          borderLeft: `4px solid ${COLORS.accent}`,
          backgroundColor: COLORS.white,
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Paper>
    </Box>
  );
}

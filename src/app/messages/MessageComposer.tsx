"use client";

import * as React from "react";
import { Box, Button, TextField } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        gap: 1.5,
        alignItems: "flex-end",
      }}
    >
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a message…"
        multiline
        minRows={1}
        maxRows={5}
        fullWidth
      />
      <Button
        variant="contained"
        onClick={onSend}
        disabled={disabled}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          borderRadius: "999px",
          px: 3,
          bgcolor: COLORS.accent,
          color: COLORS.navyDark,
          "&:hover": { bgcolor: "#f6a76a" },
        }}
      >
        Send
      </Button>
    </Box>
  );
}

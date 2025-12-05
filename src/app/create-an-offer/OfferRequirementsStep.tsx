"use client";

import * as React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";

export type RequirementsState = {
  requirementsText: string;
  phone: string;
};

type Props = {
  value: RequirementsState;
  onChange: (val: RequirementsState) => void;
};

export default function OfferRequirementsStep({ value, onChange }: Props) {
  const handleChange =
    (field: keyof RequirementsState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...value, [field]: e.target.value });
    };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Requirements
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Tell buyers what you need from them to successfully attend the viewing
        (documents, details, expectations, etc.).
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="Requirements for the buyer"
          value={value.requirementsText}
          onChange={handleChange("requirementsText")}
          multiline
          minRows={4}
          fullWidth
          helperText="For example: viewing address, preferred date/time window, any specific things to check."
        />

        <TextField
          label="Contact phone (optional)"
          value={value.phone}
          onChange={handleChange("phone")}
          fullWidth
        />
      </Stack>
    </Box>
  );
}

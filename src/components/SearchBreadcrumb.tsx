"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { useRouter } from "next/navigation";

type SearchBreadcrumbProps = {
  current: string;
};

export default function SearchBreadcrumb({ current }: SearchBreadcrumbProps) {
  const router = useRouter();

  return (
    <Typography
      variant="body2"
      sx={{ color: COLORS.white, mb: 2, display: "flex", gap: 0.5 }}
    >
      <Box
        component="span"
        onClick={() => {
          router.replace("/");
        }}
      >
        Home
      </Box>
      <Box component="span" sx={{ opacity: 0.7 }}>
        &gt;
      </Box>
      <Box component="span" sx={{ fontWeight: 700 }}>
        {current}
      </Box>
    </Typography>
  );
}

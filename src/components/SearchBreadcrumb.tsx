"use client";

import * as React from "react";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { useRouter } from "next/navigation";

type SearchBreadcrumbProps = {
  current: string;
};

export default function SearchBreadcrumb({ current }: SearchBreadcrumbProps) {
  const router = useRouter();

  return (
    <Breadcrumbs sx={{ color: "rgba(255,255,255,0.8)", mb: 1 }}>
      <Typography sx={{ cursor: "pointer" }} onClick={() => router.push("/")}>
        Home
      </Typography>
      <Typography sx={{ fontWeight: 600, color: COLORS.white }}>
        {current}
      </Typography>
    </Breadcrumbs>
  );
}

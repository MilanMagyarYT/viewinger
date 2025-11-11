"use client";

import React from "react";
import { Box } from "@mui/material";
import MenuBar from "@/components/MenuBar";
import SearchHero from "@/components/SearchHero";

export default function HomePage() {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFE", // base white background below the hero
      }}
    >
      {/* Top navigation bar */}
      <MenuBar />
      <div style={{ marginTop: "3rem" }}>
        {/* Hero search section */}
        <SearchHero />
      </div>
      {/* Placeholder for the rest of the page */}
      <Box sx={{ flex: 1, backgroundColor: "#FFFFFF" }} />
    </Box>
  );
}

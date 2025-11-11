"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useRouter } from "next/navigation";

export default function SearchHero() {
  const router = useRouter();

  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const handleSearch = () => {
    if (!city.trim() || !country.trim()) return;

    const params = new URLSearchParams({
      city: city.trim(),
      country: country.trim(),
    });

    router.push(`/search-for-offers?${params.toString()}`);
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "#0F3EA3",
        py: 8, // vertical padding only
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Headings */}
      <Typography
        variant="h4"
        sx={{
          color: "#FFFFFF",
          fontWeight: 700,
          mb: 1,
          textAlign: "center",
        }}
      >
        Find your next viewing, anywhere.
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          color: "rgba(255, 255, 255, 0.85)",
          mb: 4,
          textAlign: "center",
        }}
      >
        Connect with trusted locals who can view properties for you across the
        world.
      </Typography>

      {/* Search Box */}
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "90%",
          maxWidth: 800,
          p: 1.5,
          borderRadius: "12px",
          border: "2px solid #6C8DFF",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* City first */}
        <TextField
          label="City"
          variant="outlined"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          sx={{
            flex: 1,
            mr: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              backgroundColor: "#F9FAFB",
            },
          }}
        />

        {/* Country second */}
        <TextField
          label="Country"
          variant="outlined"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          sx={{
            flex: 1,
            mr: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              backgroundColor: "#F9FAFB",
            },
          }}
        />

        {/* Search Button */}
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            backgroundColor: "#2054CC",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#6C8DFF",
            },
          }}
        >
          Search
        </Button>
      </Paper>
    </Box>
  );
}

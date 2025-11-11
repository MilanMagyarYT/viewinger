"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function MenuBar() {
  const router = useRouter();

  const handleAccountClick = () => {
    router.push("/account");
  };

  const handleSearchOffers = () => {
    router.push("/search-for-offers");
  };

  const handleCreateOffer = () => {
    router.push("/create-an-offer");
  };

  return (
    <AppBar
      sx={{
        backgroundColor: "#0F3EA3",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left side: Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => router.push("/")}
        >
          {/* Placeholder logo icon */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              backgroundColor: "#6C8DFF",
              mr: 1.5,
            }}
          >
            V
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: "#FFFFFF",
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Viewinger
          </Typography>
        </Box>

        {/* Middle section: Buttons */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={handleSearchOffers}
            sx={{
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#2054CC",
              },
            }}
          >
            Search Offers
          </Button>

          <Button
            variant="outlined"
            onClick={handleCreateOffer}
            sx={{
              color: "#FFFFFF",
              borderColor: "#6C8DFF",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                borderColor: "#FFFFFF",
                backgroundColor: "rgba(108, 141, 255, 0.1)",
              },
            }}
          >
            Create Offer
          </Button>
        </Box>

        {/* Right side: Account icon */}
        <IconButton
          onClick={handleAccountClick}
          sx={{
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#2054CC",
            },
          }}
        >
          <AccountCircle fontSize="large" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

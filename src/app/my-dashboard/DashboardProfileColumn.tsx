"use client";

import * as React from "react";
import { Avatar, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import VerifiedIcon from "@mui/icons-material/Verified";

export type DashboardProfileState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  languages: string;
  yearsOfExperience: string;
  bio: string;
  profileImage: string;
};

type Props = {
  profile: DashboardProfileState;
  isVerified: boolean;
  onEditProfile: () => void;
  onVerifyClick: () => void;
};

export default function DashboardProfileColumn({
  profile,
  isVerified,
  onEditProfile,
  onVerifyClick,
}: Props) {
  return (
    <Box>
      {/* Profile card */}
      <Paper
        elevation={6}
        sx={{
          borderRadius: "20px",
          p: 3,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
          mb: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: "999px",
            overflow: "hidden",
            mb: 2,
            bgcolor: COLORS.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Avatar
            src={profile.profileImage || ""}
            alt={profile.name}
            sx={{
              width: "100%",
              height: "100%",
              fontSize: 40,
            }}
          >
            {profile.name?.charAt(0)}
          </Avatar>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {profile.name || "Your name"}
          </Typography>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: COLORS.accent,
            }}
          >
            <VerifiedIcon
              sx={{
                fontSize: 20,
              }}
            />
          </Box>
        </Stack>

        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.8)", mb: 2 }}
        >
          {profile.email}
        </Typography>

        <Button
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            px: 3,
            mb: 1.5,
            backgroundColor: COLORS.accent,
            color: COLORS.navyDark,
            fontWeight: 600,
            "&:hover": { backgroundColor: "#f6a76a" },
          }}
          onClick={onEditProfile}
        >
          View profile
        </Button>

        <Button
          variant="outlined"
          size="small"
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            px: 3,
            borderColor: COLORS.muted,
            color: COLORS.white,
            fontWeight: 500,
            "&:hover": {
              borderColor: COLORS.accent,
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
          onClick={onVerifyClick}
        >
          {isVerified ? "Verification details" : "Get verified"}
        </Button>
      </Paper>

      {/* Account overview placeholder */}
      <Paper
        elevation={4}
        sx={{
          borderRadius: "20px",
          p: 2.5,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Account overview
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          We’ll show your account stats here in a future update (views,
          bookings, response rate, etc.).
        </Typography>
      </Paper>
    </Box>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  Avatar,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function MenuBar() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // --- Check login + load Firestore profile ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.profileImage) setProfileImage(data.profileImage);
          }
        } catch (err) {
          console.error("Error fetching user profile image:", err);
        }
      } else {
        setProfileImage(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!user) {
      router.push("/authentication/sign-in");
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await signOut(auth);
    handleClose();
    router.replace("/");
  };

  const handleSearchOffers = () => router.push("/");
  const handleCreateOffer = () => router.push("/create-an-offer");
  const handleMyDashboard = () => {
    handleClose();
    router.push("/my-dashboard");
  };
  const handleSignIn = () => {
    handleClose();
    router.push("/authentication/sign-in");
  };

  // --- UI ---
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
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              backgroundColor: "#6C8DFF",
              mr: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 700,
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

        {/* Right side: Account Avatar */}
        <IconButton
          onClick={handleAccountClick}
          sx={{
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#2054CC",
            },
          }}
        >
          {user ? (
            profileImage ? (
              <Avatar
                src={profileImage}
                alt={user.displayName || "User"}
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <Avatar sx={{ width: 36, height: 36, bgcolor: "#6C8DFF" }}>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
              </Avatar>
            )
          ) : (
            <AccountCircle fontSize="large" />
          )}
        </IconButton>

        {/* Account Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          slotProps={{
            paper: {
              elevation: 3,
              sx: {
                mt: 1.5,
                borderRadius: "12px",
                minWidth: 180,
                backgroundColor: "#F9FAFF",
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {user
            ? [
                <Box key="header" sx={{ px: 2, py: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "#0F3EA3", fontWeight: 600 }}
                  >
                    {user.displayName || "My Account"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "gray", display: "block" }}
                  >
                    {user.email}
                  </Typography>
                </Box>,

                <Divider key="divider-1" />,

                <MenuItem
                  key="dashboard"
                  onClick={handleMyDashboard}
                  sx={{
                    color: "#0F3EA3",
                    "&:hover": { backgroundColor: "rgba(108,141,255,0.1)" },
                  }}
                >
                  Dashboard
                </MenuItem>,

                <MenuItem
                  key="create-offer"
                  onClick={handleCreateOffer}
                  sx={{
                    color: "#0F3EA3",
                    "&:hover": { backgroundColor: "rgba(108,141,255,0.1)" },
                  }}
                >
                  Create Offer
                </MenuItem>,

                <Divider key="divider-2" />,

                <MenuItem
                  key="logout"
                  onClick={handleLogout}
                  sx={{
                    color: "#B00020",
                    "&:hover": { backgroundColor: "rgba(255,76,76,0.1)" },
                  }}
                >
                  Logout
                </MenuItem>,
              ]
            : [
                <MenuItem
                  key="signin"
                  onClick={handleSignIn}
                  sx={{
                    color: "#0F3EA3",
                    "&:hover": { backgroundColor: "rgba(108,141,255,0.1)" },
                  }}
                >
                  Sign In
                </MenuItem>,
              ]}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

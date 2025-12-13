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
  Container,
  GlobalStyles,
  Badge,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";

const COLOR_NAVY_DARK = "#2D3250";
const COLOR_NAVY = "#424769";
const COLOR_WHITE = "#FFFFFF";
const COLOR_ACCENT = "#f6a76a"; // accent bubble color

export default function MenuBar() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 🔹 unread badge count
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Check login + load Firestore profile image + listen for unread convos ---
  useEffect(() => {
    let unsubscribeConvos: null | (() => void) = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // cleanup old listener when switching users/logging out
      if (unsubscribeConvos) {
        unsubscribeConvos();
        unsubscribeConvos = null;
      }

      if (currentUser) {
        try {
          // profile image load
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as any;
            if (data.profileImage) setProfileImage(data.profileImage);
            else if (data.photoURL) setProfileImage(data.photoURL);
          } else {
            setProfileImage(null);
          }
        } catch (err) {
          console.error("Error fetching user profile image:", err);
        }

        // 🔹 unread conversations/messages listener
        // Requires an index: participantIds (array-contains) + updatedAt (desc)
        try {
          const q = query(
            collection(db, "conversations"),
            where("participantIds", "array-contains", currentUser.uid),
            orderBy("updatedAt", "desc"),
            limit(50)
          );

          unsubscribeConvos = onSnapshot(
            q,
            (snap) => {
              let total = 0;

              snap.forEach((d) => {
                const data = d.data() as any;

                // ✅ If your schema is: unreadCounts: { [uid]: number }
                const map =
                  data.unreadCounts ||
                  data.unreadCountByUser ||
                  data.unreadCountMap;
                console.log(map);
                const n = map?.[currentUser.uid];
                if (typeof n === "number") total += n;
              });

              setUnreadCount(total);
            },
            (err) => {
              console.error("Error listening to conversations:", err);
              setUnreadCount(0);
            }
          );
        } catch (err) {
          console.error("Error wiring conversations listener:", err);
          setUnreadCount(0);
        }
      } else {
        setProfileImage(null);
        setUnreadCount(0);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeConvos) unsubscribeConvos();
    };
  }, []);

  // --- Handlers ---
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await signOut(auth);
    handleClose();
    router.replace("/search-for-offers");
  };

  const handleSearchOffers = () => {
    router.replace("/search-for-offers");
  };

  const handleCreateOffer = () => {
    router.push("/create-an-offer");
  };

  const handleMyDashboard = () => {
    handleClose();
    if (!user) {
      router.push("/authentication/sign-in");
      return;
    }
    router.push("/my-dashboard");
  };

  const handleSignIn = () => {
    handleClose();
    router.push("/authentication/sign-in");
  };

  const handleMessages = () => {
    handleClose();
    router.push("/messages");
  };

  // --- UI ---
  return (
    <>
      {/* Global reset for layout */}
      <GlobalStyles
        styles={{
          "html, body": {
            margin: 0,
            padding: 0,
            boxSizing: "border-box",
          },
        }}
      />

      <AppBar
        position="fixed"
        sx={{
          backgroundColor: COLOR_NAVY_DARK,
          boxShadow: "none",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            py: 1,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left: big pill with logo + nav links */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                backgroundColor: COLOR_NAVY,
                borderRadius: "16px",
                px: 2.5,
                py: 1,
                gap: 4,
              }}
            >
              {/* Logo (clickable to home) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => router.push("/search-for-offers")}
              >
                <Box
                  component="img"
                  src="/logo-wordmark.png"
                  alt="Viewinger"
                  sx={{
                    height: 28,
                    width: "auto",
                  }}
                />
              </Box>

              {/* Nav links */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  ml: 2,
                }}
              >
                <Button
                  onClick={handleSearchOffers}
                  sx={{
                    color: COLOR_WHITE,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: 14,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  Search Offers
                </Button>

                <Button
                  onClick={handleCreateOffer}
                  sx={{
                    color: COLOR_WHITE,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: 14,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  Create Offer
                </Button>

                <Button
                  onClick={handleMyDashboard}
                  sx={{
                    color: COLOR_WHITE,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: 14,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  My Dashboard
                </Button>
              </Box>
            </Box>

            {/* Right: small pill with avatar (if logged in) + messages icon + hamburger */}
            <Box
              sx={{
                ml: 2,
                display: "flex",
                alignItems: "center",
                backgroundColor: COLOR_NAVY,
                borderRadius: "16px",
                px: 2,
                py: 1,
                gap: 1.5,
              }}
            >
              {user && (
                <Avatar
                  src={profileImage || undefined}
                  alt={user.displayName || "User"}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "#DDDDDD",
                    flexShrink: 0,
                  }}
                >
                  {(!profileImage &&
                    (user.displayName?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U")) ||
                    null}
                </Avatar>
              )}

              {/* 🔹 Messages icon (only when logged in) */}
              {user && (
                <IconButton
                  onClick={handleMessages}
                  sx={{
                    color: COLOR_WHITE,
                    p: 0.75,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    invisible={!unreadCount}
                    overlap="circular"
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: COLOR_ACCENT,
                        color: COLOR_NAVY_DARK,
                        fontWeight: 800,
                        fontSize: 11,
                        minWidth: 18,
                        height: 18,
                        borderRadius: "999px",
                        px: 0.5,
                      },
                    }}
                  >
                    <QuestionAnswerIcon />
                  </Badge>
                </IconButton>
              )}

              <IconButton
                onClick={handleMenuClick}
                sx={{
                  color: COLOR_WHITE,
                  p: 0.75,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </Box>
          </Container>

          {/* Menu opened by hamburger */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  mt: 1.5,
                  borderRadius: "16px",
                  minWidth: 200,
                  backgroundColor: "#F9FAFF",
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {user
              ? [
                  <Box key="user-header" sx={{ px: 2, py: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: COLOR_NAVY_DARK, fontWeight: 600 }}
                    >
                      {user.displayName || "My account"}
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
                    key="menu-dashboard"
                    onClick={handleMyDashboard}
                    sx={{
                      color: COLOR_NAVY_DARK,
                      "&:hover": {
                        backgroundColor: "rgba(114,122,168,0.15)",
                      },
                    }}
                  >
                    My Dashboard
                  </MenuItem>,

                  <MenuItem
                    key="menu-create-offer"
                    onClick={handleCreateOffer}
                    sx={{
                      color: COLOR_NAVY_DARK,
                      "&:hover": {
                        backgroundColor: "rgba(114,122,168,0.15)",
                      },
                    }}
                  >
                    Create Offer
                  </MenuItem>,

                  <Divider key="divider-2" />,

                  <MenuItem
                    key="menu-logout"
                    onClick={handleLogout}
                    sx={{
                      color: "#B00020",
                      "&:hover": {
                        backgroundColor: "rgba(255,76,76,0.08)",
                      },
                    }}
                  >
                    Logout
                  </MenuItem>,
                ]
              : [
                  <MenuItem
                    key="menu-search-offers"
                    onClick={handleSearchOffers}
                    sx={{
                      color: COLOR_NAVY_DARK,
                      "&:hover": {
                        backgroundColor: "rgba(114,122,168,0.15)",
                      },
                    }}
                  >
                    Search Offers
                  </MenuItem>,

                  <MenuItem
                    key="menu-create-offer-guest"
                    onClick={handleCreateOffer}
                    sx={{
                      color: COLOR_NAVY_DARK,
                      "&:hover": {
                        backgroundColor: "rgba(114,122,168,0.15)",
                      },
                    }}
                  >
                    Create Offer
                  </MenuItem>,

                  <Divider key="divider-guest" />,

                  <MenuItem
                    key="menu-sign-in"
                    onClick={handleSignIn}
                    sx={{
                      color: COLOR_NAVY_DARK,
                      "&:hover": {
                        backgroundColor: "rgba(114,122,168,0.15)",
                      },
                    }}
                  >
                    Sign In
                  </MenuItem>,
                ]}
          </Menu>
        </Toolbar>
      </AppBar>
    </>
  );
}

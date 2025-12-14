"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Paper,
  Stack,
  CircularProgress,
  GlobalStyles,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuthResult(result: UserCredential) {
    const { user } = result;
    const info = getAdditionalUserInfo(result);
    const isNewUser = !!info?.isNewUser;
    console.log("Signed in:", user.uid, { isNewUser });
    router.replace("/my-dashboard");
  }

  function surfaceAuthError(error: any) {
    const map: Record<string, string> = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/invalid-credential": "Invalid credentials. Please try again.",
    };
    alert(map[error?.code] || error?.message || "Sign-in failed.");
    console.error(error);
  }

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => result && handleAuthResult(result))
      .catch(surfaceAuthError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailSignIn(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthResult(result);
    } catch (err) {
      surfaceAuthError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuthResult(result);
    } catch (err: any) {
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        surfaceAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    router.push("/authentication/forgot-password");
  };

  const cardBg = "rgba(45, 50, 80, 0.55)";
  const fieldBg = "rgba(255,255,255,0.08)";
  const fieldBorder = "rgba(255,255,255,0.16)";

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: fieldBg,
      color: COLORS.white,
      "& fieldset": { borderColor: fieldBorder },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.26)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(248,187,132,0.65)" },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.75)",
    },
  } as const;

  return (
    <>
      <GlobalStyles
        styles={{
          "html, body": {
            height: "100%",
            margin: 0,
            padding: 0,
            overflow: "hidden",
            background: COLORS.navyDark,
          },
          "#__next": { height: "100%" },
        }}
      />

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
          backgroundColor: COLORS.navyDark,
          backgroundImage: `
            radial-gradient(900px 620px at 18% 18%, rgba(66, 71, 105, 0.82) 0%, rgba(45, 50, 80, 0.98) 60%, rgba(45, 50, 80, 1) 100%),
            radial-gradient(820px 620px at 85% 22%, rgba(248, 187, 132, 0.26) 0%, rgba(248, 187, 132, 0.08) 28%, rgba(45, 50, 80, 0) 65%),
            radial-gradient(900px 720px at 70% 88%, rgba(115, 122, 168, 0.34) 0%, rgba(115, 122, 168, 0.12) 30%, rgba(45, 50, 80, 0) 66%),
            linear-gradient(135deg, rgba(45, 50, 80, 1) 0%, rgba(66, 71, 105, 0.58) 45%, rgba(45, 50, 80, 1) 100%)
          `,
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.20)",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            px: 2,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 520 }}>
            {/* Logo */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.75 }}>
              <Box
                component="img"
                src="/logo-wordmark.png"
                alt="Viewinger"
                sx={{
                  height: 34,
                  width: "auto",
                  opacity: 0.95,
                  filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.35))",
                }}
              />
            </Box>

            {/* Header */}
            <Stack spacing={1} sx={{ textAlign: "center", mb: 2.5 }}>
              <Typography
                variant="h3"
                sx={{
                  color: COLORS.white,
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  fontSize: { xs: 34, sm: 40 },
                }}
              >
                Welcome Back
              </Typography>
            </Stack>

            {/* Card */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: "20px",
                p: { xs: 2.5, sm: 3 },
                backgroundColor: cardBg,
                border: `1px solid rgba(255,255,255,0.10)`,
                boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
            >
              <Stack spacing={2.1}>
                <Stack spacing={0.75} sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{ color: COLORS.white, fontWeight: 900 }}
                  >
                    Sign in to your account
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    New here?{" "}
                    <Button
                      onClick={() =>
                        router.replace("/authentication/create-account")
                      }
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        color: COLORS.white,
                        px: 0.75,
                        minWidth: 0,
                        "&:hover": {
                          backgroundColor: "transparent",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Create an account
                    </Button>
                  </Typography>
                </Stack>

                {/* Google first */}
                <Button
                  onClick={handleGoogleSignIn}
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  sx={{
                    py: 1.35,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontWeight: 900,
                    backgroundColor: "rgba(255,255,255,0.10)",
                    color: COLORS.white,
                    border: `1px solid rgba(255,255,255,0.14)`,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.14)",
                      boxShadow: "none",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Continue with Google"
                  )}
                </Button>

                {/* OR divider */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Divider
                    sx={{ flex: 1, borderColor: "rgba(255,255,255,0.16)" }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.70)",
                      fontStyle: "italic",
                    }}
                  >
                    or
                  </Typography>
                  <Divider
                    sx={{ flex: 1, borderColor: "rgba(255,255,255,0.16)" }}
                  />
                </Box>

                {/* Email + Password */}
                <form onSubmit={handleEmailSignIn}>
                  <Stack spacing={2}>
                    {/* ✅ "Password" row label (left) + "Forgot password?" (right) */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 0.25,
                        mt: -0.5,
                        mb: -0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.70)" }}
                      >
                        Email
                      </Typography>
                    </Box>

                    <TextField
                      label=""
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      fullWidth
                      sx={textFieldSx}
                    />

                    {/* ✅ "Password" row label (left) + "Forgot password?" (right) */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 0.25,
                        mt: -0.5,
                        mb: -0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.70)" }}
                      >
                        Password
                      </Typography>

                      <Typography
                        variant="body2"
                        onClick={handleForgotPassword}
                        sx={{
                          color: "rgba(255,255,255,0.88)",
                          fontWeight: 800,
                          cursor: "pointer",
                          userSelect: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        Forgot your password?
                      </Typography>
                    </Box>

                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      fullWidth
                      sx={textFieldSx}
                    />

                    {/* Full-width primary CTA */}
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      fullWidth
                      sx={{
                        mt: 0.25,
                        py: 1.35,
                        borderRadius: "999px",
                        backgroundColor: COLORS.accent,
                        color: COLORS.navyDark,
                        fontWeight: 900,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#f6a76a",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        "Log in"
                      )}
                    </Button>
                  </Stack>
                </form>

                <Typography
                  variant="caption"
                  sx={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.70)",
                    mt: 0.25,
                  }}
                >
                  By signing in, you agree to our{" "}
                  <Box
                    component="span"
                    sx={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    Terms
                  </Box>{" "}
                  and{" "}
                  <Box
                    component="span"
                    sx={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    Privacy Policy
                  </Box>
                  .
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Box>
    </>
  );
}

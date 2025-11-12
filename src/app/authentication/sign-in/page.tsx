"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

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

  async function handleForgotPassword() {
    if (!email) return alert("Enter your email to receive a reset link.");
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (err) {
      surfaceAuthError(err);
    } finally {
      setLoading(false);
    }
  }

  // -------- JSX ----------
  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#0F3EA3",
          py: 6,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: "#FFFFFF", fontWeight: 700, mb: 1 }}
        >
          Welcome Back
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Sign in to manage your offers and profile.
        </Typography>
      </Box>

      {/* Auth Card */}
      <Box sx={{ display: "flex", justifyContent: "center", py: 6, px: 2 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: "16px",
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#F9FAFF",
          }}
        >
          <Stack spacing={2}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, textAlign: "center" }}
            >
              Sign in to your account
            </Typography>

            <Typography variant="body2" align="center">
              New here?{" "}
              <Button
                onClick={() => router.replace("/authentication/create-account")}
                size="small"
                sx={{ color: "#2054CC", textTransform: "none" }}
              >
                Create an account
              </Button>
            </Typography>

            <form onSubmit={handleEmailSignIn}>
              <Stack spacing={2}>
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      backgroundColor: "#2054CC",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      textTransform: "none",
                      py: 1.3,
                      "&:hover": { backgroundColor: "#6C8DFF" },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleForgotPassword}
                    sx={{
                      color: "#2054CC",
                      textTransform: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Forgot password?
                  </Button>
                </Stack>
              </Stack>
            </form>

            <Divider sx={{ my: 2 }} />
            <Typography
              align="center"
              sx={{ fontSize: "0.9rem", opacity: 0.8 }}
            >
              OR
            </Typography>

            <Button
              onClick={handleGoogleSignIn}
              variant="outlined"
              disabled={loading}
              sx={{
                borderColor: "#2054CC",
                color: "#2054CC",
                fontWeight: 600,
                textTransform: "none",
                py: 1.3,
                "&:hover": {
                  backgroundColor: "rgba(32,84,204,0.08)",
                  borderColor: "#2054CC",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Continue with Google"
              )}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

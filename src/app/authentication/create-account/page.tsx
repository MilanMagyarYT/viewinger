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
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  UserCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase";

export default function CreateAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuthResult(result: UserCredential) {
    const { user } = result;
    const info = getAdditionalUserInfo(result);
    const isNewUser = !!info?.isNewUser;
    console.log("Signed in:", user.uid, { isNewUser });
    router.replace("/create-seller-profile");
  }

  function surfaceAuthError(error: any) {
    const map: Record<string, string> = {
      "auth/account-exists-with-different-credential":
        "An account exists with this email using another sign-in method.",
      "auth/network-request-failed": "Network error. Try again.",
      "auth/popup-closed-by-user": "Sign-in popup closed. Please try again.",
    };
    alert(map[error?.code] || error?.message || "Sign-in failed.");
    console.error(error);
  }

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => result && handleAuthResult(result))
      .catch(surfaceAuthError);
  }, []);

  async function handleAccountCreation(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", user.uid);
      router.replace("/create-seller-profile");
    } catch (error) {
      surfaceAuthError(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountCreationWithGoogleAccount(e?: React.FormEvent) {
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
          Create Account
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Join Viewinger and start sharing your offers.
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
              Create your account
            </Typography>

            <Typography variant="body2" align="center">
              Already have an account?{" "}
              <Button
                onClick={() => router.replace("/authentication/sign-in")}
                size="small"
                sx={{ color: "#2054CC", textTransform: "none" }}
              >
                Sign in
              </Button>
            </Typography>

            <form onSubmit={handleAccountCreation}>
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
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: "#2054CC",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    textTransform: "none",
                    py: 1.5,
                    "&:hover": { backgroundColor: "#6C8DFF" },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
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
              onClick={handleAccountCreationWithGoogleAccount}
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

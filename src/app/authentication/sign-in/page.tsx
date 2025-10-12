"use client";

import { auth, googleProvider } from "@/firebase";
import { Button, Divider, TextField, Typography } from "@mui/material";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getAdditionalUserInfo } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

    // send them wherever your app expects after login
    router.replace("/dashboard"); // or "/create-seller-profile" if that’s your first-run flow
  }

  function surfaceAuthError(error: any) {
    const map: Record<string, string> = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/invalid-credential": "Invalid credentials. Please try again.",
      "auth/account-exists-with-different-credential":
        "This email uses a different sign-in method. Try that method instead.",
      "auth/cancelled-popup-request":
        "Another sign-in is already in progress. Try again.",
      "auth/popup-blocked":
        "Your browser blocked the sign-in popup. We’ll try a full-page redirect.",
      "auth/popup-closed-by-user":
        "The popup was closed before finishing. Please try again.",
      "auth/network-request-failed":
        "Network error—check your connection and try again.",
    };
    const msg = map[error?.code] || error?.message || "Sign-in failed.";
    console.error("Auth error:", error);
    alert(msg);
  }

  // Pick up result if we fell back to signInWithRedirect
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) handleAuthResult(result);
      })
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
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // flow continues after redirect
        } catch (redirectErr) {
          surfaceAuthError(redirectErr);
        }
      } else {
        surfaceAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      alert("Enter your email first to receive a reset link.");
      return;
    }
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

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      <Typography variant="h5">Sign in</Typography>

      <Typography variant="body2">
        New here?{" "}
        <Button
          onClick={() => router.replace("/authentication/create-account")}
          size="small"
        >
          Create an account
        </Button>
      </Typography>

      <form
        onSubmit={handleEmailSignIn}
        style={{ display: "grid", gap: "1rem" }}
      >
        <TextField
          label="Email Address"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
          <Button
            variant="text"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot password?
          </Button>
        </div>
      </form>

      <Divider />
      <Typography align="center">OR</Typography>

      <Button onClick={handleGoogleSignIn} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </Button>
    </div>
  );
}

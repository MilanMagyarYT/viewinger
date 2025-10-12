"use client";

import { auth, googleProvider } from "@/firebase";
import { Button, Divider, TextField, Typography } from "@mui/material";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
} from "firebase/auth";
import { getAdditionalUserInfo } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
        "An account exists with this email using another sign-in method. Try that method instead.",
      "auth/cancelled-popup-request":
        "Another sign-in was already in progress. Please try again.",
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

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) handleAuthResult(result);
      })
      .catch(surfaceAuthError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.log("Create account failed:", error);
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
      // If popup blocked/closed, fall back to redirect
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
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

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      <Typography variant="h5">Create a new account</Typography>

      <Typography variant="body2">
        Already have an account?{" "}
        <Button
          onClick={() => router.replace("/authentication/sign-in")}
          size="small"
        >
          Sign in
        </Button>
      </Typography>

      <form
        onSubmit={handleAccountCreation}
        style={{ display: "grid", gap: "1rem" }}
      >
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Account"}
        </Button>
      </form>

      <Divider />

      <Typography align="center">OR</Typography>

      <Button
        onClick={handleAccountCreationWithGoogleAccount}
        disabled={loading}
      >
        {loading ? "Opening Google…" : "Continue with Google"}
      </Button>
    </div>
  );
}

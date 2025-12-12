// src/app/verification/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Avatar,
  Container,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";

type VerificationForm = {
  baseCity: string;
  baseCountry: string;
  phoneNumber: string;
  yearsOfExperience: string;
  languages: string;
  bio: string;
};

type UserDoc = {
  isVerified?: boolean;
  baseCity?: string;
  baseCountry?: string;
  phoneNumber?: string;
  yearsOfExperience?: string;
  languages?: string[] | string;
  languagesText?: string;
  bio?: string;
  profileImage?: string;
  email?: string;
  name?: string;
  displayName?: string;
  legalName?: string;
};

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUserDoc, setLoadingUserDoc] = useState(true);

  const [isVerified, setIsVerified] = useState(false);

  const [form, setForm] = useState<VerificationForm>({
    baseCity: "",
    baseCountry: "",
    phoneNumber: "",
    yearsOfExperience: "",
    languages: "",
    bio: "",
  });

  // profile photo state
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- Auth listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/authentication/sign-in");
      } else {
        setUser(currentUser);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- Load user doc / prefill ---
  useEffect(() => {
    const loadUserDoc = async () => {
      if (!user) return;
      setLoadingUserDoc(true);
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as UserDoc;

          // Map languages -> string for editing
          let languagesString = "";
          if (Array.isArray(data.languages)) {
            languagesString = data.languages.join(", ");
          } else if (typeof data.languages === "string") {
            languagesString = data.languages;
          } else if (typeof data.languagesText === "string") {
            languagesString = data.languagesText;
          }

          setForm({
            baseCity: data.baseCity || "",
            baseCountry: data.baseCountry || "",
            phoneNumber: data.phoneNumber || "",
            yearsOfExperience: data.yearsOfExperience || "",
            languages: languagesString,
            bio: data.bio || "",
          });

          setProfileImageUrl(data.profileImage || "");
          setIsVerified(!!data.isVerified);
        } else {
          setForm((prev) => ({
            ...prev,
            baseCity: "",
            baseCountry: "",
            phoneNumber: "",
          }));
          setProfileImageUrl("");
          setIsVerified(false);
        }
      } catch (err) {
        console.error("Error loading user doc:", err);
      } finally {
        setLoadingUserDoc(false);
      }
    };
    if (user) loadUserDoc();
  }, [user]);

  const handleChange = <K extends keyof VerificationForm>(
    field: K,
    value: VerificationForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // --- Image selection (with compression, like dashboard) ---
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const MAX = 10 * 1024 * 1024;
    let toUse: File = f;

    if (f.size > MAX) {
      toUse = await compressImage(f, { maxWidth: 1600, quality: 0.8 });
      if (toUse.size > MAX) {
        alert(
          "Image is still too large after compression. Try a smaller image."
        );
        return;
      }
    }

    setFile(toUse);
    setPreview(URL.createObjectURL(toUse));
  };

  async function compressImage(
    file: File,
    { maxWidth = 1600, quality = 0.8 } = {}
  ): Promise<File> {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality
      );
    });

    URL.revokeObjectURL(img.src);
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }

  // --- Derived validation flags ---
  const hasBaseProfile =
    form.baseCity.trim().length > 0 && form.baseCountry.trim().length > 0;

  const hasContact = form.phoneNumber.trim().length > 0;

  const hasExperienceAndLanguages =
    form.yearsOfExperience.trim().length > 0 &&
    form.languages.trim().length > 0 &&
    form.bio.trim().length > 0;

  const hasPhotoForVerification = !!profileImageUrl || !!file;

  const canBeVerified =
    hasBaseProfile &&
    hasContact &&
    hasExperienceAndLanguages &&
    hasPhotoForVerification;

  // --- Save / Update verification ---
  const handleSave = async (markVerified: boolean) => {
    if (!user) return;
    setSaveError(null);
    setSaveSuccess(false);

    if (markVerified && !canBeVerified) {
      setSaveError(
        "You must complete all verification requirements (including profile photo) before you can be verified."
      );
      return;
    }

    try {
      setSaving(true);

      let finalProfileImageUrl = profileImageUrl;

      // If user selected a new file here, upload it now
      if (file) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const unsignedPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET!;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", unsignedPreset);
        formData.append("folder", `users/${user.uid}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        finalProfileImageUrl = data.secure_url;
        setProfileImageUrl(finalProfileImageUrl);
      }

      const ref = doc(db, "users", user.uid);

      // Normalized languages array
      const languagesArray = form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await setDoc(
        ref,
        {
          baseCity: form.baseCity.trim(),
          baseCountry: form.baseCountry.trim(),
          phoneNumber: form.phoneNumber.trim(),
          yearsOfExperience: form.yearsOfExperience.trim(),
          languages: languagesArray,
          languagesText: form.languages,
          bio: form.bio.trim(),
          profileImage: finalProfileImageUrl || null,
          // also keep baseCity/baseCountry/phoneNumber aligned with dashboard
          city: form.baseCity.trim() || undefined,
          country: form.baseCountry.trim() || undefined,
          // maintain verification flags
          isVerified: markVerified ? true : isVerified && !markVerified,
          verificationChecklist: {
            hasBaseProfile,
            hasContact,
            hasExperienceAndLanguages,
            hasProfilePhoto: !!finalProfileImageUrl,
            updatedAt: serverTimestamp(),
          },
          verificationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (markVerified) {
        setIsVerified(true);
      }
      setSaveSuccess(true);
      setFile(null); // clear in-memory file after successful save

      // Redirect back to dashboard on successful save
      router.push("/my-dashboard");
    } catch (err) {
      console.error("Error saving verification:", err);
      setSaveError("Could not save your verification data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingAuth || loadingUserDoc) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          overflowX: "hidden",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const displayPhoto = preview || profileImageUrl || "";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        overflowX: "hidden",
      }}
    >
      <MenuBar />

      {/* Header band (same family as create-offer / dashboard) */}
      <Box
        sx={{
          backgroundColor: COLORS.navyDark,
          pt: 6,
          pb: 4,
          mt: "3rem",
        }}
      >
        <Container maxWidth="lg">
          <SearchBreadcrumb current="Account verification" />
          <Typography
            variant="h4"
            sx={{ color: COLORS.white, fontWeight: 700, mb: 0.5 }}
          >
            Account verification
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            Complete these steps to earn a verified badge on your offers.
          </Typography>
        </Container>
      </Box>

      {/* Content (full lg width, light card styling) */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: "16px",
            backgroundColor: "#F9FAFF",
          }}
        >
          <Stack spacing={3}>
            {/* Status */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{ color: COLORS.navyDark, fontWeight: 600 }}
                >
                  Verification status
                </Typography>
                <VerifiedBadge isVerified={isVerified} size="small" />
              </Stack>

              {isVerified && (
                <Chip
                  label="Verified"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            {isVerified ? (
              <Alert severity="success" sx={{ borderRadius: "12px" }}>
                Your account is currently verified. Guests will see your
                verified badge on your offers and profile.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Complete all sections below, including adding a clear profile
                photo of your face, to get verified.
              </Alert>
            )}

            <Divider />

            {/* Profile Photo requirement + upload */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: COLORS.navyDark }}
              >
                1. Profile photo (required)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We require a clear profile photo of your face. This helps guests
                feel more confident about who they&apos;re working with.
              </Typography>

              <Stack spacing={2} alignItems="flex-start">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={displayPhoto}
                    alt="Profile"
                    sx={{ width: 80, height: 80, bgcolor: COLORS.navy }}
                  >
                    {user.displayName?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U"}
                  </Avatar>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {displayPhoto
                        ? "Current photo that will be shown on your profile."
                        : "No profile photo yet. Please upload a clear photo of your face."}
                    </Typography>
                    {file && (
                      <Typography variant="caption" color="text.secondary">
                        Selected file: {file.name}
                      </Typography>
                    )}
                  </Stack>
                </Stack>

                <Button
                  component="label"
                  variant="contained"
                  sx={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.navyDark,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "#f6a76a" },
                  }}
                >
                  {displayPhoto
                    ? "Change profile photo"
                    : "Upload profile photo"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                  />
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Base location */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: COLORS.navyDark }}
              >
                2. Base city & country
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tell us where you are usually based. This appears on your public
                profile and helps guests understand where you operate from.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="City of residence"
                  value={form.baseCity}
                  onChange={(e) => handleChange("baseCity", e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Country of residence"
                  value={form.baseCountry}
                  onChange={(e) => handleChange("baseCountry", e.target.value)}
                  fullWidth
                />
              </Stack>
            </Box>

            <Divider />

            {/* Contact info */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: COLORS.navyDark }}
              >
                3. Contact details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Guests will use this phone number to reach you about bookings
                and viewings.
              </Typography>
              <TextField
                label="Phone number (with country code)"
                value={form.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                fullWidth
              />
            </Box>

            <Divider />

            {/* Experience & languages */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: COLORS.navyDark }}
              >
                4. Experience & languages
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share your background so guests understand your experience and
                what languages you speak.
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Years of experience with property viewings"
                  type="number"
                  value={form.yearsOfExperience}
                  onChange={(e) =>
                    handleChange("yearsOfExperience", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Languages (comma-separated)"
                  value={form.languages}
                  onChange={(e) => handleChange("languages", e.target.value)}
                  fullWidth
                  placeholder="English, Dutch, German"
                />
                <TextField
                  label="Short professional bio"
                  multiline
                  minRows={3}
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  fullWidth
                  placeholder="Describe your background, how you help with viewings, and anything that builds trust."
                />
              </Stack>
            </Box>

            {/* Validation summary */}
            <Box sx={{ mt: 2 }}>
              {!canBeVerified && (
                <Alert severity="warning" sx={{ borderRadius: "10px" }}>
                  To get verified, you still need:
                  <ul
                    style={{
                      marginTop: 4,
                      marginBottom: 0,
                      paddingLeft: 20,
                    }}
                  >
                    {!hasPhotoForVerification && (
                      <li>A clear profile photo of your face</li>
                    )}
                    {!hasBaseProfile && (
                      <li>Your city and country of residence</li>
                    )}
                    {!hasContact && <li>A valid phone number</li>}
                    {!hasExperienceAndLanguages && (
                      <li>Experience, languages and a short bio filled out</li>
                    )}
                  </ul>
                </Alert>
              )}

              {saveError && (
                <Alert severity="error" sx={{ borderRadius: "10px", mt: 1 }}>
                  {saveError}
                </Alert>
              )}

              {saveSuccess && (
                <Alert severity="success" sx={{ borderRadius: "10px", mt: 1 }}>
                  Your verification info has been saved.
                  {isVerified && " You are verified!"}
                </Alert>
              )}
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => handleSave(false)}
                disabled={saving}
                sx={{
                  borderColor: COLORS.accent,
                  color: COLORS.navyDark,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: COLORS.navyDark,
                    backgroundColor: "#FFF7F2",
                  },
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSave(true)}
                disabled={saving || !canBeVerified}
                sx={{
                  backgroundColor: canBeVerified ? COLORS.accent : "#9CA3AF",
                  color: canBeVerified ? COLORS.navyDark : "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: canBeVerified ? "#f6a76a" : "#9CA3AF",
                  },
                }}
              >
                {isVerified ? "Update verification" : "Complete verification"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

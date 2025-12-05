"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Stack,
  Divider,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import MenuBar from "@/components/MenuBar";
import { useRouter } from "next/navigation";
import {
  collection,
  getFirestore,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase";
import { Offer } from "@/types/Offer";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function MyDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    languages: "",
    yearsOfExperience: "",
    bio: "",
    profileImage: "",
  });

  const [isVerified, setIsVerified] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const dbInstance = getFirestore();

  // --- Auth listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/authentication/sign-in");
      } else {
        setUser(currentUser);
        // Load profile & verification from Firestore
        await fetchUserProfile(currentUser);
        // Load offers
        await fetchOffers(currentUser.uid);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- Fetch profile from Firestore ---
  const fetchUserProfile = async (u: User) => {
    try {
      const userRef = doc(dbInstance, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as any;

        // Map languages to a string for editing
        let languagesString = "";
        if (Array.isArray(data.languages)) {
          languagesString = data.languages.join(", ");
        } else if (typeof data.languages === "string") {
          languagesString = data.languages;
        } else if (typeof data.languagesText === "string") {
          languagesString = data.languagesText;
        }

        setProfile({
          name:
            data.name ??
            data.displayName ??
            data.legalName ??
            u.displayName ??
            "",
          email: data.email ?? u.email ?? "",
          phone: data.phone ?? data.phoneNumber ?? "",
          city: data.city ?? data.baseCity ?? "",
          country:
            data.country ?? data.baseCountry ?? data.countryOfResidence ?? "",
          languages: languagesString,
          yearsOfExperience: data.yearsOfExperience ?? "",
          bio: data.bio ?? "",
          profileImage: data.profileImage ?? data.photoURL ?? "",
        });

        setIsVerified(!!data.isVerified);
      } else {
        // First-time login — prefill with auth values
        setProfile((p) => ({
          ...p,
          name: u.displayName || "",
          email: u.email || "",
        }));
        setIsVerified(false);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // --- Fetch offers ---
  const fetchOffers = async (uid: string) => {
    try {
      const offersCol = collection(dbInstance, "offers");
      const q = query(offersCol, where("uid", "==", uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Offer[];
      setOffers(list);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoadingOffers(false);
    }
  };

  // --- File handler ---
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const MAX = 10 * 1024 * 1024;
    let toUse: File = f;

    if (f.size > MAX) {
      toUse = await compressImage(f, { maxWidth: 1600, quality: 0.8 });
      if (toUse.size > MAX) {
        alert("Image is still too large after compression. Try a smaller one.");
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

  // --- Save profile to Firestore ---
  const handleProfileSave = async () => {
    if (!user) return;
    try {
      setUploading(true);
      let profileImageURL = profile.profileImage;

      // Upload new file if selected
      if (file) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const unsignedPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET!;
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", unsignedPreset);
        form.append("folder", `users/${user.uid}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form }
        );
        const data = await res.json();
        profileImageURL = data.secure_url;
      }

      const userRef = doc(dbInstance, "users", user.uid);

      // Important: use merge so we don't wipe verification fields
      await setDoc(
        userRef,
        {
          name: profile.name,
          email: user.email,
          phone: profile.phone,
          city: profile.city,
          country: profile.country,
          // keep dashboard languages as a separate string field
          languagesText: profile.languages,
          yearsOfExperience: profile.yearsOfExperience,
          bio: profile.bio,
          profileImage: profileImageURL,
          // help the verification page by also maintaining baseCity/baseCountry & phoneNumber
          baseCity: profile.city || undefined,
          baseCountry: profile.country || undefined,
          phoneNumber: profile.phone || undefined,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfile((p) => ({ ...p, profileImage: profileImageURL }));
      setEditOpen(false);
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setUploading(false);
    }
  };

  // --- Delete offer ---
  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    await deleteDoc(doc(dbInstance, "offers", id));
    setOffers((prev) => prev.filter((offer) => offer.id !== id));
  };

  // --- UI ---
  if (loadingAuth) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <MenuBar />

      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#0F3EA3",
          py: 6,
          textAlign: "center",
          marginTop: "3rem",
        }}
      >
        <Typography variant="h4" sx={{ color: "#FFF", fontWeight: 700, mb: 1 }}>
          My Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Manage your profile, verification and active offers on Viewinger.
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 3 }}>
        <Grid container spacing={4}>
          {/* Seller Profile + Verification */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: "16px",
                backgroundColor: "#F9FAFF",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#0F3EA3" }}
              >
                Seller Profile
              </Typography>

              <Stack spacing={2} alignItems="center">
                <Avatar
                  src={profile.profileImage || ""}
                  alt={profile.name}
                  sx={{ width: 80, height: 80, mb: 1, bgcolor: "#6C8DFF" }}
                >
                  {profile.name?.charAt(0)}
                </Avatar>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="h6">{profile.name}</Typography>
                  <VerifiedBadge isVerified={isVerified} size="small" />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  {profile.email}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, textAlign: "center" }}
                >
                  {isVerified
                    ? "Your account is verified. Guests will see your verified badge on your offers."
                    : "You’re not verified yet. Complete a few steps to earn a verified badge and build more trust."}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1 }}
                  justifyContent="center"
                  flexWrap="wrap"
                >
                  {!isVerified && (
                    <Button
                      variant="contained"
                      onClick={() => router.push("/verification")}
                      sx={{
                        backgroundColor: "#2054CC",
                        color: "#FFF",
                        fontWeight: 600,
                        textTransform: "none",
                        "&:hover": { backgroundColor: "#6C8DFF" },
                      }}
                    >
                      Get Verified
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => setEditOpen(true)}
                    sx={{
                      color: "#0F3EA3",
                      borderColor: "#6C8DFF",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#2054CC",
                        backgroundColor: "#EAF0FF",
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Offers Section */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: "16px",
                backgroundColor: "#F9FAFF",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "#0F3EA3", fontWeight: 600 }}
                >
                  My Offers
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => router.push("/create-an-offer")}
                  sx={{
                    backgroundColor: "#2054CC",
                    color: "#FFF",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#6C8DFF" },
                  }}
                >
                  + New Offer
                </Button>
              </Box>

              <Divider sx={{ my: 1 }} />

              {loadingOffers ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight="40vh"
                >
                  <CircularProgress />
                </Box>
              ) : offers.length === 0 ? (
                <Typography>No offers found for your account.</Typography>
              ) : (
                offers.map((offer) => (
                  <Paper
                    key={offer.id}
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      "&:hover": { backgroundColor: "#F0F5FF" },
                      transition: "background 0.2s ease",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        component="img"
                        src={offer.imageURL}
                        alt={offer.title}
                        sx={{
                          width: 80,
                          height: 60,
                          borderRadius: "8px",
                          objectFit: "cover",
                          backgroundColor: "#E0E0E0",
                        }}
                      />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {offer.title}
                        </Typography>
                        <Typography variant="body2" color="gray">
                          {offer.city}, {offer.country}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#2054CC" }}>
                          {offer.price} {offer.currency}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <IconButton
                        onClick={() => router.push(`/edit-offer/${offer.id}`)}
                        sx={{
                          color: "#2054CC",
                          "&:hover": { color: "#6C8DFF" },
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteOffer(offer.id)}
                        sx={{
                          color: "#B00020",
                          "&:hover": { color: "#FF4C4C" },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Paper>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Profile Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "#0F3EA3", fontWeight: 700 }}>
          Edit Profile
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <TextField label="Email" value={profile.email} disabled />
            <TextField
              label="Phone"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Country"
                value={profile.country}
                onChange={(e) =>
                  setProfile({ ...profile, country: e.target.value })
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Languages Spoken"
              value={profile.languages}
              onChange={(e) =>
                setProfile({ ...profile, languages: e.target.value })
              }
            />
            <TextField
              label="Years of Experience"
              type="number"
              value={profile.yearsOfExperience}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  yearsOfExperience: e.target.value,
                })
              }
            />
            <TextField
              label="Short Bio"
              multiline
              minRows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />

            {/* Profile Image Upload */}
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Profile Picture
              </Typography>
              <Button
                component="label"
                variant="contained"
                sx={{
                  backgroundColor: "#2054CC",
                  color: "#FFF",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#6C8DFF" },
                  alignSelf: "flex-start",
                }}
              >
                Choose Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                />
              </Button>
              {(preview || profile.profileImage) && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    src={preview || profile.profileImage}
                    alt="Profile"
                    sx={{ width: 56, height: 56 }}
                  />
                  <Typography variant="body2">
                    {file?.name || "Current Profile Picture"}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: "#0F3EA3" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProfileSave}
            disabled={uploading}
            sx={{
              backgroundColor: "#2054CC",
              color: "#FFF",
              "&:hover": { backgroundColor: "#6C8DFF" },
            }}
          >
            {uploading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
          sx={{ backgroundColor: "#0F3EA3" }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

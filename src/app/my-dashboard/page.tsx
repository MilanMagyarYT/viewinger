// src/app/my-dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  Stack,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
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

import MenuBar from "@/components/MenuBar";
import { auth } from "@/firebase";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import DashboardProfileColumn, {
  DashboardProfileState,
} from "./DashboardProfileColumn";
import ProfileEditDialog from "./ProfileEditDialog";
import DashboardOffersColumn from "./DashboardOffersColumn";
import DashboardBookingsColumn from "./DashboardBookingsColumn";
import { Offer } from "@/types/Offer";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import type { BookingDoc } from "@/types/bookings";

type RightTab = "bookings" | "offers";

export default function MyDashboardPage() {
  const router = useRouter();
  const dbInstance = getFirestore();

  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [profile, setProfile] = useState<DashboardProfileState>({
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

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // ✅ NEW: Tabs on right side
  const [rightTab, setRightTab] = useState<RightTab>("bookings");

  // -------- AUTH --------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/authentication/sign-in");
      } else {
        setUser(currentUser);
        await fetchUserProfile(currentUser);
        await fetchOffers(currentUser.uid);
        await fetchBookings(currentUser.uid);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // -------- PROFILE FETCH --------
  const fetchUserProfile = async (u: User) => {
    try {
      const userRef = doc(dbInstance, "users", u.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as any;

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

  // -------- OFFERS FETCH --------
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
    } catch (err) {
      console.error("Error fetching offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  // -------- BOOKINGS FETCH --------
  const fetchBookings = async (uid: string) => {
    try {
      setLoadingBookings(true);
      const bookingsCol = collection(dbInstance, "bookings");

      const q = query(
        bookingsCol,
        where("participantIds", "array-contains", uid)
      );
      const snap = await getDocs(q);

      const raw = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as BookingDoc[];

      // sort locally by updatedAt/createdAt desc
      const sorted = raw.sort((a: any, b: any) => {
        const at = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const bt = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return bt - at;
      });

      setBookings(sorted);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // -------- IMAGE HANDLING FOR PROFILE --------
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // -------- PROFILE SAVE --------
  const handleProfileSave = async () => {
    if (!user) return;

    try {
      setUploading(true);
      let profileImageURL = profile.profileImage;

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
      await setDoc(
        userRef,
        {
          name: profile.name,
          email: user.email,
          phone: profile.phone,
          city: profile.city,
          country: profile.country,
          languagesText: profile.languages,
          yearsOfExperience: profile.yearsOfExperience,
          bio: profile.bio,
          profileImage: profileImageURL,
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

  // -------- OFFER DELETE --------
  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    await deleteDoc(doc(dbInstance, "offers", id));
    setOffers((prev) => prev.filter((offer: any) => offer.id !== id));
  };

  // -------- LOADING GATE --------
  if (loadingAuth) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowX: "hidden",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const bookingsCount = bookings.length;
  const offersCount = offers.length;

  // -------- RENDER --------
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: COLORS.white,
        overflowX: "hidden",
      }}
    >
      <MenuBar />

      {/* Header band with breadcrumb */}
      <Box sx={{ bgcolor: COLORS.navyDark, pt: 6, pb: 4, mt: "3rem" }}>
        <Container maxWidth="lg">
          <SearchBreadcrumb current="Dashboard" />

          <Typography
            variant="h4"
            sx={{ color: COLORS.white, fontWeight: 700, mb: 0.5 }}
          >
            My Dashboard
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            Manage your profile, verification and active offers on Viewinger.
          </Typography>
        </Container>
      </Box>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            gap: 3,
          }}
        >
          {/* LEFT COLUMN */}
          <Box
            sx={{
              flexBasis: { xs: "100%", md: "22%" },
              maxWidth: { xs: "100%", md: "22%" },
              flexShrink: 0,
            }}
          >
            <DashboardProfileColumn
              profile={profile}
              isVerified={isVerified}
              onEditProfile={() => setEditOpen(true)}
              onVerifyClick={() => router.push("/verification")}
            />
          </Box>

          {/* RIGHT COLUMN */}
          <Box
            sx={{
              flexBasis: { xs: "100%", md: "78%" },
              maxWidth: { xs: "100%", md: "78%" },
              flexGrow: 1,
            }}
          >
            {/* ✅ NEW: Tab header above the content */}
            <Paper
              elevation={6}
              sx={{
                borderRadius: "20px",
                bgcolor: COLORS.navyDark,
                color: COLORS.white,
                px: 2,
                py: 1,
                mb: 2,
              }}
            >
              <Tabs
                value={rightTab}
                onChange={(_e, v) => setRightTab(v)}
                textColor="inherit"
                variant="fullWidth"
                sx={{
                  minHeight: 0,
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 800,
                    minHeight: 0,
                    py: 1,
                    color: "rgba(255,255,255,0.85)",
                  },
                  "& .Mui-selected": {
                    color: COLORS.white,
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: COLORS.accent,
                    height: 3,
                    borderRadius: "999px",
                  },
                }}
              >
                <Tab value="bookings" label={`Bookings (${bookingsCount})`} />
                <Tab value="offers" label={`Active offers (${offersCount})`} />
              </Tabs>
            </Paper>

            {/* ✅ NEW: Content switches under the tabs */}
            {rightTab === "bookings" ? (
              user && (
                <DashboardBookingsColumn
                  currentUid={user.uid}
                  bookings={bookings}
                  loading={loadingBookings}
                  onViewAll={() => router.push("/bookings")}
                  onOpenConversation={(cid) => router.push(`/message/${cid}`)}
                  onViewOffer={(oid) =>
                    router.push(`/search-for-offers/${oid}`)
                  }
                  onRefresh={() => fetchBookings(user.uid)}
                />
              )
            ) : (
              <DashboardOffersColumn
                offers={offers}
                loadingOffers={loadingOffers}
                onCreateOffer={() => router.push("/create-an-offer")}
                onViewOffer={(id) => router.push(`/search-for-offers/${id}`)}
                onEditOffer={(id) => router.push(`/edit-offer/${id}`)}
                onDeleteOffer={handleDeleteOffer}
              />
            )}
          </Box>
        </Box>
      </Container>

      {/* Profile edit dialog */}
      <ProfileEditDialog
        open={editOpen}
        profile={profile}
        setProfile={setProfile}
        uploading={uploading}
        previewUrl={preview}
        fileName={file?.name}
        onClose={() => setEditOpen(false)}
        onSave={handleProfileSave}
        onFileChange={handleFilePick}
      />

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
          sx={{ backgroundColor: COLORS.navyDark }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

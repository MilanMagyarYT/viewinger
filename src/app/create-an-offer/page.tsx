"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function CreateAnOffer() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- form fields ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // --- Check login state ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/authentication/sign-in");
      } else {
        setUser(currentUser);
        setEmail(currentUser.email || "");
        setName(currentUser.displayName || "");
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- FILE HANDLING + COMPRESSION ---
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
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Compression failed (got null blob)"));
        },
        "image/jpeg",
        quality
      );
    });

    URL.revokeObjectURL(img.src);
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }

  // --- FIREBASE UPLOAD ---
  async function handleDataUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    try {
      const offer = {
        uid: user.uid, // link offer to logged-in user
        name: name || user.displayName || "",
        title,
        description,
        city,
        country,
        area: Number(area),
        price: Number(price),
        currency,
        email: email || user.email || "",
        phone: phone || null,
        imageURL: null,
        createdAt: serverTimestamp(),
      };

      const offersCol = collection(db, "offers");
      const docRef = await addDoc(offersCol, offer);

      if (file) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const unsignedPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET!;

        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", unsignedPreset);
        form.append("folder", `offers/${docRef.id}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form }
        );
        const data = await res.json();

        await updateDoc(doc(db, "offers", docRef.id), {
          imageURL: data.secure_url,
          cloudinaryPublicId: data.public_id,
        });
      }

      router.replace("/my-dashboard");
    } catch (err) {
      console.error("Offer submit failed:", err);
      alert("Something went wrong while creating the offer.");
    }
  }

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

      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#0F3EA3",
          py: 6,
          textAlign: "center",
          marginTop: "3rem",
        }}
      >
        <Typography
          variant="h4"
          sx={{ color: "#FFFFFF", fontWeight: 700, mb: 1 }}
        >
          Create an Offer
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Share your availability and help others discover properties worldwide.
        </Typography>
      </Box>

      {/* Form Section */}
      <Box sx={{ display: "flex", justifyContent: "center", py: 6, px: 2 }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: "16px",
            width: "100%",
            maxWidth: 600,
            backgroundColor: "#F9FAFF",
          }}
        >
          <form
            onSubmit={handleDataUpload}
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            <TextField
              label="Name of the person fulfilling the offer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Title of the offer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Distance from city center (km)"
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Price for a viewing"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Phone (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />

            {/* Image Upload */}
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Offer cover picture
              </Typography>
              <Button
                component="label"
                variant="contained"
                sx={{
                  backgroundColor: "#2054CC",
                  color: "#FFFFFF",
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

              {preview && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    src={preview}
                    alt="preview"
                    sx={{ width: 56, height: 56 }}
                  />
                  <Typography variant="body2">{file?.name}</Typography>
                </Stack>
              )}
            </Stack>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 3,
                backgroundColor: "#0F3EA3",
                color: "#FFFFFF",
                fontWeight: 600,
                textTransform: "none",
                py: 1.5,
                "&:hover": { backgroundColor: "#2054CC" },
              }}
            >
              Submit Offer
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

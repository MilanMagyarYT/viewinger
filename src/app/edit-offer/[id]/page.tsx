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
import { useRouter, useParams } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { OffersId } from "@/types/OffersId";

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [offer, setOffer] = useState<OffersId | null>(null);

  // --- Load offer data ---
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "offers", params.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setOffer({ id: snap.id, ...snap.data() } as OffersId);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // --- Handle field changes ---
  const handleChange = (field: keyof OffersId, value: any) => {
    setOffer((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // --- Save changes ---
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!offer) return;
    setSaving(true);

    try {
      const ref = doc(db, "offers", offer.id);
      await updateDoc(ref, {
        ...offer,
        updatedAt: serverTimestamp(),
      });
      router.replace("/my-dashboard");
    } catch (err) {
      console.error("Failed to save offer:", err);
    } finally {
      setSaving(false);
    }
  };

  // --- UI ---
  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (!offer)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Typography variant="h6">Offer not found.</Typography>
      </Box>
    );

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
          Edit Offer
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Update your viewing offer details below.
        </Typography>
      </Box>

      {/* Form Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 6,
          px: 2,
        }}
      >
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
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            <TextField
              label="Title"
              value={offer.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={offer.description}
              onChange={(e) => handleChange("description", e.target.value)}
              multiline
              minRows={3}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={offer.city}
                onChange={(e) => handleChange("city", e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Country"
                value={offer.country}
                onChange={(e) => handleChange("country", e.target.value)}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Distance from city center (km)"
              type="number"
              value={offer.area}
              onChange={(e) => handleChange("area", Number(e.target.value))}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Price"
                type="number"
                value={offer.price}
                onChange={(e) => handleChange("price", Number(e.target.value))}
                required
                fullWidth
              />
              <TextField
                label="Currency"
                value={offer.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Email"
              type="email"
              value={offer.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Phone (optional)"
              type="tel"
              value={offer.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              fullWidth
            />

            {offer.imageURL && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Avatar
                  src={offer.imageURL}
                  alt={offer.title}
                  sx={{ width: 56, height: 56 }}
                />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Current cover image
                </Typography>
              </Stack>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
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
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}

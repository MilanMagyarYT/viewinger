"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Divider,
  Button,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { VerifiedBadge } from "@/components/VerifiedBadge";

type VerificationChecklist = {
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  profileComplete: boolean;
};

type ListerDoc = {
  displayName?: string;
  photoURL?: string;
  email?: string;
  legalName?: string;
  bio?: string;
  baseCity?: string;
  baseCountry?: string;
  languages?: string[];

  isVerified?: boolean;
  verificationChecklist?: VerificationChecklist;
  createdAt?: any;
};

type OfferSummary = {
  id: string;
  title: string;
  cityName?: string;
  countryName?: string;
  price?: number;
  currency?: string;
  imageURL?: string | null;
};

export default function ListerProfilePage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [lister, setLister] = useState<ListerDoc | null>(null);
  const [offers, setOffers] = useState<OfferSummary[]>([]);

  // --- load lister + their offers ---
  useEffect(() => {
    const uid = params.uid;
    if (!uid) return;

    (async () => {
      setLoading(true);
      try {
        // user doc
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = userSnap.data() as ListerDoc;
        setLister(data);

        // offers by this lister
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("uid", "==", uid));
        const offersSnap = await getDocs(q);

        const list: OfferSummary[] = [];
        offersSnap.forEach((docSnap) => {
          const o = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            title: o.title ?? "Untitled offer",
            cityName: o.cityName ?? o.city ?? undefined,
            countryName: o.countryName ?? o.country ?? undefined,
            price: typeof o.price === "number" ? o.price : Number(o.price) || 0,
            currency: o.currency ?? "",
            imageURL: o.imageURL ?? null,
          });
        });

        setOffers(list);
      } catch (err) {
        console.error("Failed to load lister profile:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.uid]);

  // --- helper for "Member since" ---
  function formatMemberSince(createdAt: any | undefined): string | null {
    if (!createdAt || typeof createdAt !== "object") return null;
    try {
      const maybeDate =
        typeof (createdAt as any).toDate === "function"
          ? (createdAt as any).toDate()
          : null;
      if (!maybeDate) return null;
      return maybeDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      });
    } catch {
      return null;
    }
  }

  // --- UI states ---
  if (loading) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !lister) {
    return (
      <Box
        sx={{
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
        }}
      >
        <MenuBar />
        <Box
          sx={{
            mt: "6rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <Typography variant="h6">Lister not found.</Typography>
        </Box>
      </Box>
    );
  }

  const checklist: VerificationChecklist = lister.verificationChecklist ?? {
    emailVerified: false,
    phoneVerified: false,
    idVerified: false,
    profileComplete: false,
  };

  const isVerified = !!lister.isVerified;

  const displayName =
    lister.displayName || lister.legalName || lister.email || "Lister";

  const memberSince = formatMemberSince(lister.createdAt);

  const languagesLabel = Array.isArray(lister.languages)
    ? lister.languages.join(", ")
    : "";

  const locationLabel =
    lister.baseCity && lister.baseCountry
      ? `${lister.baseCity}, ${lister.baseCountry}`
      : lister.baseCity || lister.baseCountry || "";

  const ChecklistItem: React.FC<{ label: string; ok: boolean }> = ({
    label,
    ok,
  }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 0.5,
      }}
    >
      <Chip
        label={ok ? "Done" : "Missing"}
        size="small"
        sx={{
          backgroundColor: ok ? "#E0F7E9" : "#FFEBEE",
          color: ok ? "#1B5E20" : "#C62828",
          fontWeight: 500,
        }}
      />
      <Typography
        variant="body2"
        sx={{ color: ok ? "text.primary" : "text.secondary" }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <MenuBar />

      {/* Header background bar */}
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
          Lister profile
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.9)" }}>
          Learn more about this person before booking a viewing.
        </Typography>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          maxWidth: 1000,
          mx: "auto",
          py: 6,
          px: 2,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {/* Top card: avatar + name + badge + location */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: "16px",
            backgroundColor: "#F9FAFF",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Avatar
              src={lister.photoURL || undefined}
              alt={displayName}
              sx={{
                width: 72,
                height: 72,
                fontSize: 32,
                bgcolor: "#2054CC",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {displayName}
                </Typography>
                <VerifiedBadge isVerified={isVerified} size="medium" />
              </Stack>

              {locationLabel && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Based in {locationLabel}
                </Typography>
              )}

              {memberSince && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Member since {memberSince}
                </Typography>
              )}
            </Box>

            {/* Optional CTA – for later maybe a "Book viewing" button */}
            <Button
              variant="outlined"
              onClick={() => {
                // For now maybe scroll to offers section
                const el = document.getElementById("lister-offers-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              sx={{
                borderColor: "#2054CC",
                color: "#2054CC",
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  borderColor: "#6C8DFF",
                  backgroundColor: "#E8F0FF",
                },
              }}
            >
              View their offers
            </Button>
          </Stack>
        </Paper>

        {/* Verification info */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Verification details
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            This lister&apos;s account is verified when all checks below are
            completed.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1 }}>
              <ChecklistItem
                label="Email address verified"
                ok={checklist.emailVerified}
              />
              <ChecklistItem
                label="Phone number provided"
                ok={checklist.phoneVerified}
              />
              <ChecklistItem
                label="Identity information provided"
                ok={checklist.idVerified}
              />
              <ChecklistItem
                label="Profile information complete"
                ok={checklist.profileComplete}
              />
            </Box>

            {isVerified ? (
              <Box
                sx={{
                  minWidth: 220,
                  p: 2,
                  borderRadius: "12px",
                  border: "1px solid #C5E1FF",
                  backgroundColor: "#E0F2FF",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Verified lister
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  This lister has provided contact details, identity information
                  and a complete profile. You still decide who to book, but this
                  badge can help you compare options.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  minWidth: 220,
                  p: 2,
                  borderRadius: "12px",
                  border: "1px solid #FFE0B2",
                  backgroundColor: "#FFF3E0",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Not fully verified yet
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  Some verification steps are still missing. You can still
                  choose this lister, but consider messaging them and comparing
                  with fully verified accounts.
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Bio & languages */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            borderRadius: "16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            About this lister
          </Typography>

          {lister.bio ? (
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {lister.bio}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This lister hasn&apos;t added a bio yet.
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={1}>
            {locationLabel && (
              <Chip
                label={locationLabel}
                sx={{
                  backgroundColor: "#E3F2FD",
                  color: "#0F3EA3",
                  fontWeight: 500,
                }}
              />
            )}
            {languagesLabel && (
              <Chip
                label={`Speaks: ${languagesLabel}`}
                sx={{
                  backgroundColor: "#F1F8E9",
                  color: "#33691E",
                  fontWeight: 500,
                }}
              />
            )}
          </Stack>
        </Paper>

        {/* Offers by this lister */}
        <Box id="lister-offers-section">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Offers by this lister
          </Typography>

          {offers.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              This lister doesn&apos;t have any active offers yet.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {offers.map((offer) => (
                <Paper
                  key={offer.id}
                  onClick={() => router.push(`/search-for-offers/${offer.id}`)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "background 0.2s ease, transform 0.15s ease",
                    "&:hover": {
                      backgroundColor: "#F9FAFF",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {offer.imageURL && (
                    <Box
                      component="img"
                      src={offer.imageURL}
                      alt={offer.title}
                      sx={{
                        width: 120,
                        height: 90,
                        borderRadius: "8px",
                        objectFit: "cover",
                        mr: 2,
                      }}
                    />
                  )}

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {offer.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "gray" }}>
                      {(offer.cityName || "Location unknown") +
                        (offer.countryName ? `, ${offer.countryName}` : "")}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 0.5, fontWeight: 500 }}
                    >
                      {offer.price} {offer.currency}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

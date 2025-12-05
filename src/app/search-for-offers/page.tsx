"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Breadcrumbs,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { Offer } from "@/types/Offer";
import { retrieveOffersFromDatabase } from "@/data/retrieveOffers";

import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { VerifiedBadge } from "@/components/VerifiedBadge";

type OfferWithUid = Offer & {
  uid?: string;
  name?: string;
  cityName?: string;
  countryName?: string;
};

export default function SearchForOffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const country = searchParams.get("country");

  const [offers, setOffers] = useState<OfferWithUid[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [cityInput, setCityInput] = useState(city ?? "");
  const [countryInput, setCountryInput] = useState(country ?? "");

  // lister verification cache: uid -> isVerified
  const [listerVerification, setListerVerification] = useState<
    Record<string, { isVerified: boolean }>
  >({});

  useEffect(() => {
    const fetchOffers = async () => {
      if (!city && !country) {
        setLoading(false);
        return;
      }
      const results = await retrieveOffersFromDatabase(
        city ?? "",
        country ?? ""
      );
      setOffers(results as OfferWithUid[]);
      setLoading(false);
    };
    fetchOffers();
  }, [city, country]);

  // load verification state for listers used in current offers
  useEffect(() => {
    const loadVerification = async () => {
      const uids = Array.from(
        new Set(offers.map((o) => o.uid).filter((uid): uid is string => !!uid))
      );
      if (!uids.length) return;

      const newMap: Record<string, { isVerified: boolean }> = {
        ...listerVerification,
      };

      await Promise.all(
        uids.map(async (uid) => {
          if (newMap[uid] !== undefined) return; // already loaded
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const data = snap.data() as any;
              newMap[uid] = { isVerified: !!data.isVerified };
            } else {
              newMap[uid] = { isVerified: false };
            }
          } catch (err) {
            console.error("Failed to load lister verification:", err);
            newMap[uid] = { isVerified: false };
          }
        })
      );

      setListerVerification(newMap);
    };

    if (offers.length > 0) {
      loadVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    nextView: "list" | "grid"
  ) => {
    if (nextView) setViewMode(nextView);
  };

  const handleOfferClick = (offerId: string) => {
    router.push(`/search-for-offers/${offerId}`);
  };

  const handleListerClick = (e: React.MouseEvent, uid: string | undefined) => {
    if (!uid) return;
    e.stopPropagation();
    router.push(`/lister/${uid}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      city: cityInput.trim(),
      country: countryInput.trim(),
    });
    router.push(`/search-for-offers?${params.toString()}`);
  };

  const getLocationLabel = (offer: OfferWithUid) => {
    const c = offer.cityName || (offer as any).city;
    const country = offer.countryName || (offer as any).country;
    if (c && country) return `${c}, ${country}`;
    return c || country || "";
  };

  // -------- JSX -----------
  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <MenuBar />

      {/* Compact Search Header */}
      <Box
        sx={{
          backgroundColor: "#0F3EA3",
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "3rem",
        }}
      >
        {/* Search Box */}
        <Paper
          elevation={4}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "90%",
            maxWidth: 800,
            p: 1.5,
            borderRadius: "12px",
            border: "2px solid #6C8DFF",
            backgroundColor: "#FFFFFF",
          }}
        >
          <TextField
            label="City"
            variant="outlined"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            sx={{
              flex: 1,
              mr: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#F9FAFB",
              },
            }}
          />
          <TextField
            label="Country"
            variant="outlined"
            value={countryInput}
            onChange={(e) => setCountryInput(e.target.value)}
            sx={{
              flex: 1,
              mr: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#F9FAFB",
              },
            }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{
              backgroundColor: "#2054CC",
              color: "#FFFFFF",
              px: 4,
              py: 1.5,
              fontWeight: 600,
              borderRadius: "8px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#6C8DFF" },
            }}
          >
            Search
          </Button>
        </Paper>

        {/* Breadcrumbs */}
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            mt: 2,
            color: "#FFFFFF",
            "& a": { color: "#FFFFFF", textDecoration: "none", opacity: 0.85 },
            "& a:hover": { textDecoration: "underline" },
          }}
        >
          <Link onClick={() => router.push("/")} sx={{ cursor: "pointer" }}>
            Home
          </Link>
          {country && (
            <Link
              onClick={() =>
                router.push(`/search-for-offers?country=${country}`)
              }
            >
              {country}
            </Link>
          )}
          {city && <Typography sx={{ color: "#FFFFFF" }}>{city}</Typography>}
        </Breadcrumbs>
      </Box>

      {/* Results Section */}
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        {/* Results Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {city && country
              ? `${city}, ${country}: ${offers.length} offers found`
              : `${offers.length} offers found`}
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            sx={{
              backgroundColor: "#F4F4F4",
              borderRadius: "20px",
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 500,
                border: "none",
                px: 2,
                borderRadius: "20px",
              },
              "& .Mui-selected": {
                backgroundColor: "#2054CC",
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#6C8DFF" },
              },
            }}
          >
            <ToggleButton value="list">List</ToggleButton>
            <ToggleButton value="grid">Grid</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Loading / Empty / Results */}
        {loading ? (
          <Box
            sx={{
              minHeight: "50vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : offers.length === 0 ? (
          <Typography>No offers found.</Typography>
        ) : viewMode === "grid" ? (
          <Grid container spacing={3}>
            {offers.map((offer) => {
              const uid = offer.uid;
              const isVerified =
                uid && listerVerification[uid]?.isVerified === true;

              return (
                <Grid item xs={12} sm={6} md={4} key={offer.id}>
                  <Paper
                    onClick={() => handleOfferClick(offer.id)}
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={offer.imageURL}
                      alt={offer.title}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: "8px",
                        mb: 2,
                      }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {offer.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "gray" }}>
                      {getLocationLabel(offer)}
                    </Typography>

                    {/* Lister + badge */}
                    <Box
                      sx={{
                        mt: 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#0F3EA3",
                          textDecoration: uid ? "underline" : "none",
                          cursor: uid ? "pointer" : "default",
                        }}
                        onClick={(e) => handleListerClick(e, uid)}
                      >
                        {offer.name || "Lister"}
                      </Typography>
                      <VerifiedBadge isVerified={!!isVerified} size="small" />
                    </Box>

                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                      {offer.price} {offer.currency}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {offers.map((offer) => {
              const uid = offer.uid;
              const isVerified =
                uid && listerVerification[uid]?.isVerified === true;

              return (
                <Paper
                  key={offer.id}
                  onClick={() => handleOfferClick(offer.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                    "&:hover": { backgroundColor: "#F9FAFF" },
                  }}
                >
                  <Box
                    component="img"
                    src={offer.imageURL}
                    alt={offer.title}
                    sx={{
                      width: 160,
                      height: 120,
                      borderRadius: "8px",
                      objectFit: "cover",
                      mr: 2,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {offer.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "gray" }}>
                      {getLocationLabel(offer)}
                    </Typography>

                    {/* Lister + badge */}
                    <Box
                      sx={{
                        mt: 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#0F3EA3",
                          textDecoration: uid ? "underline" : "none",
                          cursor: uid ? "pointer" : "default",
                        }}
                        onClick={(e) => handleListerClick(e, uid)}
                      >
                        {offer.name || "Lister"}
                      </Typography>
                      <VerifiedBadge isVerified={!!isVerified} size="small" />
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{ mt: 0.5, fontWeight: 500 }}
                    >
                      {offer.price} {offer.currency}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

"use client";

import * as React from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Container,
  Stack,
  IconButton,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  StarRounded,
  ViewModuleRounded,
  ViewListRounded,
  ArrowDropDownRounded,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { CityAutocomplete, CityOption } from "@/components/CityAutocomplete";
import {
  Country,
  EuropeCountryAutocomplete,
} from "@/components/EuropeCountryAutocompleteProps";

import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
  doc,
  getDoc,
} from "firebase/firestore";
import { VerifiedBadge } from "@/components/VerifiedBadge";

// ---- Palette ----

const COLORS = {
  accent: "#F8BB84",
  navyDark: "#2D3250",
  navy: "#424769",
  muted: "#737AA8",
  white: "#FFFFFF",
};

// ---- Types ----

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    [key: string]: any;
  };
};

type GeocodedAddress = {
  label: string;
  lat: number;
  lng: number;
  address: NominatimResult["address"];
};

type OfferHit = {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageURL?: string | null;
  cityName?: string;
  countryName?: string;
  coverageRadiusKm: number;
  distanceKm: number;
  uid?: string;
  listerName?: string;
};

type ListerMeta = {
  isVerified: boolean;
  profileImage?: string | null;
};

// ---- Helpers ----

async function geocodeStructuredAddress(params: {
  street: string;
  city: string;
  country: string;
}): Promise<GeocodedAddress | null> {
  const { street, city, country } = params;

  const searchParams = new URLSearchParams({
    street,
    city,
    country,
    format: "jsonv2",
    addressdetails: "1",
    limit: "1",
  });

  const url = `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    console.error("Nominatim error", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as NominatimResult[];

  if (!data.length) return null;

  const first = data[0];

  return {
    label: first.display_name,
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    address: first.address ?? {},
  };
}

function buildOsmEmbedUrl(lat: number, lng: number): string {
  const delta = 0.01;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  const params = new URLSearchParams({
    bbox: `${left},${bottom},${right},${top}`,
    layer: "mapnik",
    marker: `${lat},${lng}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

// Haversine distance in km between two lat/lng points
function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch offers whose coverage circle contains the given point
async function fetchOffersCoveringPoint(params: {
  lat: number;
  lng: number;
  countryCode?: string | null;
}): Promise<OfferHit[]> {
  const { lat, lng, countryCode } = params;

  const offersCol = collection(db, "offers");
  const constraints: QueryConstraint[] = [];

  if (countryCode) {
    constraints.push(where("countryCode", "==", countryCode));
  }

  const snap = await getDocs(
    constraints.length ? query(offersCol, ...constraints) : offersCol
  );

  const results: OfferHit[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data() as any;

    const centerLat = data.coverageCenterLat;
    const centerLng = data.coverageCenterLng;
    const coverageRadiusKm = data.coverageRadiusKm;

    if (
      typeof centerLat !== "number" ||
      typeof centerLng !== "number" ||
      typeof coverageRadiusKm !== "number"
    ) {
      return;
    }

    const distanceKm = haversineDistanceKm(lat, lng, centerLat, centerLng);

    if (distanceKm <= coverageRadiusKm) {
      results.push({
        id: docSnap.id,
        title: data.title ?? "Untitled offer",
        price:
          typeof data.price === "number" ? data.price : Number(data.price) || 0,
        currency: data.currency ?? "",
        imageURL: data.imageURL ?? null,
        cityName: data.cityName ?? data.city ?? undefined,
        countryName: data.countryName ?? data.country ?? undefined,
        coverageRadiusKm,
        distanceKm,
        uid: data.uid,
        listerName: data.name ?? data.listerName ?? undefined,
      });
    }
  });

  results.sort((a, b) => a.distanceKm - b.distanceKm);

  return results;
}

// ---- Page ----

export default function AddressStructuredSearchPage() {
  const router = useRouter();

  const [country, setCountry] = React.useState<Country | null>({
    code: "NL",
    name: "Netherlands",
  });
  const [city, setCity] = React.useState<CityOption | null>(null);
  const [street, setStreet] = React.useState("");

  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GeocodedAddress | null>(null);

  const [offers, setOffers] = React.useState<OfferHit[]>([]);
  const [offersLoading, setOffersLoading] = React.useState(false);

  // uid -> meta (verified + profile image)
  const [listerMeta, setListerMeta] = React.useState<
    Record<string, ListerMeta>
  >({});

  const isFormValid = !!country && !!city && street.trim().length > 0;

  async function handleSearch() {
    if (!isFormValid || !country || !city) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setOffers([]);
    setOffersLoading(false);

    try {
      const geocoded = await geocodeStructuredAddress({
        street,
        city: city.name,
        country: country.name,
      });

      if (!geocoded) {
        setError(
          "We couldn’t find that street in the selected city and country. Please check the spelling or try adding a house number."
        );
        return;
      }

      setResult(geocoded);

      setOffersLoading(true);
      const hits = await fetchOffersCoveringPoint({
        lat: geocoded.lat,
        lng: geocoded.lng,
        countryCode: country.code,
      });
      setOffers(hits);
    } catch (e) {
      console.error(e);
      setError("Something went wrong while searching. Please try again.");
    } finally {
      setIsSearching(false);
      setOffersLoading(false);
    }
  }

  // load verification & profile image for listers in `offers`
  React.useEffect(() => {
    const loadMeta = async () => {
      const uids = Array.from(
        new Set(offers.map((o) => o.uid).filter((uid): uid is string => !!uid))
      );
      if (!uids.length) return;

      const newMap: Record<string, ListerMeta> = { ...listerMeta };

      await Promise.all(
        uids.map(async (uid) => {
          if (newMap[uid] !== undefined) return;
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const data = snap.data() as any;
              newMap[uid] = {
                isVerified: !!data.isVerified,
                profileImage: data.profileImage ?? data.photoURL ?? null,
              };
            } else {
              newMap[uid] = { isVerified: false };
            }
          } catch (err) {
            console.error("Failed to load lister meta:", err);
            newMap[uid] = { isVerified: false };
          }
        })
      );

      setListerMeta(newMap);
    };

    if (offers.length > 0) {
      loadMeta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  const mapUrl =
    result != null ? buildOsmEmbedUrl(result.lat, result.lng) : null;

  const handleOfferClick = (offerId: string) => {
    router.push(`/search-for-offers/${offerId}`);
  };

  const handleListerClick = (e: React.MouseEvent, uid: string | undefined) => {
    if (!uid) return;
    e.stopPropagation();
    router.push(`/lister/${uid}`);
  };

  const MAP_HEIGHT = 520;

  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: COLORS.white }}
    >
      <MenuBar />

      {/* Top navy header with breadcrumb + pill search */}
      <Box
        sx={{
          backgroundColor: COLORS.navyDark,
          mt: "3rem",
          pt: 3,
          pb: 3,
        }}
      >
        <Container maxWidth="lg">
          {/* Breadcrumb */}
          <Typography
            variant="body2"
            sx={{ color: COLORS.white, mb: 2, display: "flex", gap: 0.5 }}
          >
            <Box component="span">Home</Box>
            <Box component="span" sx={{ opacity: 0.7 }}>
              &gt;
            </Box>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Search
            </Box>
          </Typography>

          {/* Search pill */}
          <Paper
            elevation={6}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              px: 3,
              py: 1.5,
              borderRadius: "999px",
              backgroundColor: COLORS.navy,
              border: `2px solid ${COLORS.muted}`,
            }}
          >
            {/* Country */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
                gap: 1,
              }}
            >
              <LocationOnOutlinedIcon
                sx={{ color: COLORS.accent, fontSize: 20 }}
              />
              <EuropeCountryAutocomplete
                value={country}
                onChange={setCountry}
                label="Country"
                helperText=""
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "transparent",
                    color: COLORS.white,
                    py: 0,
                    "& fieldset": { border: "none" },
                  },
                  "& .MuiInputLabel-root": {
                    color: COLORS.white,
                    "&.Mui-focused": { color: COLORS.white },
                  },
                  "& .MuiSvgIcon-root": {
                    color: COLORS.accent,
                  },
                }}
              />
            </Box>

            {/* Divider */}
            <Box
              sx={{
                height: 40,
                borderLeft: `1px solid ${COLORS.muted}`,
              }}
            />

            {/* City */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
                gap: 1,
              }}
            >
              <NearMeOutlinedIcon sx={{ color: COLORS.accent, fontSize: 20 }} />
              <CityAutocomplete
                countryCode={country?.code ?? null}
                value={city}
                onChange={setCity}
                label="City"
                helperText=""
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "transparent",
                    color: COLORS.white,
                    py: 0,
                    "& fieldset": { border: "none" },
                  },
                  "& .MuiInputLabel-root": {
                    color: COLORS.white,
                    "&.Mui-focused": { color: COLORS.white },
                  },
                  "& .MuiSvgIcon-root": {
                    color: COLORS.accent,
                  },
                }}
              />
            </Box>

            {/* Divider */}
            <Box
              sx={{
                height: 40,
                borderLeft: `1px solid ${COLORS.muted}`,
              }}
            />

            {/* Address */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1.4,
                minWidth: 0,
                gap: 1,
              }}
            >
              <SearchOutlinedIcon sx={{ color: COLORS.accent, fontSize: 20 }} />
              <TextField
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Address"
                variant="outlined"
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: "transparent",
                    color: COLORS.white,
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            {/* Search button */}
            <Button
              variant="contained"
              disabled={!isFormValid || isSearching}
              onClick={handleSearch}
              sx={{
                ml: 1,
                borderRadius: "999px",
                px: 4,
                py: 1,
                backgroundColor: COLORS.accent,
                color: COLORS.navyDark,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#f6a76a",
                },
              }}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </Paper>

          {/* Error message under bar */}
          {error && (
            <Box sx={{ mt: 2 }}>
              <Paper
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${COLORS.accent}`,
                  backgroundColor: COLORS.white,
                }}
              >
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>

      {/* Map + offers big container */}
      <Container sx={{ py: 5 }} maxWidth="lg">
        {result && (
          <Paper
            elevation={6}
            sx={{
              borderRadius: "24px",
              backgroundColor: COLORS.navyDark,
              border: `2px solid ${COLORS.muted}`,
              p: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                height: MAP_HEIGHT,
              }}
            >
              {/* Map side (60%) */}
              <Box
                sx={{
                  flex: 3,
                  borderRadius: "18px",
                  overflow: "hidden",
                  bgcolor: COLORS.navy,
                }}
              >
                {mapUrl ? (
                  <Box
                    component="iframe"
                    src={mapUrl}
                    sx={{
                      width: "100%",
                      height: "100%",
                      border: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: COLORS.white,
                    }}
                  >
                    <Typography variant="body2">
                      Map preview will appear after you search.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Offers side (40%) */}
              <Box
                sx={{
                  flex: 2,
                  display: "flex",
                  flexDirection: "column",
                  color: COLORS.white,
                }}
              >
                {/* Header row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                    px: 1,
                  }}
                >
                  <Typography variant="subtitle1">
                    There are{" "}
                    <Box
                      component="span"
                      sx={{ color: COLORS.accent, fontWeight: 700 }}
                    >
                      {offers.length}
                    </Box>{" "}
                    offers
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      color: COLORS.muted,
                      fontSize: 14,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography variant="body2">Sort by:</Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                          cursor: "default",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: COLORS.white }}
                        >
                          Any
                        </Typography>
                        <ArrowDropDownRounded fontSize="small" />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        disableRipple
                        sx={{
                          bgcolor: COLORS.accent,
                          color: COLORS.navyDark,
                          "&:hover": { bgcolor: COLORS.accent },
                        }}
                      >
                        <ViewModuleRounded fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disableRipple
                        sx={{
                          color: COLORS.muted,
                          "&:hover": { bgcolor: "transparent" },
                        }}
                      >
                        <ViewListRounded fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Offers list (scrollable only on right side) */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    pb: 1,
                  }}
                >
                  {offersLoading ? (
                    <Box
                      sx={{
                        mt: 2,
                        minHeight: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress
                        size={26}
                        sx={{ color: COLORS.accent }}
                      />
                    </Box>
                  ) : offers.length === 0 ? (
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      No offers currently cover this exact address. Try a nearby
                      address or check back later.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {offers.map((offer) => {
                        const uid = offer.uid;
                        const meta = uid ? listerMeta[uid] : undefined;
                        const isVerified = meta?.isVerified === true;
                        const avatarSrc = meta?.profileImage || undefined;

                        // placeholder rating UI
                        const ratingValue = 4.5;
                        const ratingCount = 27;

                        return (
                          <Paper
                            key={offer.id}
                            onClick={() => handleOfferClick(offer.id)}
                            sx={{
                              backgroundColor: COLORS.navy,
                              color: COLORS.white,
                              borderRadius: "20px",
                              cursor: "pointer",
                              overflow: "hidden",
                              position: "relative",
                              transition:
                                "transform 0.15s ease, box-shadow 0.15s ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                              },
                            }}
                          >
                            {/* Cover image */}
                            {offer.imageURL && (
                              <Box
                                component="img"
                                src={offer.imageURL}
                                alt={offer.title}
                                sx={{
                                  width: "100%",
                                  height: 140,
                                  objectFit: "cover",
                                }}
                              />
                            )}

                            {/* Lister avatar overlay */}
                            {avatarSrc && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  right: 16,
                                  top: 100,
                                  width: 76,
                                  height: 76,
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  border: `3px solid ${COLORS.navy}`,
                                }}
                              >
                                <Box
                                  component="img"
                                  src={avatarSrc}
                                  alt={offer.listerName || "Lister"}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </Box>
                            )}

                            {/* Text content */}
                            <Box sx={{ p: 2.5, pt: 2.5 }}>
                              {/* Name + verified */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                <VerifiedBadge
                                  isVerified={isVerified}
                                  size="small"
                                />
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {offer.listerName || "Lister"}
                                </Typography>
                              </Box>

                              {/* Offer title */}
                              <Typography
                                variant="body2"
                                sx={{
                                  color: COLORS.white,
                                  opacity: 0.9,
                                  mb: 1,
                                }}
                              >
                                {offer.title}
                              </Typography>

                              {/* Rating row (static for now) */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mb: 1,
                                }}
                              >
                                <StarRounded
                                  fontSize="small"
                                  sx={{ color: COLORS.accent }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: COLORS.accent, fontWeight: 600 }}
                                >
                                  {ratingValue.toFixed(1)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: COLORS.muted }}
                                >
                                  ({ratingCount})
                                </Typography>
                              </Box>

                              {/* Price & distance */}
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "baseline",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: COLORS.muted }}
                                >
                                  ~{offer.distanceKm.toFixed(1)} km away ·
                                  coverage {offer.coverageRadiusKm.toFixed(1)}{" "}
                                  km
                                </Typography>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: COLORS.muted }}
                                  >
                                    from
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color: COLORS.accent,
                                      fontWeight: 700,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {offer.currency} {offer.price}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        {!result && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: "center" }}
          >
            Search for an address above to see who can go to that viewing for
            you.
          </Typography>
        )}
      </Container>
    </Box>
  );
}

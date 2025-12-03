"use client";

import * as React from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
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
} from "firebase/firestore";

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

// We only need a subset of fields + distance
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
  const R = 6371; // Earth radius in km
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
      return; // skip malformed offers
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
      });
    }
  });

  // Sort by distance ascending
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

      // Fetch offers that cover this point
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

  const mapUrl =
    result != null ? buildOsmEmbedUrl(result.lat, result.lng) : null;

  const handleOfferClick = (offerId: string) => {
    // reuse your existing offer-detail page route
    router.push(`/search-for-offers/${offerId}`);
  };

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        mt: 4,
        mb: 6,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Typography variant="h4" component="h1">
        Search viewing address
      </Typography>

      {/* Country autocomplete (Europe) */}
      <EuropeCountryAutocomplete
        value={country}
        onChange={setCountry}
        label="Country"
        helperText="Start typing the country (minimum 3 letters)."
      />

      {/* City autocomplete (depends on country) */}
      <CityAutocomplete
        countryCode={country?.code ?? null}
        value={city}
        onChange={setCity}
        label="City"
        helperText="Start typing the city name in the selected country."
      />

      {/* Street (+ optional number) */}
      <TextField
        label="Street (and house number if known)"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        fullWidth
        placeholder="Damrak 5 or just Damrak"
        helperText="You can leave out the house number if you don’t know it yet."
      />

      {/* Search button + validation */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="contained"
          disabled={!isFormValid || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? "Searching..." : "Find address & offers"}
        </Button>

        {!isFormValid && (
          <Typography variant="body2" color="text.secondary">
            Select a country, pick a city, and fill in street to search.
          </Typography>
        )}
      </Box>

      {error && (
        <Paper sx={{ p: 2, borderLeft: "4px solid #f44336" }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Paper>
      )}

      {/* Result info */}
      {result && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Geocoded address
          </Typography>
          <Typography variant="body1">{result.label}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Lat: <strong>{result.lat}</strong>
            <br />
            Lng: <strong>{result.lng}</strong>
          </Typography>
        </Paper>
      )}

      {/* Map preview */}
      {mapUrl && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Map preview
          </Typography>
          <Box
            component="iframe"
            src={mapUrl}
            sx={{
              width: "100%",
              height: 300,
              border: 0,
              borderRadius: 2,
              boxShadow: 1,
            }}
          />
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            © OpenStreetMap contributors
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Offers list */}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Offers that can cover this viewing
          </Typography>

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
              <CircularProgress size={24} />
            </Box>
          ) : offers.length === 0 ? (
            <Typography variant="body2" sx={{ mt: 1 }}>
              No offers currently cover this exact address. Try a nearby address
              or check back later.
            </Typography>
          ) : (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {offers.map((offer) => (
                <Paper
                  key={offer.id}
                  onClick={() => handleOfferClick(offer.id)}
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
                      {(offer.cityName || "City unknown") +
                        (offer.countryName ? `, ${offer.countryName}` : "")}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 0.5, fontWeight: 500 }}
                    >
                      {offer.price} {offer.currency}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.5, display: "block", color: "gray" }}
                    >
                      ~{offer.distanceKm.toFixed(1)} km from address (coverage
                      radius {offer.coverageRadiusKm.toFixed(1)} km)
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

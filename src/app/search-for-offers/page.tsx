"use client";

import * as React from "react";
import { Box, Toolbar } from "@mui/material";
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import SearchHeader from "@/components/SearchHeader";
import SearchResultsLayout from "@/components/SearchResultsLayout";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { Country } from "@/components/EuropeCountryAutocompleteProps";
import { CityOption } from "@/components/CityAutocomplete";

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
import {
  GeocodedAddress,
  ListerMeta,
  NominatimResult,
  OfferHit,
} from "@/types/SearchPage";

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

  const handleListerClick = (uid: string | undefined) => {
    if (!uid) return;
    router.push(`/lister/${uid}`);
  };

  return (
    <Box
      sx={{
        width: "100%", // ⬅ avoid 100vw to remove white strip
        minHeight: "100vh",
        backgroundColor: COLORS.white,
      }}
    >
      <MenuBar />
      {/* Spacer so content starts below fixed AppBar */}
      <Toolbar /> {/* ⬅ this takes the same height as the AppBar */}
      {/* Top navy header with breadcrumb + pill search */}
      <SearchHeader
        country={country}
        setCountry={setCountry}
        city={city}
        setCity={setCity}
        street={street}
        setStreet={setStreet}
        isFormValid={isFormValid}
        isSearching={isSearching}
        onSearch={handleSearch}
        error={error}
      />
      {/* Map + offers layout */}
      <SearchResultsLayout
        result={result}
        mapUrl={mapUrl}
        offers={offers}
        offersLoading={offersLoading}
        listerMeta={listerMeta}
        onOfferClick={handleOfferClick}
        onListerClick={handleListerClick}
      />
    </Box>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
  Slider,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

import {
  EuropeCountryAutocomplete,
  Country as CountryType,
} from "@/components/EuropeCountryAutocompleteProps";
import { CityAutocomplete, CityOption } from "@/components/CityAutocomplete";

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [docId, setDocId] = useState<string | null>(null);

  // basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [imageURL, setImageURL] = useState<string | null>(null);

  // geo fields
  const [country, setCountry] = useState<CountryType | null>(null);
  const [cityOption, setCityOption] = useState<CityOption | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [pinLatLng, setPinLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerIconRef = useRef<any>(null);

  // --- load offer ---
  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "offers", params.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }

        const data = snap.data() as any;
        setDocId(snap.id);

        // basic fields
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setPrice(
          typeof data.price === "number" ? String(data.price) : data.price ?? ""
        );
        setCurrency(data.currency ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setName(data.name ?? "");
        setImageURL(data.imageURL ?? null);

        // country
        if (data.countryName && data.countryCode) {
          setCountry({
            code: data.countryCode,
            name: data.countryName,
          });
        }

        // city + coordinates
        const cityName = data.cityName ?? data.city ?? null;
        const cityLat = typeof data.cityLat === "number" ? data.cityLat : null;
        const cityLng = typeof data.cityLng === "number" ? data.cityLng : null;

        if (cityName && cityLat != null && cityLng != null) {
          setCityOption({
            id: `${cityName}-${cityLat},${cityLng}`,
            name: cityName,
            displayName: cityName,
            lat: cityLat,
            lng: cityLng,
            raw: null as any,
          } as CityOption);
        }

        // coverage center
        const centerLat =
          typeof data.coverageCenterLat === "number"
            ? data.coverageCenterLat
            : cityLat;
        const centerLng =
          typeof data.coverageCenterLng === "number"
            ? data.coverageCenterLng
            : cityLng;

        if (centerLat != null && centerLng != null) {
          setPinLatLng({ lat: centerLat, lng: centerLng });
        }

        // radius
        const radius =
          typeof data.coverageRadiusKm === "number"
            ? data.coverageRadiusKm
            : typeof data.area === "number"
            ? data.area
            : 5;
        setRadiusKm(radius);
      } catch (err) {
        console.error("Failed to load offer:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // --- init Leaflet map ---
  useEffect(() => {
    if (loading) return;

    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    let isMounted = true;

    (async () => {
      try {
        const mod = await import("leaflet");
        const L = (mod as any).default || mod;
        leafletRef.current = L;

        // custom marker icon
        markerIconRef.current = L.divIcon({
          html:
            '<div style="width:18px;height:18px;border-radius:50%;' +
            "background:#2054CC;border:2px solid white;" +
            'box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        if (!isMounted || !mapContainerRef.current) return;

        const initialCenter: [number, number] =
          pinLatLng != null
            ? [pinLatLng.lat, pinLatLng.lng]
            : cityOption != null
            ? [cityOption.lat, cityOption.lng]
            : [52.37, 4.9];

        const map = L.map(mapContainerRef.current).setView(initialCenter, 11);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // click to move pin
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setPinLatLng({ lat, lng });
        });
      } catch (err) {
        console.error("Leaflet init error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      circleRef.current = null;
      markerIconRef.current = null;
    };
    // we intentionally do *not* depend on pinLatLng/cityOption here
  }, [loading]);

  // --- center map when city changes (user picks another city) ---
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!cityOption || !map || !L) return;

    const center: [number, number] = [cityOption.lat, cityOption.lng];
    map.setView(center, 11);

    setPinLatLng(
      (prev) => prev ?? { lat: cityOption.lat, lng: cityOption.lng }
    );
  }, [cityOption]);

  // --- marker + circle when pin/radius changes ---
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !pinLatLng) return;

    const latLng: [number, number] = [pinLatLng.lat, pinLatLng.lng];

    // marker
    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, {
        icon: markerIconRef.current || undefined,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
    }

    // circle
    const radiusMeters = radiusKm * 1000;
    if (!circleRef.current) {
      circleRef.current = L.circle(latLng, {
        radius: radiusMeters,
        color: "#2054CC",
        fillColor: "#6C8DFF",
        fillOpacity: 0.3,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(latLng);
      circleRef.current.setRadius(radiusMeters);
    }
  }, [pinLatLng, radiusKm]);

  // --- save ---
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!docId) return;

    if (!country || !cityOption || !pinLatLng) {
      alert("Please make sure country, city, and map pin are set.");
      return;
    }

    setSaving(true);
    try {
      const ref = doc(db, "offers", docId);
      await updateDoc(ref, {
        title,
        description,
        price: Number(price),
        currency,
        email,
        phone: phone || null,
        name,

        countryName: country.name,
        countryCode: country.code,
        cityName: cityOption.name,
        cityLat: cityOption.lat,
        cityLng: cityOption.lng,

        coverageCenterLat: pinLatLng.lat,
        coverageCenterLng: pinLatLng.lng,
        coverageRadiusKm: radiusKm,

        updatedAt: serverTimestamp(),
      });
      router.replace("/my-dashboard");
    } catch (err) {
      console.error("Failed to save offer:", err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // --- UI states ---
  if (loading) {
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
  }

  if (notFound) {
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
  }

  // --- main UI ---
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

      {/* Form */}
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

            {/* Country + City */}
            <Stack direction="row" spacing={2}>
              <EuropeCountryAutocomplete
                value={country}
                onChange={setCountry}
                label="Country"
                helperText="Start typing the country (minimum 3 letters)."
              />
              <CityAutocomplete
                countryCode={country?.code ?? null}
                value={cityOption}
                onChange={setCityOption}
                label="City"
                helperText="Start typing the city name in that country."
              />
            </Stack>

            {/* Map + radius */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Coverage area
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click on the map to set the center point of your coverage. Use
                the slider to adjust how far you&apos;re willing to travel from
                that point.
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  height: 320,
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #E0E7FF",
                  boxShadow: 1,
                }}
              >
                <div
                  ref={mapContainerRef}
                  style={{ width: "100%", height: "100%" }}
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Radius from pin: <strong>{radiusKm.toFixed(1)} km</strong>
                </Typography>
                <Slider
                  value={radiusKm}
                  min={0}
                  max={25}
                  step={0.5}
                  onChange={(_e, value) => setRadiusKm(value as number)}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>

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

            {imageURL && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mt: 2 }}
              >
                <Avatar
                  src={imageURL}
                  alt={title}
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

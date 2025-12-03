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

// geo UI components (paths as you used them)
import {
  EuropeCountryAutocomplete,
  Country as CountryType,
} from "@/components/EuropeCountryAutocompleteProps";
import { CityAutocomplete, CityOption } from "@/components/CityAutocomplete";

export default function CreateAnOffer() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- basic form fields ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // --- geo selection state ---
  const [country, setCountry] = useState<CountryType | null>({
    code: "NL",
    name: "Netherlands",
  });
  const [cityOption, setCityOption] = useState<CityOption | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5); // slider value, 0–25 km

  // pin center (coverage center)
  const [pinLatLng, setPinLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerIconRef = useRef<any>(null); // custom marker icon

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

  // --- INIT LEAFLET MAP (dynamic import, browser only) ---
  useEffect(() => {
    console.log("[MAP EFFECT] run", {
      loadingAuth,
      container: !!mapContainerRef.current,
      hasMap: !!mapRef.current,
    });

    if (loadingAuth) {
      console.log("[MAP EFFECT] waiting for auth to finish");
      return;
    }

    if (!mapContainerRef.current) {
      console.log("[MAP EFFECT] no container yet after auth, will run again");
      return;
    }

    if (mapRef.current) {
      console.log("[MAP EFFECT] map already initialized, skipping");
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        console.log("[MAP EFFECT] importing leaflet...");
        const mod = await import("leaflet");
        const L = (mod as any).default || mod;
        leafletRef.current = L;

        // create custom marker icon (blue dot)
        markerIconRef.current = L.divIcon({
          html:
            '<div style="width:18px;height:18px;border-radius:50%;' +
            "background:#2054CC;border:2px solid white;" +
            'box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        if (!isMounted) {
          console.log("[MAP EFFECT] not mounted anymore, abort");
          return;
        }
        if (!mapContainerRef.current) {
          console.log("[MAP EFFECT] container missing after import, abort");
          return;
        }

        const initialCenter: [number, number] = [52.37, 4.9]; // default Amsterdam-ish
        console.log("[MAP EFFECT] creating map at center", initialCenter);

        const map = L.map(mapContainerRef.current).setView(initialCenter, 6);
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        console.log("[MAP EFFECT] tile layer added");

        // clicking on map drops/moves pin
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          console.log("[MAP CLICK] clicked at", lat, lng);
          setPinLatLng({ lat, lng });
        });
      } catch (err) {
        console.error("[MAP EFFECT] ERROR while setting up leaflet map", err);
      }
    })();

    return () => {
      console.log("[MAP EFFECT] cleanup");
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      circleRef.current = null;
      markerIconRef.current = null;
    };
  }, [loadingAuth]); // rerun when auth finishes

  // --- UPDATE MAP CENTER WHEN CITY CHANGES ---
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    console.log("[CITY EFFECT] triggered", {
      hasCity: !!cityOption,
      hasMap: !!map,
      hasLeaflet: !!L,
      cityOption,
    });

    if (!cityOption || !map || !L) return;

    const center: [number, number] = [cityOption.lat, cityOption.lng];
    console.log("[CITY EFFECT] setting map view to", center);
    map.setView(center, 11);

    // if no pin yet, drop it at city center
    setPinLatLng(
      (prev) =>
        prev ?? {
          lat: cityOption.lat,
          lng: cityOption.lng,
        }
    );
  }, [cityOption]);

  // --- UPDATE MARKER AND RADIUS CIRCLE WHEN PIN / RADIUS CHANGES ---
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    console.log("[PIN/RADIUS EFFECT] triggered", {
      hasLeaflet: !!L,
      hasMap: !!map,
      hasPin: !!pinLatLng,
      pinLatLng,
      radiusKm,
    });

    if (!L || !map || !pinLatLng) return;

    const latLng: [number, number] = [pinLatLng.lat, pinLatLng.lng];

    // marker
    if (!markerRef.current) {
      console.log("[PIN/RADIUS EFFECT] creating marker at", latLng);
      markerRef.current = L.marker(latLng, {
        icon: markerIconRef.current || undefined,
      }).addTo(map);
    } else {
      console.log("[PIN/RADIUS EFFECT] moving marker to", latLng);
      markerRef.current.setLatLng(latLng);
    }

    // circle
    const radiusMeters = radiusKm * 1000;
    if (!circleRef.current) {
      console.log(
        "[PIN/RADIUS EFFECT] creating circle at",
        latLng,
        "radius m",
        radiusMeters
      );
      circleRef.current = L.circle(latLng, {
        radius: radiusMeters,
        color: "#2054CC",
        fillColor: "#6C8DFF",
        fillOpacity: 0.3,
      }).addTo(map);
    } else {
      console.log(
        "[PIN/RADIUS EFFECT] updating circle to",
        latLng,
        "radius m",
        radiusMeters
      );
      circleRef.current.setLatLng(latLng);
      circleRef.current.setRadius(radiusMeters);
    }
  }, [pinLatLng, radiusKm]);

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

    if (!country || !cityOption) {
      alert("Please select a country and city for your offer coverage.");
      return;
    }

    if (!pinLatLng) {
      alert("Please click on the map to set your coverage center.");
      return;
    }

    if (radiusKm < 0 || radiusKm > 25) {
      alert("Radius must be between 0 and 25 km.");
      return;
    }

    try {
      const offer = {
        uid: user.uid,
        name: name || user.displayName || "",
        title,
        description,

        // human-readable location
        countryName: country.name,
        countryCode: country.code,
        cityName: cityOption.name,

        // city center (from city autocomplete)
        cityLat: cityOption.lat,
        cityLng: cityOption.lng,

        // coverage center (from pin on map)
        coverageCenterLat: pinLatLng.lat,
        coverageCenterLng: pinLatLng.lng,

        // coverage radius (from slider, in km)
        coverageRadiusKm: radiusKm,

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

            {/* Country + City selection */}
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

            {/* Map + radius selector */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                Coverage area
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After selecting country and city, click on the map to drop a pin
                where you&apos;re based. Use the slider to set how far
                you&apos;re willing to travel from that point.
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

// src/app/create-an-offer/CoverageMapSelector.tsx
"use client";

import * as React from "react";
import { Box, Slider, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { CityOption } from "@/components/CityAutocomplete";

type CoverageMapSelectorProps = {
  city: CityOption | null;
  radiusKm: number;
  onChange: (v: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
  }) => void;
};

type LatLng = { lat: number; lng: number };

export default function CoverageMapSelector({
  city,
  radiusKm,
  onChange,
}: CoverageMapSelectorProps) {
  // Keep latest onChange in a ref so Leaflet handlers never see a stale one
  const onChangeRef = React.useRef(onChange);

  // Container + Leaflet refs
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<any>(null);
  const leafletRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);
  const markerIconRef = React.useRef<any>(null);

  // internal state for center + radius
  const [center, setCenter] = React.useState<LatLng | null>(null);
  const [currentRadius, setCurrentRadius] = React.useState<number>(radiusKm);

  // Also keep the latest radius in a ref (for the map click handler)
  const radiusRef = React.useRef<number>(radiusKm);

  // Always keep the latest onChange in the ref
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Sync internal radius + radiusRef whenever parent radiusKm changes
  React.useEffect(() => {
    setCurrentRadius(radiusKm);
    radiusRef.current = radiusKm;
  }, [radiusKm]);

  // Keep radiusRef in sync when currentRadius changes from the slider
  React.useEffect(() => {
    radiusRef.current = currentRadius;
  }, [currentRadius]);

  // initialize Leaflet map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    (async () => {
      try {
        const mod = await import("leaflet");
        const L = (mod as any).default || mod;
        leafletRef.current = L;

        markerIconRef.current = L.divIcon({
          html:
            '<div style="width:18px;height:18px;border-radius:50%;' +
            "background:#2054CC;border:2px solid white;" +
            'box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        if (!isMounted || !containerRef.current) return;

        const initialCenter: [number, number] = city
          ? [city.lat, city.lng]
          : [52.37, 4.9]; // Amsterdam-ish default

        const map = L.map(containerRef.current).setView(
          initialCenter,
          city ? 11 : 6
        );
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // user clicks to place / move pin
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng as { lat: number; lng: number };
          setCenter({ lat, lng });

          // ✅ notify parent with latest onChange + latest radius
          if (onChangeRef.current) {
            onChangeRef.current({
              centerLat: lat,
              centerLng: lng,
              radiusKm: radiusRef.current,
            });
          }
        });
      } catch (err) {
        console.error("[CoverageMapSelector] Failed to init map", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- run once

  // when city changes, just recenter the map (no onChange)
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !city) return;

    map.setView([city.lat, city.lng], 11);
  }, [city]);

  // whenever center or radius changes, update marker + circle visuals only
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !center) return;

    const latLng: [number, number] = [center.lat, center.lng];

    // marker
    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, {
        icon: markerIconRef.current || undefined,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
    }

    // radius circle
    const radiusMeters = currentRadius * 1000;
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
  }, [center, currentRadius]);

  return (
    <Box>
      <Box
        sx={{
          height: 320,
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: 2,
          bgcolor: COLORS.navy,
        }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Radius from pin: <strong>{currentRadius.toFixed(1)} km</strong>
        </Typography>
        <Slider
          value={currentRadius}
          min={0}
          max={25}
          step={0.5}
          onChange={(_e, value) => {
            const newRadius = value as number;
            setCurrentRadius(newRadius);

            // ✅ only notify parent if we already have a center
            if (center && onChangeRef.current) {
              onChangeRef.current({
                centerLat: center.lat,
                centerLng: center.lng,
                radiusKm: newRadius,
              });
            }
          }}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}

// src/components/CityAutocomplete.tsx
"use client";

import * as React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type PhotonFeature = {
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name?: string;
    city?: string;
    country?: string;
    countrycode?: string;
    state?: string;
    osm_key?: string;
    osm_value?: string;
    [key: string]: any;
  };
};

type PhotonResponse = {
  features: PhotonFeature[];
};

export type CityOption = {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  raw: PhotonFeature;
};

export interface CityAutocompleteProps {
  countryCode: string | null;
  value: CityOption | null;
  onChange: (city: CityOption | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
  placeholder?: string;
}

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";

export function CityAutocomplete({
  countryCode,
  value,
  onChange,
  label = "City",
  helperText = "Start typing the city name (minimum 3 letters).",
  required = true,
  sx,
  placeholder,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<CityOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Reset when country changes
  React.useEffect(() => {
    setOptions([]);
    setInputValue("");
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  // Fetch cities when user types
  React.useEffect(() => {
    if (!countryCode) {
      setOptions([]);
      return;
    }

    const trimmed = inputValue.trim();
    if (trimmed.length < 3) {
      setOptions([]);
      return;
    }

    let active = true;
    setLoading(true);

    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          limit: "10",
          lang: "en",
        });

        const res = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`);

        if (!res.ok) {
          console.error(
            "Photon city search error",
            res.status,
            await res.text()
          );
          if (active) setOptions([]);
          return;
        }

        const data = (await res.json()) as PhotonResponse;
        if (!active) return;

        const isoLower = countryCode.toLowerCase();

        const cityResults: CityOption[] = data.features
          .filter((feature) => {
            const p = feature.properties || {};

            if (p.countrycode && p.countrycode.toLowerCase() !== isoLower) {
              return false;
            }

            const isPlace = p.osm_key === "place" || !!p.city || !!p.name;
            if (!isPlace) return false;

            const value = p.osm_value;
            const allowedPlaceTypes = [
              "city",
              "town",
              "village",
              "hamlet",
              "suburb",
              "neighbourhood",
            ];

            if (value && !allowedPlaceTypes.includes(value)) {
              return false;
            }

            return true;
          })
          .map((feature, idx) => {
            const p = feature.properties || {};
            const [lng, lat] = feature.geometry.coordinates;

            const nameFromProps = p.city || p.name || p.state;
            const name =
              nameFromProps ?? `(${lat.toFixed(3)}, ${lng.toFixed(3)})`;

            const displayNameParts = [name, p.state, p.country].filter(Boolean);
            const displayName = displayNameParts.join(", ");

            return {
              id: `${feature.properties.osm_id ?? idx}-${lat},${lng}`,
              name,
              displayName,
              lat,
              lng,
              raw: feature,
            } as CityOption;
          });

        const seen = new Set<string>();
        const deduped: CityOption[] = [];
        for (const c of cityResults) {
          const key = `${c.name.toLowerCase()}|${countryCode}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(c);
          }
        }

        if (active) setOptions(deduped);
      } catch (e) {
        console.error("City autocomplete error", e);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300); // debounce

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [countryCode, inputValue]); // <-- removed onChange here

  const disabled = !countryCode;

  return (
    <Autocomplete<CityOption, false, false, false>
      sx={sx}
      options={options}
      value={value}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      onChange={(_event, newValue) => {
        onChange(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      noOptionsText={
        !countryCode
          ? "Select a country first."
          : inputValue.trim().length < 3
          ? "Type at least 3 letters..."
          : "No matching cities."
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={disabled ? "Select a country first." : helperText}
        />
      )}
    />
  );
}

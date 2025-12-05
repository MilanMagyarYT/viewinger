"use client";

import * as React from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import {
  Country as CountryType,
  EuropeCountryAutocomplete,
} from "@/components/EuropeCountryAutocompleteProps";
import { CityAutocomplete, CityOption } from "@/components/CityAutocomplete";
import CoverageMapSelector from "./CoverageMapSelector";

export type OverviewState = {
  title: string;
  description: string;
  country: CountryType | null;
  city: CityOption | null;
  coverageCenterLat: number | null;
  coverageCenterLng: number | null;
  coverageRadiusKm: number;
  displayName: string;
};

type Props = {
  value: OverviewState;
  onChange: (state: OverviewState) => void;
};

export default function OfferOverviewStep({ value, onChange }: Props) {
  const handleFieldChange =
    (field: keyof OverviewState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...value, [field]: e.target.value });
    };

  const handleCountryChange = (country: CountryType | null) => {
    onChange({
      ...value,
      country,
      city: null,
    });
  };

  const handleCityChange = (city: CityOption | null) => {
    onChange({
      ...value,
      city,
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Overview
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Give a clear title and describe what kind of property viewings you can
        help with and where you are available.
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="Public display name"
          value={value.displayName}
          onChange={handleFieldChange("displayName")}
          fullWidth
        />

        <TextField
          label="Title of the offer"
          value={value.title}
          onChange={handleFieldChange("title")}
          required
          fullWidth
          helperText="For example: 'I will attend your apartment viewing in Groningen'"
        />

        <TextField
          label="Short description"
          value={value.description}
          onChange={handleFieldChange("description")}
          required
          fullWidth
          multiline
          minRows={3}
        />

        {/* Country + City */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <EuropeCountryAutocomplete
            value={value.country}
            onChange={handleCountryChange}
            label="Country"
            helperText=""
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          />
          <CityAutocomplete
            countryCode={value.country?.code ?? null}
            value={value.city}
            onChange={handleCityChange}
            label="City"
            helperText="Start typing the city name."
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          />
        </Stack>

        {/* Map + radius */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
            Coverage area
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Click on the map to place your base location. Use the slider to set
            how far you’re willing to travel for a viewing.
          </Typography>

          <CoverageMapSelector
            city={value.city}
            radiusKm={value.coverageRadiusKm}
            onChange={({ centerLat, centerLng, radiusKm }) =>
              onChange({
                ...value,
                coverageCenterLat: centerLat,
                coverageCenterLng: centerLng,
                coverageRadiusKm: radiusKm,
              })
            }
          />
        </Box>
      </Stack>
    </Box>
  );
}

// src/components/EuropeCountryAutocompleteProps.tsx
"use client";

import * as React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type Country = {
  code: string;
  name: string;
};

export interface EuropeCountryAutocompleteProps {
  value: Country | null;
  onChange: (country: Country | null) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  sx?: SxProps<Theme>;
  placeholder?: string;
}

// Basic list of European countries (you can extend/adjust as needed)
const EUROPEAN_COUNTRIES: Country[] = [
  { code: "AL", name: "Albania" },
  { code: "AD", name: "Andorra" },
  { code: "AT", name: "Austria" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "ME", name: "Montenegro" },
  { code: "NL", name: "Netherlands" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SM", name: "San Marino" },
  { code: "RS", name: "Serbia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TR", name: "Türkiye" },
  { code: "UA", name: "Ukraine" },
  { code: "GB", name: "United Kingdom" },
  { code: "VA", name: "Vatican City" },
];

export function EuropeCountryAutocomplete({
  value,
  onChange,
  label = "Country",
  helperText = "Start typing to search for a country in Europe.",
  required = true,
  sx,
  placeholder,
}: EuropeCountryAutocompleteProps) {
  return (
    <Autocomplete<Country, false, false, false>
      sx={sx}
      options={EUROPEAN_COUNTRIES}
      value={value}
      onChange={(_event, newValue) => onChange(newValue)}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => !!val && option.code === val.code}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={helperText}
        />
      )}
    />
  );
}

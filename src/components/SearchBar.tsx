"use client";

import * as React from "react";
import { Box, Button, Paper, TextField } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import {
  Country,
  EuropeCountryAutocomplete,
} from "@/components/EuropeCountryAutocompleteProps";
import { CityAutocomplete, CityOption } from "@/components/CityAutocomplete";

type SearchBarProps = {
  country: Country | null;
  setCountry: (country: Country | null) => void;
  city: CityOption | null;
  setCity: (city: CityOption | null) => void;
  street: string;
  setStreet: (value: string) => void;
  isFormValid: boolean;
  isSearching: boolean;
  onSearch: () => void;
};

export default function SearchBar(props: SearchBarProps) {
  const {
    country,
    setCountry,
    city,
    setCity,
    street,
    setStreet,
    isFormValid,
    isSearching,
    onSearch,
  } = props;

  return (
    <Paper
      elevation={6}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2.5,
        px: 3,
        py: 1.5,
        borderRadius: "16px",
        backgroundColor: COLORS.navy,
        border: `2px solid ${COLORS.muted}`,
      }}
    >
      {/* Country segment */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          gap: 1,
        }}
      >
        <LocationOnOutlinedIcon sx={{ color: COLORS.accent, fontSize: 20 }} />
        <EuropeCountryAutocomplete
          value={country}
          onChange={setCountry}
          label="" // no floating label
          placeholder="Country" // placeholder inside
          helperText="" // no helper text
          required={false} // remove the "*"
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              color: COLORS.white,
              py: 0.5,
              "& fieldset": { border: "none" },
            },
            "& .MuiInputBase-input": {
              fontSize: 16,
            },
            "& input::placeholder": {
              color: "rgba(255,255,255,0.75)",
              opacity: 1,
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

      {/* City segment */}
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
          label="" // no floating label
          placeholder="City" // placeholder inside
          helperText="" // no helper
          required={false}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              color: COLORS.white,
              py: 0.5,
              "& fieldset": { border: "none" },
            },
            "& .MuiInputBase-input": {
              fontSize: 16,
            },
            "& input::placeholder": {
              color: "rgba(255,255,255,0.75)",
              opacity: 1,
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

      {/* Address segment */}
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
        onClick={onSearch}
        sx={{
          ml: 1,
          borderRadius: "12px",
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
  );
}

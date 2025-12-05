// src/components/SearchHeader.tsx
"use client";

import * as React from "react";
import { Box, Container } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { Country } from "@/components/EuropeCountryAutocompleteProps";
import { CityOption } from "@/components/CityAutocomplete";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import SearchBar from "@/components/SearchBar";
import SearchErrorAlert from "@/components/SearchErrorAlert";

type SearchHeaderProps = {
  country: Country | null;
  setCountry: (country: Country | null) => void;
  city: CityOption | null;
  setCity: (city: CityOption | null) => void;
  street: string;
  setStreet: (value: string) => void;
  isFormValid: boolean;
  isSearching: boolean;
  onSearch: () => void;
  error: string | null;
};

export default function SearchHeader(props: SearchHeaderProps) {
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
    error,
  } = props;

  return (
    <Box
      sx={{
        backgroundColor: COLORS.navyDark,
        pt: 3,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <SearchBreadcrumb current="Search" />

        <SearchBar
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
          street={street}
          setStreet={setStreet}
          isFormValid={isFormValid}
          isSearching={isSearching}
          onSearch={onSearch}
        />

        <SearchErrorAlert error={error} />
      </Container>
    </Box>
  );
}

// src/types/SearchPage.ts

export type NominatimAddress = {
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

export type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

export type GeocodedAddress = {
  label: string;
  lat: number;
  lng: number;
  address: NominatimAddress;
};

export type OfferHit = {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageURL?: string | null;
  cityName?: string;
  countryName?: string;
  coverageRadiusKm: number;
  distanceKm: number;
  uid?: string;
  listerName?: string;
};

export type ListerMeta = {
  isVerified: boolean;
  profileImage?: string | null;
};

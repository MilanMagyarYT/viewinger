// src/app/search-for-offers/[offerId]/types.ts

// ---- Pricing tiers ----
export type PricingTier = {
  id: string;                // "basic" | "standard" | "premium" | etc.
  name?: string;             // e.g. "Basic"
  label?: string;            // some older docs might use label instead of name
  enabled?: boolean;
  price?: number | null;
  description?: string;
};

// ---- Portfolio (cover, video, pdf, etc.) ----
export type OfferPortfolio = {
  coverImageURL: string | null;
  coverImagePublicId: string | null;
  videoURL: string | null;
  videoPublicId: string | null;
  pdfURL: string | null;
  pdfPublicId: string | null;
};

// ---- Main offer document as stored in Firestore ----
// This is aligned with your baseDoc shape + some legacy fields as optional.
export type OfferDoc = {
  id: string;

  uid?: string;
  name?: string; // host display name when the offer was created

  // Core content
  title: string;
  description: string;

  // Location (new schema)
  countryName?: string | null;
  countryCode?: string | null;
  cityName?: string | null;
  cityLat?: number | null;
  cityLng?: number | null;

  // Coverage area
  coverageCenterLat?: number | null;
  coverageCenterLng?: number | null;
  coverageRadiusKm?: number | null;

  // Legacy location / search fields (for older offers)
  country?: string;
  city?: string;
  area?: number;

  // Pricing
  price?: number;
  currency?: string;

  // Contact info
  email?: string;
  phone?: string | null;

  // Structured pricing tiers
  pricingTiers?: PricingTier[];

  // Requirements text
  requirements?: string;

  // Media / assets
  portfolio?: OfferPortfolio;

  // Legacy / flat image fields
  coverImageURL?: string;
  imageURL?: string;

  // Optional flat video field if you ever denormalise it
  videoUrl?: string | null;

  // Timestamps (loosely typed so we don't pull in Firestore Timestamp here)
  createdAt?: any;
  updatedAt?: any;
};

// ---- Host profile shown on the offer page ----
export type HostProfile = {
  name: string;
  profileImage?: string;
  baseCity?: string;
  baseCountry?: string;
  languagesText?: string;
  yearsOfExperience?: string;
  bio?: string;
  memberSinceLabel?: string;
  email?: string;
  phone?: string;
};

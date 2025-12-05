"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import MenuBar from "@/components/MenuBar";
import { auth, db } from "@/firebase";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

// Reuse the same step components + types as the create wizard
import OfferOverviewStep, {
  OverviewState,
} from "@/app/create-an-offer/OfferOverviewStep";
import OfferPricingStep, {
  PricingTier,
} from "@/app/create-an-offer/OfferPricingStep";
import OfferRequirementsStep, {
  RequirementsState,
} from "@/app/create-an-offer/OfferRequirementsStep";
import OfferPortfolioStep, {
  PortfolioState,
} from "@/app/create-an-offer/OfferPortfolioStep";
import OfferWizardStepper, {
  OFFER_STEPS,
} from "@/app/create-an-offer/OfferWizardStepper";
import OfferPublishStep from "@/app/create-an-offer/OfferPublishStep";

// ---- Cloudinary upload helper (same as create) ----

async function uploadToCloudinary(
  file: File,
  folder: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  if (!cloudName || !unsignedPreset) {
    console.error("[Cloudinary] Missing env vars", {
      cloudName,
      unsignedPreset,
    });
    throw new Error(
      "File upload failed: Cloudinary is not configured on the server."
    );
  }

  console.log("[Cloudinary] Starting upload", {
    fileName: file.name,
    size: file.size,
    type: file.type,
    folder,
    resourceType,
  });

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", unsignedPreset);
  form.append("folder", folder);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: form,
      }
    );
  } catch (err) {
    console.error("[Cloudinary] Network error while uploading", err);
    throw new Error(
      "File upload failed: could not reach Cloudinary (network error)."
    );
  }

  const data = await res.json();
  if (!res.ok) {
    console.error("[Cloudinary] Upload failed", { status: res.status, data });
    throw new Error(
      data?.error?.message || `File upload failed with status ${res.status}.`
    );
  }

  console.log("[Cloudinary] Upload success", data);

  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
  };
}

// ---- Page component ----

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [offerId, setOfferId] = useState<string | null>(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  // ----- Wizard state (same shape as create) -----

  const [overview, setOverview] = useState<OverviewState>({
    title: "",
    description: "",
    country: { code: "NL", name: "Netherlands" },
    city: null,
    coverageCenterLat: null,
    coverageCenterLng: null,
    coverageRadiusKm: 5,
    displayName: "",
  });

  const [pricing, setPricing] = useState<PricingTier[]>([
    {
      id: "basic",
      label: "Basic",
      enabled: true,
      price: "",
      description: "",
    },
    {
      id: "standard",
      label: "Standard",
      enabled: false,
      price: "",
      description: "",
    },
    {
      id: "premium",
      label: "Premium",
      enabled: false,
      price: "",
      description: "",
    },
  ]);

  const [requirements, setRequirements] = useState<RequirementsState>({
    requirementsText: "",
    phone: "",
  });

  const [portfolio, setPortfolio] = useState<PortfolioState>({
    coverImageFile: null,
    coverImagePreviewUrl: "",
    videoFile: null,
    videoName: "",
    pdfFile: null,
    pdfName: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ----- Auth gate -----

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      if (!current) {
        router.replace("/authentication/sign-in");
      } else {
        setUser(current);
        setOverview((prev) => ({
          ...prev,
          displayName: prev.displayName || current.displayName || "",
        }));
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, [router]);

  // ----- Load existing offer from Firestore -----

  useEffect(() => {
    if (!params?.id) return;

    const loadOffer = async () => {
      try {
        const ref = doc(db, "offers", params.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setNotFound(true);
          return;
        }

        const data = snap.data() as any;
        setOfferId(snap.id);

        console.log("[EditOffer] Loaded doc", { id: snap.id, data });

        // ---- Overview ----
        const country =
          data.countryCode && data.countryName
            ? { code: data.countryCode, name: data.countryName }
            : null;

        const cityName = data.cityName ?? data.city ?? null;
        const cityLat = typeof data.cityLat === "number" ? data.cityLat : null;
        const cityLng = typeof data.cityLng === "number" ? data.cityLng : null;

        const city =
          cityName && cityLat != null && cityLng != null
            ? {
                id: `${cityName}-${cityLat},${cityLng}`,
                name: cityName,
                displayName: cityName,
                lat: cityLat,
                lng: cityLng,
                raw: null as any,
              }
            : null;

        const coverageCenterLat =
          typeof data.coverageCenterLat === "number"
            ? data.coverageCenterLat
            : cityLat ?? null;

        const coverageCenterLng =
          typeof data.coverageCenterLng === "number"
            ? data.coverageCenterLng
            : cityLng ?? null;

        const coverageRadiusKm =
          typeof data.coverageRadiusKm === "number" ? data.coverageRadiusKm : 5;

        setOverview({
          title: data.title ?? "",
          description: data.description ?? "",
          country,
          city,
          coverageCenterLat,
          coverageCenterLng,
          coverageRadiusKm,
          displayName: data.name ?? "",
        });

        // ---- Pricing ----
        let loadedPricing: PricingTier[];

        if (Array.isArray(data.pricingTiers) && data.pricingTiers.length) {
          loadedPricing = data.pricingTiers.map((tier: any) => ({
            id: tier.id ?? "basic",
            label: tier.label ?? "Basic",
            enabled: !!tier.enabled,
            price:
              typeof tier.price === "number"
                ? String(tier.price)
                : tier.price ?? "",
            description: tier.description ?? "",
          }));
        } else {
          // fallback for old offers
          const basePrice =
            typeof data.price === "number" ? String(data.price) : "";
          loadedPricing = [
            {
              id: "basic",
              label: "Basic",
              enabled: true,
              price: basePrice,
              description: data.description ?? "",
            },
            {
              id: "standard",
              label: "Standard",
              enabled: false,
              price: "",
              description: "",
            },
            {
              id: "premium",
              label: "Premium",
              enabled: false,
              price: "",
              description: "",
            },
          ];
        }

        setPricing(loadedPricing);

        // ---- Requirements ----
        setRequirements({
          requirementsText: data.requirements ?? "",
          phone: data.phone ?? "",
        });

        // ---- Portfolio ----
        const portfolioData = data.portfolio ?? {};
        const coverImageURL =
          portfolioData.coverImageURL || data.imageURL || "";

        const videoURL = portfolioData.videoURL || "";
        const pdfURL = portfolioData.pdfURL || "";

        const videoName = videoURL
          ? videoURL.split("/").pop()?.split("?")[0] ?? "Video"
          : "";
        const pdfName = pdfURL
          ? pdfURL.split("/").pop()?.split("?")[0] ?? "Portfolio.pdf"
          : "";

        setPortfolio({
          coverImageFile: null,
          coverImagePreviewUrl: coverImageURL || "",
          videoFile: null,
          videoName,
          pdfFile: null,
          pdfName,
        });
      } catch (err) {
        console.error("[EditOffer] Failed to load offer:", err);
        setNotFound(true);
      } finally {
        setOfferLoading(false);
      }
    };

    loadOffer();
  }, [params?.id]);

  // ----- Step navigation helpers (same validation as create) -----

  const canGoNext = () => {
    if (activeStep === 0) {
      return (
        overview.title.trim().length > 0 &&
        overview.description.trim().length > 0 &&
        !!overview.country &&
        !!overview.city &&
        overview.coverageCenterLat !== null &&
        overview.coverageCenterLng !== null
      );
    }
    if (activeStep === 1) {
      const basic = pricing.find((p) => p.id === "basic");
      return !!basic && basic.enabled && basic.price.trim().length > 0;
    }
    if (activeStep === 3) {
      // cover image required (either existing URL OR new file)
      return !!portfolio.coverImageFile || !!portfolio.coverImagePreviewUrl;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep < OFFER_STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (submitting) return;

    if (activeStep === 0) {
      // leave edit screen without saving
      router.replace("/my-dashboard");
      return;
    }

    setActiveStep((s) => s - 1);
  };

  // ----- Publish = save changes to this existing offer -----

  const handlePublish = async () => {
    if (!user || !offerId) return;
    if (!canGoNext()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const basicTier = pricing.find((p) => p.id === "basic")!;
      const basicPriceNumber = Number(basicTier.price) || 0;

      const docRef = doc(collection(db, "offers"), offerId);

      console.log("[EditOffer] Saving offer", {
        id: offerId,
        overview,
        pricing,
        requirements,
        portfolio,
      });

      const baseUpdates: any = {
        uid: user.uid, // keep ownership
        name: overview.displayName || user.displayName || "",
        title: overview.title.trim(),
        description: overview.description.trim(),

        countryName: overview.country?.name ?? null,
        countryCode: overview.country?.code ?? null,
        cityName: overview.city?.name ?? null,
        cityLat: overview.city?.lat ?? null,
        cityLng: overview.city?.lng ?? null,

        coverageCenterLat: overview.coverageCenterLat,
        coverageCenterLng: overview.coverageCenterLng,
        coverageRadiusKm: overview.coverageRadiusKm,

        price: basicPriceNumber,
        currency: "EUR",

        email: user.email || "",
        phone: requirements.phone || null,

        pricingTiers: pricing.map((tier) => ({
          id: tier.id,
          label: tier.label,
          enabled: tier.enabled,
          price: Number(tier.price) || 0,
          description: tier.description.trim(),
        })),

        requirements: requirements.requirementsText.trim(),

        updatedAt: serverTimestamp(),
      };

      const updates: any = { ...baseUpdates };

      // Upload new portfolio files if provided
      if (portfolio.coverImageFile) {
        console.log("[EditOffer] Uploading new cover image...");
        const img = await uploadToCloudinary(
          portfolio.coverImageFile,
          `offers/${offerId}`,
          "image"
        );
        updates.imageURL = img.url;
        updates.cloudinaryPublicId = img.publicId;
        updates["portfolio.coverImageURL"] = img.url;
        updates["portfolio.coverImagePublicId"] = img.publicId;
      }

      if (portfolio.videoFile) {
        console.log("[EditOffer] Uploading new video...");
        const vid = await uploadToCloudinary(
          portfolio.videoFile,
          `offers/${offerId}`,
          "video"
        );
        updates["portfolio.videoURL"] = vid.url;
        updates["portfolio.videoPublicId"] = vid.publicId;
      }

      if (portfolio.pdfFile) {
        console.log("[EditOffer] Uploading new PDF...");
        const pdf = await uploadToCloudinary(
          portfolio.pdfFile,
          `offers/${offerId}`,
          "raw"
        );
        updates["portfolio.pdfURL"] = pdf.url;
        updates["portfolio.pdfPublicId"] = pdf.publicId;
      }

      await updateDoc(docRef, updates);

      console.log("[EditOffer] Offer updated successfully");
      router.replace("/my-dashboard");
    } catch (err: any) {
      console.error("[EditOffer] Save failed:", err);
      setSubmitError(
        err?.message || "Something went wrong while saving your offer."
      );
      setSubmitting(false);
    }
  };

  // ----- Loading / not found states -----

  if (authLoading || offerLoading) {
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

  if (notFound || !offerId) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.white,
        }}
      >
        <Typography variant="h6">Offer not found.</Typography>
      </Box>
    );
  }

  // ----- Main UI -----

  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: COLORS.white }}
    >
      <MenuBar />

      {/* Header band */}
      <Box
        sx={{
          backgroundColor: COLORS.navyDark,
          pt: 8,
          pb: 4,
          mt: "3rem",
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{ color: COLORS.white, fontWeight: 700, mb: 1 }}
          >
            Edit Offer
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            Update your viewing offer details and portfolio.
          </Typography>
        </Container>
      </Box>

      {/* Wizard body */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 6 }}>
        <Paper
          elevation={6}
          sx={{
            borderRadius: "20px",
            p: 3,
            backgroundColor: "#F9FAFF",
          }}
        >
          {/* Stepper */}
          <OfferWizardStepper activeStep={activeStep} />

          <Box sx={{ mt: 3 }}>
            {activeStep === 0 && (
              <OfferOverviewStep value={overview} onChange={setOverview} />
            )}

            {activeStep === 1 && (
              <OfferPricingStep tiers={pricing} onChange={setPricing} />
            )}

            {activeStep === 2 && (
              <OfferRequirementsStep
                value={requirements}
                onChange={setRequirements}
              />
            )}

            {activeStep === 3 && (
              <OfferPortfolioStep value={portfolio} onChange={setPortfolio} />
            )}

            {activeStep === 4 && (
              <OfferPublishStep
                overview={overview}
                pricing={pricing}
                requirements={requirements}
                portfolio={portfolio}
              />
            )}
          </Box>

          {/* Footer buttons */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: 4 }}
          >
            <Button
              variant="text"
              onClick={handleBack}
              disabled={submitting}
              sx={{ textTransform: "none" }}
            >
              {activeStep === 0 ? "Cancel" : "Back"}
            </Button>

            <Stack direction="row" spacing={2} alignItems="center">
              {submitError && (
                <Typography variant="body2" color="error">
                  {submitError}
                </Typography>
              )}

              {activeStep < OFFER_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!canGoNext() || submitting}
                  sx={{
                    textTransform: "none",
                    px: 4,
                    py: 1.2,
                    backgroundColor: COLORS.accent,
                    color: COLORS.navyDark,
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "#f6a76a",
                    },
                  }}
                >
                  Save & Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handlePublish}
                  disabled={submitting || !canGoNext()}
                  sx={{
                    textTransform: "none",
                    px: 4,
                    py: 1.2,
                    backgroundColor: COLORS.accent,
                    color: COLORS.navyDark,
                    fontWeight: 700,
                    "&:hover": {
                      backgroundColor: "#f6a76a",
                    },
                  }}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

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
import { useRouter } from "next/navigation";
import MenuBar from "@/components/MenuBar";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import OfferOverviewStep, { OverviewState } from "./OfferOverviewStep";
import OfferPricingStep, { PricingTier } from "./OfferPricingStep";
import OfferRequirementsStep, {
  RequirementsState,
} from "./OfferRequirementsStep";
import OfferPortfolioStep, { PortfolioState } from "./OfferPortfolioStep";
import OfferWizardStepper, { OFFER_STEPS } from "./OfferWizardStepper";
import OfferPublishStep from "./OfferPublishStep";

export default function CreateOfferPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeStep, setActiveStep] = useState(0);

  // ----- Wizard state -----

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
      console.log("[CreateOffer] onAuthStateChanged", !!current);
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

  // ----- Step navigation helpers -----

  const canGoNext = () => {
    if (activeStep === 0) {
      // basic validation for overview
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
      // cover image is required
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
    if (activeStep > 0 && !submitting) {
      setActiveStep((s) => s - 1);
    }
  };

  // ----- Cloudinary helpers (hardened) -----

  async function uploadToCloudinary(
    file: File,
    folder: string,
    resourceType: "image" | "video" | "raw" = "image"
  ): Promise<{ url: string; publicId: string }> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

    if (!cloudName || !unsignedPreset) {
      console.error("[Cloudinary] Missing env variables", {
        cloudName,
        unsignedPreset,
      });
      throw new Error(
        "File upload failed: Cloudinary configuration is missing."
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

    let data: any;
    try {
      data = await res.json();
    } catch (err) {
      console.error("[Cloudinary] Failed to parse JSON response", err);
      throw new Error("File upload failed: invalid Cloudinary response.");
    }

    if (!res.ok) {
      console.error("[Cloudinary] Upload failed", {
        status: res.status,
        statusText: res.statusText,
        data,
      });
      throw new Error("File upload failed: Cloudinary returned an error.");
    }

    console.log("[Cloudinary] Upload success", {
      secure_url: data.secure_url,
      public_id: data.public_id,
    });

    return {
      url: data.secure_url as string,
      publicId: data.public_id as string,
    };
  }

  // ----- Publish handler (with logging + safer error handling) -----

  const handlePublish = async () => {
    if (!user) return;

    if (!canGoNext()) {
      // keep user on current step if validation fails
      console.warn("[CreateOffer] Validation failed on step", activeStep);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    console.log("[CreateOffer] Publishing offer with state", {
      overview,
      pricing,
      requirements,
      portfolio: {
        hasCoverImage: !!portfolio.coverImageFile,
        hasVideo: !!portfolio.videoFile,
        hasPdf: !!portfolio.pdfFile,
      },
      user: {
        uid: user.uid,
        email: user.email,
      },
    });

    try {
      const basicTier = pricing.find((p) => p.id === "basic");
      if (!basicTier || !basicTier.enabled || !basicTier.price.trim()) {
        throw new Error(
          "Please set a valid Basic tier price in the Pricing step."
        );
      }

      const basicPriceNumber = Number(basicTier.price);
      if (Number.isNaN(basicPriceNumber) || basicPriceNumber <= 0) {
        throw new Error(
          "Please enter a positive number for the Basic tier price."
        );
      }

      if (!overview.country || !overview.city) {
        throw new Error("Please select a country and city in the Overview.");
      }
      if (
        overview.coverageCenterLat === null ||
        overview.coverageCenterLng === null
      ) {
        throw new Error("Please set your coverage center on the map.");
      }
      if (!overview.title.trim() || !overview.description.trim()) {
        throw new Error("Please fill in a title and description.");
      }
      if (!portfolio.coverImageFile && !portfolio.coverImagePreviewUrl) {
        throw new Error("Please upload a cover image in the Portfolio step.");
      }

      const offersCol = collection(db, "offers");

      const baseDoc: any = {
        uid: user.uid,
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

        // legacy fields for search:
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

        portfolio: {
          coverImageURL: null,
          coverImagePublicId: null,
          videoURL: null,
          videoPublicId: null,
          pdfURL: null,
          pdfPublicId: null,
        },

        createdAt: serverTimestamp(),
      };

      console.log("[CreateOffer] Creating Firestore offer doc", baseDoc);

      const docRef = await addDoc(offersCol, baseDoc);

      console.log("[CreateOffer] Firestore doc created", { id: docRef.id });

      // Upload portfolio files (optional ones can be skipped)
      const updates: any = {};

      if (portfolio.coverImageFile) {
        console.log("[CreateOffer] Uploading cover image...");
        const img = await uploadToCloudinary(
          portfolio.coverImageFile,
          `offers/${docRef.id}`,
          "image"
        );
        updates.imageURL = img.url; // for search cards (backwards compatibility)
        updates.cloudinaryPublicId = img.publicId;
        updates["portfolio.coverImageURL"] = img.url;
        updates["portfolio.coverImagePublicId"] = img.publicId;
      }

      if (portfolio.videoFile) {
        console.log("[CreateOffer] Uploading video...");
        const vid = await uploadToCloudinary(
          portfolio.videoFile,
          `offers/${docRef.id}`,
          "video"
        );
        updates["portfolio.videoURL"] = vid.url;
        updates["portfolio.videoPublicId"] = vid.publicId;
      }

      if (portfolio.pdfFile) {
        console.log("[CreateOffer] Uploading PDF...");
        const pdf = await uploadToCloudinary(
          portfolio.pdfFile,
          `offers/${docRef.id}`,
          "raw"
        );
        updates["portfolio.pdfURL"] = pdf.url;
        updates["portfolio.pdfPublicId"] = pdf.publicId;
      }

      console.log("[CreateOffer] Media upload results", updates);

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "offers", docRef.id), updates);
        console.log("[CreateOffer] Firestore doc updated with media");
      }

      router.replace("/my-dashboard");
    } catch (err: any) {
      console.error("[CreateOffer] Offer publish failed:", err);
      setSubmitError(
        err?.message ||
          "Something went wrong while creating your offer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Render -----

  if (authLoading) {
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
            Create an Offer
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.85)" }}
          >
            Fill in a few details to publish your viewing offer.
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
              disabled={activeStep === 0 || submitting}
              sx={{ textTransform: "none" }}
            >
              Back
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
                  {submitting ? "Publishing..." : "Publish Offer"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

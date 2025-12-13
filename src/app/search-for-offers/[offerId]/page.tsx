// src/app/search-for-offers/[offerId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, CircularProgress } from "@mui/material";
import MenuBar from "@/components/MenuBar";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

import { OfferDoc, HostProfile, PricingTier } from "./types";
import OfferLeftColumn from "./OfferLeftColumn";
import OfferRightPricingCard from "./OfferRightPricingCard";

// ✅ Messaging helper you implemented
import { getOrCreateConversation } from "@/lib/messaging";

const tierOrder: Record<string, number> = {
  basic: 0,
  standard: 1,
  premium: 2,
};

export default function OfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  // Next 15: params is a Promise
  const { offerId } = React.use(params);

  const [offer, setOffer] = useState<OfferDoc | null>(null);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Prevent double-click creating multiple chats
  const [contacting, setContacting] = useState(false);

  // ---- Load offer + host ----
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const offerRef = doc(db, "offers", offerId);
        const snap = await getDoc(offerRef);

        if (!snap.exists()) {
          setOffer(null);
          setHost(null);
          return;
        }

        const data = { id: snap.id, ...snap.data() } as OfferDoc;
        setOffer(data);

        // Load seller profile
        if (data.uid) {
          const userRef = doc(db, "users", data.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const u = userSnap.data() as any;

            // Use updatedAt (fallback to createdAt) and only show date part
            let memberSinceLabel: string | undefined;
            const ts = u.updatedAt ?? u.createdAt;
            if (ts?.toDate) {
              const d = ts.toDate() as Date;
              memberSinceLabel = d.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            }

            setHost({
              name:
                u.name ?? u.displayName ?? u.legalName ?? u.baseName ?? "Host",
              profileImage: u.profileImage ?? u.photoURL ?? "",
              baseCity: u.baseCity ?? u.city ?? "",
              baseCountry: u.baseCountry ?? u.country ?? "",
              languagesText: u.languagesText ?? "",
              yearsOfExperience: u.yearsOfExperience ?? "",
              bio: u.bio ?? "",
              memberSinceLabel,
              email: u.email,
              phone: u.phoneNumber ?? u.phone,
            });
          }
        }
      } catch (err) {
        console.error("Error loading offer page:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [offerId]);

  // ---- Build pricing tiers (with fallback) ----
  const pricingTiers: PricingTier[] = useMemo(() => {
    if (!offer) return [];

    const tiers =
      (offer.pricingTiers || [])
        .filter((t) => (t.enabled ?? true) && t.price != null)
        .sort((a, b) => (tierOrder[a.id] ?? 99) - (tierOrder[b.id] ?? 99)) ||
      [];

    // Fallback: if no structured tiers but offer.price exists
    if (tiers.length === 0 && (offer as any)?.price != null) {
      const basicPrice = (offer as any).price as number;
      return [
        {
          id: "basic",
          name: "Basic",
          price: basicPrice,
          description: offer.description || "",
          enabled: true,
        },
      ];
    }

    return tiers;
  }, [offer]);

  // Default selected tier
  useEffect(() => {
    if (pricingTiers.length && !selectedTierId) {
      setSelectedTierId(pricingTiers[0].id);
    }
  }, [pricingTiers, selectedTierId]);

  // ✅ NEW: Contact -> open/create conversation -> route to messages
  const handleContactSeller = async () => {
    if (!offer) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Not logged in -> go sign in
      window.location.href = "/authentication/sign-in";
      return;
    }

    // Prevent messaging yourself
    if (offer.uid && currentUser.uid === offer.uid) {
      window.location.href = "/messages";
      return;
    }

    if (!offer.uid) {
      console.error(
        "Offer has no uid (seller uid). Cannot start conversation."
      );
      return;
    }

    if (contacting) return;

    try {
      setContacting(true);

      const cover =
        offer.portfolio?.coverImageURL ||
        offer.coverImageURL ||
        offer.imageURL ||
        null;

      const conversationId = await getOrCreateConversation({
        offerId: offer.id,
        offerTitle: offer.title || "Offer",
        offerCoverImageURL: cover,
        hostUid: offer.uid, // seller
        guestUid: currentUser.uid, // current user
      });

      window.location.href = `/messages/${conversationId}`;
    } catch (err) {
      console.error("Failed to open conversation:", err);
    } finally {
      setContacting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: COLORS.white,
          overflowX: "hidden",
        }}
      >
        <CircularProgress sx={{ color: COLORS.accent }} />
      </Box>
    );
  }

  if (!offer) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          bgcolor: COLORS.white,
          overflowX: "hidden",
        }}
      >
        <MenuBar />
        <Container maxWidth="lg" sx={{ mt: 16, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Offer not found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This offer might have been removed or the link is incorrect.
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: COLORS.white,
        overflowX: "hidden",
      }}
    >
      <MenuBar />

      {/* Header band & breadcrumb */}
      <Box
        sx={{
          bgcolor: COLORS.navyDark,
          pt: 6,
          pb: 4,
          mt: "3rem",
        }}
      >
        <Container maxWidth="lg">
          <SearchBreadcrumb current={`Offer ${offerId}`} />
        </Container>
      </Box>

      {/* Main content two-column layout */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
            gap: 3,
          }}
        >
          <OfferLeftColumn
            offer={offer}
            host={host}
            pricingTiers={pricingTiers}
            onContact={handleContactSeller}
          />

          <OfferRightPricingCard
            pricingTiers={pricingTiers}
            selectedTierId={selectedTierId}
            onSelectedTierChange={setSelectedTierId}
            onContact={handleContactSeller}
          />
        </Box>
      </Container>
    </Box>
  );
}

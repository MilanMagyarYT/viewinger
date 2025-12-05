// src/components/SearchResultsLayout.tsx
"use client";

import * as React from "react";
import {
  Box,
  Container,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  ArrowDropDownRounded,
  ViewModuleRounded,
  ViewListRounded,
} from "@mui/icons-material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { GeocodedAddress, OfferHit, ListerMeta } from "@/types/SearchPage";
import OfferResultCard from "@/components/OfferResultCard";

type SearchResultsLayoutProps = {
  result: GeocodedAddress | null;
  mapUrl: string | null;
  offers: OfferHit[];
  offersLoading: boolean;
  listerMeta: Record<string, ListerMeta>;
  onOfferClick: (offerId: string) => void;
  onListerClick?: (uid: string | undefined) => void;
};

// taller block so it almost fills the screen under the header
const MAP_HEIGHT = 640;

export default function SearchResultsLayout({
  result,
  mapUrl,
  offers,
  offersLoading,
  listerMeta,
  onOfferClick,
  onListerClick,
}: SearchResultsLayoutProps) {
  if (!result) {
    return (
      <Container sx={{ py: 5 }} maxWidth="xl">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, textAlign: "center" }}
        >
          Search for an address above to see who can go to that viewing for you.
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 5 }} maxWidth="xl">
      <Paper
        elevation={6}
        sx={{
          borderRadius: "24px",
          backgroundColor: COLORS.navyDark,
          border: `2px solid ${COLORS.muted}`,
          p: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2.5,
            height: MAP_HEIGHT,
          }}
        >
          {/* Map side (60%) */}
          <Box
            sx={{
              flex: 3,
              borderRadius: "20px",
              overflow: "hidden",
              bgcolor: COLORS.navy,
            }}
          >
            {mapUrl ? (
              <Box
                component="iframe"
                src={mapUrl}
                sx={{
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.white,
                }}
              >
                <Typography variant="body2">
                  Map preview will appear after you search.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Offers side (40%) */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              color: COLORS.white,
            }}
          >
            {/* Header row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                px: 1,
              }}
            >
              <Typography variant="subtitle1">
                There are{" "}
                <Box
                  component="span"
                  sx={{ color: COLORS.accent, fontWeight: 700 }}
                >
                  {offers.length}
                </Box>{" "}
                offers
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  color: COLORS.muted,
                  fontSize: 14,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2">Sort by:</Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.25,
                      cursor: "default",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: COLORS.white }}
                    >
                      Any
                    </Typography>
                    <ArrowDropDownRounded fontSize="small" />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {/* Module view = active */}
                  <IconButton
                    size="small"
                    disableRipple
                    sx={{
                      bgcolor: COLORS.accent,
                      color: COLORS.navyDark,
                      "&:hover": { bgcolor: COLORS.accent },
                    }}
                  >
                    <ViewModuleRounded fontSize="small" />
                  </IconButton>
                  {/* List view (placeholder, not active yet) */}
                  {/* <IconButton
                    size="small"
                    disableRipple
                    sx={{
                      color: COLORS.muted,
                      "&:hover": { bgcolor: "transparent" },
                    }}
                  >
                    <ViewListRounded fontSize="small" />
                  </IconButton> */}
                </Box>
              </Box>
            </Box>

            {/* Offers list (scrollable only on right side) */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                pr: 1,
                pb: 1,
              }}
            >
              {offersLoading ? (
                <Box
                  sx={{
                    mt: 2,
                    minHeight: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={26} sx={{ color: COLORS.accent }} />
                </Box>
              ) : offers.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  No offers currently cover this exact address. Try a nearby
                  address or check back later.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 2,
                  }}
                >
                  {offers.map((offer) => {
                    const uid = offer.uid;
                    const meta = uid ? listerMeta[uid] : undefined;

                    return (
                      <OfferResultCard
                        key={offer.id}
                        offer={offer}
                        meta={meta}
                        onOfferClick={() => onOfferClick(offer.id)}
                        onListerClick={onListerClick}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

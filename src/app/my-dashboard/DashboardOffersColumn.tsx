"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

type Props = {
  offers: any[];
  loadingOffers: boolean;
  onCreateOffer: () => void;
  onViewOffer: (id: string) => void;
  onEditOffer: (id: string) => void;
  onDeleteOffer: (id: string) => void;
};

function getBasicPrice(offer: any): number | null {
  if (Array.isArray(offer.pricingTiers)) {
    const basic = offer.pricingTiers.find(
      (t: any) => t.id === "basic" && t.enabled
    );
    if (basic && typeof basic.price === "number") return basic.price;
  }
  if (typeof offer.price === "number") return offer.price;
  return null;
}

export default function DashboardOffersColumn({
  offers,
  loadingOffers,
  onCreateOffer,
  onViewOffer,
  onEditOffer,
  onDeleteOffer,
}: Props) {
  return (
    <Box>
      {/* pill title */}
      <Box
        sx={{
          mb: 1.5,
          display: "inline-flex",
          px: 3,
          py: 1,
          borderRadius: "999px",
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
          Active offers
        </Typography>
      </Box>

      {/* main container */}
      <Paper
        elevation={6}
        sx={{
          borderRadius: "20px",
          px: 3,
          py: 2,
          bgcolor: COLORS.navyDark,
          color: COLORS.white,
        }}
      >
        {/* header row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {offers.length} active offer{offers.length === 1 ? "" : "s"}
          </Typography>

          <Button
            variant="contained"
            onClick={onCreateOffer}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: "999px",
              backgroundColor: COLORS.accent,
              color: COLORS.navyDark,
              fontWeight: 600,
              "&:hover": { backgroundColor: "#f6a76a" },
            }}
          >
            + New offer
          </Button>
        </Stack>

        {/* content */}
        {loadingOffers ? (
          <Box
            sx={{
              minHeight: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress sx={{ color: COLORS.accent }} />
          </Box>
        ) : offers.length === 0 ? (
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            You don&apos;t have any active offers yet. Create your first one to
            start helping with viewings.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {offers.map((offer, index) => {
              const country = offer.countryName || offer.country || "Country";
              const city = offer.cityName || offer.city || "City";
              const basicPrice = getBasicPrice(offer);
              const coverSrc = offer.imageURL || offer.coverImageURL || null;

              return (
                <Paper
                  key={offer.id}
                  elevation={0}
                  sx={{
                    borderRadius: "18px",
                    bgcolor: "#4b5285", // slightly lighter than panel
                    display: "flex",
                    p: 1.75,
                    gap: 2,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Image column ~30% width */}
                  <Box
                    sx={{
                      flexBasis: { xs: "32%", md: "30%" },
                      maxWidth: { xs: "32%", md: "30%" },
                      flexShrink: 0,
                    }}
                  >
                    {coverSrc ? (
                      <Box
                        component="img"
                        src={coverSrc}
                        alt={offer.title}
                        sx={{
                          width: "100%",
                          height: 110,
                          borderRadius: "14px",
                          objectFit: "cover",
                          bgcolor: "#404a7a",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: 110,
                          borderRadius: "14px",
                          bgcolor: "#404a7a",
                        }}
                      />
                    )}
                  </Box>

                  {/* Text + actions column */}
                  <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                    {/* top row: Offer # + icons */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "16px", color: COLORS.white }}
                      >
                        {/* "Offer " white, id accent + bold */}
                        Offer{" "}
                        <Box
                          component="span"
                          sx={{
                            color: COLORS.accent,
                            fontWeight: 700,
                          }}
                        >
                          #{index + 1}
                        </Box>
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.75,
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: COLORS.white,
                            "&:hover": { color: COLORS.accent },
                          }}
                          onClick={() => onViewOffer(offer.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            color: COLORS.white,
                            "&:hover": { color: COLORS.accent },
                          }}
                          onClick={() => onEditOffer(offer.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{
                            color: "#ff8a80",
                            "&:hover": { color: "#ff5252" },
                          }}
                          onClick={() => onDeleteOffer(offer.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Stack>

                    {/* title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: 20,
                        color: COLORS.white,
                        mb: 0.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {offer.title}
                    </Typography>

                    {/* description – 2 lines max */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.85)",
                        mb: 0.9,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {offer.description}
                    </Typography>

                    {/* bottom row: location + price */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ pr: 0.5 }}
                    >
                      <Typography variant="body2" sx={{ color: COLORS.white }}>
                        {country},{" "}
                        <Box
                          component="span"
                          sx={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: COLORS.accent,
                          }}
                        >
                          {city}
                        </Box>
                      </Typography>

                      {basicPrice != null && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: COLORS.white,
                              fontWeight: 400,
                            }}
                          >
                            from
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: COLORS.accent,
                              fontWeight: 700,
                              fontSize: 22,
                              lineHeight: 1,
                            }}
                          >
                            €{basicPrice}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

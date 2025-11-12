"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Link as MuiLink,
  Typography,
  Stack,
  Alert,
  Paper,
  Button,
  Grid,
  Avatar,
  Divider,
} from "@mui/material";
import MenuBar from "@/components/MenuBar";
import { retrieveOfferById } from "@/data/retrieveOfferById";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { OffersId } from "@/types/OffersId";
import OfferDetail from "@/components/OfferDetail";

interface SellerProfile {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  languages?: string;
  yearsOfExperience?: string;
  bio?: string;
  profileImage?: string;
}

export default function OfferByIdPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OffersId | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Fetch Offer and Seller Data ---
  useEffect(() => {
    (async () => {
      try {
        const offerData = await retrieveOfferById(params.id);
        setOffer(offerData);
        console.log(offerData);
        if (offerData?.uid) {
          const userDoc = await getDoc(doc(db, "users", offerData.uid));
          if (userDoc.exists()) {
            setSeller(userDoc.data() as SellerProfile);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // --- UI ---
  return (
    <Box
      sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#FFFFFF" }}
    >
      <MenuBar />

      {/* Hero Header */}
      <Box
        sx={{
          backgroundColor: "#0F3EA3",
          color: "#FFFFFF",
          py: 6,
          mt: "3rem",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Offer Details
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Learn more about this property viewing offer.
        </Typography>
      </Box>

      <Container sx={{ py: 6, maxWidth: "lg" }}>
        {/* Breadcrumbs */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink
              component={NextLink}
              href="/"
              underline="hover"
              sx={{
                color: "#0F3EA3",
                fontWeight: 500,
                "&:hover": { color: "#2054CC" },
              }}
            >
              Offers
            </MuiLink>
            <Typography color="text.primary">
              {offer ? offer.title : "Loading..."}
            </Typography>
          </Breadcrumbs>
        </Stack>

        {/* Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "40vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : !offer ? (
          <Alert severity="warning" sx={{ borderRadius: "12px" }}>
            Offer not found or may have been removed.
          </Alert>
        ) : (
          <Grid container spacing={4}>
            {/* Left Column – Offer Info */}
            <Grid item xs={12} md={7.5}>
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  borderRadius: "16px",
                  backgroundColor: "#F9FAFF",
                }}
              >
                <OfferDetail offer={offer} />

                <Stack spacing={3} sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#0F3EA3" }}
                  >
                    Interested in this offer?
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    Contact the seller directly using the information provided
                    on the right, or explore more offers in your area.
                  </Typography>

                  <Box>
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: "#2054CC",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        textTransform: "none",
                        px: 4,
                        "&:hover": {
                          backgroundColor: "#6C8DFF",
                        },
                      }}
                      component={NextLink}
                      href="/"
                    >
                      Browse More Offers
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Right Column – Lister Info */}
            <Grid item xs={12} md={4.5}>
              <Box sx={{ position: "sticky", top: "120px" }}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: "16px",
                    backgroundColor: "#F9FAFF",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {seller ? (
                    <>
                      <Avatar
                        src={seller.profileImage || ""}
                        alt={seller.name}
                        sx={{
                          width: 100,
                          height: 100,
                          mb: 2,
                          bgcolor: "#6C8DFF",
                          fontSize: 36,
                          fontWeight: 600,
                        }}
                      >
                        {seller.name?.charAt(0)}
                      </Avatar>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "#0F3EA3", mb: 0.5 }}
                      >
                        {seller.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {seller.city}, {seller.country}
                      </Typography>

                      <Divider sx={{ my: 2, width: "100%" }} />

                      {seller.bio && (
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            color: "text.secondary",
                            textAlign: "center",
                          }}
                        >
                          “{seller.bio}”
                        </Typography>
                      )}

                      <Stack spacing={1} sx={{ width: "100%", mb: 2 }}>
                        {seller.languages && (
                          <Typography variant="body2">
                            <strong>Languages:</strong> {seller.languages}
                          </Typography>
                        )}
                        {seller.yearsOfExperience && (
                          <Typography variant="body2">
                            <strong>Experience:</strong>{" "}
                            {seller.yearsOfExperience} years
                          </Typography>
                        )}
                      </Stack>

                      <Divider sx={{ my: 2, width: "100%" }} />

                      <Stack spacing={1} sx={{ width: "100%" }}>
                        <Typography variant="body2">
                          <strong>Email:</strong> {seller.email}
                        </Typography>
                        {seller.phone && (
                          <Typography variant="body2">
                            <strong>Phone:</strong> {seller.phone}
                          </Typography>
                        )}
                      </Stack>

                      <Button
                        variant="contained"
                        sx={{
                          mt: 3,
                          backgroundColor: "#2054CC",
                          color: "#FFFFFF",
                          textTransform: "none",
                          fontWeight: 600,
                          width: "100%",
                          "&:hover": { backgroundColor: "#6C8DFF" },
                        }}
                        href={`mailto:${seller.email}`}
                      >
                        Contact Seller
                      </Button>
                    </>
                  ) : (
                    <Typography color="text.secondary">
                      Seller information unavailable.
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}

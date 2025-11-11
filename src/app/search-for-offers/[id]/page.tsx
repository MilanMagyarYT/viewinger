"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { retrieveOfferById } from "@/data/retrieveOfferById";
import OfferDetail from "@/components/OfferDetail";
import {
  Container,
  CircularProgress,
  Box,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Typography,
  Stack,
} from "@mui/material";
import { OffersId } from "@/types/OffersId";

export default function OfferByIdPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OffersId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await retrieveOfferById(params.id);
        setOffer(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  return (
    <Container sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MuiLink
            component={NextLink}
            href="/search-for-offers"
            underline="hover"
            color="inherit"
          >
            Offers
          </MuiLink>
          <Typography color="text.primary">{params.id}</Typography>
        </Breadcrumbs>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !offer ? (
        <Alert severity="warning">Offer not found.</Alert>
      ) : (
        <OfferDetail offer={offer} />
      )}
    </Container>
  );
}

"use client";

import { OfferCard } from "@/components/OfferCard";
import { retrieveOffersFromDatabase } from "@/data/retrieveOffers";
import { Offer } from "@/types/Offer";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Stack,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchForOffers() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await retrieveOffersFromDatabase();
        setOffers(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading === true) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="xl">
      <TextField
        onChange={(event) => {
          setSearchFilter(event.target.value);
        }}
        label={"City"}
      ></TextField>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {offers
          .filter((o) =>
            (o.city ?? "")
              .toLowerCase()
              .includes(searchFilter.trim().toLowerCase())
          )
          .map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onView={(id) => router.push(`/search-for-offers/${id}`)}
            />
          ))}
      </Stack>
    </Container>
  );
}

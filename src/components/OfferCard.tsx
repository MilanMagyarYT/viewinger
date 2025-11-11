import * as React from "react";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  Button,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export type Offer = {
  id: string;
  name: string;
  title: string;
  description: string;
  city: string;
  area: number;
  price: number;
  currency: string; // e.g., "EUR", "USD"
  imageURL: string;
};

type OfferCardProps = {
  offer: Offer;
  onView?: (id: string) => void;
};

export function OfferCard({ offer, onView }: OfferCardProps) {
  const { name, title, description, city, area, price, currency, imageURL } =
    offer;

  return (
    <Card sx={{ width: 360 }}>
      <CardMedia
        component="img"
        image={imageURL}
        alt={`${title || name} — ${city}`}
        sx={{ height: 200, objectFit: "cover" }}
      />

      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="h6" noWrap>
            {name || title}
          </Typography>
          {title && name && (
            <Typography variant="subtitle2" color="text.secondary" noWrap>
              {title}
            </Typography>
          )}
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mt: 1.5, flexWrap: "wrap" }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LocationOnIcon fontSize="small" />
            <Typography variant="body2">{city}</Typography>
          </Stack>
          <Chip size="small" label={`+${area} km`} />
        </Stack>

        <Typography variant="h6" sx={{ mt: 1.5 }}>
          {price + " " + currency}
        </Typography>
      </CardContent>

      <CardActions>
        <Button size="small" onClick={() => onView?.(offer.id)}>
          View details
        </Button>
      </CardActions>
    </Card>
  );
}

"use client";

import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Action() {
  const router = useRouter();

  return (
    <div>
      <Button
        onClick={() => {
          router.replace("/create-an-offer");
        }}
      >
        Create an Offer
      </Button>
      <Button
        onClick={() => {
          router.replace("/search-for-offers");
        }}
      >
        Search for Offers
      </Button>
    </div>
  );
}

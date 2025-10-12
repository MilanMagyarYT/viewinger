"use client";

import SellerHeader from "@/components/SellerHeader";
import { Button } from "@mui/material";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user)
      if (user.displayName && user.email) {
        setDisplayName(user.displayName);
        setEmail(user.email);
      }
  }, []);

  return (
    <div>
      <SellerHeader></SellerHeader>
      <Button>Set up Profile</Button>
    </div>
  );
}

"use client";

import ProfileOverview from "@/components/ProfileOverview";
import SellerHeader from "@/components/SellerHeader";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

export default function DashboardProfilePage() {
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
      <ProfileOverview />
    </div>
  );
}

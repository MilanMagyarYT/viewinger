"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

type Props = {
  children: React.ReactNode;
  /**
   * If true, user MUST be signed in; otherwise redirect.
   * If false (public-only), signed-in users will be redirected away (e.g., from /sign-in).
   */
  requireAuth?: boolean; // default true
  redirectTo?: string; // default "/sign-in" when requireAuth, or "/" when public-only
  loadingFallback?: React.ReactNode; // shown while checking status
};

export default function AuthGate({
  children,
  requireAuth = true,
  redirectTo,
  loadingFallback = <div>Loading…</div>,
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth) {
      if (!user) router.replace(redirectTo ?? "/authentication/sign-in");
    } else {
      // public-only page (e.g., /sign-in, /create-account) → bounce signed-in users
      if (user) router.replace(redirectTo ?? "/dashboard");
    }
  }, [loading, user, router, requireAuth, redirectTo]);

  if (loading) return <>{loadingFallback}</>;

  if (requireAuth && !user) return null; // redirecting
  if (!requireAuth && user) return null; // redirecting

  return <>{children}</>;
}

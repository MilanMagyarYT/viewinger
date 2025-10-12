import AuthGate from "@/components/AuthGate";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate
      requireAuth
      redirectTo="/authentication/sign-in"
      loadingFallback={<div style={{ padding: 16 }}>Checking session…</div>}
    >
      {children}
    </AuthGate>
  );
}

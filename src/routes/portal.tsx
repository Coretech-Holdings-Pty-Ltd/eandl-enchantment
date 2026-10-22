/**
 * Portal root route — wraps all /portal/* children in PortalAuthProvider
 * Uses its own layout (no site nav/footer)
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PortalAuthProvider } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/portal")({
  beforeLoad: async ({ location }) => {
    // If hitting /portal exactly, redirect to /portal/dashboard
    if (location.pathname === "/portal" || location.pathname === "/portal/") {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw redirect({ to: "/portal/login" });
      throw redirect({ to: "/portal/dashboard" });
    }
  },
  component: PortalRoot,
});

function PortalRoot() {
  return (
    <PortalAuthProvider>
      <Outlet />
    </PortalAuthProvider>
  );
}

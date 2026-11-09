/**
 * Portal root route — wraps all /portal/* children in PortalAuthProvider
 * Uses its own layout (no site nav/footer)
 */
import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalAuthProvider } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/portal")({
  component: PortalRoot,
});

function PortalRoot() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    // If hitting /portal or /portal/ exactly, route to dashboard or login
    if (currentPath === "/portal" || currentPath === "/portal/") {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate({ to: "/portal/login" });
        } else {
          navigate({ to: "/portal/dashboard" });
        }
      });
    }
  }, [currentPath, navigate]);

  return (
    <PortalAuthProvider>
      <Outlet />
    </PortalAuthProvider>
  );
}

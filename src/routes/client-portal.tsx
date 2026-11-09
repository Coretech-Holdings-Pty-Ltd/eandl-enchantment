/**
 * /client-portal — redirects to the dedicated portal
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/client-portal")({
  component: ClientPortalRedirect,
});

function ClientPortalRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/portal/login");
    }
  }, []);

  return null;
}

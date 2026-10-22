/**
 * /client-portal — redirects to the dedicated portal
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/client-portal")({
  beforeLoad: () => { throw redirect({ to: "/portal/login" }); },
  component: () => null,
});

/**
 * CoreTech Engine Supabase Client - E&L Client Portal
 * Shared project: xhowrpswxqthslzwikkl
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://xhowrpswxqthslzwikkl.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob3dycHN3eHF0aHNsendpa2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0Mjg3MzAsImV4cCI6MjEwOTAwNDczMH0.Edf428oZFncRC3zeSf6IEErwKpGwCUpVQWUXUxg9nMo";
export const BRAND_ID = (import.meta.env.VITE_BRAND_ID as string) || "e_and_l";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Schema helpers
export const partnerSchema = () => supabase.schema("partner");
export const coreSchema    = () => supabase.schema("core");
export const techSchema    = () => supabase.schema("tech");

/** Fetch the current user's portal context from Supabase */
export async function getPortalContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get client record
  const { data: client } = await partnerSchema()
    .from("clients")
    .select("*, subscriptions(*, packages(name, category))")
    .eq("user_id", user.id)
    .eq("brand_id", BRAND_ID)
    .maybeSingle();

  // Get profile
  const { data: profile } = await coreSchema()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, client, profile };
}

/** Check what portals a client has access to */
export function getPortalAccess(client: any): {
  projects: boolean;
  learning: boolean;
  accountStatus: string;
} {
  if (!client) return { projects: false, learning: false, accountStatus: "none" };

  const subs: any[] = client.subscriptions || [];
  const activeSubs = subs.filter((s: any) =>
    ["active", "trialing", "paused"].includes(s.status)
  );

  const hasProjects =
    client.portal_access_projects === true ||
    activeSubs.some((s: any) => {
      const cat = s.packages?.category || s.package_category || "";
      return ["website", "ecommerce", "app", "system", "custom"].includes(cat);
    });

  const hasLearning =
    client.portal_access_learning === true ||
    client.learning_access === true ||
    activeSubs.some((s: any) => {
      const cat = s.packages?.category || s.package_category || "";
      return cat === "growth_community" || s.learning_access === true;
    });

  return {
    projects: hasProjects,
    learning: hasLearning,
    accountStatus: client.account_status || (hasLearning || hasProjects ? "active" : "trialing"),
  };
}

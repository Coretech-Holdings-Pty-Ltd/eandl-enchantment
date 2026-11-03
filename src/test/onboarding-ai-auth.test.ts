import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";
import {
  evaluateScopingProgress,
  synthesizeScopeWithGemini,
  type ChatMessage
} from "@/lib/gemini";

describe("AI Solutions Architect & Onboarding Scoping", () => {
  it("accurately tracks scoping stages from discovery to readiness", () => {
    // 0 messages: initial discovery
    const initial = evaluateScopingProgress([]);
    expect(initial.stage).toBe("discovery");
    expect(initial.isReadyToProceed).toBe(false);
    expect(initial.progressPct).toBe(20);

    // 1 user message: features discussion
    const step1: ChatMessage[] = [
      { role: "user", text: "We need a corporate website with online booking" }
    ];
    const progress1 = evaluateScopingProgress(step1);
    expect(progress1.stage).toBe("features");
    expect(progress1.isReadyToProceed).toBe(false);
    expect(progress1.progressPct).toBe(45);

    // 2 user messages mentioning brand uploads: assets stage
    const step2: ChatMessage[] = [
      ...step1,
      { role: "model", text: "Please upload your logo and company profile in the upload panel." },
      { role: "user", text: "Here is our branding guidelines and logo." }
    ];
    const progress2 = evaluateScopingProgress(step2, 1);
    expect(progress2.hasRequestedUploads).toBe(true);
    expect(progress2.stage).toBe("ready");
    expect(progress2.isReadyToProceed).toBe(true);
    expect(progress2.progressPct).toBe(100);
  });

  it("synthesizes scope correctly for eCommerce vs Corporate builds", async () => {
    // E-commerce consultation
    const shopChat: ChatMessage[] = [
      { role: "user", text: "I want an online shop to sell products with Paystack checkout" }
    ];
    const shopResult = await synthesizeScopeWithGemini(shopChat, {
      businessName: "Kasi Store",
      contactPerson: "Lindiwe"
    });
    expect(shopResult.recommendedPackage).toBeDefined();
    expect(shopResult.monthlyFee).toBeGreaterThan(0);
    expect(shopResult.keyFeatures.length).toBeGreaterThan(2);

    // Corporate & Booking consultation
    const corporateChat: ChatMessage[] = [
      { role: "user", text: "We are an attorney practice needing corporate portal and client booking" }
    ];
    const corpResult = await synthesizeScopeWithGemini(corporateChat, {
      businessName: "Mthethwa Attorneys",
      contactPerson: "Dr. Mthethwa"
    });
    expect(corpResult.recommendedPackage).toBeDefined();
    expect(corpResult.monthlyFee).toBeGreaterThan(0);
  }, 25000);

  it("verifies all Supabase Auth Email templates are 100% branded as E&L Digital", () => {
    const templatesDir = path.resolve(__dirname, "../../docs/supabase-auth-emails");
    const templateFiles = [
      "confirm_signup.html",
      "reset_password.html",
      "invite_user.html",
      "magic_link.html",
      "change_email.html"
    ];

    templateFiles.forEach(file => {
      const filePath = path.join(templatesDir, file);
      expect(fs.existsSync(filePath), `Template file ${file} must exist`).toBe(true);
      const content = fs.readFileSync(filePath, "utf-8");

      // Must be branded for E&L Digital
      expect(content).toContain("E&amp;L Digital");
      expect(content).toContain("hello@eandl.digital");
      expect(content).toContain("https://eandl.digital");

      // Must NOT contain CoreTech Holdings as the sender or title
      expect(content).not.toContain("CoreTech Holdings &amp; E&amp;L");
      expect(content).not.toContain("CORETECH ENGINE · UNIFIED AUTHENTICATION DESK");
      expect(content).not.toContain("admin@coretechholdings.co.za");
    });
  });

  it("verifies public and portal onboarding routes are properly registered", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const publicOnboarding = router.matchRoutes("/onboarding");
    expect(publicOnboarding.at(-1)?.routeId).toBe("/onboarding");

    const portalOnboarding = router.matchRoutes("/portal/onboarding");
    expect(portalOnboarding.at(-1)?.routeId).toBe("/portal/onboarding");

    const portalLogin = router.matchRoutes("/portal/login");
    expect(portalLogin.at(-1)?.routeId).toBe("/portal/login");
  });
});

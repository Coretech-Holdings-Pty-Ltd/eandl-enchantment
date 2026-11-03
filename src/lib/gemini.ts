/**
 * Gemini AI Integration for E&L Digital
 * Handles conversational project scoping, asset requests, and plan recommendation.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Active production Gemini models (verified against Google AI Interactions API)
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

async function callGemini(body: object): Promise<Response | null> {
  const models = GEMINI_MODELS.slice(0, 2);
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(2500),
        }
      );
      if (res.status === 503 || res.status === 429) {
        continue;
      }
      if (res.ok) return res;
    } catch (err: any) {
      if (err?.name === "TimeoutError") break;
    }
  }
  return null;
}

export interface ChatMessage {
  role: "user" | "model" | "system";
  text: string;
}

export interface ScopingResult {
  recommendedPackage: string;
  monthlyFee: number;
  leadScore: number;
  projectTitle: string;
  scopeSummary: string;
  keyFeatures: string[];
  carePlanMinutes: number;
  timeline: string;
  urgency: string;
}

export interface ScopingProgress {
  progressPct: number;
  isReadyToProceed: boolean;
  hasRequestedUploads: boolean;
  stage: "discovery" | "features" | "assets" | "ready";
  summaryHint: string;
}

/** Evaluates the conversational scoping state to determine readiness and asset request needs */
export function evaluateScopingProgress(messages: ChatMessage[], uploadedAssetsCount = 0): ScopingProgress {
  const userMessages = messages.filter(m => m.role === "user");
  const modelMessages = messages.filter(m => m.role === "model");
  const count = userMessages.length;

  const combinedText = messages.map(m => m.text.toLowerCase()).join(" ");
  const mentionsUploads =
    combinedText.includes("upload") ||
    combinedText.includes("logo") ||
    combinedText.includes("brand guidelines") ||
    combinedText.includes("company profile") ||
    combinedText.includes("document");

  const mentionsReady =
    combinedText.includes("ready to proceed") ||
    combinedText.includes("continue to the next step") ||
    combinedText.includes("gathered enough") ||
    combinedText.includes("select your plan") ||
    combinedText.includes("scoping complete");

  // Determine stage & readiness
  if (count >= 3 || mentionsReady || (count >= 2 && uploadedAssetsCount > 0)) {
    return {
      progressPct: 100,
      isReadyToProceed: true,
      hasRequestedUploads: mentionsUploads || uploadedAssetsCount > 0,
      stage: "ready",
      summaryHint: "Scope captured! Ready to review your recommended plan.",
    };
  }

  if (count === 2 || mentionsUploads) {
    return {
      progressPct: 75,
      isReadyToProceed: count >= 2,
      hasRequestedUploads: true,
      stage: "assets",
      summaryHint: "Please upload your brand assets (logo, profile) or continue to features.",
    };
  }

  if (count === 1) {
    return {
      progressPct: 45,
      isReadyToProceed: false,
      hasRequestedUploads: false,
      stage: "features",
      summaryHint: "Tell us what features and pages you need on your website.",
    };
  }

  return {
    progressPct: 20,
    isReadyToProceed: false,
    hasRequestedUploads: false,
    stage: "discovery",
    summaryHint: "Share your business goals to begin scoping.",
  };
}

export async function askGeminiArchitect(
  history: ChatMessage[],
  newMessage: string,
  businessContext: { businessName: string; contactPerson: string; industry?: string },
  uploadedAssets: string[] = []
): Promise<string> {
  const assetContext = uploadedAssets.length > 0
    ? `The client has already uploaded the following brand assets: ${uploadedAssets.join(", ")}.`
    : `The client has not yet uploaded brand assets (logo, company profile, brand guide). If you discuss their visual identity or brand, invite them to use the upload panel below.`;

  if (API_KEY) {
    try {
      const systemInstruction = `You are the Senior AI Solutions Architect at E&L Digital (eandl.digital), a premier South African technology and digital agency.
The client you are speaking with is ${businessContext.contactPerson} from "${businessContext.businessName}" (Industry: ${businessContext.industry || "General Business"}).
${assetContext}

Your goal is to guide them through an efficient, high-value scoping consultation:
1. Warm, visionary, and concise (2-3 sentences per reply maximum).
2. Ask focused questions about their business goals, target market, and required features (e.g. online booking, eCommerce store, Paystack / Ozow payments, multi-page corporate showcase, WhatsApp integration).
3. WHEN TO ASK FOR ASSET UPLOADS: When the client discusses their branding, logo, company background, or services (or by turn 2), explicitly invite them: "Please upload your company profile PDF, logo, or brand guidelines using the upload area below so our design team can match your exact aesthetic."
4. WHEN TO LET USER CONTINUE TO NEXT STEP: Once the client has described their core business, key features, and timeline (or after 2-3 substantive responses), conclude your reply by explicitly confirming: "We have captured enough detail to architect your digital build! You are now ready to continue to the next step to review your recommended Grow Online plan and confirm your build."

E&L Digital Grow Online subscription tiers (billed via South African DebiCheck):
- Spark (R199/mo): 1-page presence, hosting, domain, SSL.
- Build (R349/mo): Up to 3 pages, domain, mailbox, Google profile.
- Starter (R500/mo): Up to 5 pages, SEO, 30m updates/mo, hosting.
- Business (R1,200/mo): Up to 10 pages, CMS/blog, forms, 2h updates/mo.
- Professional (R2,200/mo): Up to 20 pages, client portal, integrations, 5h updates/mo.
- Shop Start (R799/mo): eCommerce up to 100 products, Paystack/Ozow, 60m updates/mo.
- Shop Growth (R1,299/mo): eCommerce up to 1,000 products, 120m updates/mo.`;

      const contents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: `Understood. I will act as the E&L Senior AI Solutions Architect, actively guide ${businessContext.contactPerson}, ask for brand asset uploads when appropriate, and signal when they are ready to proceed to plan selection.` }] },
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        })),
        { role: "user", parts: [{ text: newMessage }] }
      ];

      const res = await callGemini({ contents });
      if (res) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      }
    } catch (err) {
      console.warn("Gemini API call warning:", err);
    }
  }

  // Fallback intelligent conversation
  const lower = newMessage.toLowerCase();
  const exchangeCount = history.filter(h => h.role === "user").length;

  if (exchangeCount >= 2) {
    return `Thank you, ${businessContext.contactPerson}! We have captured your core goals for ${businessContext.businessName}. Please ensure you've uploaded your logo or company profile in the upload panel below if available. We have gathered enough detail to architect your digital build! You are now ready to continue to the next step to review your recommended Grow Online plan and confirm your build.`;
  }

  if (lower.includes("shop") || lower.includes("store") || lower.includes("sell") || lower.includes("product") || lower.includes("paystack")) {
    return `That's a powerful opportunity, ${businessContext.contactPerson}. For an online store with South African payments like Paystack and Ozow, our Shop Start and Shop Growth tiers handle your catalog, cart, and monthly updates. Please upload your product list or logo below. How many products are you aiming to launch with?`;
  }

  if (lower.includes("book") || lower.includes("calendar") || lower.includes("appointment") || lower.includes("patient") || lower.includes("doctor")) {
    return `Automated online booking is one of our specialties. We integrate real-time calendar reservations with automated SMS and WhatsApp confirmations. Please upload your service menu or company profile below. Would your clients need to pay upfront or upon arrival?`;
  }

  return `Excellent vision, ${businessContext.contactPerson}. We can bring that to life for ${businessContext.businessName} with high-converting mobile design, Google SEO, and South African DebiCheck hosting. Please feel free to upload your logo or company profile in the upload panel below. What key actions do you want visitors to take when landing on your site?`;
}

export async function synthesizeScopeWithGemini(
  conversation: ChatMessage[],
  businessContext: { businessName: string; contactPerson: string }
): Promise<ScopingResult> {
  const fullChatText = conversation.map(c => `${c.role}: ${c.text}`).join("\n");

  if (API_KEY) {
    try {
      const prompt = `Analyze this project scoping conversation between a client (${businessContext.contactPerson} from ${businessContext.businessName}) and E&L Digital:
${fullChatText}

Recommend the most suitable E&L Digital package:
- "Spark" (R199/mo, 1 page)
- "Build" (R349/mo, 3 pages, 1 mailbox)
- "Starter" (R500/mo, 5 pages, 30 min updates)
- "Business" (R1200/mo, 10 pages, 120 min updates, CMS)
- "Professional" (R2200/mo, 20 pages, 300 min updates, portal)
- "Shop Start" (R799/mo, 100 products, 60 min updates)
- "Shop Growth" (R1299/mo, 1000 products, 120 min updates)

Return ONLY a valid JSON object:
{
  "recommendedPackage": string,
  "monthlyFee": number,
  "leadScore": number (70-99),
  "projectTitle": string,
  "scopeSummary": string,
  "keyFeatures": string[],
  "carePlanMinutes": number,
  "timeline": string,
  "urgency": string
}`;

      const res = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
      if (res) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleaned);
        }
      }
    } catch (e) {
      console.warn("Gemini scope synthesis error:", e);
    }
  }

  // Fallback intelligent evaluation
  const chatLower = fullChatText.toLowerCase();
  const isCommerce = chatLower.includes("shop") || chatLower.includes("store") || chatLower.includes("sell") || chatLower.includes("paystack");
  const isLarge = chatLower.includes("patient") || chatLower.includes("corporate") || chatLower.includes("booking") || chatLower.includes("enterprise") || chatLower.includes("portal") || chatLower.includes("attorney");

  if (isCommerce) {
    return {
      recommendedPackage: "Shop Start",
      monthlyFee: 799,
      leadScore: 94,
      projectTitle: `${businessContext.businessName} Online Store & Payment Gateway`,
      scopeSummary: "Full eCommerce storefront with Paystack / Ozow card & instant EFT checkout, catalog management, and automated DebiCheck retainer with 60 min monthly care updates.",
      keyFeatures: [
        "Paystack & Ozow Card / Instant EFT Checkout",
        "Up to 100 Products with Custom Variants",
        "Mobile-Optimized Cart & Checkout",
        "60 Minutes Monthly Care Updates",
        "DebiCheck Automated Retainer"
      ],
      carePlanMinutes: 60,
      timeline: "2 to 3 Weeks",
      urgency: "Standard Priority"
    };
  }

  if (isLarge) {
    return {
      recommendedPackage: "Business",
      monthlyFee: 1200,
      leadScore: 96,
      projectTitle: `${businessContext.businessName} Corporate Portal & Booking Hub`,
      scopeSummary: "Comprehensive corporate presence with online booking, Google SEO, responsive mobile design, and 120 minutes of monthly updates.",
      keyFeatures: [
        "Up to 10 Custom Responsive Pages",
        "Online Booking & Enquiry Workflows",
        "Content Management & Blog",
        "120 Minutes Monthly Website Updates",
        "Dedicated Solutions Architect SLA"
      ],
      carePlanMinutes: 120,
      timeline: "2 to 3 Weeks",
      urgency: "High Priority"
    };
  }

  return {
    recommendedPackage: "Build",
    monthlyFee: 349,
    leadScore: 90,
    projectTitle: `${businessContext.businessName} Professional Business Website`,
    scopeSummary: "Custom 3-page business website with domain, professional mailbox, Google Business setup, WhatsApp integration, and Growth Community access.",
    keyFeatures: [
      "Up to 3 Custom-Branded Pages",
      "Connect Your Own Domain & SSL",
      "1 Professional Business Mailbox",
      "Google Business Profile Setup",
      "Growth Community Member Access"
    ],
    carePlanMinutes: 30,
    timeline: "1 to 2 Weeks",
    urgency: "Standard Priority"
  };
}

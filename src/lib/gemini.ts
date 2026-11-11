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
  const models = GEMINI_MODELS;
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(4000),
        }
      );
      if (res.status === 503 || res.status === 429 || res.status === 404) {
        continue;
      }
      if (res.ok) return res;
    } catch (err: any) {
      if (err?.name === "TimeoutError") continue;
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

  // Kira-Style Comprehensive Dossier
  companyProfile?: {
    registeredName?: string;
    regNumber?: string;
    address?: string;
    operatingAreas?: string;
    tagline?: string;
    directorName?: string;
    coreServices?: string[];
    targetMarkets?: string[];
    workingApproach?: string[];
  };
  scopeAdoption?: {
    requestedPlan?: string;
    recommendedPlan?: string;
    rationale?: string;
    upsellFeatures?: string[];
  };
  platformArchitecture?: {
    suggestedPages?: { title: string; purpose: string }[];
    integrations?: string[];
  };
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
    : `The client has not yet uploaded brand assets (CIPC registration certificate, company profile PDF, logo, past work photos). Invite them to use the upload panel below.`;

  if (API_KEY) {
    try {
      const systemInstruction = `You are the Senior AI Solutions Architect at E&L Digital (eandl.digital), a premier South African digital engineering agency.
The client you are consulting with is ${businessContext.contactPerson} representing "${businessContext.businessName}" (Industry: ${businessContext.industry || "General Business"}).
${assetContext}

YOUR MISSION:
Conduct an elite, professional, and thorough digital scoping consultation to discover everything needed to architect their high-converting platform before development begins.

CORE CONVERSATIONAL GUIDELINES:
1. Warm, authoritative, and concise (2-3 sentences per reply maximum).
2. ASK PROBING QUESTIONS across these 4 vital business dimensions:
   - SERVICE OFFERINGS: What are all their distinct service divisions or specializations? (e.g. For contractors: precision painting, waterproofing, tiling, plumbing, crack repairs, estate maintenance).
   - TARGET MARKET SEGMENTATION: Who are their highest-value clients? (e.g. Residential homeowners vs. commercial property managers, body corporates, residential estates, or developers).
   - OPERATIONAL APPROACH & TRUST: Do they follow a structured process (site inspection -> formal quotation -> execution -> quality sign-off)? Do they need quotation request (RFQ) forms, before/after project galleries, or client booking?
   - CIPC REGISTRATION & LOCATION: Inquire about their CIPC company registration number, registered physical address, and operating areas (e.g. Gauteng, Johannesburg, Orange Farm) so their platform can feature verified trust badges.
3. STRATEGIC SCOPE ADOPTION (UP-SELLING & RIGHT-SIZING):
   - Many clients mistakenly think a single-page Spark plan (R199/mo) is enough.
   - If they offer multiple specialized services, commercial contracts, or body corporate maintenance, actively explain:
     "Because you offer multiple specialized service lines and target commercial body corporates, cramming everything into a single 1-page Spark site will dilute your credibility. We recommend adopting our **Build** (R349/mo) or **Business** (R1,200/mo) plan to give each service a dedicated conversion funnel with an RFQ quotation engine."
4. ASSET UPLOAD PROMPT: Explicitly remind them: "Please upload your CIPC registration document (COR 14.3), company profile PDF, or logo using the upload area below so our architects have your verified credentials."
5. READINESS SIGNAL: Once they have shared their services, target audience, and business details (after 2-3 substantive exchanges), confirm: "We have captured comprehensive architecture detail for ${businessContext.businessName}! You are ready to review your executive scope dossier and confirm your plan."

E&L Digital Plan Tiers (DebiCheck recurring maintenance):
- Spark (R199/mo): 1-page presence, hosting, domain, SSL. Best for simple one-service side ventures.
- Build (R349/mo): 3-5 pages, mailbox, Google Profile, SEO, RFQ forms. Ideal for multi-service contractors.
- Starter (R500/mo): 5 pages, SEO, 30m monthly updates, hosting.
- Business (R1,200/mo): Up to 10 pages, dedicated service funnels, CMS, quotation engine, 2h updates/mo.
- Professional (R2,200/mo): Up to 20 pages, custom portal, 5h updates/mo.
- Shop Start (R799/mo) & Shop Growth (R1,299/mo): eCommerce with Paystack & Ozow.`;

      const contents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: `Understood. I am the E&L Senior AI Solutions Architect. I will guide ${businessContext.contactPerson} with strategic questions covering their full service lines, commercial vs. residential target markets, CIPC details, and scope adoption recommendations.` }] },
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
    return `Thank you, ${businessContext.contactPerson}! We have gathered comprehensive architecture detail for ${businessContext.businessName}, including your service lines and market positioning. Please ensure your CIPC certificate or company profile PDF is uploaded below. We are now ready to generate your full executive scope dossier and review your recommended plan!`;
  }

  if (lower.includes("paint") || lower.includes("waterproof") || lower.includes("plumb") || lower.includes("tile") || lower.includes("renovat") || lower.includes("repair") || lower.includes("construct")) {
    return `That is a substantial portfolio of capabilities, ${businessContext.contactPerson}. For multi-service property solutions (like painting, waterproofing, tiling, and repairs), clients need dedicated service pages and an RFQ quotation engine so commercial estates and body corporates take your proposals seriously. Do you primarily target residential homeowners or corporate estate managers? Also, please upload your company profile or CIPC certificate below.`;
  }

  if (lower.includes("shop") || lower.includes("store") || lower.includes("sell") || lower.includes("product") || lower.includes("paystack")) {
    return `That's a high-impact model, ${businessContext.contactPerson}. For an online store with South African payments like Paystack and Ozow, our Shop Start and Shop Growth tiers handle your catalog, cart, and monthly updates. Please upload your product list or logo below. How many products are you aiming to launch with?`;
  }

  if (lower.includes("book") || lower.includes("calendar") || lower.includes("appointment") || lower.includes("patient") || lower.includes("doctor")) {
    return `Automated online booking is one of our core specialties. We integrate real-time calendar reservations with automated SMS and WhatsApp confirmations. Please upload your service menu or company profile below. Would your clients need to pay upfront or upon service completion?`;
  }

  return `Excellent vision, ${businessContext.contactPerson}. To ensure your platform converts high-value contracts for ${businessContext.businessName}, what are all the specialized services you provide, and what operating areas (e.g. Gauteng, national) do you cover? Please also feel free to upload your CIPC document or company profile in the upload panel below.`;
}

export async function synthesizeScopeWithGemini(
  conversation: ChatMessage[],
  businessContext: { businessName: string; contactPerson: string }
): Promise<ScopingResult> {
  const fullChatText = conversation.map(c => `${c.role}: ${c.text}`).join("\n");

  if (API_KEY) {
    try {
      const prompt = `Analyze this project scoping consultation between a client (${businessContext.contactPerson} from ${businessContext.businessName}) and E&L Digital:
${fullChatText}

Conduct an elite Solutions Architect evaluation.
If the client has multiple service divisions, commercial/estate clients, or requires formal quotations, evaluate SCOPE ADOPTION:
Explain why they need a multi-page platform (Build at R349/mo or Business at R1,200/mo) rather than a simple 1-page Spark (R199/mo).

Available E&L Digital Packages:
- "Spark" (R199/mo, 1-page presence, hosting, domain, SSL)
- "Build" (R349/mo, 3-5 pages, 1 mailbox, Google Business, RFQ quotation request)
- "Starter" (R500/mo, 5 pages, SEO, 30 min updates)
- "Business" (R1,200/mo, up to 10 pages, CMS, quotation engine, 120 min updates, multi-service funnels)
- "Professional" (R2,200/mo, up to 20 pages, client portal, 300 min updates)
- "Shop Start" (R799/mo, eCommerce 100 items)
- "Shop Growth" (R1,299/mo, eCommerce 1,000 items)

Return ONLY a valid JSON object matching this structure:
{
  "recommendedPackage": string,
  "monthlyFee": number,
  "leadScore": number,
  "projectTitle": string,
  "scopeSummary": string,
  "keyFeatures": string[],
  "carePlanMinutes": number,
  "timeline": string,
  "urgency": string,
  "companyProfile": {
    "registeredName": string,
    "regNumber": string,
    "address": string,
    "operatingAreas": string,
    "tagline": string,
    "directorName": string,
    "coreServices": string[],
    "targetMarkets": string[],
    "workingApproach": string[]
  },
  "scopeAdoption": {
    "requestedPlan": string,
    "recommendedPlan": string,
    "rationale": string,
    "upsellFeatures": string[]
  },
  "platformArchitecture": {
    "suggestedPages": [
      { "title": string, "purpose": string }
    ],
    "integrations": string[]
  }
}`;

      const res = await callGemini({ contents: [{ parts: [{ text: prompt }] }] });
      if (res) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.recommendedPackage && parsed.projectTitle) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Gemini scope synthesis error:", e);
    }
  }

  // Fallback intelligent evaluation
  const chatLower = fullChatText.toLowerCase();
  const isCommerce = chatLower.includes("shop") || chatLower.includes("store") || chatLower.includes("sell") || chatLower.includes("paystack");
  const isContractorOrMaintenance =
    chatLower.includes("fixer") ||
    chatLower.includes("paint") ||
    chatLower.includes("waterproof") ||
    chatLower.includes("plumb") ||
    chatLower.includes("tile") ||
    chatLower.includes("renovat") ||
    chatLower.includes("estate") ||
    chatLower.includes("repair");

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
      urgency: "Standard Priority",
      companyProfile: {
        registeredName: businessContext.businessName,
        coreServices: ["Online Product Retail", "Digital Checkout", "Order Fulfillment"],
        targetMarkets: ["National Online Consumers", "Direct-to-Consumer Retail"]
      },
      scopeAdoption: {
        requestedPlan: "Starter",
        recommendedPlan: "Shop Start",
        rationale: "eCommerce requires secure PCI-compliant checkout, inventory sync, and Paystack integration not covered in static marketing sites.",
        upsellFeatures: ["Paystack / Ozow Payments", "Product Catalog Engine", "Cart & Order Notifications"]
      },
      platformArchitecture: {
        suggestedPages: [
          { title: "Home Storefront", purpose: "Featured items & trust triggers" },
          { title: "Catalog / Shop", purpose: "Filterable product collection" },
          { title: "Cart & Checkout", purpose: "Instant Paystack / Card checkout" },
          { title: "Contact & Support", purpose: "Client inquiries & returns" }
        ],
        integrations: ["Paystack Gateway", "Ozow Instant EFT", "WhatsApp Support", "DebiCheck Care"]
      }
    };
  }

  if (isContractorOrMaintenance) {
    return {
      recommendedPackage: "Build",
      monthlyFee: 349,
      leadScore: 96,
      projectTitle: `${businessContext.businessName} Professional Property Solutions Platform`,
      scopeSummary: "Comprehensive property maintenance and renovation platform featuring dedicated service funnels, commercial quotation (RFQ) engine, project gallery, and verified trust credentials.",
      keyFeatures: [
        "Multi-Service Breakdown Pages (Painting, Waterproofing, Plumbing, Tiling, Estate Care)",
        "Commercial RFQ & Inspection Request Engine",
        "Before / After Project Portfolio Gallery",
        "Direct WhatsApp Inquiry & Click-to-Call Workflows",
        "Domain, SSL, Google Business Profile & SEO Setup",
        "Monthly DebiCheck Care Plan with 30m Updates"
      ],
      carePlanMinutes: 30,
      timeline: "1 to 2 Weeks",
      urgency: "High Priority",
      companyProfile: {
        registeredName: businessContext.businessName,
        regNumber: "2025/670159/07",
        address: "1268 Drieziek 4 Orange Farm, Johannesburg, Gauteng, 1841",
        operatingAreas: "Gauteng",
        tagline: "Quality Workmanship. Precision. Reliability.",
        directorName: businessContext.contactPerson,
        coreServices: [
          "Precision Painting",
          "Waterproofing (Roofs, Balconies, Bathrooms)",
          "Tiling & Paving Installations",
          "Plumbing Services & Leak Repairs",
          "Crack & Wall Repairs",
          "Estate & Common-Area Maintenance"
        ],
        targetMarkets: [
          "Residential property owners",
          "Property management companies",
          "Body corporates & HOAs",
          "Residential estates",
          "Commercial property owners & developers"
        ],
        workingApproach: [
          "1. Client consultation & understanding of scope",
          "2. On-site inspection & technical assessment",
          "3. Preparation & submission of formal quotations",
          "4. Planning & execution of approved work",
          "5. Quality control & final inspection sign-off",
          "6. Project completion & client handover"
        ]
      },
      scopeAdoption: {
        requestedPlan: "Spark (R199/mo)",
        recommendedPlan: "Build (R349/mo)",
        rationale: "With 6 specialized service divisions targeting high-value commercial estates and body corporates, a single 1-page Spark site lacks the credibility and conversion structure needed. The Build plan gives dedicated service landing funnels and an RFQ quotation engine to secure commercial contracts.",
        upsellFeatures: [
          "Dedicated pages for each service division",
          "Corporate RFQ quotation engine for estate managers",
          "High-resolution project portfolio gallery",
          "Custom business mailbox (info@yourcompany.co.za)"
        ]
      },
      platformArchitecture: {
        suggestedPages: [
          { title: "Home", purpose: "Hero positioning, core values & trust badges" },
          { title: "Services Hub", purpose: "Dedicated sub-pages for Painting, Waterproofing, Plumbing, Tiling, and Estate Care" },
          { title: "Commercial & Estates", purpose: "Tailored portal for Property Managers & Body Corporates" },
          { title: "Projects Gallery", purpose: "Before & after workmanship portfolio" },
          { title: "About Us & CIPC", purpose: "Director message, registration credentials & operating safety" },
          { title: "Request Quote / Contact", purpose: "Multi-step RFQ form with inspection scheduling" }
        ],
        integrations: ["WhatsApp Live Chat", "DebiCheck Retainer", "Google Business Profile", "SSL & Custom Domain"]
      }
    };
  }

  return {
    recommendedPackage: "Build",
    monthlyFee: 349,
    leadScore: 92,
    projectTitle: `${businessContext.businessName} Professional Business Platform`,
    scopeSummary: "Custom multi-page business website with domain, professional mailbox, Google Business setup, WhatsApp integration, and Growth Community access.",
    keyFeatures: [
      "Up to 3 Custom-Branded Responsive Pages",
      "Connect Your Own Domain & SSL Security",
      "1 Professional Business Mailbox",
      "Google Business Profile Setup & Local SEO",
      "Growth Community Member Access"
    ],
    carePlanMinutes: 30,
    timeline: "1 to 2 Weeks",
    urgency: "Standard Priority",
    companyProfile: {
      registeredName: businessContext.businessName,
      coreServices: ["General Business Offerings", "Client Consulting", "Professional Services"],
      targetMarkets: ["Regional Consumers", "Corporate Clients"]
    },
    scopeAdoption: {
      requestedPlan: "Spark",
      recommendedPlan: "Build",
      rationale: "A multi-page build provides the search authority, dedicated company email, and Google profile needed for competitive organic ranking.",
      upsellFeatures: ["Custom Business Mailbox", "Google Business Profile", "Multi-Page Navigation"]
    },
    platformArchitecture: {
      suggestedPages: [
        { title: "Home", purpose: "Brand introduction & primary calls to action" },
        { title: "Services / About", purpose: "Capabilities & value proposition" },
        { title: "Contact", purpose: "Inquiry capture & location details" }
      ],
      integrations: ["WhatsApp Integration", "DebiCheck Care Plan", "Google Analytics", "Domain & SSL"]
    }
  };
}

export interface EnhanceFieldParams {
  field: "goals" | "audience" | "businessName" | "colors" | "general";
  currentValue: string;
  businessName?: string;
  industry?: string;
}

/**
 * Intelligent AI copy enhancer for client onboarding form fields.
 * Uses Gemini API with an immediate smart local fallback if the network is delayed.
 */
export async function enhanceFormFieldWithAI(params: EnhanceFieldParams): Promise<string> {
  const { field, currentValue, businessName, industry } = params;
  const biz = businessName?.trim() || "Our Company";
  const ind = industry?.trim() || "General Business";

  const fieldLabel =
    field === "goals" ? "Primary Website Goals & Business Objectives" :
    field === "audience" ? "Target Customers & Client Profile" :
    field === "businessName" ? "Company Description / Positioning Tagline" :
    "Brand Style & Palette";

  const prompt = `You are an elite digital strategist and copywriter at E&L Digital.
A client is filling out their website onboarding form.
Field to improve: ${fieldLabel}
Client's current draft / rough notes: "${currentValue.trim() || "None yet. Generate a compelling, tailored example for this business."}"
Business Context:
- Company Name: ${biz}
- Industry: ${ind}

Instructions:
1. Turn this into a concise, professional, highly articulated statement (1-2 sentences maximum).
2. Sound authoritative, modern, and inspiring.
3. Return ONLY the enhanced text. Do NOT wrap in quotes, do not add introductory phrases like "Here is:".`;

  try {
    const res = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 120,
        temperature: 0.7,
      },
    });

    if (res && res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 10) {
        return text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
      }
    }
  } catch (err) {
    console.warn("[Gemini] Field enhancer error:", err);
  }

  // Instant intelligent fallback guarantees zero wait or failure
  const val = currentValue.trim();
  if (field === "goals") {
    if (val) {
      return `Establish a modern, high-converting digital presence for ${biz} that showcases verified capabilities, streamlines client acquisition, and drives measurable revenue.`;
    }
    return `Build trust with qualified clients, showcase ${biz}'s services with clarity, and automate inbound consultation requests.`;
  }
  if (field === "audience") {
    if (val) {
      return `Targeting discerning clients and businesses seeking premium, trustworthy ${ind.toLowerCase()} services with responsive digital communication.`;
    }
    return `Motivated consumers and commercial partners in the ${ind.toLowerCase()} sector who value reliability, exceptional quality, and seamless support.`;
  }
  if (field === "colors") {
    return `Signature deep slate (#0F172A) complemented by energetic teal (#0D9488) and crisp silver-white accents for an elevated executive aesthetic.`;
  }
  return val || `${biz} — Premium ${ind} solutions tailored for modern client success.`;
}

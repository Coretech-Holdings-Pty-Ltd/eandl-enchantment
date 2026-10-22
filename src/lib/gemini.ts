/**
 * Gemini AI Integration for E&L Digital
 * Handles conversational project scoping and package recommendation.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

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

export async function askGeminiArchitect(
  history: ChatMessage[],
  newMessage: string,
  businessContext: { businessName: string; contactPerson: string; industry?: string }
): Promise<string> {
  if (API_KEY) {
    try {
      const systemInstruction = `You are the Senior AI Solutions Architect at E&L Digital (eandl.co.za), a premier South African technology and digital agency.
The client you are speaking with is ${businessContext.contactPerson} from "${businessContext.businessName}".
Your goal is to guide them through scoping their new digital presence or website.
Keep your tone warm, professional, visionary, and concise (2-4 sentences max per reply).
Ask focused questions about their target audience, key functionality (e.g. online booking, eCommerce, lead generation, WhatsApp integration), and their monthly update needs.
E&L Digital offers fixed-scope Grow Online subscription packages billed via South African DebiCheck:
- Spark (R199/mo): 1 page presence, hosting, domain.
- Build (R349/mo): 5 pages, 30 min updates/mo.
- Starter (R549/mo): 10 pages, 60 min updates/mo.
- Business (R899/mo): 20 pages, 120 min updates/mo, priority care.
- Elite (R1,499/mo): Unlimited pages, 240 min updates/mo, VIP concierge.
- Shop Start (R799/mo): eCommerce up to 100 products, Paystack/Ozow, 60 min updates/mo.
- Shop Growth (R1,299/mo): eCommerce up to 1,000 products, 120 min updates/mo.
- Shop Scale (R1,999/mo): Enterprise online store, 240 min updates/mo.
Engage conversationally and naturally.`;

      const contents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Understood. I will act as the E&L Senior AI Solutions Architect and guide " + businessContext.contactPerson + " professionally." }] },
        ...history.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        })),
        { role: "user", parts: [{ text: newMessage }] }
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      }
    } catch (err) {
      console.warn("Gemini API call warning:", err);
    }
  }

  // Intelligent conversational fallback if API key is pending or offline
  const lower = newMessage.toLowerCase();
  if (lower.includes("shop") || lower.includes("store") || lower.includes("sell") || lower.includes("product") || lower.includes("paystack")) {
    return `That sounds fantastic, ${businessContext.contactPerson}. For an online store with South African payments like Paystack and DebiCheck, our Shop Start or Shop Growth tiers include catalog setup, inventory tracking, and monthly maintenance. How many products are you aiming to launch with initially?`;
  }
  if (lower.includes("book") || lower.includes("calendar") || lower.includes("appointment") || lower.includes("patient") || lower.includes("doctor")) {
    return `Automated online booking is one of our core specialties. We seamlessly integrate real-time calendar reservations with automated SMS and WhatsApp confirmation notices. Would your clients also need to pay upfront or upon arrival?`;
  }
  if (lower.includes("lead") || lower.includes("corporate") || lower.includes("company") || lower.includes("services")) {
    return `A high-converting corporate presence is essential for ${businessContext.businessName}. Our Grow Online Business tier provides up to 20 custom responsive pages, SEO optimization, and 120 minutes of monthly updates to keep your offers fresh. What is your ideal launch timeline?`;
  }
  return `Excellent vision, ${businessContext.contactPerson}. We can definitely bring that to life for ${businessContext.businessName} with fast loading times, modern mobile responsiveness, and South African DebiCheck hosting. Are there any particular integrations or design styles you have in mind?`;
}

export async function synthesizeScopeWithGemini(
  conversation: ChatMessage[],
  businessContext: { businessName: string; contactPerson: string }
): Promise<ScopingResult> {
  const fullChatText = conversation.map(c => `${c.role}: ${c.text}`).join("\n");

  if (API_KEY) {
    try {
      const prompt = `Analyze the following project scoping conversation between a client (${businessContext.contactPerson} from ${businessContext.businessName}) and E&L Digital:
${fullChatText}

Based on their specific requirements, recommend the most suitable E&L Digital package:
Options:
- "Grow Online Spark" (R199/mo, 1 page)
- "Grow Online Build" (R349/mo, 5 pages, 30 min updates)
- "Grow Online Starter" (R549/mo, 10 pages, 60 min updates)
- "Grow Online Business" (R899/mo, 20 pages, 120 min updates)
- "Grow Online Elite" (R1499/mo, unlimited pages, 240 min updates)
- "Shop Start" (R799/mo, 100 products, 60 min updates)
- "Shop Growth" (R1299/mo, 1000 products, 120 min updates)
- "Shop Scale" (R1999/mo, enterprise store, 240 min updates)

Return ONLY a valid JSON object with:
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

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (res.ok) {
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
  const isLarge = chatLower.includes("patient") || chatLower.includes("corporate") || chatLower.includes("booking") || chatLower.includes("enterprise") || chatLower.includes("portal");

  if (isCommerce) {
    return {
      recommendedPackage: "Shop Start",
      monthlyFee: 799,
      leadScore: 92,
      projectTitle: `${businessContext.businessName} Online Store & Payment Gateway`,
      scopeSummary: "Full eCommerce storefront with Paystack / Ozow checkout, product catalog management, and automated DebiCheck hosting with 60 min monthly care updates.",
      keyFeatures: ["Paystack / Ozow Card & EFT Checkout", "Up to 100 Products with Variants", "Mobile-Optimized Cart & Checkout", "60 Minutes Monthly Care Updates", "DebiCheck Automated Retainer"],
      carePlanMinutes: 60,
      timeline: "3 to 4 Weeks",
      urgency: "Standard Priority"
    };
  }

  if (isLarge) {
    return {
      recommendedPackage: "Grow Online Business",
      monthlyFee: 899,
      leadScore: 96,
      projectTitle: `${businessContext.businessName} Corporate Portal & Booking Hub`,
      scopeSummary: "Comprehensive corporate digital presence with online booking integration, responsive patient/client inquiry workflows, Google SEO, and 120 minutes of monthly change requests.",
      keyFeatures: ["Up to 20 Custom Responsive Pages", "Real-Time Online Booking Flow", "Google Local SEO & Fast SSD Hosting", "120 Minutes Monthly Website Updates", "Dedicated Solutions Architect SLA"],
      carePlanMinutes: 120,
      timeline: "2 to 3 Weeks",
      urgency: "High Priority"
    };
  }

  return {
    recommendedPackage: "Grow Online Starter",
    monthlyFee: 549,
    leadScore: 88,
    projectTitle: `${businessContext.businessName} Modern Business Website`,
    scopeSummary: "High-performance business website with lead capture forms, WhatsApp click-to-chat, responsive design, and 60 minutes of monthly care updates.",
    keyFeatures: ["Up to 10 Custom Pages", "Lead Capture & WhatsApp Contact", "Fast Cloud Hosting & Free SSL", "60 Minutes Monthly Website Updates", "DebiCheck Zero-Chase Billing"],
    carePlanMinutes: 60,
    timeline: "2 Weeks",
    urgency: "Standard Priority"
  };
}

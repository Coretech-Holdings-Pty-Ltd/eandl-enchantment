import {
  Code2,
  Monitor,
  Network,
  TrendingUp,
  Zap,
  Compass,
  Bot,
  Sparkles,
  BookOpen,
  Rocket,
  Award,
  Users,
  Video,
  MapPin,
  MessageSquare,
  GraduationCap,
  Laptop,
  Briefcase,
  Palette,
  CheckCircle2,
} from "lucide-react";

export const companyContact = {
  name: "E and L Holdings PTY (LTD)",
  email: "info@eandl.digital",
  landline: "010 057 2860",
  landlineTel: "+27100572860",
  whatsapp: "083 432 5339",
  whatsappTel: "+27834325339",
  whatsappLink: "https://wa.me/27834325339",
  address: {
    line1: "4958 Jan Frederick Avenue",
    area: "Randpark Ridge, Randburg, 2154",
    city: "Johannesburg",
    country: "South Africa",
  },
  team: [
    { role: "Group Strategy CEO", name: "Ezile", email: "ezile@eandl.digital" },
    {
      role: "Chief Operating Officer",
      name: "Yonela",
      email: "yonela@eandl.digital",
      phone: "083 432 5339",
      tel: "+27834325339",
    },
  ],
  supportHours: "Monday–Friday, 08:00–17:00 SAST (Excluding public holidays)",
};

export const services = [
  {
    id: "consulting",
    title: "Enterprise IT Consulting",
    short:
      "Clarity before complexity. Technology strategy, business analysis and transformation built around your goals.",
    icon: Compass,
    features: [
      "Technology strategy and digital transformation",
      "Systems and technical business analysis",
      "Infrastructure optimisation and procurement guidance",
      "Vendor selection and project advisory",
    ],
    description:
      "Make your next technology decision with confidence. We connect business needs to practical technology roadmaps, informed procurement and effective delivery.",
  },
  {
    id: "software",
    title: "Software & Digital Platforms",
    short:
      "From a first website to a connected business platform. Designed, developed and delivered with care.",
    icon: Code2,
    features: [
      "Custom application development and integration",
      "Websites, e-commerce and booking systems",
      "Quality assurance, testing and deployment",
      "Continuous improvement and monthly platform support",
    ],
    description:
      "Turn an idea into a dependable digital product. Our delivery spans design, development, integration, testing and long-term improvement, with CoreTech powering our subscription website builds.",
  },
  {
    id: "hardware",
    title: "Hardware & Software Supply",
    short:
      "Business-ready technology. Reliable sourcing, quality checks and support from trusted partners.",
    icon: Monitor,
    features: [
      "Laptops, desktops, servers and storage",
      "Business software and security licences",
      "Bulk procurement, quality testing and delivery",
      "Manufacturer partnerships and after-sales support",
    ],
    description:
      "Equip your team with technology that is ready for business. Our manufacturer and distribution partnerships support informed selection, competitive procurement, bulk fulfilment and after-sales assistance.",
  },
  {
    id: "support",
    title: "Networks, Support & Security",
    short: "Stay connected. Stay protected. Proactive support that keeps your operations moving.",
    icon: Network,
    features: [
      "Managed support, maintenance and monitoring",
      "LAN, WAN and secure Wi-Fi networking",
      "Threat assessments and vulnerability management",
      "Security testing and incident response",
    ],
    description:
      "Build resilient operations with secure connectivity and accountable technical care. From network design to ongoing maintenance, we help protect the systems your business depends on.",
  },
  {
    id: "investment",
    title: "Investment & Growth Solutions",
    short:
      "More than funding. Strategic support that helps ambitious businesses unlock their next chapter.",
    icon: TrendingUp,
    features: [
      "SMME and startup growth support",
      "Working capital and purchase-order funding",
      "Equipment and sector-specific financing",
      "Technology, property, automotive, agriculture and industry",
    ],
    description:
      "Access practical growth support across finance, technology, property, automotive, agriculture, retail, manufacturing and energy. Funding options are scoped to your business needs and subject to assessment.",
  },
  {
    id: "power",
    title: "Power & Infrastructure",
    short:
      "Power your progress. Reliable distribution, backup and renewable energy infrastructure.",
    icon: Zap,
    features: [
      "Transformers, switchgear and distribution boards",
      "UPS, battery backup and generators",
      "Solar, energy storage and hybrid systems",
      "Transformer accessories, testing and maintenance",
    ],
    description:
      "Strengthen operational continuity with power distribution, backup systems and renewable energy solutions. Our capabilities include transformer accessories, testing and maintenance for demanding infrastructure environments.",
  },
];

export const packages = [
  {
    name: "Spark",
    label: "Your first step online",
    prices: [199, 260, 340],
    features: [
      "One-page professional website",
      "Free E&L web address",
      "WhatsApp, call and map buttons",
      "Hosting, SSL and backups",
      "Growth Community access",
    ],
    trial: true,
  },
  {
    name: "Build",
    label: "A stronger business presence",
    prices: [349, 450, 600],
    features: [
      "Up to 3 custom-branded pages",
      "Connect your own domain",
      "1 business mailbox",
      "Google Business Profile setup",
      "Contact form and WhatsApp",
      "Member Directory listing",
    ],
    featured: true,
    trial: true,
  },
  {
    name: "Starter",
    label: "Room to tell your story",
    prices: [500, 650, 850],
    features: [
      "Up to 5 custom-designed pages",
      "Contact form and social links",
      "Basic on-page SEO setup",
      "30 minutes of changes monthly",
      "Hosting, SSL and backups",
      "Growth Community access",
    ],
    trial: true,
  },
  {
    name: "Business",
    label: "Built for your next stage",
    prices: [1200, 1550, 2050],
    features: [
      "Up to 10 pages",
      "Content management and blog",
      "Enquiry, quote and booking forms",
      "Analytics and SEO",
      "1 professional mailbox",
      "2 hours of monthly updates",
      "Growth Community Plus",
    ],
  },
  {
    name: "Professional",
    label: "For established companies",
    prices: [2200, 2850, 3750],
    features: [
      "Up to 20 bespoke pages",
      "Optional client login area",
      "Multi-language and advanced SEO",
      "Newsletter and CRM integrations",
      "5 mailboxes and monthly report",
      "5 hours of monthly updates",
      "Priority community spotlight",
    ],
  },
];

export const engagements = [
  { company: "MultiChoice", year: "2019", work: "Systems analysis" },
  { company: "DVT", year: "2021–2025", work: "Business development & consultation" },
  { company: "Anglo American", year: "2021–2025", work: "Systems migration" },
  { company: "Harambee", year: "2025", work: "Technical business analysis" },
];

export const learningHub = {
  title: "E & L Holdings Learning Hub",
  tagline: "Empowering Africa to Build and Use AI",
  emoji: "🤖🇿🇦",
  slogan: "From Africa, For Africa. Don't just consume AI, create it.",
  about: {
    lead: "The E & L Learning Hub is an accessible, practical education platform designed to teach South Africans and Africans how to UNDERSTAND, CREATE, and USE Artificial Intelligence to grow businesses, careers, and communities.",
    philosophy: "We don't just teach theory - we teach how to make AI work for you.",
    stats: [
      { label: "Practical Focus", value: "100%" },
      { label: "Progressive Levels", value: "3 Tracks" },
      { label: "Free Starter Access", value: "R0" },
      { label: "Monthly Subscriptions", value: "R199–R499" },
    ],
  },
  audiences: [
    {
      title: "Small Business Owners & Entrepreneurs",
      role: "Business Growth",
      icon: Briefcase,
      summary:
        "Automate repetitive operations, generate leads on WhatsApp, craft professional marketing campaigns, and cut operating costs.",
      takeaways: [
        "WhatsApp auto-responders & lead filters",
        "Automated quotes, invoices & proposals",
        "Zero-cost AI marketing creatives",
      ],
    },
    {
      title: "Matriculants, Students & Graduates",
      role: "Career Launch",
      icon: GraduationCap,
      summary:
        "Future-proof your career trajectory. Learn high-demand AI skills that set you apart in the South African and global job market.",
      takeaways: [
        "AI-accelerated CV & interview readiness",
        "Building a portfolio of live AI tools",
        "In-demand prompt engineering & automation",
      ],
    },
    {
      title: "Working Professionals",
      role: "Productivity & Leadership",
      icon: Laptop,
      summary:
        "Multiply your workplace productivity 10x. Turn routine spreadsheets, reports, and emails into effortless automated workflows.",
      takeaways: [
        "Executive summaries & data analysis with Gemini/ChatGPT",
        "Workflow automation without IT delays",
        "Strategic AI implementation leadership",
      ],
    },
    {
      title: "Creatives, Marketers & Content Creators",
      role: "Creative Production",
      icon: Palette,
      summary:
        "Produce studio-grade visuals, AI voiceovers, video clips, and high-converting copy in minutes for local and international clients.",
      takeaways: [
        "Hyper-realistic generative image generation",
        "African-accented AI voiceovers & audio",
        "Monetizing design & copywriting retainers",
      ],
    },
  ],
  levels: [
    {
      number: "01",
      title: "Level 1: AI Literacy",
      subtitle: "How to USE AI",
      badge: "Foundations & Productivity",
      description:
        "Master everyday AI tools to radically boost your personal and business productivity from day one.",
      icon: BookOpen,
      modules: [
        {
          name: "What is AI & Generative AI?",
          details:
            "Demystifying neural networks, Large Language Models (LLMs), and machine learning in plain, accessible language without academic jargon.",
        },
        {
          name: "Mastering ChatGPT, Gemini & Canva AI",
          details:
            "Hands-on practical mastery of modern AI engines for drafting documents, brainstorming, editing, and professional visual design.",
        },
        {
          name: "AI for CVs, Business Plans, Marketing & Sales",
          details:
            "Ready-to-use prompting frameworks for South African business plans, tender readiness, cold outreach, and job applications.",
        },
        {
          name: "AI Ethics, Privacy & Safety for Africans",
          details:
            "Data sovereignty, respecting local copyright and privacy (POPIA compliance), avoiding algorithmic biases, and verifying AI facts.",
        },
      ],
      outcome:
        "Gain supreme confidence using AI daily. Save 10+ hours every week on writing, planning, and content creation.",
    },
    {
      number: "02",
      title: "Level 2: AI Builder",
      subtitle: "How to CREATE AI",
      badge: "No-Code Tools & Automation",
      description:
        "Go beyond prompting. Build custom chatbots, automated workflows, and AI apps that solve real business bottlenecks.",
      icon: Bot,
      modules: [
        {
          name: "No-code AI Chatbots for Business",
          details:
            "Train intelligent customer service assistants on your business documents, FAQs, and price lists that answer customer questions 24/7.",
        },
        {
          name: "AI Voiceovers, Images & Video Production",
          details:
            "Generate photorealistic imagery, realistic studio voiceovers with African tones, and AI video explainers without expensive gear.",
        },
        {
          name: "Automating with WhatsApp Bots & Lead Gen",
          details:
            "Connect AI to WhatsApp Business, Google Sheets, and CRM tools to automatically capture, qualify, and follow up with leads.",
        },
        {
          name: "Building AI-Powered Websites & Apps Without Code",
          details:
            "Leverage modern visual app builders and APIs to launch functional web apps, client booking tools, and automated calculators in hours.",
        },
      ],
      outcome:
        "Deploy real, working AI solutions that automate sales, client inquiries, and digital production without writing code.",
    },
    {
      number: "03",
      title: "Level 3: AI Business",
      subtitle: "How to MAKE MONEY with AI",
      badge: "Monetization & Agency Scale",
      description:
        "Turn your AI expertise into sustainable revenue streams, commercial client retainers, and enterprise services.",
      icon: Rocket,
      modules: [
        {
          name: "How to Start an AI Agency",
          details:
            "Service packaging, pricing tiers, client onboarding contracts, and standard operating procedures for selling AI solutions.",
        },
        {
          name: "How to Sell AI Services to Businesses",
          details:
            "Prospecting South African SMEs and corporates, handling client skepticism, demonstrating ROI, and closing monthly retainers.",
        },
        {
          name: "NFS Case Study: AI in Insurance & Finance",
          details:
            "Exclusive deep dive into how NFS Insure & financial services leverage intelligent workflows for underwriting, claims triage, and client communication.",
        },
      ],
      outcome:
        "Launch a profitable AI service offering, land commercial clients, and build high-margin recurring income.",
    },
  ],
  delivery: [
    {
      title: "Online Masterclasses",
      detail:
        "Live interactive sessions via Zoom and Google Meet with screen shares, live building, and direct Q&A.",
      icon: Video,
      tag: "Interactive & Live",
    },
    {
      title: "Physical Workshops",
      detail:
        "Hands-on practical bootcamps hosted at Midrand and regional hubs across South Africa with peer collaboration.",
      icon: MapPin,
      tag: "Midrand & Around SA",
    },
    {
      title: "WhatsApp Learning Group",
      detail:
        "Daily bite-sized prompt drops, active mentor support, peer troubleshooting, and real-time announcements.",
      icon: MessageSquare,
      tag: "24/7 Community",
    },
    {
      title: "Verified Digital Certificates",
      detail:
        "Earn shareable credentials upon completing milestones and building verified capstone projects.",
      icon: Award,
      tag: "CV & LinkedIn Ready",
    },
  ],
  pricingTiers: [
    {
      name: "Free Starter Track",
      price: "R0",
      period: "Forever free",
      description: "Ideal for anyone taking their very first step into Artificial Intelligence.",
      features: [
        "Interactive AI Kickstart online lesson access",
        "Join the public WhatsApp Community Group",
        "Weekly curated AI prompt & tool digest",
        "Access to free community webinars",
        "Starter AI knowledge check certificate",
      ],
      ctaText: "Start learning free",
      ctaType: "free",
      featured: false,
    },
    {
      name: "Active Learner Pass",
      price: "R199",
      period: "/ month",
      description:
        "Full access to Level 1 & Level 2 live masterclasses, tool templates, and workshops.",
      features: [
        "All Level 1 (Literacy) & Level 2 (Builder) modules",
        "Live weekly Zoom / Google Meet masterclasses",
        "Private cohort WhatsApp group with instructor support",
        "Ready-made chatbot & automation templates",
        "Digital Certificate of Competency for each level",
        "Recording archive of all live sessions",
      ],
      ctaText: "Enrol in Active Learner",
      ctaType: "paid",
      featured: true,
      badge: "Most Popular",
    },
    {
      name: "Pro Builder & Business",
      price: "R499",
      period: "/ month",
      description:
        "For entrepreneurs, agencies, and pros ready to monetize AI and scale client services.",
      features: [
        "Full 3-Level curriculum (Literacy + Builder + Business)",
        "Exclusive NFS Insurance & Finance AI Case Study",
        "AI Agency starter kit (proposals, contracts, pricing sheets)",
        "Priority seating at Midrand physical workshops",
        "Monthly 1-on-1 implementation strategy review",
        "Direct referral to E & L client network opportunities",
      ],
      ctaText: "Join Pro Builder",
      ctaType: "paid",
      featured: false,
    },
  ],
  freeCourse: {
    title: "Free AI Kickstart Practitioner Track",
    tagline: "Practical AI in 15 Minutes — No Code Required",
    lessons: [
      {
        id: "lesson-1",
        title: "Lesson 1: The South African AI Landscape — What AI Really Is",
        badge: "Foundations",
        readTime: "3 min read",
        summary:
          "AI is not an esoteric tech toy or an existential threat; it is a tireless cognitive collaborator. In Africa, the divide is no longer between techies and non-techies — it is between those who consume foreign AI passively and those who direct AI to solve local challenges.",
        keyTakeaway:
          "The winners in South Africa will not be those who fear AI or just consume it, but those who learn to direct it.",
        deepDive: {
          heading: "Understanding Predictive vs Generative vs Agentic AI",
          paragraphs: [
            "Modern AI breaks down into three distinct tiers: (1) Predictive AI (algorithms forecasting sales trends or credit risk), (2) Generative AI (Large Language Models like ChatGPT, Claude, and Gemini that create new text, code, or images from contextual prompts), and (3) Agentic AI (autonomous systems that reason, browse the web, execute multi-step business actions, and trigger software tools).",
            "At their core, Large Language Models (LLMs) operate on statistical token prediction. They do not 'think' like a human with emotions or consciousness. They predict the most statistically probable and contextually appropriate next token based on billions of training patterns. When you give them vague instructions, you get vague, generic statistics. When you provide rich South African business context, exact roles, and structured rules, they perform like seasoned executive specialists.",
          ],
          caseStudyTitle: "Case in Point: The Kempton Park Logistics Fleet",
          caseStudyText:
            "A mid-sized freight dispatcher in Gauteng connected an LLM to their fleet tracking data. Instead of spending 3 hours daily writing manual client email status updates, a single structured prompt generates personalized route progress reports across 45 delivery routes in 35 seconds, flagging customs delays and estimated arrival times with 99.4% accuracy.",
          proTips: [
            "Never treat an LLM like a Google search bar; treat it like an intelligent, eager intern who needs clear guidelines.",
            "Token context is king: models perform best when given examples of desired outputs (few-shot prompting).",
          ],
        },
      },
      {
        id: "lesson-2",
        title: "Lesson 2: The E&L C.R.I.S.P. Prompt Architecture for Business",
        badge: "Action Framework",
        readTime: "4 min read",
        summary:
          "Generic prompting ('Write an email about our prices') produces flat, useless content. The E&L C.R.I.S.P. architecture guarantees executive-grade, client-ready deliverables on your very first generation.",
        keyTakeaway:
          "Great prompts turn generic AI answers into professional, client-ready work in one go.",
        deepDive: {
          heading: "The 5 Pillars of the C.R.I.S.P. Architecture",
          paragraphs: [
            "C — Context: Ground the AI in your exact environment. Who are you? Who is your customer? Are you operating in Sandton, Durban, or a township retail center? What are your constraints?",
            "R — Role: Assign an elite specialist persona. E.g., 'Act as a senior South African commercial proposal director with 15 years experience in B-BBEE compliance and logistics tenders.'",
            "I — Instruction: Detail the explicit task step-by-step. Break complex asks into numbered chains of thought.",
            "S — Specifics: Define constraints, tone, and currency. Require South African Rand (ZAR), South African spelling (organise vs organize), and mention relevant legislation (POPIA, BCEA).",
            "P — Presentation: Mandate the exact output structure — whether a clean Markdown table, formal PDF letter format, bulleted executive summary, or a WhatsApp-ready mobile template with emojis.",
          ],
          caseStudyTitle: "Before vs After C.R.I.S.P.",
          caseStudyText:
            "Vague Prompt: 'Write an invoice reminder.' -> AI Output: 'Dear Sir, Please pay invoice.'\nC.R.I.S.P. Prompt: 'Act as a courteous South African credit control manager for an electrical contractor. Draft a polite 7-day overdue reminder to an engineering client in Centurion for Invoice #2049 (R38,500). Tone: warm, relationship-preserving, yet firm. Include standard EFT banking placeholder and VAT compliance notice.' -> AI Output: Professional, polished, legally sound letter that gets invoices paid without burning bridges.",
          proTips: [
            "Always include negative constraints: e.g. 'Do not invent pricing figures' or 'Do not use American legal terminology'.",
            "Ask the AI to ask you 3 clarifying questions before generating if key info is missing.",
          ],
        },
      },
      {
        id: "lesson-3",
        title: "Lesson 3: The Free African AI Tool Stack (Zero Subscription Cost)",
        badge: "Free Stack",
        readTime: "4 min read",
        summary:
          "You do not need costly Silicon Valley software subscriptions to build high-margin digital workflows. Master these 5 proven free platforms to handle writing, visual design, research, and voice synthesis.",
        keyTakeaway:
          "You do not need costly subscriptions to build high-value client work today.",
        deepDive: {
          heading: "The 5 Indispensable Free Platforms",
          paragraphs: [
            "1. ChatGPT (Free GPT-4o mini): Best-in-class everyday copy editing, proposal drafting, data formatting, and ideation.",
            "2. Google Gemini: Directly integrated with live Google search and Google Drive; ideal for analyzing live South African web data, current petrol prices, SARS announcements, and long PDFs.",
            "3. Canva Magic Studio (Free tier): Instant AI visual generation, automated background removal, and professional business branding templates.",
            "4. Perplexity AI: Research assistant with hyperlinked citations; perfect for verifying South African trade regulations, market stats, and industry benchmarks with verifiable sources.",
            "5. ElevenLabs (Free Tier): Studio-grade multilingual voice synthesis for voice notes, explainer videos, and interactive training modules.",
          ],
          caseStudyTitle: "Case in Point: The R0 Marketing Agency",
          caseStudyText:
            "A creative freelancer in Midrand used this exact free stack to package social media management retainers for 4 local dental practices. Using Gemini for competitor research, ChatGPT for content calendars, and Canva Magic for visuals, she delivered R24,000/month in billable value with zero software overhead.",
          proTips: [
            "Cross-verify factual claims across both Gemini and Perplexity to avoid relying on single-model training cutoffs.",
            "Export outputs as plain text or markdown to keep client deliverables clean and portable.",
          ],
        },
      },
      {
        id: "lesson-4",
        title: "Lesson 4: Building WhatsApp AI Bots & Ensuring POPIA Compliance",
        badge: "Automation & Safety",
        readTime: "4 min read",
        summary:
          "WhatsApp is the operating system of African commerce. Pairing no-code AI webhooks with your WhatsApp business line enables 24/7 client booking, instant quote calculations, and multilingual service while maintaining strict POPIA compliance.",
        keyTakeaway:
          "A WhatsApp AI bot saves hours of manual messaging and prevents lost sales.",
        deepDive: {
          heading: "Architecture & POPIA Security Guardrails",
          paragraphs: [
            "An enterprise WhatsApp AI workflow connects 3 layers: (1) WhatsApp Cloud API / Twilio as the messaging gateway, (2) An automation orchestrator like Make.com, n8n, or Zapier, and (3) An OpenAI/Gemini API assistant grounded in your business FAQ, service pricing, and operating hours.",
            "Crucial POPIA Compliance Rule: Under the South African Protection of Personal Information Act (POPIA), you must never ingest unredacted South African ID numbers, banking credentials, medical histories, or sensitive employee records into public AI training models. Enterprise deployments must implement automated PII masking (redacting phone numbers, names, and ID numbers into tokens) before prompting the LLM.",
          ],
          caseStudyTitle: "Case in Point: Soweto Retail Store Lay-By Assistant",
          caseStudyText:
            "A fashion boutique deployed a WhatsApp bot answering customers in English and casual isiZulu. The bot answers lay-by policy queries, checks shoe sizes in Google Sheets, and sends SnapScan / Ozow payment links. Weekend customer conversion increased by 42% because inquiries were resolved in 4 seconds instead of waiting until Monday morning.",
          proTips: [
            "Always include a human-escalation fallback: 'Would you like me to connect you directly with a manager on this line?'",
            "Set explicit guardrails: 'Never promise discounts or deviate from the official published price list.'",
          ],
        },
      },
    ],
    samplePrompts: [
      {
        label: "WhatsApp Multilingual Lay-by Assistant",
        category: "Customer Service",
        context: "Soweto retail fashion store answering inquiries in mixed isiZulu & English",
        prompt:
          "Act as a friendly, culturally attuned South African WhatsApp customer care manager for a fashion boutique in Soweto. Respond to this customer note: 'Sanibonani, ngisacela ukubuza if i-jacket e-black isekhona size 34 and ungayibamba nge-deposit?'\nRequirements:\n1. Acknowledge warmly in respectful South African vernacular.\n2. Confirm Size 34 is in stock in black (R650).\n3. Explain the 30% lay-by deposit policy (R195 upfront, 60 days to settle).\n4. Provide our trading hours at Maponya Mall and attach a friendly booking sign-off.",
        simulatedOutput:
          "Yebo, sanibonani! 👋 Thank you for reaching out to us!\n\nYes, we definitely have the Black Winter Jacket in Size 34 in stock at our Maponya Mall store for R650.\n\nYou can certainly secure it on lay-by today with our 30% deposit of R195. You then have 60 days to settle the remaining balance in flexible installments whenever it suits you.\n\nWe are open Monday to Sunday from 9:00 AM to 6:00 PM. Would you like me to hold this jacket under your name until 5:00 PM today? 😊✨",
      },
      {
        id: "tender-exec",
        label: "SMME Logistics Tender Executive Summary",
        category: "Commercial Proposals",
        context: "Kempton Park transport fleet bidding on a corporate supply chain contract",
        prompt:
          "Act as a senior South African commercial proposal director. Draft an executive summary for our logistics company tender submission to a national FMCG distributor.\nContext: Fleet of 22 refrigerated trucks, depot in Kempton Park, B-BBEE Level 1, 99.4% on-time delivery rate across Gauteng, KZN, and Western Cape.\nRequirements:\n- Emphasize POPIA compliance, real-time telematics tracking, and cold-chain temperature guarantees.\n- Highlight 24/7 mechanical standby dispatch.\n- Tone: executive, authoritative, and focused on risk mitigation.",
        simulatedOutput:
          "EXECUTIVE SUMMARY: STRATEGIC LOGISTICS PARTNERSHIP\n\nIn a competitive FMCG marketplace where cold-chain integrity and delivery punctuality directly determine brand equity, our Kempton Park depot delivers an uncompromised transport infrastructure built for reliability.\n\nKey Strategic Advantages:\n• High-Availability Fleet: 22 modern refrigerated vehicles operating with multi-temperature zones.\n• Verifiable SLA Track Record: Consistent 99.4% on-time dispatch rate across Gauteng, KwaZulu-Natal, and the Western Cape.\n• Compliance & Risk Governance: B-BBEE Level 1 accredited, fully compliant with POPIA data protocols, featuring live IoT telematics and real-time cold-chain temperature telemetry accessible to client dispatchers 24/7.\n• Rapid Contingency Response: 24/7 dedicated mobile breakdown support ensuring zero stranded shipments.\n\nWe don't merely move cargo; we insulate your supply chain against operational disruption with complete accountability.",
      },
      {
        id: "tax-calc",
        label: "SARS-Compliant Overdue Debt Notice",
        category: "Financial Control",
        context: "Midrand commercial contractor recovering overdue engineering retainer",
        prompt:
          "Act as an empathetic yet firm South African credit control specialist for an electrical infrastructure contractor in Midrand. Draft a 14-day formal letter of overdue account to an engineering client.\nVariables: Invoice #EL-8941, Outstanding amount: R48,300 (incl. 15% VAT), Overdue by 21 days.\nRequirements:\n1. Preserve the long-term relationship while signaling imminent escalation to legal dispatch.\n2. Cite payment terms under our signed master service agreement.\n3. Provide EFT banking details placeholder and offer a 48-hour payment plan resolution window.",
        simulatedOutput:
          "Attention: Accounts Payable & Commercial Directorate\nRe: Overdue Settlement Request — Invoice #EL-8941 (R48,300.00 incl. VAT)\n\nWe value our ongoing operational partnership with your engineering team and appreciate the collaborative milestones achieved to date.\n\nOur accounts ledger reflects that Invoice #EL-8941 in the amount of R48,300.00 (inclusive of 15% South African VAT) remains outstanding, having exceeded our agreed 30-day payment term by 21 days.\n\nTo ensure our ongoing support on your site projects continues without administrative suspension, kindly arrange for settlement into our standard business account (FNB Corporate, Branch 250655, Account [Placeholder]) within the next 48 hours, or contact our credit control desk immediately to agree on a formal reconciliation schedule.\n\nWarm regards,\nCredit Control Desk · E and L Holdings (PTY) LTD",
      },
    ],
    quiz: [
      {
        id: "q-1",
        scenarioTitle: "Case Study 01: The Kempton Park Freight Quotation",
        scenarioText:
          "Thabo operates an express courier fleet in Kempton Park. He asked an AI: 'Write me a quote for 4 pallets from JHB to Durban.' The AI produced a generic letter with no pricing in ZAR, no transit times, no weight liabilities, and American spelling. The client rejected the bid as amateurish.",
        question:
          "Applying the C.R.I.S.P. prompt framework from Lesson 2, what was Thabo's primary failure and which prompt architecture resolves it?",
        options: [
          "He should have written the prompt in Python programming code instead of plain English.",
          "He omitted the Context (courier fleet parameters), Specifics (ZAR pricing, route transit limits, liability terms), and Presentation (line-item quotation format).",
          "AI models are strictly forbidden from writing financial proposals.",
          "He should have allowed the customer to write the prompt for him.",
        ],
        correctIndex: 1,
        explanation:
          "Without Context, Specific constraints (ZAR currency, delivery routes, weight liability), and Presentation format, the model falls back to generic placeholders. Using C.R.I.S.P. ensures production-ready accuracy.",
        competencyEarned: "C.R.I.S.P. Prompt Architecture",
      },
      {
        id: "q-2",
        scenarioTitle: "Case Study 02: Vernacular & Grounding in WhatsApp Customer Care",
        scenarioText:
          "Nandi deployed a WhatsApp AI bot for her retail boutique in Soweto. A customer asks in mixed colloquial isiZulu and English: 'Sanibonani, ngisacela ukubuza if i-jacket e-black isekhona size 34 and ungayibamba nge-deposit?'",
        question:
          "To guarantee the assistant responds warmly, accurately, and without inventing stock that doesn't exist, what must the system prompt enforce?",
        options: [
          "Force the assistant to strictly reply in formal English and disregard vernacular inquiries.",
          "Instruct the persona to comprehend South African multilingual vernacular, bind its responses strictly to real-time inventory data, and enforce: 'Never confirm stock unless verified in the provided catalog.'",
          "Disconnect the WhatsApp line and demand customers come in person.",
          "Allow the AI to guess stock numbers because customers will accept replacements.",
        ],
        correctIndex: 1,
        explanation:
          "African commercial bots must handle vernacular phrasing with cultural empathy while enforcing strict factual grounding against a real inventory database.",
        competencyEarned: "Multilingual Vernacular & Guardrails",
      },
      {
        id: "q-3",
        scenarioTitle: "Case Study 03: South African POPIA & Sensitive Data Exposure",
        scenarioText:
          "An administrative manager at a Midrand accounting practice copies 15 overdue client files—including South African ID numbers, banking details, and SARS tax audit notices—directly into a public, free consumer AI web tool to generate debt recovery letters.",
        question:
          "Under South Africa's Protection of Personal Information Act (POPIA) and enterprise safety rules (Lesson 4), what critical risk occurred and what is the required remedy?",
        options: [
          "No risk exists because AI companies are based overseas.",
          "Severe POPIA violation: Personally Identifiable Information (PII) was exposed to public training loops. Sensitive data must be sanitized/masked (e.g. [Client_A], masked ID) or routed through private zero-data-retention APIs.",
          "It is only a violation if the invoice exceeds R500,000.",
          "Computers should never be used to send payment reminders.",
        ],
        correctIndex: 1,
        explanation:
          "Transmitting unredacted personal identifiers (ID numbers, bank details) into public AI models breaches POPIA. Data must always be masked or processed via private, zero-retention enterprise pipelines.",
        competencyEarned: "POPIA Compliance & Data Sanitization",
      },
      {
        id: "q-4",
        scenarioTitle: "Case Study 04: Arithmetic Precision & Hallucination in SARS Invoicing",
        scenarioText:
          "Lerato asked an LLM to add 15% South African VAT and deduct a 7.5% early settlement discount across a R94,200 commercial contract. The model hallucinated the math, resulting in a R1,420 calculation discrepancy that disqualified her corporate tender.",
        question:
          "Why did this discrepancy occur, and what is the proven methodology taught in the E & L Learning Hub to eliminate calculation errors?",
        options: [
          "Large Language Models are probabilistic token predictors, not native math engines; complex arithmetic must be verified using code interpreters, spreadsheet formulas, or verified calculation tools.",
          "South African VAT is too complicated for international artificial intelligence to comprehend.",
          "She should have converted the figures into Roman numerals.",
          "The AI was deliberately altering the bid to help a competitor.",
        ],
        correctIndex: 0,
        explanation:
          "LLMs predict text rather than performing exact deterministic computation. For commercial and tax-critical figures, always pair language prompts with deterministic verification tools (Excel, Python, or Code Interpreter).",
        competencyEarned: "Hallucination Auditing & Precision Verification",
      },
    ],
  },
};

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | E and L Holdings` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | E and L Holdings` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

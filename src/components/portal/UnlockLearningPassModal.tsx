/**
 * Unlock Learning Pass Modal — E&L Client Portal
 * Allows logged-in clients to add the Learning Pass (R199/mo, R499/mo, or R0 starter)
 * directly to their active plan without being sent to the generic public packages page.
 */
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  GraduationCap, Sparkles, CheckCircle2, Shield,
  ArrowRight, X, Loader2, CreditCard, Lock, Zap
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";

interface UnlockLearningPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LEARNING_PASS_TIERS = [
  {
    id: "monthly",
    name: "Active Learner Pass",
    price: "R199",
    period: "per month",
    badge: "Recommended",
    highlight: true,
    description: "Full access to Level 1 & Level 2 live masterclasses, templates, and workshops.",
    features: [
      "All Level 1 (Literacy) & Level 2 (Builder) modules",
      "Live weekly Zoom / Google Meet masterclasses",
      "Private cohort WhatsApp community with instructor support",
      "Ready-made chatbot & prompt automation templates",
      "Digital Certificate of Competency for each level",
    ],
  },
  {
    id: "executive",
    name: "Pro Builder & Business",
    price: "R499",
    period: "per month",
    badge: "Agency & Scale",
    highlight: false,
    description: "For founders, agencies, and pros ready to monetize AI and scale client services.",
    features: [
      "Full 3-Level curriculum (Literacy + Builder + Business Track)",
      "Exclusive NFS Insurance & Finance AI Case Study",
      "AI Agency starter kit (proposals, contracts, pricing sheets)",
      "Monthly 1-on-1 implementation strategy review",
    ],
  },
  {
    id: "starter",
    name: "Free AI Starter Track",
    price: "R0",
    period: "forever free",
    badge: "Free Starter",
    highlight: false,
    description: "Ideal for anyone taking their very first step into applied Artificial Intelligence.",
    features: [
      "Interactive AI Kickstart online lesson access",
      "Join public WhatsApp Community Group",
      "Weekly curated AI prompt & tool digest",
    ],
  },
];

export function UnlockLearningPassModal({ isOpen, onClose, onSuccess }: UnlockLearningPassModalProps) {
  const navigate = useNavigate();
  const { client, user, unlockLearningPass, setToast } = usePortalAuth();

  const [selectedTierId, setSelectedTierId] = useState<string>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedTier = LEARNING_PASS_TIERS.find(t => t.id === selectedTierId) || LEARNING_PASS_TIERS[0];
  const isDebiCheckAuthorized = client?.mandateStatus === "authorized";

  const handleUnlock = async () => {
    setError(null);
    setSubmitting(true);

    const result = await unlockLearningPass({
      id: selectedTier.id,
      name: selectedTier.name,
      price: selectedTier.price,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
      setToast(`🎉 ${selectedTier.name} unlocked! Academy access enabled.`);
      if (onSuccess) onSuccess();
    }
  };

  const handleGoToAcademy = () => {
    onClose();
    navigate({ to: "/portal/academy" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#0b1220] border border-white/15 rounded-3xl p-5 sm:p-7 text-white shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {!isSuccess ? (
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1">
                  <Sparkles size={11} /> E&amp;L Learning Hub
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Add Learning Pass to Your Plan
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Unlock all masterclasses, AI tools, prompts, and accredited South African business certifications directly in your workspace.
                </p>
              </div>
            </div>

            {/* Plan Tier Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LEARNING_PASS_TIERS.map(tier => {
                const isSelected = selectedTierId === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          tier.highlight
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-white/10 text-slate-300"
                        }`}>
                          {tier.badge}
                        </span>
                        {isSelected && <CheckCircle2 size={15} className="text-amber-400" />}
                      </div>

                      <div className="text-xs font-black text-white leading-snug">{tier.name}</div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-black text-white">{tier.price}</span>
                        <span className="text-[10px] text-slate-400">/{tier.period === "forever free" ? "free" : "mo"}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{tier.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1">
                      {tier.features.slice(0, 2).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
                          <CheckCircle2 size={10} className="text-amber-400 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Billing Notification Callout */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <CreditCard size={15} />
              </div>
              <div className="text-xs leading-relaxed text-slate-300 min-w-0">
                {selectedTier.price === "R0" ? (
                  <>
                    <strong className="text-white block font-bold">100% Free Kickstart Track:</strong>
                    No billing or banking required. You will be enrolled instantly with full access to starter modules.
                  </>
                ) : isDebiCheckAuthorized ? (
                  <>
                    <strong className="text-white block font-bold">DebiCheck Retainer Synchronized:</strong>
                    Your banking account ({client?.bankName || "Verified Bank"} · ••••{client?.accountNumber ? client.accountNumber.slice(-4) : "••••"}) is registered. This add-on of <strong className="text-amber-300">{selectedTier.price}/mo</strong> will be added directly to your monthly retainer with zero administrative interruption.
                  </>
                ) : (
                  <>
                    <strong className="text-white block font-bold">Seamless Account Addition:</strong>
                    Your request will be activated immediately and loaded onto your {client?.name || "client"} account statement for <strong className="text-amber-300">{selectedTier.price}/mo</strong>.
                  </>
                )}
              </div>
            </div>

            {/* Error notice if any */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Activating Pass...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>
                      {selectedTier.price === "R0"
                        ? "Unlock Free Starter Track"
                        : `Confirm & Unlock (${selectedTier.price}/mo)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                ✓ Access Enabled
              </div>
              <h2 className="text-2xl font-black text-white">
                {selectedTier.name} Activated!
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Your client profile now has full access to the E&amp;L Digital Learning Academy courses, live masterclass schedules, and AI automation templates.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleGoToAcademy}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Learning Academy Now</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


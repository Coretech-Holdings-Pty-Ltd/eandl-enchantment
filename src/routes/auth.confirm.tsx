/**
 * White-Label Auth Confirmation Route — /auth/confirm
 * Verifies Supabase OTP token_hash from white-labeled brand emails
 * and navigates to the target brand portal destination.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth/confirm")({
  validateSearch: (s: Record<string, unknown>): { token_hash?: string; type?: string; next?: string } => ({
    token_hash: typeof s["token_hash"] === "string" ? s["token_hash"] : undefined,
    type: typeof s["type"] === "string" ? s["type"] : undefined,
    next: typeof s["next"] === "string" ? s["next"] : undefined,
  }),
  component: AuthConfirmPage,
});

function AuthConfirmPage() {
  const navigate = useNavigate();
  const { token_hash, type, next } = Route.useSearch();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function handleVerify() {
      if (!token_hash || !type) {
        setStatus("error");
        setErrorMessage("Missing authentication verification token or type.");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          if (isMounted) {
            setStatus("error");
            setErrorMessage(error.message || "Failed to verify credential. Link may have expired.");
          }
        } else {
          if (isMounted) {
            setStatus("success");
            const target = next || (type === "recovery" ? "/portal/reset-password" : "/portal/dashboard");
            setTimeout(() => {
              navigate({ to: target as any });
            }, 1200);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err?.message || "An unexpected error occurred during confirmation.");
        }
      }
    }

    handleVerify();

    return () => {
      isMounted = false;
    };
  }, [token_hash, type, next, navigate]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <img src={logo} alt="E&L Digital" className="w-14 h-14 object-contain rounded-2xl" />
        </div>

        {status === "verifying" && (
          <div className="space-y-3">
            <RefreshCw size={28} className="animate-spin text-teal-400 mx-auto" />
            <h2 className="text-lg font-extrabold text-white">Verifying Brand Credentials</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please wait while we confirm your authentication token with E&amp;L Digital Security Desk...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <h2 className="text-lg font-extrabold text-white">Verification Complete</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Redirecting you to your client workspace...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle size={32} className="text-rose-400 mx-auto" />
            <h2 className="text-lg font-extrabold text-white">Verification Notice</h2>
            <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl leading-relaxed">
              {errorMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate({ to: "/portal/login" })}
                className="px-6 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white transition-all"
              >
                Return to Portal Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

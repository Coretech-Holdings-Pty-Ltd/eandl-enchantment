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
  validateSearch: (s: Record<string, unknown>): {
    token_hash?: string;
    type?: string;
    next?: string;
    code?: string;
    error?: string;
    error_description?: string;
  } => ({
    token_hash: typeof s["token_hash"] === "string" ? s["token_hash"] : undefined,
    type: typeof s["type"] === "string" ? s["type"] : undefined,
    next: typeof s["next"] === "string" ? s["next"] : undefined,
    code: typeof s["code"] === "string" ? s["code"] : undefined,
    error: typeof s["error"] === "string" ? s["error"] : undefined,
    error_description: typeof s["error_description"] === "string" ? s["error_description"] : undefined,
  }),
  component: AuthConfirmPage,
});

function AuthConfirmPage() {
  const navigate = useNavigate();
  const { token_hash, type, next, code, error, error_description } = Route.useSearch();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function handleVerify() {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const hashParams = typeof window !== "undefined" ? new URLSearchParams(window.location.hash.replace(/^#/, "")) : null;

      // 1. Check for Supabase error passed in URL
      const passedError =
        error_description ||
        error ||
        searchParams?.get("error_description") ||
        hashParams?.get("error_description") ||
        searchParams?.get("error") ||
        hashParams?.get("error");

      if (passedError) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(passedError);
        }
        return;
      }

      // 2. PKCE code exchange flow (?code=...)
      const pkceCode = code || searchParams?.get("code");
      if (pkceCode) {
        try {
          const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(pkceCode);
          if (codeErr) {
            console.warn("[AuthConfirm] exchangeCodeForSession error:", codeErr);
          } else if (data?.session && isMounted) {
            setStatus("success");
            const target = next || "/portal/dashboard";
            setTimeout(() => {
              navigate({ to: target as any });
            }, 800);
            return;
          }
        } catch (e) {
          console.warn("[AuthConfirm] exchangeCode exception:", e);
        }
      }

      // 3. OTP verification flow (?token_hash=...&type=...)
      const effectiveTokenHash = token_hash || searchParams?.get("token_hash") || hashParams?.get("token_hash");
      const effectiveType = type || searchParams?.get("type") || hashParams?.get("type");
      if (effectiveTokenHash && effectiveType) {
        try {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: effectiveTokenHash,
            type: effectiveType as any,
          });

          if (otpErr) {
            console.warn("[AuthConfirm] verifyOtp notice:", otpErr);
          } else if (isMounted) {
            setStatus("success");
            const target = next || (effectiveType === "recovery" ? "/portal/reset-password" : "/portal/dashboard");
            setTimeout(() => {
              navigate({ to: target as any });
            }, 800);
            return;
          }
        } catch (e: any) {
          console.warn("[AuthConfirm] verifyOtp exception:", e);
        }
      }

      // 4. Session check (implicit grant or already active session)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setStatus("success");
          const target = next || "/portal/dashboard";
          setTimeout(() => {
            navigate({ to: target as any });
          }, 600);
          return;
        }
      } catch (e) {
        console.warn("[AuthConfirm] getSession notice:", e);
      }

      // 5. Fallback: Check if user is signed in after a slight debounce
      await new Promise(r => setTimeout(r, 600));
      const { data: { session: delayedSession } } = await supabase.auth.getSession();
      if (delayedSession?.user && isMounted) {
        setStatus("success");
        navigate({ to: (next || "/portal/dashboard") as any });
        return;
      }

      if (isMounted) {
        setStatus("error");
        setErrorMessage("Verification link may have expired or was already completed. Please try signing in or request a new link.");
      }
    }

    handleVerify();

    return () => {
      isMounted = false;
    };
  }, [token_hash, type, next, code, error, error_description, navigate]);

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


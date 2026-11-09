import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  isRedirect,
  isNotFound,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "../lib/theme";

function NotFoundComponent() {
  const isPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/portal");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {isPortal ? "Portal Page Not Found" : "Page not found"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPortal
            ? "The client workspace route you requested does not exist or your session was updated."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {isPortal ? (
            <>
              <a
                href="/portal/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-500 shadow-md cursor-pointer"
              >
                Go to Portal Dashboard
              </a>
              <a
                href="/portal/login"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                Sign In / Switch Account
              </a>
            </>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  if (isRedirect(error)) {
    throw error;
  }
  if (isNotFound(error)) {
    throw error;
  }

  console.error("[RootErrorComponent]", error);
  const router = useRouter();
  const isPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/portal");

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPortal
            ? "Your client workspace session encountered a temporary issue. You can reload or return directly to your dashboard."
            : "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-500 shadow-md cursor-pointer"
          >
            Try again
          </button>
          {isPortal ? (
            <>
              <a
                href="/portal/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                Go to Portal Dashboard
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (typeof window !== "undefined") {
                      for (const key of Object.keys(localStorage)) {
                        if (key.startsWith("sb-") || key.startsWith("el_")) {
                          localStorage.removeItem(key);
                        }
                      }
                      sessionStorage.clear();
                    }
                  } catch (_) {}
                  window.location.href = "/portal/login?switch=true";
                }}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
              >
                Switch Account
              </button>
            </>
          ) : (
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
            >
              Go home
            </a>
          )}
        </div>

        {Boolean(error) && (
          <details open className="mt-6 text-left text-xs bg-card p-4 rounded-xl border border-destructive/30 text-muted-foreground">
            <summary className="cursor-pointer font-bold font-mono text-foreground mb-1">Diagnostic Details</summary>
            <pre className="mt-2 text-[11px] font-mono text-destructive whitespace-pre-wrap word-break-all overflow-x-auto">
              {error instanceof Error ? error.stack || error.message : String(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "E and L Holdings | Innovate. Integrate. Elevate." },
      {
        name: "description",
        content:
          "Technology, infrastructure and investment solutions for sustainable business growth in South Africa.",
      },
      { name: "author", content: "E and L Holdings" },
      { property: "og:title", content: "E and L Holdings" },
      {
        property: "og:description",
        content: "Practical technology. Powerful infrastructure. Long-term value.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;650;700;750;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('el-theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Seamless Supabase auth hash token handler
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    if (hash && (hash.includes("access_token=") || hash.includes("type=recovery") || hash.includes("type=signup") || hash.includes("type=magiclink"))) {
      if (pathname === "/" || pathname === "") {
        window.location.replace(`/auth/confirm${hash}`);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

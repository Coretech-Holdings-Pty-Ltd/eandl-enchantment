/**
 * Portal Layout — dedicated nav + shell for Client Portal
 * Completely separate from the public SiteLayout
 * Optimized for high-end mobile and desktop executive experience
 */
import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, GraduationCap, Settings, LogOut,
  ChevronRight, Bell, Menu, X, Zap, BookOpen, Briefcase, Shield,
  ChevronDown, User, HelpCircle, ExternalLink, Home, MessageSquare,
  Sparkles, CheckCircle2, Clock, ArrowUpRight
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";
import portalLogo from "@/assets/logo.png";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  category: "core" | "deliverables" | "learning" | "system";
  portalKey?: "projects" | "learning";
}

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, client, access, logout, user, onboarding, isAdminUser, loading } = usePortalAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Derive First + Last name initials (Strictly generated, zero photo upload)
  const deriveInitials = (fullName?: string | null, clientName?: string | null, email?: string | null): string => {
    const candidate = (fullName || clientName || "").replace(/\(.*?\)/g, "").replace(/\b(pty|ltd|holdings|group|co|cc)\b/gi, "").trim();
    if (candidate) {
      const words = candidate.split(/[\s._-]+/).filter(Boolean);
      const first = words[0];
      const last = words[words.length - 1];
      if (words.length >= 2 && first && last && first[0] && last[0]) {
        return (first[0] + last[0]).toUpperCase();
      }
      if (first && first.length >= 2) {
        return first.slice(0, 2).toUpperCase();
      }
      if (first && first[0]) {
        return first[0].toUpperCase();
      }
    }
    if (email && email.includes("@")) {
      const local = (email.split("@")[0] || "").replace(/[0-9]/g, "");
      const words = local.split(/[\s._-]+/).filter(Boolean);
      const first = words[0];
      const last = words[words.length - 1];
      if (words.length >= 2 && first && last && first[0] && last[0]) {
        return (first[0] + last[0]).toUpperCase();
      }
      if (first && first.length >= 2) {
        return first.slice(0, 2).toUpperCase();
      }
      return "CL";
    }
    return "CL";
  };

  // Clean person name (e.g. "Sipho Tester" without "(CoreBiz)" cramming)
  const rawFullName = profile?.fullName || client?.name || user?.email?.split("@")[0] || "Client";
  const personName = rawFullName.replace(/\(.*?\)/g, "").trim() || "Client";

  // Company / brand name extracted from parentheses or business record
  const companyMatch = (client?.name || "").match(/\((.*?)\)/);
  const companyName = companyMatch ? companyMatch[1] : (client?.businessType || "");

  const displayName = personName;
  const initials = deriveInitials(profile?.fullName, client?.name, user?.email);

  const safeAccountStatus = access?.accountStatus || client?.accountStatus || "active";
  const accountBadgeColor = {
    active: "bg-emerald-500 shadow-emerald-500/50",
    trialing: "bg-amber-400 shadow-amber-400/50",
    paused: "bg-orange-500 shadow-orange-500/50",
    arrears: "bg-rose-500 shadow-rose-500/50",
    cancelled: "bg-slate-500",
    none: "bg-slate-400",
  }[safeAccountStatus] || "bg-emerald-500 shadow-emerald-500/50";

  // Prevent white screens: Render branded loading screen while hydrating
  if (loading) {
    return (
      <div className="portal-shell bg-[#080d19] min-h-screen text-slate-100 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-teal-400 animate-pulse" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Loading E&amp;L Portal...</h2>
        <p className="text-xs text-slate-400">Verifying client workspace session</p>
      </div>
    );
  }

  // Prevent white screens: If no active session or session ambiguity, show Session Switcher
  if (!user) {
    return (
      <div className="portal-shell bg-[#080d19] min-h-screen text-slate-100 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto mb-4 text-teal-400">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-white mb-2">Portal Session Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Please sign in to access your E&amp;L client workspace, or switch to the correct client account.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href="/portal/login"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-teal-500/20 text-center"
            >
              Sign in to E&amp;L Portal →
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/portal/login";
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Switch Account / Clear Stored Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derive Onboarding Stage/Level (1 to 4)
  const isMandateAuthorized = client?.mandateStatus === "authorized";
  const hasMandateDoc = Boolean(client?.mandateDocUrl);
  const isOnboardingComplete = Boolean(onboarding?.isCompleted);

  let currentLevel = 1;
  let levelTitle = "Level 1: AI Scope & Setup";
  let levelShort = "L1 Setup";
  let levelProgress = 25;
  let levelBadgeColor = "text-teal-400 bg-teal-500/10 border-teal-500/30";
  let needsMandateAction = false;

  if (isOnboardingComplete && isMandateAuthorized) {
    currentLevel = 4;
    levelTitle = "Level 4: Live & Launch Ready";
    levelShort = "L4 Active";
    levelProgress = 100;
    levelBadgeColor = "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  } else if (isMandateAuthorized) {
    currentLevel = 3;
    levelTitle = "Level 3: Design Brief & Assets";
    levelShort = "L3 Brief";
    levelProgress = 75;
    levelBadgeColor = "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
  } else if (hasMandateDoc) {
    currentLevel = 2;
    levelTitle = "Level 2: Sign Debit Mandate";
    levelShort = "L2 Sign Mandate";
    levelProgress = 50;
    levelBadgeColor = "text-amber-300 bg-amber-500/15 border-amber-500/40 animate-pulse";
    needsMandateAction = true;
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      to: "/portal/dashboard",
      icon: <LayoutDashboard size={18} className="text-teal-400" />,
      category: "core"
    },
    {
      label: "Onboarding Journey",
      to: "/portal/onboarding",
      icon: <Zap size={18} className={needsMandateAction ? "text-amber-400 animate-bounce" : "text-amber-400"} />,
      badge: needsMandateAction ? "Sign Mandate" : isOnboardingComplete ? undefined : "In Progress",
      badgeColor: needsMandateAction ? "bg-amber-500 text-slate-950 font-black animate-pulse" : "bg-teal-500/20 text-teal-300",
      category: "core",
    },
    ...(access.projects ? [
      {
        label: "My Project & Sprint",
        to: "/portal/project",
        icon: <FolderKanban size={18} className="text-cyan-400" />,
        portalKey: "projects" as const,
        category: "deliverables" as const,
      },
      {
        label: "Change Requests",
        to: "/portal/change-requests",
        icon: <Briefcase size={18} className="text-indigo-400" />,
        portalKey: "projects" as const,
        category: "deliverables" as const,
      },
    ] : []),
    ...(access.learning ? [
      {
        label: "Academy",
        to: "/portal/academy",
        icon: <GraduationCap size={18} className="text-amber-300" />,
        portalKey: "learning" as const,
        category: "learning" as const,
      },
      {
        label: "My Learning",
        to: "/portal/my-learning",
        icon: <BookOpen size={18} className="text-emerald-400" />,
        portalKey: "learning" as const,
        category: "learning" as const,
      },
    ] : []),
    {
      label: "Support Desk",
      to: "/portal/support",
      icon: <HelpCircle size={18} className="text-sky-400" />,
      category: "system"
    },
    {
      label: "Settings",
      to: "/portal/settings",
      icon: <Settings size={18} className="text-slate-400" />,
      category: "system"
    },
  ];

  return (
    <div className="portal-shell bg-[#080d19] min-h-screen text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* ── Mobile & Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className={`portal-sidebar ${sidebarOpen ? "portal-sidebar--open" : ""} fixed top-0 bottom-0 left-0 z-50 w-[290px] sm:w-[310px] bg-gradient-to-b from-[#0c1322] via-[#090e1a] to-[#050811] border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl`}
      >
        <div className="portal-sidebar-inner flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <Link to="/portal/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-md">
                <img
                  src={portalLogo}
                  alt="E&L Digital"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>E&amp;L Portal</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-teal-400/80">
                  Client Hub &bull; RSA
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 md:hidden transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Client Identity & Account Status Card (Strictly Monogram, No Photo Upload) */}
          <div className="px-3 py-2.5 mx-3 my-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              {/* Monogram Avatar — Generated First + Last Name Initials */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 p-[2px] shadow-lg shadow-teal-900/40">
                  <div className="w-full h-full bg-[#0c1322] rounded-[14px] flex items-center justify-center">
                    <span className="text-sm font-black tracking-tight bg-gradient-to-br from-teal-300 to-cyan-400 bg-clip-text text-transparent select-none">
                      {initials}
                    </span>
                  </div>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-[#0a0f1d] ${accountBadgeColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-white truncate leading-tight">
                  {personName}
                </div>
                {companyName && (
                  <div className="text-[10px] font-bold text-teal-300 truncate">
                    {companyName}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                    {safeAccountStatus}
                  </span>
                  {client?.mandateStatus === "authorized" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 size={9} /> Mandate ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Micro Onboarding Level Tracker inside Sidebar */}
            <div className="mt-3.5 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-extrabold mb-1.5">
                <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> Onboarding Track
                </span>
                <span className="text-teal-300 font-mono">{levelProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-slate-300 mt-1.5 truncate">
                {levelTitle}
              </div>

              {/* Attention Prompt if Mandate Pending */}
              {needsMandateAction && (
                <Link
                  to="/portal/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="mt-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-extrabold text-amber-300 transition-all group/btn"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="animate-spin text-amber-400" />
                    Sign DebiCheck Mandate
                  </span>
                  <ArrowUpRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Links Grouped */}
          <nav className="flex-1 px-3 py-2 space-y-4">
            {/* Core Section */}
            <div>
              <div className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                Workspace
              </div>
              <div className="space-y-1">
                {navItems.filter(i => i.category === "core").map(item => {
                  const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        active
                          ? "bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-200 border-l-2 border-teal-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${active ? "bg-teal-500/20 text-teal-300" : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200"}`}>
                          {item.icon}
                        </div>
                        <span className="font-bold">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide ${item.badgeColor || "bg-teal-500/20 text-teal-300"}`}>
                          {item.badge}
                        </span>
                      ) : active ? (
                        <ChevronRight size={14} className="text-teal-400" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Deliverables Section */}
            {access.projects && (
              <div>
                <div className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <FolderKanban size={10} className="text-cyan-400" /> Deliverables
                </div>
                <div className="space-y-1">
                  {navItems.filter(i => i.category === "deliverables").map(item => {
                    const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          active
                            ? "bg-cyan-500/15 text-cyan-200 border-l-2 border-cyan-400 shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${active ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200"}`}>
                            {item.icon}
                          </div>
                          <span className="font-bold">{item.label}</span>
                        </div>
                        {active && <ChevronRight size={14} className="text-cyan-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learning Section */}
            {access.learning && (
              <div>
                <div className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <GraduationCap size={10} className="text-amber-400" /> Academy &amp; Courses
                </div>
                <div className="space-y-1">
                  {navItems.filter(i => i.category === "learning").map(item => {
                    const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          active
                            ? "bg-amber-500/15 text-amber-200 border-l-2 border-amber-400 shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${active ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200"}`}>
                            {item.icon}
                          </div>
                          <span className="font-bold">{item.label}</span>
                        </div>
                        {active && <ChevronRight size={14} className="text-amber-400" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* System & Support */}
            <div>
              <div className="px-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                Support &amp; Account
              </div>
              <div className="space-y-1">
                {navItems.filter(i => i.category === "system").map(item => {
                  const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        active
                          ? "bg-white/10 text-white border-l-2 border-slate-300 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${active ? "bg-white/10 text-white" : "bg-white/[0.03] text-slate-400 group-hover:text-slate-200"}`}>
                          {item.icon}
                        </div>
                        <span className="font-bold">{item.label}</span>
                      </div>
                      {active && <ChevronRight size={14} className="text-slate-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* WhatsApp Dedicated Concierge Pill in Sidebar */}
          <div className="p-3 mx-3 my-2 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-slate-900 border border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold text-white">Concierge Desk</div>
                <div className="text-[10px] text-emerald-300/80">Direct WhatsApp Help</div>
              </div>
            </div>
            <a
              href="https://wa.me/27732890453?text=Hi%20E%26L%20Digital,%20I%20need%20assistance%20with%20my%20client%20account"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow-sm transition-all"
            >
              <span>Chat with Team</span>
              <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Bottom Links */}
          <div className="p-3 border-t border-white/10 space-y-1 bg-black/20">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Home size={15} />
                <span>E&amp;L Public Website</span>
              </span>
              <ExternalLink size={13} className="text-slate-500" />
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
            >
              <LogOut size={15} />
              <span>Sign out of Portal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="portal-main flex-1 md:ml-[290px] min-h-screen flex flex-col">
        {/* Floating Topbar */}
        <header className="sticky top-0 z-40 bg-[#080d19]/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-lg shadow-black/20">
          {/* Left: Mobile Drawer Trigger & Title */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Open portal navigation"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link to="/portal/dashboard" className="flex items-center gap-2 group md:hidden">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  <img
                    src={portalLogo}
                    alt="E&L"
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </Link>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-black text-white truncate">
                    {navItems.find(n => currentPath.startsWith(n.to))?.label || "Portal"}
                  </h1>
                  {/* Onboarding Level Badge on Mobile Header */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${levelBadgeColor}`}>
                    {levelShort}
                  </span>
                </div>
                <div className="hidden sm:block text-[10px] text-slate-400 font-medium truncate">
                  {personName} • {levelTitle}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Concierge, Notification, and Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Direct Concierge WhatsApp — icon only on mobile */}
            <a
              href="https://wa.me/27732890453?text=Hi%20E%26L%20Digital,%20I%20need%20assistance%20with%20my%20client%20account"
              target="_blank"
              rel="noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              title="Chat with Account Manager on WhatsApp"
            >
              <MessageSquare size={15} />
              <span className="hidden sm:inline text-[11px]">WhatsApp</span>
            </a>

            {/* Notification Bell */}
            <Link
              to="/portal/dashboard"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all relative shrink-0"
              title="Notifications"
            >
              <Bell size={16} />
              {needsMandateAction && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </Link>

            {/* User Avatar — clean monogram button, icon only on small screens */}
            <div className="relative shrink-0">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Account menu"
                title={personName}
              >
                {/* Monogram circle */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 p-[1.5px] shadow-md shadow-teal-900/30 shrink-0">
                  <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                    <span className="text-[11px] font-black bg-gradient-to-br from-teal-300 to-cyan-400 bg-clip-text text-transparent select-none leading-none">
                      {initials}
                    </span>
                  </div>
                </div>
                <span className="hidden md:inline-block text-xs font-bold text-slate-200">
                  {personName}
                </span>
                <ChevronDown size={13} className={`hidden md:inline-block text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* User Dropdown Sheet */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 rounded-2xl bg-[#0f172a] border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-1.5 flex items-center gap-2.5">
                    {/* Monogram in dropdown header */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 p-[1.5px] shadow-md shrink-0">
                      <div className="w-full h-full bg-[#0c1322] rounded-[9px] flex items-center justify-center">
                        <span className="text-xs font-black bg-gradient-to-br from-teal-300 to-cyan-400 bg-clip-text text-transparent select-none">
                          {initials}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                      <div className="mt-1 flex items-center gap-1 text-[9px]">
                        <span className="text-slate-500">Status</span>
                        <span className="font-extrabold text-teal-300 uppercase">{safeAccountStatus}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/portal/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User size={14} className="text-teal-400" />
                    <span>Profile &amp; Settings</span>
                  </Link>
                  <Link
                    to="/portal/support"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <HelpCircle size={14} className="text-sky-400" />
                    <span>Support Tickets</span>
                  </Link>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content — extra bottom padding on mobile so bottom dock never covers content */}
        <main className="portal-content flex-1 max-w-7xl w-full mx-auto" style={{ paddingBottom: undefined }}>
          {children}
        </main>

        {/* ── Floating Mobile Bottom Navigation Dock ─────────────────── */}
        <nav
          className="md:hidden fixed bottom-2 left-2 right-2 z-40 bg-[#0a0f1d]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 flex items-center justify-around shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
          aria-label="Mobile Navigation Dock"
        >
          <Link
            to="/portal/dashboard"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
              currentPath === "/portal/dashboard"
                ? "text-teal-300 bg-teal-500/15 font-bold shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Home</span>
          </Link>

          <Link
            to="/portal/onboarding"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl relative transition-all ${
              currentPath === "/portal/onboarding"
                ? "text-amber-300 bg-amber-500/15 font-bold shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap size={18} className={needsMandateAction ? "animate-bounce text-amber-400" : ""} />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Onboard</span>
            {needsMandateAction && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </Link>

          {access.projects ? (
            <Link
              to="/portal/project"
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
                currentPath.startsWith("/portal/project")
                  ? "text-cyan-300 bg-cyan-500/15 font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FolderKanban size={18} />
              <span className="text-[9px] font-bold mt-1 tracking-tight">Project</span>
            </Link>
          ) : access.learning ? (
            <Link
              to="/portal/academy"
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
                currentPath.startsWith("/portal/academy")
                  ? "text-amber-300 bg-amber-500/15 font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap size={18} />
              <span className="text-[9px] font-bold mt-1 tracking-tight">Academy</span>
            </Link>
          ) : (
            <Link
              to="/portal/support"
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
                currentPath === "/portal/support"
                  ? "text-sky-300 bg-sky-500/15 font-bold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle size={18} />
              <span className="text-[9px] font-bold mt-1 tracking-tight">Support</span>
            </Link>
          )}

          <Link
            to="/portal/settings"
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all ${
              currentPath === "/portal/settings"
                ? "text-white bg-white/15 font-bold shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings size={18} />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Settings</span>
          </Link>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
            aria-label="Open Full Menu Drawer"
          >
            <Menu size={18} />
            <span className="text-[9px] font-bold mt-1 tracking-tight">Menu</span>
          </button>
        </nav>
      </div>

      {/* Dimmed Overlay for Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Portal Layout — dedicated nav + shell for Client Portal
 * Completely separate from the public SiteLayout
 */
import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, GraduationCap, Settings, LogOut,
  ChevronRight, Bell, Menu, X, Zap, BookOpen, Briefcase, Shield,
  ChevronDown, User, HelpCircle, ExternalLink, Home
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
  portalKey?: "projects" | "learning";
}

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, client, access, logout, user } = usePortalAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems: NavItem[] = [
    { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard size={18} /> },
    ...(access.projects ? [
      { label: "My Project", to: "/portal/project", icon: <FolderKanban size={18} />, portalKey: "projects" as const },
      { label: "Onboarding", to: "/portal/onboarding", icon: <Zap size={18} />, portalKey: "projects" as const },
      { label: "Change Requests", to: "/portal/change-requests", icon: <Briefcase size={18} />, portalKey: "projects" as const },
    ] : []),
    ...(access.learning ? [
      { label: "Academy", to: "/portal/academy", icon: <GraduationCap size={18} />, portalKey: "learning" as const },
      { label: "My Learning", to: "/portal/my-learning", icon: <BookOpen size={18} />, portalKey: "learning" as const },
    ] : []),
    { label: "Support", to: "/portal/support", icon: <HelpCircle size={18} /> },
    { label: "Settings", to: "/portal/settings", icon: <Settings size={18} /> },
  ];

  const initials = (profile?.fullName || user?.email || "?")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const displayName = profile?.fullName || user?.email?.split("@")[0] || "Client";
  const accountBadgeColor = {
    active: "bg-emerald-500",
    trialing: "bg-amber-400",
    paused: "bg-orange-500",
    arrears: "bg-red-500",
    cancelled: "bg-slate-500",
    none: "bg-slate-400",
  }[access.accountStatus] || "bg-slate-400";

  return (
    <div className="portal-shell">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`portal-sidebar ${sidebarOpen ? "portal-sidebar--open" : ""}`}>
        <div className="portal-sidebar-inner">
          {/* Brand */}
          <div className="portal-brand">
            <div className="portal-brand-logo">
              <Zap size={20} className="text-amber-400" />
            </div>
            <div>
              <div className="portal-brand-name">E&amp;L Portal</div>
              <div className="portal-brand-sub">Client Hub</div>
            </div>
            <button className="portal-sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Client Status Badge */}
          {client && (
            <div className="portal-client-badge">
              <span className={`portal-status-dot ${accountBadgeColor}`} />
              <div className="portal-client-info">
                <span className="portal-client-name">{client.name}</span>
                <span className="portal-client-status">{access.accountStatus.replace("_", " ")}</span>
              </div>
            </div>
          )}

          {/* Portal Access Chips */}
          <div className="portal-access-chips">
            {access.projects && (
              <span className="portal-chip portal-chip--projects">
                <FolderKanban size={11} /> Projects
              </span>
            )}
            {access.learning && (
              <span className="portal-chip portal-chip--learning">
                <GraduationCap size={11} /> Academy
              </span>
            )}
            {!access.projects && !access.learning && (
              <span className="portal-chip portal-chip--none">
                <Shield size={11} /> No active plan
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="portal-nav">
            {navItems.map(item => {
              const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`portal-nav-item ${active ? "portal-nav-item--active" : ""} ${
                    item.portalKey === "projects" ? "portal-nav-item--project" :
                    item.portalKey === "learning" ? "portal-nav-item--learning" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && <span className="portal-nav-badge">{item.badge}</span>}
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom links */}
          <div className="portal-sidebar-bottom">
            <a href="/" target="_blank" rel="noreferrer" className="portal-nav-item portal-nav-item--muted">
              <Home size={16} />
              <span>E&amp;L Website</span>
              <ExternalLink size={12} className="ml-auto opacity-40" />
            </a>
            <button className="portal-nav-item portal-nav-item--danger" onClick={logout}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="portal-main">
        {/* Topbar */}
        <header className="portal-topbar">
          <button className="portal-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="portal-topbar-breadcrumb">
            {navItems.find(n => currentPath.startsWith(n.to))?.label || "Portal"}
          </div>
          <div className="portal-topbar-right">
            <button className="portal-icon-btn">
              <Bell size={18} />
            </button>
            <div className="portal-user-menu-wrap">
              <button
                className="portal-avatar-btn"
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <span className="portal-avatar">{initials}</span>
                <span className="portal-avatar-name">{displayName}</span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <div className="portal-user-dropdown">
                  <div className="portal-user-dropdown-header">
                    <div className="portal-avatar portal-avatar--lg">{initials}</div>
                    <div>
                      <div className="font-semibold text-sm">{displayName}</div>
                      <div className="text-xs text-slate-400">{user?.email}</div>
                    </div>
                  </div>
                  <div className="portal-user-dropdown-divider" />
                  <Link to="/portal/settings" className="portal-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <User size={14} /> Profile &amp; Settings
                  </Link>
                  <button className="portal-dropdown-item portal-dropdown-item--danger" onClick={logout}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="portal-content">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="portal-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

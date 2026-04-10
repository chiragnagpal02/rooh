"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import { Recording } from "@/types";
import { Parent } from "./page";
import MemoriesView from "./views/memories";
import ImportantInfoView from "./views/important-info";
import PromptsView from "./views/prompts";
import FamilyView from "./views/family";
import HealthView from "./views/health";
import SettingsView from "./views/settings";

type View = "memories" | "info" | "prompts" | "family" | "health" | "settings";

interface Props {
  recordings: Recording[];
  parents: Parent[];
  familyId: string;
  userEmail: string;
  lastActive: string | null;
  loading: boolean;
  adultName: string;
  onMarkSeen: (id: string) => void;
  onParentAdded: (parent: Parent) => void;
}

function formatLastActive(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 60) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

const NAV_ITEMS: {
  key: View;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "memories",
    label: "Memories",
    description: "All voice notes your parent has recorded — transcribed, summarised, and searchable.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "info",
    label: "Info",
    description: "Key practical details extracted from recordings — insurance, bank info, property, and contacts.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "health",
    label: "Health",
    description: "Doctors, medicines, symptoms, and appointments — automatically tracked from voice notes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M8 2a4 4 0 00-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "prompts",
    label: "Prompts",
    description: "Send your parent a gentle question on WhatsApp to inspire their next memory.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "family",
    label: "Family",
    description: "Manage connected parents and invite family members to share the archive.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    description: "Manage your notification preferences, WhatsApp number, and account details.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const VIEW_TITLES: Record<View, string> = {
  memories: "Memories",
  info: "Important info",
  health: "Health log",
  prompts: "Prompts",
  family: "Family",
  settings: "Settings",
};

function InfoTooltip({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    }
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        onClick={e => e.stopPropagation()}
        style={{
          width: "16px", height: "16px", borderRadius: "50%",
          border: "1px solid #3C3936", background: "transparent",
          color: "#5F5E5A", fontSize: "10px", fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, padding: 0,
        }}
      >
        i
      </button>
      {open && (
        <div style={{
          position: "fixed", top: pos.top, left: pos.left,
          transform: "translateY(-50%)", background: "#2C2926",
          border: "0.5px solid #3C3936", borderRadius: "10px",
          padding: "10px 14px", width: "200px", zIndex: 9999, pointerEvents: "none",
        }}>
          <p style={{ fontSize: "12px", color: "#E8E0D5", margin: 0, lineHeight: 1.6 }}>{description}</p>
          <div style={{
            position: "absolute", left: "-4px", top: "50%",
            transform: "translateY(-50%) rotate(45deg)",
            width: "8px", height: "8px", background: "#2C2926",
            borderLeft: "0.5px solid #3C3936", borderBottom: "0.5px solid #3C3936",
          }} />
        </div>
      )}
    </>
  );
}

export default function LayoutShell({
  recordings, parents, familyId, userEmail, lastActive,
  loading, adultName, onMarkSeen, onParentAdded,
}: Props) {
  const [view, setView] = useState<View>("memories");
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const newCount = recordings.filter((r) => (r as any).is_new).length;

  const archiveTitle =
    parents.length === 0 ? "Your archive"
      : parents.length === 1 ? `${parents[0].name}'s archive`
      : parents.length === 2 ? `${parents[0].name} & ${parents[1].name}'s archive`
      : "Family archive";

  const mostRecentParent = parents.reduce(
    (latest, p) => {
      if (!p.last_active) return latest;
      if (!latest?.last_active) return p;
      return p.last_active > latest.last_active ? p : latest;
    },
    null as Parent | null,
  );

  const currentNavItem = NAV_ITEMS.find(i => i.key === view)!;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebarWidth = collapsed ? "60px" : "200px";

  return (
    <>
      <style>{`
        .desktop-sidebar { display: flex; }
        .mobile-bottomnav { display: none; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottomnav { display: block !important; }
          .main-content-pad { padding: 20px 16px 90px 16px !important; }
          .mobile-page-desc { display: block !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#FDF8F3" }}>

        {/* ── Desktop Sidebar ── */}
        <div
          className="desktop-sidebar"
          style={{
            width: sidebarWidth, background: "#1C1917", flexDirection: "column",
            flexShrink: 0, position: "sticky", top: 0, height: "100vh",
            transition: "width 0.2s ease", overflow: "hidden", zIndex: 30,
          }}
        >
          <div style={{ padding: collapsed ? "20px 0" : "20px 16px", borderBottom: "0.5px solid #2C2926", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#1D9E75", fontSize: "18px" }}>∿</span>
                <span style={{ fontSize: "22px", color: "#FDF8F3", fontFamily: "Georgia, serif" }}>Rooh</span>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5F5E5A", padding: "4px", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {collapsed
                  ? <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  : <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {NAV_ITEMS.map((item) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={() => setView(item.key)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: "10px",
                    padding: collapsed ? "9px 0" : "9px 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "8px", cursor: "pointer",
                    background: view === item.key ? "#1D9E75" : "none",
                    border: "none", color: view === item.key ? "#FDF8F3" : "#78716C",
                    fontSize: "13px", transition: "all 0.15s", position: "relative",
                  }}
                >
                  {item.icon}
                  {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                  {item.key === "memories" && newCount > 0 && (
                    <span style={{
                      background: view === item.key ? "rgba(255,255,255,0.25)" : "#1D9E75",
                      color: "white", fontSize: "10px", padding: "1px 6px",
                      borderRadius: "20px", minWidth: "18px", textAlign: "center",
                    }}>
                      {newCount}
                    </span>
                  )}
                </button>
                {!collapsed && <InfoTooltip description={item.description} />}
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 8px", borderTop: "0.5px solid #2C2926" }}>
            <button
              onClick={handleSignOut}
              title={collapsed ? "Sign out" : undefined}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: collapsed ? "9px 0" : "9px 10px", justifyContent: collapsed ? "center" : "flex-start", borderRadius: "8px", cursor: "pointer", background: "none", border: "none", color: "#5F5E5A", fontSize: "13px", width: "100%" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Topbar */}
          <div style={{ background: "#FDF8F3", borderBottom: "0.5px solid #E8E0D5", padding: "14px 24px", display: "flex", flexDirection: "column", gap: "8px", position: "sticky", top: 0, zIndex: 10 }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#1D9E75", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>
                {VIEW_TITLES[view]}
              </p>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#1C1917", margin: 0 }}>
                {archiveTitle}
              </h1>
            </div>

            {mostRecentParent && lastActive && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1D9E75" }} />
                <span style={{ fontSize: "12px", color: "#A8A29E" }}>
                  {mostRecentParent.name.split(" ")[0]} last recorded {formatLastActive(lastActive)}
                </span>
              </div>
            )}

            {/* Mobile page description */}
            <p
              className="mobile-page-desc"
              style={{ fontSize: "12px", color: "#A8A29E", margin: 0, lineHeight: 1.5, display: "none" }}
            >
              {currentNavItem.description}
            </p>
          </div>

          {/* Page content */}
          <div
            className="main-content-pad"
            style={{ flex: 1, padding: "32px 24px", maxWidth: "720px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}
          >
            {view === "memories" && <MemoriesView recordings={recordings} parents={parents} userEmail={userEmail} adultName={adultName} loading={loading} onMarkSeen={onMarkSeen} />}
            {view === "info" && <ImportantInfoView recordings={recordings} />}
            {view === "health" && <HealthView recordings={recordings} parents={parents} />}
            {view === "prompts" && <PromptsView userEmail={userEmail} />}
            {view === "family" && <FamilyView familyId={familyId} parents={parents} userEmail={userEmail} onParentAdded={onParentAdded} />}
            {view === "settings" && <SettingsView userEmail={userEmail} />}
          </div>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <div
          className="mobile-bottomnav"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 40, display: "none", height: "70px",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Curved SVG background */}
          <svg
            viewBox="0 0 390 70"
            preserveAspectRatio="none"
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", zIndex: 0,
            }}
          >
            <path d="M0,20 Q195,-20 390,20 L390,70 L0,70 Z" fill="#1C1917" />
          </svg>

          {/* Nav items */}
          <div style={{
            display: "flex", alignItems: "stretch",
            position: "relative", zIndex: 1, height: "100%",
            paddingTop: "8px",
          }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "3px", padding: "10px 4px 8px",
                  background: "none", border: "none", cursor: "pointer",
                  color: view === item.key ? "#1D9E75" : "#5F5E5A",
                  position: "relative",
                }}
              >
                {item.icon}
                <span style={{ fontSize: "10px", fontWeight: view === item.key ? 500 : 400 }}>
                  {item.label}
                </span>
                {item.key === "memories" && newCount > 0 && (
                  <div style={{
                    position: "absolute", top: "6px", right: "20%",
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#1D9E75",
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
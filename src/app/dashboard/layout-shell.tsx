"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import { Recording } from "@/types";
import MemoriesView from "./views/memories";
import ImportantInfoView from "./views/important-info";
import PromptsView from "./views/prompts";
import FamilyView from "./views/family";
import SettingsView from "./views/settings";

type View = "memories" | "info" | "prompts" | "family" | "settings";

interface Props {
  recordings: Recording[];
  parentName: string;
  parentWhatsapp: string;
  userEmail: string;
  lastActive: string | null;
  loading: boolean;
  onMarkSeen: (id: string) => void;
}

function formatLastActive(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

const NAV_ITEMS: { key: View; label: string; icon: React.ReactNode }[] = [
  {
    key: "memories",
    label: "Memories",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 4h12M2 8h8M2 12h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "info",
    label: "Important info",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 8h6M5 11h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "prompts",
    label: "Prompts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 2h12v9H9l-3 3V11H2V2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "family",
    label: "Family",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const VIEW_TITLES: Record<View, string> = {
  memories: "Memories",
  info: "Important info",
  prompts: "Prompts",
  family: "Family",
  settings: "Settings",
};

export default function LayoutShell({
  recordings,
  parentName,
  parentWhatsapp,
  userEmail,
  lastActive,
  loading,
  onMarkSeen,
}: Props) {
  const [view, setView] = useState<View>("memories");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const newCount = recordings.filter((r) => (r as any).is_new).length;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebarWidth = collapsed ? "60px" : "200px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FDF8F3" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 40,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: sidebarWidth,
          background: "#1C1917",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          transition: "width 0.2s ease",
          overflow: "hidden",
          zIndex: 30,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "20px 0" : "20px 16px",
            borderBottom: "0.5px solid #2C2926",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#1D9E75", fontSize: "18px" }}>∿</span>
              <span
                style={{
                  fontSize: "22px",
                  color: "#FDF8F3",
                  fontFamily: "Georgia, serif",
                }}
              >
                Rooh
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#5F5E5A",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {collapsed ? (
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M10 4l-4 4 4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div
          style={{
            flex: 1,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: collapsed ? "9px 0" : "9px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: "8px",
                cursor: "pointer",
                background: view === item.key ? "#1D9E75" : "none",
                border: "none",
                color: view === item.key ? "#FDF8F3" : "#78716C",
                fontSize: "13px",
                width: "100%",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {item.key === "memories" && newCount > 0 && (
                <span
                  style={{
                    marginLeft: collapsed ? 0 : "auto",
                    position: collapsed ? "absolute" : "static",
                    top: collapsed ? "6px" : "auto",
                    right: collapsed ? "6px" : "auto",
                    background:
                      view === item.key ? "rgba(255,255,255,0.25)" : "#1D9E75",
                    color: "white",
                    fontSize: "10px",
                    padding: "1px 6px",
                    borderRadius: "20px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: "12px 8px", borderTop: "0.5px solid #2C2926" }}>
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign out" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: collapsed ? "9px 0" : "9px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: "8px",
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "#5F5E5A",
              fontSize: "13px",
              width: "100%",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: "#FDF8F3",
            borderBottom: "0.5px solid #E8E0D5",
            padding: "14px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
          className="topbar"
        >
          {/* Title block - now with better spacing */}
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#1D9E75",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}
            >
              {VIEW_TITLES[view]}
            </p>

            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "20px",
                fontWeight: 400,
                color: "#1C1917",
                margin: 0,
              }}
            >
              {parentName}'s archive
            </h1>
          </div>

          {/* Status row - now on its own line for mobile breathing room */}
          {lastActive && (
            <div
              className="status-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#1D9E75",
                }}
              />
              <span style={{ fontSize: "12px", color: "#A8A29E" }}>
                {parentName.split(" ")[0]} last recorded{" "}
                {formatLastActive(lastActive)}
              </span>
            </div>
          )}
        </div>

        {/* Page content */}
        <div
          style={{
            flex: 1,
            padding: "32px 24px",
            maxWidth: "720px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {view === "memories" && (
            <MemoriesView
              recordings={recordings}
              parentName={parentName}
              loading={loading}
              onMarkSeen={onMarkSeen}
            />
          )}
          {view === "info" && <ImportantInfoView recordings={recordings} />}
          {view === "prompts" && <PromptsView userEmail={userEmail} />}
          {view === "family" && (
            <FamilyView
              parentName={parentName}
              parentWhatsapp={parentWhatsapp}
            />
          )}
          {view === "settings" && <SettingsView userEmail={userEmail} />}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { Recording, RecordingType } from "@/types";
import { useRouter } from "next/navigation";

const TYPE_CONFIG: Record<
  RecordingType,
  { label: string; color: string; bg: string }
> = {
  story: { label: "Life story", color: "#3C3489", bg: "#EEEDFE" },
  practical: { label: "Practical", color: "#085041", bg: "#E1F5EE" },
  legacy: { label: "Legacy", color: "#633806", bg: "#FAEEDA" },
  mixed: { label: "Mixed", color: "#712B13", bg: "#FAECE7" },
  untagged: { label: "Untagged", color: "#444441", bg: "#F1EFE8" },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function aggregateEntities(recordings: Recording[]) {
  const entities = {
    medical: [] as any[],
    medicines: [] as any[],
    insurance: [] as any[],
    bank: [] as any[],
    contacts: [] as any[],
    property: [] as any[],
  };

  recordings.forEach((recording) => {
    const e = recording.extracted_entities;
    if (!e) return;
    if (e.medical) entities.medical.push(...e.medical);
    if (e.medicines) entities.medicines.push(...e.medicines);
    if (e.insurance) entities.insurance.push(...e.insurance);
    if (e.bank) entities.bank.push(...e.bank);
    if (e.contacts) entities.contacts.push(...e.contacts);
    if (e.property) entities.property.push(...e.property);
  });

  Object.keys(entities).forEach((key) => {
    const k = key as keyof typeof entities;
    entities[k] = entities[k].filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => JSON.stringify(t) === JSON.stringify(item)),
    );
  });

  return entities;
}

export default function Dashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filter, setFilter] = useState<RecordingType | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("Your parent");
  const [showPractical, setShowPractical] = useState(true);
  const [checking, setChecking] = useState(true) // add this with other states
  const [search, setSearch] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    fetchData();
  }, []);

async function fetchData() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }

  const { data: family } = await supabase
    .from('families')
    .select('parent_name')
    .eq('adult_child_email', user.email)
    .single()

  if (!family) {
    router.push('/onboarding')
    return
  }

  setParentName(family.parent_name)
  setChecking(false) // only show dashboard after we confirm family exists

  const res = await fetch('/api/recordings')
  const data = await res.json()
  if (data.recordings) setRecordings(data.recordings)
  setLoading(false)
}

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filtered = recordings
    .filter((r) => filter === "all" || r.primary_type === filter)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.english_summary?.toLowerCase().includes(q) ||
        r.transcript_original?.toLowerCase().includes(q) ||
        Object.values(r.extracted_entities || {}).some(
          (arr) =>
            Array.isArray(arr) &&
            arr.some((item) =>
              Object.values(item).some(
                (v) => typeof v === "string" && v.toLowerCase().includes(q),
              ),
            ),
        )
      );
    });

  const counts = {
    all: recordings.length,
    story: recordings.filter(
      (r) => r.primary_type === "story" || r.primary_type === "mixed",
    ).length,
    practical: recordings.filter(
      (r) => r.primary_type === "practical" || r.primary_type === "mixed",
    ).length,
    legacy: recordings.filter((r) => r.primary_type === "legacy").length,
  };

  const entities = aggregateEntities(recordings);
  const hasPracticalData = Object.values(entities).some(
    (arr) => arr.length > 0,
  );

  if (checking) {
  return (
    <main style={{ 
      background: '#FDF8F3', 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{ fontSize: '14px', color: '#A8A29E' }}>Loading...</p>
    </main>
  )
}

  return (
    <main style={{ background: "#FDF8F3", minHeight: "100vh" }}>
      {/* Nav */}
      <nav
        style={{
          background: "#FDF8F3",
          borderBottom: "0.5px solid #E8E0D5",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          <svg
            width="80"
            height="26"
            viewBox="0 0 120 38"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 19 Q8 10 11 19 Q14 28 17 19"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x="24"
              y="27"
              fontFamily="Georgia, serif"
              fontSize="26"
              fontWeight="400"
              fill="#1C1917"
              letterSpacing="1"
            >
              Rooh
            </text>
          </svg>
        </a>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: "13px",
            color: "#78716C",
            background: "none",
            border: "0.5px solid #E8E0D5",
            borderRadius: "8px",
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </nav>

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "48px 32px 80px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#1D9E75",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Family archive
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#1C1917",
              margin: "0 0 4px",
            }}
          >
            {parentName}'s memories
          </h1>
          <p style={{ fontSize: "14px", color: "#A8A29E", margin: 0 }}>
            {recordings.length === 0
              ? "No recordings yet"
              : `${recordings.length} ${recordings.length === 1 ? "memory" : "memories"} preserved`}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {[
            { label: "Total", value: counts.all, color: "#1C1917" },
            { label: "Stories", value: counts.story, color: "#3C3489" },
            { label: "Practical", value: counts.practical, color: "#085041" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "white",
                border: "0.5px solid #E8E0D5",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: stat.color,
                  margin: "0 0 4px",
                }}
              >
                {stat.value}
              </p>
              <p style={{ fontSize: "12px", color: "#A8A29E", margin: 0 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Practical info panel */}
        {hasPracticalData && (
          <div
            style={{
              background: "white",
              border: "0.5px solid #E8E0D5",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={() => setShowPractical(!showPractical)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: showPractical ? "0.5px solid #F5F0EA" : "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "#E1F5EE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  📋
                </div>
                <div style={{ textAlign: "left" }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1C1917",
                      margin: 0,
                    }}
                  >
                    Important information
                  </p>
                  <p style={{ fontSize: "12px", color: "#A8A29E", margin: 0 }}>
                    Extracted from all recordings
                  </p>
                </div>
              </div>
              <span
                style={{
                  color: "#D6CEC4",
                  fontSize: "16px",
                  transform: showPractical ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                ↓
              </span>
            </button>

            {showPractical && (
              <div style={{ padding: "16px 20px" }}>
                {[
                  {
                    key: "medical" as const,
                    label: "Doctors",
                    color: "#3C3489",
                    bg: "#EEEDFE",
                    render: (v: any) =>
                      [v.name, v.role, v.contact].filter(Boolean).join(" · "),
                  },
                  {
                    key: "medicines" as const,
                    label: "Medicines",
                    color: "#085041",
                    bg: "#E1F5EE",
                    render: (v: any) =>
                      [v.name, v.frequency].filter(Boolean).join(" · "),
                  },
                  {
                    key: "insurance" as const,
                    label: "Insurance",
                    color: "#633806",
                    bg: "#FAEEDA",
                    render: (v: any) =>
                      [v.provider, v.number, v.type]
                        .filter(Boolean)
                        .join(" · "),
                  },
                  {
                    key: "bank" as const,
                    label: "Bank accounts",
                    color: "#712B13",
                    bg: "#FAECE7",
                    render: (v: any) =>
                      [v.name, v.branch, v.details].filter(Boolean).join(" · "),
                  },
                  {
                    key: "contacts" as const,
                    label: "Contacts",
                    color: "#0C447C",
                    bg: "#E6F1FB",
                    render: (v: any) =>
                      [v.name, v.relation, v.number]
                        .filter(Boolean)
                        .join(" · "),
                  },
                  {
                    key: "property" as const,
                    label: "Property & documents",
                    color: "#444441",
                    bg: "#F1EFE8",
                    render: (v: any) =>
                      [v.description, v.location].filter(Boolean).join(" · "),
                  },
                ].map(({ key, label, color, bg, render }) => {
                  const items = entities[key];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={key} style={{ marginBottom: "14px" }}>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#A8A29E",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          margin: "0 0 8px",
                        }}
                      >
                        {label}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {items.map((item: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              background: bg,
                              borderRadius: "8px",
                              padding: "8px 12px",
                              fontSize: "13px",
                              color: color,
                              lineHeight: 1.4,
                            }}
                          >
                            {render(item)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <svg
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.4,
            }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="6.5"
              cy="6.5"
              r="5"
              stroke="#1C1917"
              strokeWidth="1.5"
            />
            <path
              d="M10 10L14 14"
              stroke="#1C1917"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search memories, doctors, medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              fontSize: "14px",
              border: "0.5px solid #E8E0D5",
              borderRadius: "12px",
              background: "white",
              color: "#1C1917",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#A8A29E",
                fontSize: "18px",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { key: "all", label: `All (${counts.all})` },
              { key: "story", label: `Stories (${counts.story})` },
              { key: "practical", label: `Practical (${counts.practical})` },
              { key: "legacy", label: `Legacy (${counts.legacy})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                fontSize: "13px",
                padding: "6px 14px",
                borderRadius: "20px",
                border:
                  filter === tab.key
                    ? "1px solid #1C1917"
                    : "0.5px solid #E8E0D5",
                background: filter === tab.key ? "#1C1917" : "white",
                color: filter === tab.key ? "#FDF8F3" : "#78716C",
                cursor: "pointer",
                fontWeight: filter === tab.key ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recordings */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "14px", color: "#A8A29E" }}>
              Loading memories...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              background: "white",
              borderRadius: "16px",
              border: "0.5px solid #E8E0D5",
            }}
          >
            <p
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "20px",
                color: "#1C1917",
                margin: "0 0 8px",
              }}
            >
              {search ? `No results for "${search}"` : "No memories yet"}
            </p>
            <p style={{ fontSize: "14px", color: "#A8A29E", margin: 0 }}>
              {search
                ? "Try searching for a name, medicine, or place"
                : "Send a voice note to the Rooh WhatsApp number to get started."}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {filtered.map((recording) => {
              const config = TYPE_CONFIG[recording.primary_type];
              const isExpanded = expanded === recording.id;
              return (
                <div
                  key={recording.id}
                  style={{
                    background: "white",
                    border: isExpanded
                      ? "1px solid #D6CEC4"
                      : "0.5px solid #E8E0D5",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* Card header */}
                  <button
                    onClick={() =>
                      setExpanded(isExpanded ? null : recording.id)
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "20px 24px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#A8A29E",
                          margin: "0 0 8px",
                          fontFamily: "Georgia, serif",
                          fontStyle: "italic",
                        }}
                      >
                        {formatDate(recording.created_at)}
                      </p>
                      <p
                        style={{
                          fontFamily: "Georgia, serif",
                          fontSize: "16px",
                          lineHeight: 1.5,
                          color: "#1C1917",
                          margin: "0 0 12px",
                          fontWeight: 400,
                        }}
                      >
                        {recording.english_summary?.split(".")[0]}.
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: config.bg,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                        {recording.language_detected && (
                          <span style={{ fontSize: "12px", color: "#C8C0B8" }}>
                            {recording.language_detected}
                          </span>
                        )}
                        {recording.needs_review && (
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              background: "#FAEEDA",
                              color: "#633806",
                            }}
                          >
                            Needs review
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        color: "#D6CEC4",
                        fontSize: "18px",
                        flexShrink: 0,
                        marginTop: "4px",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      ↓
                    </span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 24px 24px",
                        borderTop: "0.5px solid #F5F0EA",
                      }}
                    >
                      {/* Audio player */}
                      {recording.audio_url && (
                        <div
                          style={{ marginBottom: "20px", paddingTop: "20px" }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#A8A29E",
                              margin: "0 0 8px",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              fontWeight: 500,
                            }}
                          >
                            Original recording
                          </p>
                          <audio
                            controls
                            src={recording.audio_url}
                            style={{ width: "100%", height: "36px" }}
                          />
                        </div>
                      )}

                      {/* Full summary */}
                      {recording.english_summary && (
                        <div style={{ marginBottom: "20px" }}>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#A8A29E",
                              margin: "0 0 8px",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              fontWeight: 500,
                            }}
                          >
                            Summary
                          </p>
                          <p
                            style={{
                              fontFamily: "Georgia, serif",
                              fontSize: "15px",
                              lineHeight: 1.7,
                              color: "#57534E",
                              margin: 0,
                            }}
                          >
                            {recording.english_summary}
                          </p>
                        </div>
                      )}

                      {/* Transcript */}
                      {recording.transcript_original &&
                        recording.primary_type !== "legacy" && (
                          <div style={{ marginBottom: "20px" }}>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#A8A29E",
                                margin: "0 0 8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                fontWeight: 500,
                              }}
                            >
                              Original transcript
                            </p>
                            <p
                              style={{
                                fontSize: "14px",
                                lineHeight: 1.7,
                                color: "#A8A29E",
                                fontStyle: "italic",
                                margin: 0,
                                background: "#FDF8F3",
                                padding: "14px 16px",
                                borderRadius: "10px",
                                borderLeft: "3px solid #E8E0D5",
                              }}
                            >
                              "{recording.transcript_original}"
                            </p>
                          </div>
                        )}

                      {/* Legacy notice */}
                      {recording.primary_type === "legacy" && (
                        <div
                          style={{
                            background: "#FAEEDA",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#633806",
                              margin: 0,
                            }}
                          >
                            This is a personal message kept in {parentName}'s
                            exact words. Listen to the original recording above.
                          </p>
                        </div>
                      )}

                      {/* Extracted entities */}
                      {recording.extracted_entities &&
                        Object.keys(recording.extracted_entities).length >
                          0 && (
                          <div>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#A8A29E",
                                margin: "0 0 10px",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                fontWeight: 500,
                              }}
                            >
                              Extracted information
                            </p>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {Object.entries(recording.extracted_entities).map(
                                ([key, values]) =>
                                  Array.isArray(values) &&
                                  values.map((v: any, i: number) => (
                                    <span
                                      key={`${key}-${i}`}
                                      style={{
                                        fontSize: "12px",
                                        background: "#F0FAF6",
                                        border: "0.5px solid #9FE1CB",
                                        borderRadius: "8px",
                                        padding: "4px 10px",
                                        color: "#1C1917",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "#1D9E75",
                                          marginRight: "4px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {key}
                                      </span>
                                      {Object.values(v)
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </span>
                                  )),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}


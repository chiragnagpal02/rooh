"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "14px 18px",
    fontSize: "15px",
    border: "1px solid #D6CEC4",
    borderRadius: "10px",
    background: "#FDF8F3",
    color: "#1C1917",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        background: "#FDF8F3",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <svg
            width="120"
            height="38"
            viewBox="0 0 120 38"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: "0 auto 8px", display: "block" }}
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
        </div>

        <div
          style={{
            background: "#FFF9F4",
            border: "0.5px solid #E8E0D5",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          {done ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "32px", margin: "0 0 16px" }}>🙏</p>
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "#1C1917",
                  margin: "0 0 8px",
                }}
              >
                Password set!
              </h2>
              <p style={{ fontSize: "14px", color: "#78716C", margin: 0 }}>
                Taking you to your dashboard...
              </p>
            </div>
          ) : !ready && !error ? (
            <p
              style={{
                fontSize: "14px",
                color: "#A8A29E",
                textAlign: "center",
                margin: 0,
              }}
            >
              Verifying reset link...
            </p>
          ) : error && !ready ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "#DC2626",
                  margin: "0 0 16px",
                }}
              >
                {error}
              </p>
              <a href="/login" style={{ fontSize: "13px", color: "#1D9E75" }}>
                Back to login
              </a>
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "#1C1917",
                  margin: "0 0 8px",
                }}
              >
                Set your password
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#78716C",
                  margin: "0 0 24px",
                }}
              >
                Choose a password to access your Rooh account.
              </p>

              <form
                onSubmit={handleReset}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      color: "#78716C",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    New password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      color: "#78716C",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Confirm password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                {error && (
                  <p style={{ fontSize: "13px", color: "#DC2626", margin: 0 }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  style={{
                    padding: "14px",
                    background: "#1C1917",
                    color: "#FDF8F3",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor:
                      loading || !password || !confirm
                        ? "not-allowed"
                        : "pointer",
                    opacity: loading || !password || !confirm ? 0.6 : 1,
                    marginTop: "4px",
                  }}
                >
                  {loading ? "Setting password..." : "Set password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

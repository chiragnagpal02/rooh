"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: true,
      });
    }

    // Scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

    // Progress bar + back to top visibility
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      const bar = document.getElementById("progress-bar");
      const backToTop = document.getElementById("back-to-top");
      if (bar) bar.style.width = progress + "%";
      if (backToTop) backToTop.style.opacity = scrollTop > 400 ? "1" : "0";
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent, location: string) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        setSubmitted(true);
        posthog.capture("waitlist_signup", { location, email });
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "14px 18px",
    fontSize: "15px",
    border: "1px solid #D6CEC4",
    borderRadius: "10px",
    background: "#FFF9F4",
    color: "#1C1917",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const btnStyle: React.CSSProperties = {
    padding: "14px",
    background: "#1C1917",
    color: "#FDF8F3",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 500,
    cursor: loading || !email ? "not-allowed" : "pointer",
    opacity: loading || !email ? 0.6 : 1,
    width: "100%",
  };

  const successBox = (
    <div
      style={{
        background: "#F0FAF6",
        border: "1px solid #A7F3D0",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "400px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "20px", margin: "0 0 8px" }}>🙏</p>
      <p
        style={{
          fontSize: "16px",
          fontWeight: 500,
          color: "#065F46",
          margin: "0 0 6px",
        }}
      >
        You are on the list.
      </p>
      <p style={{ fontSize: "14px", color: "#047857", margin: 0 }}>
        Check your email - we have sent you a note. You will hear from us
        personally when your spot is ready.
      </p>
    </div>
  );

  return (
    <main
      style={{ background: "#FDF8F3", minHeight: "100vh", color: "#1C1917" }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "5px",
          background: "#E8E0D5",
          zIndex: 100,
        }}
      >
        <div
          id="progress-bar"
          style={{
            height: "100%",
            width: "0%",
            background: "linear-gradient(to right, #1D9E75, #5DCAA5)",
            transition: "width 0.1s ease",
          }}
        />
      </div>

      <style>{`
  .fade-up {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-up.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .fade-up-delay-1 { transition-delay: 0.1s; }
  .fade-up-delay-2 { transition-delay: 0.2s; }
  .fade-up-delay-3 { transition-delay: 0.3s; }
  .fade-up-delay-4 { transition-delay: 0.4s; }
  input:focus {
    border-color: #1D9E75 !important;
    box-shadow: 0 0 0 3px rgba(29,158,117,0.1);
  }
  button:hover:not(:disabled) {
    opacity: 0.88 !important;
    transform: translateY(-1px);
  }
  button { transition: opacity 0.15s, transform 0.15s !important; }
  .nav-link:hover { opacity: 0.85; }
  .pillar-card { transition: transform 0.2s ease; }
  .pillar-card:hover { transform: translateX(4px); }
  .security-card { transition: transform 0.2s ease; }
  .security-card:hover { transform: translateY(-2px); }
  #back-to-top {
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.2s ease;
  }
  #back-to-top:hover {
    transform: translateY(-2px);
  }
`}</style>

      {/* Nav */}
      <nav
        style={{
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "0.5px solid #E8E0D5",
          position: "sticky",
          top: 0,
          background: "#FDF8F3",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          <svg
            width="96"
            height="30"
            viewBox="0 0 96 30"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 15 Q6 8 8 15 Q10 22 12 15"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x="18"
              y="22"
              fontFamily="Georgia, serif"
              fontSize="21"
              fontWeight="400"
              fill="#1C1917"
              letterSpacing="0.5"
            >
              Rooh
            </text>
          </svg>
        </div>
        <a
          href="#waitlist"
          className="nav-link"
          onClick={() => posthog.capture("nav_cta_clicked")}
          style={{
            fontSize: "13px",
            padding: "8px 18px",
            background: "#1D9E75",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 500,
            transition: "opacity 0.15s",
          }}
        >
          Join waitlist
        </a>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "100px 32px 80px",
          textAlign: "center",
        }}
      >
        <p
          className="fade-up"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#1D9E75",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          Early access - free for founding families
        </p>
        <h1
          className="fade-up fade-up-delay-1"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#1C1917",
            marginBottom: "24px",
          }}
        >
          Your parents have a whole life
          <br />
          you know nothing about.
        </h1>
        <p
          className="fade-up fade-up-delay-2"
          style={{
            fontSize: "18px",
            lineHeight: 1.7,
            color: "#57534E",
            maxWidth: "520px",
            margin: "0 auto 48px",
          }}
        >
          Their stories. Their memories. Where the documents are. What they want
          you to know. Rooh keeps it all - so you always have them, even when
          you cannot be there.
        </p>
        <div className="fade-up fade-up-delay-3">
          {submitted ? (
            successBox
          ) : (
            <form
              onSubmit={(e) => handleSubmit(e, "hero")}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={loading || !email}
                style={btnStyle}
              >
                {loading ? "Joining..." : "Join the waitlist - it's free"}
              </button>
              {error && (
                <p style={{ fontSize: "13px", color: "#DC2626", margin: 0 }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* Pain */}
      <section
        style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px" }}
      >
        <p
          className="fade-up"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(20px, 3vw, 28px)",
            lineHeight: 1.6,
            color: "#1C1917",
            margin: "0 0 32px",
          }}
        >
          Are your parents happy? Not "fine" - actually happy?
        </p>
        <p
          className="fade-up fade-up-delay-1"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(20px, 3vw, 28px)",
            lineHeight: 1.6,
            color: "#57534E",
            margin: "0 0 32px",
          }}
        >
          Do you know what their childhood was like? What they sacrificed for
          you? What they never told you about themselves?
        </p>
        <p
          className="fade-up fade-up-delay-2"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(20px, 3vw, 28px)",
            lineHeight: 1.6,
            color: "#A8A29E",
            margin: 0,
          }}
        >
          Do you know if they are facing any illness? Which medicines they take or who their doctor is?
          If something happened tonight - would you know what to do?
        </p>
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* How it works */}
      <section
        style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px" }}
      >
        <p
          className="fade-up"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "48px",
          }}
        >
          How it works
        </p>
        {[
          {
            num: "01",
            title: "Your parent talks",
            desc: "They send a voice note on WhatsApp - in their own language, in their own words. No app to download. No login. Just talk.",
          },
          {
            num: "02",
            title: "Rooh listens",
            desc: "AI transcribes and organises everything automatically - life stories, practical information, personal wishes - into your family archive.",
          },
          {
            num: "03",
            title: "You always have them",
            desc: "Browse their recordings, read their words, listen to their voice. Even from 4,000 miles away. Even years from now.",
          },
        ].map((step, i) => (
          <div
            key={i}
            className={`fade-up fade-up-delay-${i}`}
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: i < 2 ? "48px" : "0",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "13px",
                color: "#1D9E75",
                fontWeight: 500,
                flexShrink: 0,
                marginTop: "3px",
              }}
            >
              {step.num}
            </span>
            <div>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "#1C1917",
                  margin: "0 0 8px",
                }}
              >
                {step.title}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#57534E",
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* Three pillars */}
      <section
        style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px" }}
      >
        <p
          className="fade-up"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "48px",
          }}
        >
          What Rooh keeps safe
        </p>
        {[
          {
            color: "#7F77DD",
            bg: "#F5F4FF",
            title: "Their stories",
            desc: "Childhood memories. How they met. What life was like before you were born. The things you always meant to ask but never found the right moment.",
          },
          {
            color: "#1D9E75",
            bg: "#F0FAF6",
            title: "The practical stuff",
            desc: "Insurance policies. Bank accounts. Doctors. Medicines. Property papers. Everything you would need if something happened tomorrow - organised and searchable.",
          },
          {
            color: "#BA7517",
            bg: "#FFFBEB",
            title: "Their wishes",
            desc: "What they want the family to know. Messages for grandchildren. Things they never found the right moment to say. Kept in their exact words, forever.",
          },
        ].map((pillar, i) => (
          <div
            key={i}
            className={`fade-up fade-up-delay-${i} pillar-card`}
            style={{
              background: pillar.bg,
              borderLeft: `3px solid ${pillar.color}`,
              borderRadius: "0 12px 12px 0",
              padding: "20px 24px",
              marginBottom: i < 2 ? "16px" : "0",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#1C1917",
                margin: "0 0 6px",
              }}
            >
              {pillar.title}
            </p>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#57534E",
                margin: 0,
              }}
            >
              {pillar.desc}
            </p>
          </div>
        ))}
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* Founder */}
      <section
        style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px" }}
      >
        <div
          className="fade-up"
          style={{
            background: "#FFF9F4",
            border: "0.5px solid #E8E0D5",
            borderRadius: "16px",
            padding: "40px",
          }}
        >
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(16px, 2.5vw, 20px)",
              lineHeight: 1.8,
              color: "#1C1917",
              margin: "0 0 28px",
              fontStyle: "italic",
            }}
          >
            "I live in Singapore. My parents are in India. One day I realised I
            had no idea where their documents were, who their doctor was, or
            what medicines they take. And beyond the practical stuff - I did not
            know half their story. I am building Rooh because I do not want to
            be the person who only realises this too late."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                border: "2px solid #E8E0D5",
              }}
            >
              <img
                src="/chirag.jpg"
                alt="Chirag Nagpal"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#1C1917",
                  margin: "0 0 2px",
                }}
              >
                Chirag Nagpal
              </p>
              <p style={{ fontSize: "13px", color: "#78716C", margin: 0 }}>
                Founder, Rooh · Singapore
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* Security */}
      <section
        style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px" }}
      >
        <p
          className="fade-up"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Privacy & security
        </p>
        <p
          className="fade-up fade-up-delay-1"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#1C1917",
            margin: "0 0 40px",
          }}
        >
          This is deeply personal.
          <br />
          We treat it that way.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {[
            {
              title: "Private by default",
              desc: "Your archive is only visible to you. No one else can access it without your permission.",
            },
            {
              title: "Your data, always",
              desc: "Export or delete everything at any time. We never train AI on your family recordings.",
            },
            {
              title: "Encrypted storage",
              desc: "All recordings and transcripts are encrypted at rest and in transit.",
            },
            {
              title: "No selling, ever",
              desc: "Your family stories are not a product. We will never sell your data to third parties.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`fade-up fade-up-delay-${i} security-card`}
              style={{
                background: "#FFF9F4",
                border: "0.5px solid #E8E0D5",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1C1917",
                  margin: "0 0 6px",
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "#78716C",
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        style={{
          borderTop: "0.5px solid #E8E0D5",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      />

      {/* Final CTA */}
      <section
        id="waitlist"
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "80px 32px",
          textAlign: "center",
        }}
      >
        <p
          className="fade-up"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#1C1917",
            margin: "0 0 16px",
          }}
        >
          Do not wait for the right moment.
        </p>
        <p
          className="fade-up fade-up-delay-1"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#A8A29E",
            margin: "0 0 40px",
          }}
        >
          It does not come.
        </p>
        <p
          className="fade-up fade-up-delay-2"
          style={{
            fontSize: "15px",
            color: "#78716C",
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          Join families already preserving what matters most.
          <br />
          Free during early access.
        </p>
        <div className="fade-up fade-up-delay-3">
          {submitted ? (
            successBox
          ) : (
            <form
              onSubmit={(e) => handleSubmit(e, "footer")}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxWidth: "400px",
                margin: "0 auto",
              }}
            >
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={loading || !email}
                style={btnStyle}
              >
                {loading ? "Joining..." : "Join the waitlist - it's free"}
              </button>
              {error && (
                <p style={{ fontSize: "13px", color: "#DC2626", margin: 0 }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "0.5px solid #E8E0D5",
          padding: "32px",
          textAlign: "center",
        }}
      >
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
        <p style={{ fontSize: "13px", color: "#A8A29E", margin: "0 0 16px" }}>
          The soul of your family, always with you.
        </p>
        <p style={{ fontSize: "12px", color: "#D6CEC4", margin: 0 }}>
          2026 Rooh. Made with care in Singapore.
        </p>
      </footer>
      {/* Back to top */}
      <button
        id="back-to-top"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          posthog.capture("back_to_top_clicked");
        }}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "#1C1917",
          color: "#FDF8F3",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 50,
        }}
      >
        ↑
      </button>
    </main>
  );
}

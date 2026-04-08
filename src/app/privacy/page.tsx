"use client";

export default function PrivacyPolicy() {
  return (
    <main style={{ background: "#FDF8F3", minHeight: "100vh", color: "#1C1917" }}>
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
          href="/"
          style={{
            fontSize: "13px",
            padding: "8px 18px",
            background: "#1D9E75",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back home
        </a>
      </nav>

      {/* Content */}
      <section
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "80px 32px",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "38px",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#1C1917",
            marginBottom: "32px",
          }}
        >
          Privacy Policy
        </h1>

        <p style={{ fontSize: "14px", color: "#78716C", marginBottom: "32px" }}>
          Last updated: April 2026
        </p>

        <div style={{ lineHeight: 1.8, color: "#57534E", fontSize: "15px" }}>
          {/* Introduction */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            1. Introduction
          </h2>
          <p>
            Rooh ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal information when you use our website, mobile application, and related services (collectively, the "Service").
          </p>

          {/* Information We Collect */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            2. Information We Collect
          </h2>

          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "20px",
              marginBottom: "12px",
            }}
          >
            2.1 Information You Provide Directly
          </h3>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>Name and email address (via signup/waitlist)</li>
            <li>Phone number (for WhatsApp integration)</li>
            <li>Family information and voice recordings</li>
            <li>Documents and personal messages you choose to upload</li>
            <li>Any other information you voluntarily share</li>
          </ul>

          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "20px",
              marginBottom: "12px",
            }}
          >
            2.2 Information Collected Automatically
          </h3>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Device information (device type, operating system)</li>
            <li>Usage analytics via PostHog</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          {/* How We Use Information */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            3. How We Use Your Information
          </h2>
          <p>We use collected information for:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>Providing and improving the Service</li>
            <li>Processing voice notes via WhatsApp</li>
            <li>AI-based classification and organization of family archives</li>
            <li>Sending service-related communications</li>
            <li>Analytics and understanding user behavior</li>
            <li>Compliance with legal obligations</li>
          </ul>

          {/* Data Security */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            4. Data Security
          </h2>
          <p>
            We implement industry-standard security measures to protect your personal information:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>End-to-end encryption for voice recordings and transcripts</li>
            <li>Encrypted storage at rest and in transit</li>
            <li>Regular security audits and updates</li>
            <li>Secure authentication mechanisms (magic link, OAuth)</li>
            <li>Access controls and role-based permissions</li>
          </ul>
          <p style={{ marginTop: "16px", fontStyle: "italic" }}>
            However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
          </p>

          {/* AI Processing */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            5. AI Processing & Classification
          </h2>
          <p>
            Rooh uses AI services (OpenAI Whisper for transcription, Claude for classification) to organize your family archives. We do not use your family recordings or personal data to train AI models. Your data is processed only to provide the Service.
          </p>

          {/* Third-Party Services */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            6. Third-Party Services
          </h2>
          <p>We may share limited information with trusted partners:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>
              <strong>WhatsApp Business API:</strong> For receiving voice messages
            </li>
            <li>
              <strong>OpenAI & Anthropic:</strong> For transcription and classification services
            </li>
            <li>
              <strong>Supabase:</strong> For secure database hosting
            </li>
            <li>
              <strong>Resend:</strong> For email delivery
            </li>
            <li>
              <strong>PostHog:</strong> For analytics
            </li>
            <li>
              <strong>Vercel:</strong> For app hosting
            </li>
          </ul>
          <p>
            We do not sell your personal information to third parties. All third-party services are contractually obligated to maintain data confidentiality.
          </p>

          {/* Your Rights */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            7. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your family archive</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a href="mailto:hello@rooh.family" style={{ color: "#1D9E75" }}>
              hello@rooh.family
            </a>
            .
          </p>

          {/* Children's Privacy */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            8. Children's Privacy
          </h2>
          <p>
            Rooh is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will promptly delete it.
          </p>

          {/* Data Retention */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            9. Data Retention
          </h2>
          <p>
            We retain your personal information for as long as necessary to provide the Service and comply with legal obligations. You can request deletion of your account and data at any time. Upon deletion, your family archive will be permanently removed from our servers.
          </p>

          {/* International Transfers */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            10. International Data Transfers
          </h2>
          <p>
            Rooh is operated from Singapore. Your information may be transferred to, stored in, and processed in countries other than your country of residence, which may have data protection laws that differ from your home country. By using Rooh, you consent to the transfer of your information to countries outside your country of residence.
          </p>

          {/* Changes to This Policy */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            11. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last updated" date at the top of this page. Your continued use of Rooh after changes constitutes acceptance of the updated Privacy Policy.
          </p>

          {/* Contact Us */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 500,
              color: "#1C1917",
              marginTop: "32px",
              marginBottom: "16px",
            }}
          >
            12. Contact Us
          </h2>
          <p>
            If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p style={{ marginTop: "16px" }}>
            <strong>Rooh</strong>
            <br />
            Email:{" "}
            <a href="mailto:hello@rooh.family" style={{ color: "#1D9E75" }}>
              hello@rooh.family
            </a>
            <br />
            Location: Singapore
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "0.5px solid #E8E0D5",
          padding: "32px",
          textAlign: "center",
          marginTop: "80px",
        }}
      >
        <p style={{ fontSize: "13px", color: "#A8A29E", margin: "0 0 16px" }}>
          The soul of your family, always with you.
        </p>
        <p style={{ fontSize: "12px", color: "#D6CEC4", margin: 0 }}>
          2026 Rooh. Made with care in Singapore.
        </p>
      </footer>
    </main>
  );
}
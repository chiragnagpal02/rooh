"use client";

import { useState } from "react";

const ROOH_NUMBER = "+65 8276 5445";

interface Props {
  parentName: string;
  hasRecordings: boolean;
  onDismiss: () => void;
  onGoToPrompts: () => void;
}

export default function GettingStartedChecklist({
  parentName,
  hasRecordings,
  onDismiss,
  onGoToPrompts,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // ← collapsed by default

  const steps = [
    {
      id: "connected",
      label: `Connect ${parentName.split(" ")[0]}`,
      detail: "Done! Your parent is connected to Rooh.",
      done: true,
    },
    {
      id: "share",
      label: "Share the Rooh WhatsApp number",
      detail: `Tell ${parentName.split(" ")[0]} to save this number and send a voice note.`,
      done: copied,
      action: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              background: "#F0FAF6",
              border: "0.5px solid #9FE1CB",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "15px",
              fontWeight: 500,
              color: "#1C1917",
              letterSpacing: "0.02em",
            }}
          >
            {ROOH_NUMBER}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(ROOH_NUMBER);
              setCopied(true);
            }}
            style={{
              padding: "8px 14px",
              background: "#1C1917",
              color: "#FDF8F3",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      ),
    },
    {
      id: "prompt",
      label: "Send your first prompt",
      detail: `Ask ${parentName.split(" ")[0]} a question to get the first memory started.`,
      done: false,
      action: (
        <button
          onClick={onGoToPrompts}
          style={{
            marginTop: "8px",
            padding: "8px 14px",
            background: "transparent",
            color: "#1D9E75",
            border: "0.5px solid #1D9E75",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Go to Prompts →
        </button>
      ),
    },
    {
      id: "memory",
      label: "Wait for the first memory",
      detail: `Once ${parentName.split(" ")[0]} sends a voice note, it'll appear right here.`,
      done: hasRecordings,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid #E8E0D5",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "24px",
      }}
    >
      {/* Header — replace <button> with <div> */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: collapsed ? "none" : "0.5px solid #F5F0EA",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#1C1917",
              margin: "0 0 2px",
            }}
          >
            Getting started
          </p>
          <p style={{ fontSize: "12px", color: "#A8A29E", margin: 0 }}>
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              color: "#D6CEC4",
              fontSize: "16px",
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.2s",
            }}
          >
            ↓
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#A8A29E",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar — always visible */}
      <div style={{ height: "3px", background: "#F5F0EA" }}>
        <div
          style={{
            height: "100%",
            background: "#1D9E75",
            width: `${(completedCount / steps.length) * 100}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Steps — only shown when expanded */}
      {!collapsed && (
        <div style={{ padding: "8px 0" }}>
          {steps.map((step, i) => (
            <div
              key={step.id}
              style={{
                padding: "12px 20px",
                borderBottom:
                  i < steps.length - 1 ? "0.5px solid #F5F0EA" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: "1px",
                    background: step.done ? "#1D9E75" : "transparent",
                    border: step.done ? "none" : "1.5px solid #D6CEC4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {step.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: step.done ? "#A8A29E" : "#1C1917",
                      margin: "0 0 2px",
                      textDecoration: step.done ? "line-through" : "none",
                    }}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#78716C",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {step.detail}
                    </p>
                  )}
                  {!step.done && step.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMEZONES = [
  { label: "India (IST)", value: "Asia/Kolkata" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "UAE (GST)", value: "Asia/Dubai" },
  { label: "UK (GMT)", value: "Europe/London" },
  { label: "US East (EST)", value: "America/New_York" },
  { label: "US West (PST)", value: "America/Los_Angeles" },
  { label: "Australia (AEST)", value: "Australia/Sydney" },
];
const FREQUENCIES = ["Every week", "Every 2 weeks", "Every month"];
const TIMES = [
  "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

interface Props {
  userEmail: string;
}

function getNextSendDate(day: string, frequency: string): string {
  const dayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0
  }
  const targetDay = dayMap[day]
  const today = new Date()
  const todayDay = today.getDay()
  let daysUntil = (targetDay - todayDay + 7) % 7
  if (daysUntil === 0) daysUntil = 7 // next occurrence, not today

  if (frequency === 'Every 2 weeks') daysUntil = daysUntil <= 7 ? daysUntil : daysUntil + 7
  if (frequency === 'Every month') daysUntil = daysUntil <= 7 ? daysUntil + 21 : daysUntil + 14

  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return next.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function PromptsView({ userEmail }: Props) {
  const supabase = createSupabaseBrowser()

  const [activeTab, setActiveTab] = useState<"next" | "schedule" | "history">("next")
  const [selectedDay, setSelectedDay] = useState("Sun")
  const [selectedTime, setSelectedTime] = useState("9:00 AM")
  const [selectedFreq, setSelectedFreq] = useState("Every week")
  const [selectedTz, setSelectedTz] = useState("Asia/Kolkata")
  const [paused, setPaused] = useState(false)
  const [scheduleExists, setScheduleExists] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null)
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  const [promptText, setPromptText] = useState(
    "What is your favourite memory of the monsoon season? A moment, a smell, a feeling — anything that comes to mind."
  )
  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<"success" | "error" | null>(null)

  const [history, setHistory] = useState<Array<{
    id: string; prompt_text: string; sent_at: string; prompt_category: string;
  }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => { fetchSchedule() }, [])
  useEffect(() => { if (activeTab === "history") fetchHistory() }, [activeTab])

  async function fetchSchedule() {
    setLoadingSchedule(true)
    const { data } = await supabase
      .from('families')
      .select('prompt_schedule, prompt_schedule_paused')
      .eq('adult_child_email', userEmail)
      .single()

    if (data?.prompt_schedule) {
      const s = data.prompt_schedule
      setSelectedDay(s.day || 'Sun')
      setSelectedTime(s.time || '9:00 AM')
      setSelectedFreq(s.frequency || 'Every week')
      setSelectedTz(s.timezone || 'Asia/Kolkata')
      setScheduleExists(true)
    }
    setPaused(data?.prompt_schedule_paused ?? false)
    setLoadingSchedule(false)
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true)
    setSaveStatus(null)
    const { error } = await supabase
      .from('families')
      .update({
        prompt_schedule: {
          day: selectedDay,
          time: selectedTime,
          frequency: selectedFreq,
          timezone: selectedTz,
        },
        prompt_schedule_paused: false,
      })
      .eq('adult_child_email', userEmail)

    if (error) {
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      setScheduleExists(true)
      setPaused(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
    setSavingSchedule(false)
  }

  async function handleTogglePause() {
    const newPaused = !paused
    setPaused(newPaused)
    await supabase
      .from('families')
      .update({ prompt_schedule_paused: newPaused })
      .eq('adult_child_email', userEmail)
  }

  async function handleDeleteSchedule() {
    await supabase
      .from('families')
      .update({ prompt_schedule: null, prompt_schedule_paused: false })
      .eq('adult_child_email', userEmail)
    setScheduleExists(false)
    setPaused(false)
    setSelectedDay('Sun')
    setSelectedTime('9:00 AM')
    setSelectedFreq('Every week')
    setSelectedTz('Asia/Kolkata')
  }

  async function fetchHistory() {
    setHistoryLoading(true)
    const res = await fetch(`/api/prompt-history?email=${userEmail}`)
    const data = await res.json()
    if (data.prompts) setHistory(data.prompts)
    setHistoryLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      const prompts = [
        "What did your childhood home look like? Can you describe it in detail — the rooms, the smells, the sounds?",
        "Tell me about the moment you knew you wanted to marry your partner. What happened?",
        "What was the hardest period of your life, and what got you through it?",
        "What is a recipe you know by heart that you learned from your mother?",
        "What advice would you give to your younger self?",
        "Tell me about a teacher or mentor who changed your life.",
        "What is something you sacrificed for your children that you never told them about?",
      ]
      setPromptText(prompts[Math.floor(Math.random() * prompts.length)])
      setGenerating(false)
    }, 1200)
  }

  async function handleSendPrompt() {
    setSending(true)
    try {
      const res = await fetch("/api/send-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, userEmail }),
      })
      const data = await res.json()
      setSendStatus(data.success ? "success" : "error")
    } catch {
      setSendStatus("error")
    } finally {
      setSending(false)
      setTimeout(() => setSendStatus(null), 3000)
    }
  }

  const inputStyle = {
    fontSize: "13px", color: "#1C1917", background: "#FDF8F3",
    border: "0.5px solid #E8E0D5", borderRadius: "8px",
    padding: "8px 12px", width: "100%", outline: "none",
  } as React.CSSProperties

  const nextSendDate = scheduleExists && !paused
    ? getNextSendDate(selectedDay, selectedFreq)
    : null

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "0.5px solid #E8E0D5" }}>
        {(["next", "schedule", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", fontSize: "13px",
              color: activeTab === tab ? "#1C1917" : "#78716C",
              cursor: "pointer", background: "none", border: "none",
              borderBottom: activeTab === tab ? "2px solid #1C1917" : "2px solid transparent",
              fontWeight: activeTab === tab ? 500 : 400, marginBottom: "-0.5px",
            }}
          >
            {tab === "next" ? "Next prompt" : tab === "schedule" ? "Schedule" : "History"}
          </button>
        ))}
      </div>

      {/* Next prompt tab */}
      {activeTab === "next" && (
        <div>
          <div style={{ background: "white", border: "0.5px solid #E8E0D5", borderRadius: "16px", padding: "24px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
                  {scheduleExists && !paused
                    ? `Scheduled · ${selectedDay} at ${selectedTime}`
                    : 'No schedule set · send manually below'}
                </p>
                <p style={{ fontSize: "13px", color: "#78716C", margin: 0 }}>
                  Generated by Rooh · edit or regenerate below
                </p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", background: "#EEEDFE", color: "#3C3489" }}>
                Childhood
              </span>
            </div>

            {editing ? (
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                style={{ ...inputStyle, width: "100%", minHeight: "100px", resize: "vertical", fontFamily: "Georgia, serif", fontSize: "15px", lineHeight: 1.6, marginBottom: "16px", boxSizing: "border-box", borderLeft: "3px solid #1D9E75" }}
              />
            ) : (
              <div
                onClick={() => setEditing(true)}
                style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: "#1C1917", lineHeight: 1.6, marginBottom: "16px", padding: "14px 16px", background: "#FDF8F3", borderRadius: "10px", borderLeft: "3px solid #1D9E75", cursor: "text" }}
              >
                "{promptText}"
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={editing ? () => setEditing(false) : handleSendPrompt}
                style={{ padding: "8px 18px", background: "#1C1917", color: "#FDF8F3", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1 }}
              >
                {sending ? "Sending..." : editing ? "Save prompt" : "Send as is ✓"}
              </button>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ padding: "8px 18px", background: "white", color: "#1C1917", border: "0.5px solid #E8E0D5", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
                  Edit
                </button>
              )}
              <button onClick={handleGenerate} disabled={generating} style={{ padding: "8px 18px", background: "transparent", color: "#78716C", border: "0.5px solid #E8E0D5", borderRadius: "8px", fontSize: "13px", cursor: "pointer", opacity: generating ? 0.6 : 1 }}>
                {generating ? "Generating..." : "Generate new ↻"}
              </button>
            </div>
          </div>

          {sendStatus === "success" && (
            <div style={{ background: "#F0FAF6", border: "0.5px solid #9FE1CB", borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "#085041", margin: 0 }}>Prompt sent successfully ✓</p>
            </div>
          )}
          {sendStatus === "error" && (
            <div style={{ background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", color: "#7F1D1D", margin: 0 }}>Failed to send prompt. Please try again.</p>
            </div>
          )}

          <div style={{ background: "#F0FAF6", border: "0.5px solid #9FE1CB", borderRadius: "12px", padding: "14px 16px" }}>
            <p style={{ fontSize: "13px", color: "#085041", margin: 0 }}>
              This prompt will be sent to your parent on WhatsApp. They just need to press and hold the microphone button to reply.
            </p>
          </div>
        </div>
      )}

      {/* Schedule tab */}
      {activeTab === "schedule" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Active schedule summary */}
          {scheduleExists && !loadingSchedule && (
            <div style={{ background: paused ? '#FFF9F4' : '#F0FAF6', border: `0.5px solid ${paused ? '#E8E0D5' : '#9FE1CB'}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: paused ? '#78716C' : '#085041', margin: '0 0 2px' }}>
                  {paused ? 'Schedule paused' : `Next prompt: ${nextSendDate}`}
                </p>
                <p style={{ fontSize: '12px', color: paused ? '#A8A29E' : '#1D9E75', margin: 0 }}>
                  {selectedFreq} · {selectedDay} at {selectedTime}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleTogglePause}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '0.5px solid #E8E0D5', background: 'white', color: '#78716C', cursor: 'pointer' }}
                >
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleDeleteSchedule}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '0.5px solid #FCA5A5', background: 'white', color: '#DC2626', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Schedule form */}
          <div style={{ background: "white", border: "0.5px solid #E8E0D5", borderRadius: "16px", padding: "24px" }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: '0 0 20px' }}>
              {scheduleExists ? 'Edit schedule' : 'Set up a schedule'}
            </p>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "#78716C", marginBottom: "10px" }}>Send on</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: "6px 12px", borderRadius: "20px", fontSize: "13px",
                      border: selectedDay === day ? "1px solid #1C1917" : "0.5px solid #E8E0D5",
                      background: selectedDay === day ? "#1C1917" : "white",
                      color: selectedDay === day ? "#FDF8F3" : "#78716C",
                      cursor: "pointer",
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "13px", color: "#78716C", marginBottom: "8px" }}>Time (parent's local time)</p>
                <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} style={inputStyle}>
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: "13px", color: "#78716C", marginBottom: "8px" }}>Frequency</p>
                <select value={selectedFreq} onChange={(e) => setSelectedFreq(e.target.value)} style={inputStyle}>
                  {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "13px", color: "#78716C", marginBottom: "8px" }}>Parent's timezone</p>
              <select value={selectedTz} onChange={(e) => setSelectedTz(e.target.value)} style={inputStyle}>
                {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              style={{ padding: "10px 20px", background: "#1C1917", color: "#FDF8F3", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer", opacity: savingSchedule ? 0.6 : 1 }}
            >
              {savingSchedule ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : scheduleExists ? 'Update schedule' : 'Save schedule'}
            </button>

            {saveStatus === 'error' && (
              <p style={{ fontSize: '13px', color: '#DC2626', margin: '10px 0 0' }}>Failed to save. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div style={{ background: "white", border: "0.5px solid #E8E0D5", borderRadius: "16px", overflow: "hidden" }}>
          {historyLoading ? (
            <p style={{ padding: "24px", fontSize: "13px", color: "#A8A29E", textAlign: "center" }}>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ padding: "24px", fontSize: "13px", color: "#A8A29E", textAlign: "center" }}>No prompts sent yet.</p>
          ) : (
            history.map((item, i) => (
              <div
                key={item.id}
                style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "14px 20px", borderBottom: i < history.length - 1 ? "0.5px solid #F5F0EA" : "none" }}
              >
                <span style={{ fontSize: "12px", color: "#A8A29E", flexShrink: 0, width: "50px", paddingTop: "2px" }}>
                  {new Date(item.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <p style={{ fontSize: "13px", color: "#57534E", flex: 1, margin: 0, lineHeight: 1.5 }}>
                  "{item.prompt_text}"
                </p>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", flexShrink: 0, background: item.prompt_category === 'scheduled' ? '#E1F5EE' : '#F1EFE8', color: item.prompt_category === 'scheduled' ? '#085041' : '#444441' }}>
                  {item.prompt_category === 'scheduled' ? 'Scheduled' : 'Manual'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
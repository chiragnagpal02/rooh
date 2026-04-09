'use client'

import { Recording, RecordingType } from '@/types'
import { Parent } from '../page'
import { useState } from 'react'

const TYPE_CONFIG: Record<RecordingType, { label: string; color: string; bg: string }> = {
  story:    { label: 'Life story',  color: '#3C3489', bg: '#EEEDFE' },
  practical:{ label: 'Practical',   color: '#085041', bg: '#E1F5EE' },
  legacy:   { label: 'Legacy',      color: '#633806', bg: '#FAEEDA' },
  mixed:    { label: 'Mixed',       color: '#712B13', bg: '#FAECE7' },
  untagged: { label: 'Untagged',    color: '#444441', bg: '#F1EFE8' },
}

const REACTION_EMOJIS = ['🙏', '❤️', '😢', '😊', '✨']

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Reaction {
  id: string
  recording_id: string
  emoji: string
  message: string | null
  created_at: string
}

interface Props {
  recordings: Recording[]
  parents: Parent[]
  userEmail: string
  adultName: string
  loading: boolean
  onMarkSeen: (id: string) => void
}

export default function MemoriesView({ recordings, parents, userEmail, adultName, loading, onMarkSeen }: Props) {
  const [filter, setFilter] = useState<RecordingType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Reactions state
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})
  const [reactingTo, setReactingTo] = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('🙏')
  const [reactionMessage, setReactionMessage] = useState('')
  const [submittingReaction, setSubmittingReaction] = useState(false)
  const [reactionSuccess, setReactionSuccess] = useState<string | null>(null)

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p.name]))

  const filtered = recordings
    .filter(r => filter === 'all' || r.primary_type === filter)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.english_summary?.toLowerCase().includes(q) ||
        r.transcript_original?.toLowerCase().includes(q) ||
        Object.values(r.extracted_entities || {}).some(arr =>
          Array.isArray(arr) && arr.some(item =>
            Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(q))
          )
        )
      )
    })

  const counts = {
    all: recordings.length,
    story: recordings.filter(r => r.primary_type === 'story' || r.primary_type === 'mixed').length,
    practical: recordings.filter(r => r.primary_type === 'practical' || r.primary_type === 'mixed').length,
    legacy: recordings.filter(r => r.primary_type === 'legacy').length,
  }

  async function handleExpand(recordingId: string, isNew: boolean) {
    const nowExpanded = expanded === recordingId ? null : recordingId
    setExpanded(nowExpanded)
    if (nowExpanded && isNew) onMarkSeen(recordingId)

    // Fetch reactions when expanding
    if (nowExpanded && !reactions[recordingId]) {
      const res = await fetch(`/api/react?recording_id=${recordingId}`)
      const data = await res.json()
      if (data.reactions) {
        setReactions(prev => ({ ...prev, [recordingId]: data.reactions }))
      }
    }
  }

  async function handleSubmitReaction(recordingId: string) {
    setSubmittingReaction(true)
    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recording_id: recordingId,
          emoji: selectedEmoji,
          message: reactionMessage.trim() || null,
          user_email: userEmail,
          adult_name: adultName,
        })
      })
      const data = await res.json()
      if (data.success) {
        setReactions(prev => ({
          ...prev,
          [recordingId]: [...(prev[recordingId] || []), data.reaction]
        }))
        setReactionSuccess(recordingId)
        setReactingTo(null)
        setReactionMessage('')
        setSelectedEmoji('🙏')
        setTimeout(() => setReactionSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Reaction error:', err)
    } finally {
      setSubmittingReaction(false)
    }
  }

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#1C1917" strokeWidth="1.5"/>
          <path d="M10 10L14 14" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search memories, doctors, medicines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: '14px', border: '0.5px solid #E8E0D5', borderRadius: '12px', background: 'white', color: '#1C1917', outline: 'none', boxSizing: 'border-box' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A8A29E', fontSize: '18px', padding: 0 }}>×</button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {([
          { key: 'all', label: `All (${counts.all})` },
          { key: 'story', label: `Stories (${counts.story})` },
          { key: 'practical', label: `Practical (${counts.practical})` },
          { key: 'legacy', label: `Legacy (${counts.legacy})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              fontSize: '13px', padding: '6px 14px', borderRadius: '20px',
              border: filter === tab.key ? '1px solid #1C1917' : '0.5px solid #E8E0D5',
              background: filter === tab.key ? '#1C1917' : 'white',
              color: filter === tab.key ? '#FDF8F3' : '#78716C',
              cursor: 'pointer', fontWeight: filter === tab.key ? 500 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recordings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: '14px', color: '#A8A29E' }}>Loading memories...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '16px', border: '0.5px solid #E8E0D5' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1C1917', margin: '0 0 8px' }}>
            {search ? `No results for "${search}"` : 'No memories yet'}
          </p>
          <p style={{ fontSize: '14px', color: '#A8A29E', margin: 0 }}>
            {search ? 'Try searching for a name, medicine, or place' : 'Send a voice note to the Rooh WhatsApp number to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(recording => {
            const config = TYPE_CONFIG[recording.primary_type]
            const isExpanded = expanded === recording.id
            const recordingParentName = (recording as any).parent_id
              ? parentMap[(recording as any).parent_id] || 'Your parent'
              : parents[0]?.name || 'Your parent'
            const recordingReactions = reactions[recording.id] || []
            const isReacting = reactingTo === recording.id

            return (
              <div key={recording.id} style={{ background: 'white', border: isExpanded ? '1px solid #D6CEC4' : '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <button
                  onClick={() => handleExpand(recording.id, (recording as any).is_new)}
                  style={{ width: '100%', textAlign: 'left', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {formatDate(recording.created_at)}
                      </p>
                      {parents.length > 1 && (
                        <span style={{ fontSize: '11px', color: '#A8A29E', background: '#F5F0EA', padding: '2px 8px', borderRadius: '20px' }}>
                          {recordingParentName.split(' ')[0]}
                        </span>
                      )}
                      {recordingReactions.length > 0 && (
                        <span style={{ fontSize: '12px' }}>
                          {recordingReactions.slice(0, 3).map(r => r.emoji).join('')}
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: 1.5, color: '#1C1917', margin: '0 0 12px' }}>
                      {recording.english_summary?.split('.')[0]}.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      {recording.language_detected && (
                        <span style={{ fontSize: '12px', color: '#C8C0B8' }}>{recording.language_detected}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0, marginTop: '4px' }}>
                    {(recording as any).is_new && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1D9E75', marginTop: '5px' }} />}
                    <span style={{ color: '#D6CEC4', fontSize: '18px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 24px 24px', borderTop: '0.5px solid #F5F0EA' }}>
                    {recording.audio_url && (
                      <div style={{ marginBottom: '20px', paddingTop: '20px' }}>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Original recording</p>
                        <audio controls src={recording.audio_url} style={{ width: '100%', height: '36px' }}/>
                      </div>
                    )}
                    {recording.english_summary && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Summary</p>
                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '15px', lineHeight: 1.7, color: '#57534E', margin: 0 }}>{recording.english_summary}</p>
                      </div>
                    )}
                    {recording.transcript_original && recording.primary_type !== 'legacy' && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Original transcript</p>
                        <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#A8A29E', fontStyle: 'italic', margin: 0, background: '#FDF8F3', padding: '14px 16px', borderRadius: '10px', borderLeft: '3px solid #E8E0D5' }}>"{recording.transcript_original}"</p>
                      </div>
                    )}
                    {recording.primary_type === 'legacy' && (
                      <div style={{ background: '#FAEEDA', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#633806', margin: 0 }}>
                          This is a personal message kept in {recordingParentName}'s exact words.
                        </p>
                      </div>
                    )}
                    {recording.extracted_entities && Object.keys(recording.extracted_entities).length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Extracted information</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {Object.entries(recording.extracted_entities).map(([key, values]) =>
                            Array.isArray(values) && values.map((v: any, i: number) => (
                              <span key={`${key}-${i}`} style={{ fontSize: '12px', background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '4px 10px', color: '#1C1917' }}>
                                <span style={{ color: '#1D9E75', marginRight: '4px', fontWeight: 500 }}>{key}</span>
                                {Object.values(v).filter(Boolean).join(' · ')}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Existing reactions */}
                    {recordingReactions.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Reactions</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {recordingReactions.map(r => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#FDF8F3', borderRadius: '10px', padding: '10px 14px' }}>
                              <span style={{ fontSize: '18px', flexShrink: 0 }}>{r.emoji}</span>
                              {r.message && <p style={{ fontSize: '13px', color: '#57534E', margin: 0, lineHeight: 1.5, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>"{r.message}"</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success state */}
                    {reactionSuccess === recording.id && (
                      <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                        <p style={{ fontSize: '13px', color: '#085041', margin: 0 }}>
                          🙏 {recordingParentName.split(' ')[0]} will be notified of your reaction.
                        </p>
                      </div>
                    )}

                    {/* Reaction UI */}
                    {!isReacting ? (
                      <button
                        onClick={() => setReactingTo(recording.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', border: '0.5px solid #E8E0D5', borderRadius: '20px', fontSize: '13px', color: '#78716C', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '14px' }}>🙏</span> React to this memory
                      </button>
                    ) : (
                      <div style={{ background: '#FDF8F3', border: '0.5px solid #E8E0D5', borderRadius: '12px', padding: '16px' }}>
                        <p style={{ fontSize: '13px', color: '#78716C', margin: '0 0 12px' }}>
                          How did this make you feel?
                        </p>

                        {/* Emoji picker */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                          {REACTION_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => setSelectedEmoji(emoji)}
                              style={{
                                width: '42px', height: '42px', borderRadius: '50%', fontSize: '20px',
                                border: selectedEmoji === emoji ? '2px solid #1D9E75' : '0.5px solid #E8E0D5',
                                background: selectedEmoji === emoji ? '#F0FAF6' : 'white',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        {/* Optional message */}
                        <textarea
                          placeholder={`Add a message for ${recordingParentName.split(' ')[0]}... (optional)`}
                          value={reactionMessage}
                          onChange={e => setReactionMessage(e.target.value)}
                          rows={2}
                          style={{
                            width: '100%', padding: '10px 12px', fontSize: '13px',
                            border: '0.5px solid #E8E0D5', borderRadius: '10px',
                            background: 'white', color: '#1C1917', outline: 'none',
                            resize: 'none', boxSizing: 'border-box',
                            fontFamily: 'Georgia, serif', marginBottom: '12px'
                          }}
                        />

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setReactingTo(null); setReactionMessage(''); setSelectedEmoji('🙏') }}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#78716C', border: '0.5px solid #E8E0D5', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitReaction(recording.id)}
                            disabled={submittingReaction}
                            style={{
                              flex: 1, padding: '8px', background: '#1C1917', color: '#FDF8F3',
                              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                              cursor: submittingReaction ? 'not-allowed' : 'pointer',
                              opacity: submittingReaction ? 0.6 : 1
                            }}
                          >
                            {submittingReaction ? 'Sending...' : `Send ${selectedEmoji} to ${recordingParentName.split(' ')[0]}`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
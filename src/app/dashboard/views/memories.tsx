'use client'

import { Recording, RecordingType } from '@/types'
import { useState } from 'react'

const TYPE_CONFIG: Record<RecordingType, { label: string; color: string; bg: string }> = {
  story:    { label: 'Life story',  color: '#3C3489', bg: '#EEEDFE' },
  practical:{ label: 'Practical',   color: '#085041', bg: '#E1F5EE' },
  legacy:   { label: 'Legacy',      color: '#633806', bg: '#FAEEDA' },
  mixed:    { label: 'Mixed',       color: '#712B13', bg: '#FAECE7' },
  untagged: { label: 'Untagged',    color: '#444441', bg: '#F1EFE8' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  recordings: Recording[]
  parentName: string
  loading: boolean
  onMarkSeen: (id: string) => void
}

export default function MemoriesView({ recordings, parentName, loading, onMarkSeen }: Props) {
  const [filter, setFilter] = useState<RecordingType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
            return (
              <div key={recording.id} style={{ background: 'white', border: isExpanded ? '1px solid #D6CEC4' : '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <button
                  onClick={() => {
                    const nowExpanded = isExpanded ? null : recording.id
                    setExpanded(nowExpanded)
                    if (nowExpanded && (recording as any).is_new) onMarkSeen(recording.id)
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 8px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {formatDate(recording.created_at)}
                    </p>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', lineHeight: 1.5, color: '#1C1917', margin: '0 0 12px' }}>
                      {recording.english_summary?.split('.')[0]}.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      {recording.language_detected && <span style={{ fontSize: '12px', color: '#C8C0B8' }}>{recording.language_detected}</span>}
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
                        <p style={{ fontSize: '13px', color: '#633806', margin: 0 }}>This is a personal message kept in {parentName}'s exact words.</p>
                      </div>
                    )}
                    {recording.extracted_entities && Object.keys(recording.extracted_entities).length > 0 && (
                      <div>
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
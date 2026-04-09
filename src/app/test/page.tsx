'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface FamilyOption {
  id: string
  adult_child_name: string
  parents: { id: string; name: string }[]
}

export default function TestPage() {
  const [families, setFamilies] = useState<FamilyOption[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('english')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFamilies, setLoadingFamilies] = useState(true)

  const supabase = createSupabaseBrowser()

  useEffect(() => { fetchFamilies() }, [])

  async function fetchFamilies() {
    setLoadingFamilies(true)
    const { data: familyData } = await supabase
      .from('families')
      .select('id, adult_child_name')

    if (!familyData) { setLoadingFamilies(false); return }

    const familiesWithParents = await Promise.all(
      familyData.map(async f => {
        const { data: parents } = await supabase
          .from('parents')
          .select('id, name')
          .eq('family_id', f.id)
        return { ...f, parents: parents || [] }
      })
    )

    setFamilies(familiesWithParents)

    // Auto-select first family and parent
    if (familiesWithParents.length > 0) {
      setSelectedFamilyId(familiesWithParents[0].id)
      if (familiesWithParents[0].parents.length > 0) {
        setSelectedParentId(familiesWithParents[0].parents[0].id)
      }
    }
    setLoadingFamilies(false)
  }

  const selectedFamily = families.find(f => f.id === selectedFamilyId)

  function handleFamilyChange(familyId: string) {
    setSelectedFamilyId(familyId)
    const family = families.find(f => f.id === familyId)
    if (family?.parents.length) {
      setSelectedParentId(family.parents[0].id)
    } else {
      setSelectedParentId('')
    }
  }

  async function runTest() {
    if (!transcript || !selectedFamilyId || !selectedParentId) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/test-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language,
          family_id: selectedFamilyId,
          parent_id: selectedParentId,
        })
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', fontSize: '14px', border: '1px solid #E5E7EB',
    borderRadius: '10px', padding: '10px 12px', outline: 'none',
    background: 'white', color: '#1C1917', cursor: 'pointer'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '32px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#1C1917', margin: '0 0 6px' }}>
          Rooh — pipeline tester
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px' }}>
          Simulate a parent voice note without WhatsApp. Select a family and parent, paste a transcript, hit run.
        </p>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Family selector */}
          <div>
            <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Family</label>
            {loadingFamilies ? (
              <p style={{ fontSize: '13px', color: '#A8A29E' }}>Loading families...</p>
            ) : (
              <select value={selectedFamilyId} onChange={e => handleFamilyChange(e.target.value)} style={selectStyle}>
                {families.map(f => (
                  <option key={f.id} value={f.id}>{f.adult_child_name}'s family</option>
                ))}
              </select>
            )}
          </div>

          {/* Parent selector */}
          <div>
            <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Parent</label>
            {selectedFamily?.parents.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#A8A29E' }}>No parents connected to this family.</p>
            ) : (
              <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)} style={selectStyle}>
                {selectedFamily?.parents.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Language */}
          <div>
            <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="tamil">Tamil</option>
              <option value="kannada">Kannada</option>
              <option value="punjabi">Punjabi</option>
              <option value="mandarin">Mandarin</option>
            </select>
          </div>

          {/* Transcript */}
          <div>
            <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
              Transcript — paste what the parent said
            </label>
            <textarea
              rows={5}
              placeholder="e.g. I've been taking Metformin 500mg twice daily for my diabetes. Dr. Patel at Apollo Hospital said my blood sugar is better now."
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              style={{ ...selectStyle, resize: 'none', cursor: 'text', fontFamily: 'inherit' }}
            />
          </div>

          <button
            onClick={runTest}
            disabled={loading || !transcript || !selectedFamilyId || !selectedParentId}
            style={{
              background: loading || !transcript ? '#9CA3AF' : '#059669',
              color: 'white', fontSize: '14px', padding: '12px',
              borderRadius: '10px', border: 'none', cursor: loading || !transcript ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            {loading ? 'Running pipeline...' : 'Run pipeline'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: '16px', background: 'white', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px' }}>
            {result.error ? (
              <p style={{ fontSize: '14px', color: '#DC2626' }}>{result.error}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#059669' }}>Pipeline succeeded</span>
                  <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '20px' }}>
                    {result.classification?.primary_type}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    {result.classification ? Math.round(result.classification.confidence * 100) : 0}% confidence
                  </span>
                </div>

                <div>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>English summary</p>
                  <p style={{ fontSize: '14px', color: '#374151' }}>{result.classification?.english_summary}</p>
                </div>

                {result.notifications && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Notifications</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(result.notifications).map(([channel, status]) => (
                        <span key={channel} style={{
                          fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                          background: String(status) === 'sent' ? '#D1FAE5' : '#F3F4F6',
                          color: String(status) === 'sent' ? '#065F46' : '#6B7280'
                        }}>
                          {channel}: {String(status)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.classification?.followup_prompt && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Follow-up prompt queued</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>{result.classification.followup_prompt}</p>
                  </div>
                )}

                {result.classification?.extracted_entities && Object.keys(result.classification.extracted_entities).length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>Extracted entities</p>
                    <pre style={{ fontSize: '12px', background: '#F9FAFB', borderRadius: '8px', padding: '12px', overflow: 'auto', color: '#374151' }}>
                      {JSON.stringify(result.classification.extracted_entities, null, 2)}
                    </pre>
                  </div>
                )}

                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Recording saved → check your dashboard to see it appear.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
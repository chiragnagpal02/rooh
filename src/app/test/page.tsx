'use client'

import { useState } from 'react'

export default function TestPage() {
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState('english')
  const [familyId, setFamilyId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function runTest() {
    if (!transcript || !familyId) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/test-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language, family_id: familyId })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: 'Request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-medium text-gray-900 mb-2">Rooh — pipeline tester</h1>
        <p className="text-sm text-gray-500 mb-6">
          Simulate a parent voice note without WhatsApp.
          Paste a transcript, hit run, then check your dashboard.
        </p>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">

          <div>
            <label className="text-xs text-gray-500 block mb-1">Family ID</label>
            <input
              type="text"
              placeholder="Paste your family ID from Supabase"
              value={familyId}
              onChange={e => setFamilyId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="tamil">Tamil</option>
              <option value="kannada">Kannada</option>
              <option value="punjabi">Punjabi</option>
              <option value="mandarin">Mandarin</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Transcript — paste what the parent said
            </label>
            <textarea
              rows={5}
              placeholder="e.g. I remember when I was young, we lived in a small house in Chennai. My mother used to make the best sambar. Also, my LIC policy number is 48392, the documents are in the blue folder..."
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 resize-none"
            />
          </div>

          <button
            onClick={runTest}
            disabled={loading || !transcript || !familyId}
            className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Running pipeline...' : 'Run pipeline'}
          </button>
        </div>

        {result && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
            {result.error ? (
              <p className="text-sm text-red-500">{result.error}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-medium text-sm">Pipeline succeeded</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    {result.classification.primary_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(result.classification.confidence * 100)}% confidence
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">English summary</p>
                  <p className="text-sm text-gray-700">{result.classification.english_summary}</p>
                </div>

                {result.classification.followup_prompt && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Follow-up prompt queued</p>
                    <p className="text-sm text-gray-500 italic">
                      {result.classification.followup_prompt}
                    </p>
                  </div>
                )}

                {Object.keys(result.classification.extracted_entities).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Extracted entities</p>
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto text-gray-600">
                      {JSON.stringify(result.classification.extracted_entities, null, 2)}
                    </pre>
                  </div>
                )}

                <p className="text-xs text-gray-400 pt-1">
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
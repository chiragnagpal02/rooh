'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Recording, RecordingType } from '@/types'

const TYPE_LABELS: Record<RecordingType, string> = {
  story: 'Life story',
  practical: 'Practical',
  legacy: 'Legacy',
  mixed: 'Mixed',
  untagged: 'Untagged'
}

const TYPE_COLORS: Record<RecordingType, string> = {
  story: 'bg-purple-100 text-purple-800',
  practical: 'bg-emerald-100 text-emerald-800',
  legacy: 'bg-amber-100 text-amber-800',
  mixed: 'bg-coral-100 text-orange-800',
  untagged: 'bg-gray-100 text-gray-600'
}

export default function Dashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [filter, setFilter] = useState<RecordingType | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecordings()
  }, [])

  async function fetchRecordings() {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setRecordings(data)
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? recordings
    : recordings.filter(r => r.primary_type === filter)

  const counts = {
    all: recordings.length,
    story: recordings.filter(r => r.primary_type === 'story').length,
    practical: recordings.filter(r => r.primary_type === 'practical').length,
    legacy: recordings.filter(r => r.primary_type === 'legacy').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900">روح Rooh</h1>
          <p className="text-gray-500 text-sm mt-1">Your family archive</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total recordings', value: counts.all },
            { label: 'Stories', value: counts.story },
            { label: 'Practical info', value: counts.practical },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-medium text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'story', 'practical', 'legacy'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : `${TYPE_LABELS[f]} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Recordings */}
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No recordings yet.</p>
            <p className="text-gray-400 text-xs mt-1">
              Set up WhatsApp to start receiving your parent's stories.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(recording => (
              <div
                key={recording.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                {/* Card header */}
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpanded(
                    expanded === recording.id ? null : recording.id
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">
                        {recording.english_summary?.split('.')[0] || 'Recording'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[recording.primary_type]}`}>
                          {TYPE_LABELS[recording.primary_type]}
                        </span>
                        {recording.language_detected && (
                          <span className="text-xs text-gray-400">
                            {recording.language_detected}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(recording.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-300 text-sm flex-shrink-0">
                      {expanded === recording.id ? '↑' : '↓'}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {expanded === recording.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">

                    {/* Audio player */}
                    {recording.audio_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1.5">Original recording</p>
                        <audio
                          controls
                          src={recording.audio_url}
                          className="w-full h-8"
                        />
                      </div>
                    )}

                    {/* Full summary */}
                    {recording.english_summary && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Summary</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {recording.english_summary}
                        </p>
                      </div>
                    )}

                    {/* Original transcript */}
                    {recording.transcript_original &&
                     recording.primary_type !== 'legacy' && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Original transcript ({recording.language_detected})
                        </p>
                        <p className="text-sm text-gray-500 italic leading-relaxed bg-gray-50 rounded-lg p-3">
                          {recording.transcript_original}
                        </p>
                      </div>
                    )}

                    {/* Extracted entities */}
                    {recording.extracted_entities &&
                     Object.keys(recording.extracted_entities).length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Extracted information</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(recording.extracted_entities).map(([key, values]) =>
                            Array.isArray(values) && values.map((v: any, i: number) => (
                              <span
                                key={`${key}-${i}`}
                                className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg"
                              >
                                <span className="text-emerald-500 mr-1">{key}</span>
                                {Object.values(v).filter(Boolean).join(' · ')}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Needs review flag */}
                    {recording.needs_review && (
                      <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        This recording needs manual review — classification confidence was low.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
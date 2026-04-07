export type RecordingType = 'story' | 'practical' | 'legacy' | 'mixed' | 'untagged'

export interface Family {
  id: string
  adult_child_email: string
  adult_child_name: string
  parent_name: string
  parent_whatsapp: string
  created_at: string
}

export interface ExtractedEntities {
  insurance?: { provider: string; number: string; type: string }[]
  bank?: { name: string; branch: string; details: string }[]
  medical?: { name: string; role: string; contact?: string }[]
  medicines?: { name: string; frequency?: string }[]
  property?: { description: string; location: string }[]
  contacts?: { name: string; relation: string; number?: string }[]
}

export interface Recording {
  id: string
  family_id: string
  audio_url: string | null
  language_detected: string | null
  transcript_original: string | null
  english_summary: string | null
  primary_type: RecordingType
  story_tags: string[]
  legacy_tags: string[]
  extracted_entities: Record<string, any[]>
  classification_confidence: number
  needs_review: boolean
  created_at: string
  is_new?: boolean
}

export interface ClassificationResult {
  primary_type: RecordingType
  story_tags: string[]
  legacy_tags: string[]
  extracted_entities: ExtractedEntities
  english_summary: string
  confidence: number
  needs_review: boolean
  followup_prompt?: string
}

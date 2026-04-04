import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { classifyRecording } from '@/lib/classify'
import { getPostHogClient } from '@/lib/posthog-server'

// This simulates what happens when a parent sends a voice note
// We skip the audio step and feed a transcript directly
export async function POST(req: NextRequest) {
  try {
    const { transcript, language, family_id } = await req.json()

    if (!transcript || !family_id) {
      return NextResponse.json(
        { error: 'transcript and family_id are required' },
        { status: 400 }
      )
    }

    // Run Claude classification
    const classification = await classifyRecording(
      transcript,
      language || 'english'
    )

    // Save to database
    const { data: recording, error } = await supabaseAdmin
      .from('recordings')
      .insert({
        family_id,
        audio_url: null,
        language_detected: language || 'english',
        transcript_original: transcript,
        english_summary: classification.english_summary,
        primary_type: classification.primary_type,
        story_tags: classification.story_tags,
        legacy_tags: classification.legacy_tags,
        extracted_entities: classification.extracted_entities,
        classification_confidence: classification.confidence,
        needs_review: classification.needs_review,
      })
      .select()
      .single()

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Track the test recording submission
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: family_id,
      event: 'test_recording_submitted',
      properties: {
        recording_id: recording.id,
        family_id,
        primary_type: classification.primary_type,
        language: language || 'english',
        classification_confidence: classification.confidence,
      },
    })

    return NextResponse.json({
      success: true,
      recording,
      classification
    })

  } catch (err) {
    console.error('Test recording error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

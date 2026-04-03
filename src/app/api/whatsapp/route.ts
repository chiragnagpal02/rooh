import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { transcribeAudio } from '@/lib/whisper'
import { classifyRecording } from '@/lib/classify'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// 360dialog sends a GET request to verify your webhook
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// This runs every time your parent sends a WhatsApp message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extract the message from the WhatsApp payload
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    // Only process voice notes — ignore text messages for now
    if (!message || message.type !== 'audio') {
      return NextResponse.json({ status: 'ignored' })
    }

    const from = message.from // parent's phone number
    const audioId = message.audio.id

    // 1. Find which family this parent belongs to
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('parent_whatsapp', from)
      .single()

    if (familyError || !family) {
      console.error('Unknown parent number:', from)
      return NextResponse.json({ status: 'unknown_parent' })
    }

    // 2. Download the audio file from WhatsApp
    const audioBuffer = await downloadWhatsAppAudio(audioId)
    if (!audioBuffer) {
      return NextResponse.json({ status: 'audio_download_failed' })
    }

    // 3. Upload audio to Supabase storage
    const filename = '${family.id}/${Date.now()}.ogg'
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('recordings')
      .upload(filename, audioBuffer, { contentType: 'audio/ogg' })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ status: 'upload_failed' })
    }

    // 4. Get public URL for the audio
    const { data: urlData } = supabaseAdmin
      .storage
      .from('recordings')
      .getPublicUrl(filename)

    // 5. Transcribe with Whisper
    const { text: transcript, language } = await transcribeAudio(
      audioBuffer,
      filename
    )

    // 6. Classify with Claude
    const classification = await classifyRecording(transcript, language)

    // 7. Save everything to database
    const { data: recording, error: recordingError } = await supabaseAdmin
      .from('recordings')
      .insert({
        family_id: family.id,
        audio_url: urlData.publicUrl,
        language_detected: language,
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

    if (recordingError) {
      console.error('DB insert error:', recordingError)
      return NextResponse.json({ status: 'db_error' })
    }

    // 8. Send confirmation back to parent on WhatsApp
    const confirmationMessage = getConfirmationMessage(
      family.parent_name,
      classification.primary_type
    )
    await sendWhatsAppMessage(from, confirmationMessage)

    // 9. If Claude suggested a follow-up, queue it
    if (classification.followup_prompt) {
      await sendWhatsAppMessage(
        from,
        'One follow-up question when you have a moment:\n\n${classification.followup_prompt}'
      )
    }

    console.log('✓ Recording saved for family ${family.id} — type: ${classification.primary_type}')
    return NextResponse.json({ status: 'success', recording_id: recording.id })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

// Download audio file from WhatsApp servers
async function downloadWhatsAppAudio(audioId: string): Promise<Buffer | null> {
  const apiKey = process.env.WHATSAPP_API_KEY
  if (!apiKey) return null

  try {
    // Get the download URL
    const metaRes = await fetch(
      'https://waba.360dialog.io/v1/media/${audioId}',
      { headers: { 'D360-API-KEY': apiKey } }
    )
    const meta = await metaRes.json()

    // Download the actual audio
    const audioRes = await fetch(meta.url, {
      headers: { 'D360-API-KEY': apiKey }
    })
    const arrayBuffer = await audioRes.arrayBuffer()
    return Buffer.from(arrayBuffer)

  } catch (err) {
    console.error('Audio download error:', err)
    return null
  }
}

// Warm confirmation message back to parent
function getConfirmationMessage(parentName: string, type: string): string {
  const name = parentName.split(' ')[0]

  const messages: Record<string, string> = {
    story: 'Thank you ' + name + ' \uD83D\uDE4F Your memory has been saved safely. Your family will treasure this.',
    practical: 'Thank you ' + name + '. That important information has been saved for your family.',
    legacy: 'Thank you ' + name + ' \uD83D\uDE4F Your message has been saved with care, in your exact words.',
    mixed: 'Thank you ' + name + ' \uD83D\uDE4F Your recording has been saved safely for your family.',
    untagged: 'Thank you ' + name + '. Your recording has been saved.'
  }

  return messages[type] || messages.untagged
}
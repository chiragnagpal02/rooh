import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { transcribeAudio } from '@/lib/whisper'
import { classifyRecording } from '@/lib/classify'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message || message.type !== 'audio') {
      return NextResponse.json({ status: 'ignored' })
    }

    const from = message.from
    const audioId = message.audio.id

    const { data: family } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('parent_whatsapp', from)
      .single()

    if (!family) {
      console.log('Unknown number:', from)
      return NextResponse.json({ status: 'unknown_parent' })
    }

    const audioBuffer = await downloadMetaAudio(audioId)
    if (!audioBuffer) {
      return NextResponse.json({ status: 'audio_download_failed' })
    }

    const filename = `${family.id}/${Date.now()}.ogg`
    await supabaseAdmin.storage
      .from('recordings')
      .upload(filename, audioBuffer, { contentType: 'audio/ogg' })

    const { data: urlData } = supabaseAdmin.storage
      .from('recordings')
      .getPublicUrl(filename)

    const { text: transcript, language } = await transcribeAudio(audioBuffer, filename)

    const classification = await classifyRecording(transcript, language)

    await supabaseAdmin.from('recordings').insert({
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

    await sendWhatsAppMessage(
      from,
      getConfirmationMessage(family.parent_name, classification.primary_type)
    )

    if (classification.followup_prompt) {
      await sendWhatsAppMessage(from, classification.followup_prompt)
    }

    return NextResponse.json({ status: 'success' })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

async function downloadMetaAudio(audioId: string): Promise<Buffer | null> {
  const token = process.env.WHATSAPP_API_KEY
  if (!token) return null

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v18.0/${audioId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const meta = await metaRes.json()

    const audioRes = await fetch(meta.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const arrayBuffer = await audioRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error('Audio download error:', err)
    return null
  }
}

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
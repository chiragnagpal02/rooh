import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { classifyRecording } from '@/lib/classify'
import { getPostHogClient } from '@/lib/posthog-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { transcript, language, family_id, parent_id } = await req.json()

    if (!transcript || !family_id) {
      return NextResponse.json(
        { error: 'transcript and family_id are required' },
        { status: 400 }
      )
    }

    const { data: family } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', family_id)
      .single()

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Fetch parent name for notification
    let parentName = 'Your parent'
    if (parent_id) {
      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('name')
        .eq('id', parent_id)
        .single()
      if (parent) parentName = parent.name
    } else {
      const { data: firstParent } = await supabaseAdmin
        .from('parents')
        .select('name')
        .eq('family_id', family_id)
        .limit(1)
        .single()
      if (firstParent) parentName = firstParent.name
    }

    const classification = await classifyRecording(
      transcript,
      language || 'english'
    )

    const { data: recording, error } = await supabaseAdmin
      .from('recordings')
      .insert({
        family_id,
        parent_id: parent_id || null,
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

    const notifResults = await notifyAdultChild(parentName, family, classification.primary_type)

    return NextResponse.json({
      success: true,
      recording,
      classification,
      notifications: notifResults,
    })

  } catch (err) {
    console.error('Test recording error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

async function notifyAdultChild(parentName: string, family: any, recordingType: string) {
  const parentFirstName = parentName.split(' ')[0]
  const adultFirstName = family.adult_child_name.split(' ')[0]
  const results: { whatsapp?: string; email?: string } = {}

  if (family.notify_whatsapp && family.adult_child_whatsapp) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: family.adult_child_whatsapp,
            type: 'template',
            template: {
              name: 'rooh_notify_child',
              language: { code: 'en' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: adultFirstName },
                  { type: 'text', text: parentFirstName },
                ],
              }],
            },
          }),
        }
      )
      const data = await response.json()
      results.whatsapp = response.ok ? 'sent' : `failed: ${JSON.stringify(data)}`
    } catch (err) {
      results.whatsapp = `error: ${String(err)}`
    }
  } else {
    results.whatsapp = family.notify_whatsapp
      ? 'skipped: no adult_child_whatsapp number'
      : 'skipped: notify_whatsapp is off'
  }

  if (family.notify_email && family.adult_child_email) {
    try {
      await resend.emails.send({
        from: 'Rooh <hello@rooh.family>',
        to: family.adult_child_email,
        subject: `${parentFirstName} just recorded a memory for you 🙏`,
        html: getEmailHtml(adultFirstName, parentFirstName),
      })
      results.email = 'sent'
    } catch (err) {
      results.email = `error: ${String(err)}`
    }
  } else {
    results.email = family.notify_email
      ? 'skipped: no email'
      : 'skipped: notify_email is off'
  }

  console.log('Notification results:', results)
  return results
}

function getEmailHtml(adultName: string, parentName: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #FDF8F3; font-family: Georgia, serif;">
  <div style="max-width: 480px; margin: 40px auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 28px; color: #1C1917; margin: 0; letter-spacing: 1px;">Rooh</p>
    </div>
    <div style="background: white; border: 0.5px solid #E8E0D5; border-radius: 16px; padding: 32px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 16px;">🙏</div>
      <h1 style="font-size: 22px; font-weight: 400; color: #1C1917; margin: 0 0 12px;">
        ${parentName} recorded a memory
      </h1>
      <p style="font-size: 15px; color: #57534E; line-height: 1.7; margin: 0 0 28px;">
        Hi ${adultName}, ${parentName} just shared something with you on Rooh.
        Open your archive to listen to it.
      </p>
      <a href="https://rooh.family/dashboard"
        style="display: inline-block; padding: 14px 32px; background: #1C1917; color: #FDF8F3; text-decoration: none; border-radius: 10px; font-size: 15px; font-family: sans-serif;">
        Open your archive
      </a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #A8A29E; margin-top: 24px; font-family: sans-serif;">
      You're receiving this because you set up notifications in Rooh.
      <a href="https://rooh.family/dashboard" style="color: #A8A29E;">Manage settings</a>
    </p>
  </div>
</body>
</html>
  `
}
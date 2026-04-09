import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const recording_id = req.nextUrl.searchParams.get('recording_id')
  if (!recording_id) return NextResponse.json({ reactions: [] })

  const { data: reactions } = await supabaseAdmin
    .from('reactions')
    .select('*')
    .eq('recording_id', recording_id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ reactions: reactions || [] })
}

export async function POST(req: NextRequest) {
  try {
    const { recording_id, emoji, message, user_email, adult_name } = await req.json()

    const { data: family } = await supabaseAdmin
      .from('families')
      .select('id')
      .eq('adult_child_email', user_email)
      .single()

    if (!family) return NextResponse.json({ success: false, error: 'Family not found' })

    const { data: reaction, error } = await supabaseAdmin
      .from('reactions')
      .insert({ recording_id, family_id: family.id, emoji, message: message || null })
      .select()
      .single()

    if (error) {
      console.error('Reaction insert error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    const { data: recording } = await supabaseAdmin
      .from('recordings')
      .select('parent_id')
      .eq('id', recording_id)
      .single()

    if (recording?.parent_id) {
      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('name, whatsapp')
        .eq('id', recording.parent_id)
        .single()

      if (parent) {
        const adultFirstName = adult_name.split(' ')[0]
        const notifMessage = message?.trim() || 'with love'

        await fetch(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: parent.whatsapp,
              type: 'template',
              template: {
                name: 'rooh_reaction',
                language: { code: 'en' },
                components: [{
                  type: 'body',
                  parameters: [
                    { type: 'text', text: adultFirstName },
                    { type: 'text', text: emoji },
                    { type: 'text', text: notifMessage },
                  ],
                }],
              },
            }),
          }
        )
      }
    }

    return NextResponse.json({ success: true, reaction })
  } catch (err) {
    console.error('React error:', err)
    return NextResponse.json({ success: false, error: 'Something went wrong' })
  }
}
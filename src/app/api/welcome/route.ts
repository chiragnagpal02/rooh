import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { family_id } = await req.json()

    const { data: family } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', family_id)
      .single()

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const parentFirstName = family.parent_name.split(' ')[0]
    const adultFirstName = family.adult_child_name.split(' ')[0]

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: family.parent_whatsapp,
          type: 'template',
          template: {
            name: 'rooh_welcome',
            language: { code: 'en' },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: parentFirstName },
                { type: 'text', text: adultFirstName }
              ]
            }]
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return NextResponse.json({ error: 'WhatsApp send failed', detail: data }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Welcome message error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
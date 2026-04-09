import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { parent_id } = await req.json()

    // Fetch parent + family in one query
    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('*, families(*)')
      .eq('id', parent_id)
      .single()

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const family = parent.families as any
    const parentFirstName = parent.name.split(' ')[0]
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
          to: parent.whatsapp,
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
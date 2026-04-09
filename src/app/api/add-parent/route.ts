import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { family_id, name, whatsapp } = await req.json()

    if (!family_id || !name || !whatsapp) {
      return NextResponse.json({ error: 'family_id, name and whatsapp are required' }, { status: 400 })
    }

    // Insert into parents table
    const { data: parent, error: insertError } = await supabaseAdmin
      .from('parents')
      .insert({ family_id, name, whatsapp })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message, code: insertError.code },
        { status: 500 }
      )
    }

    // Fetch family for adult child name
    const { data: family } = await supabaseAdmin
      .from('families')
      .select('adult_child_name')
      .eq('id', family_id)
      .single()

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const parentFirstName = name.split(' ')[0]
    const adultFirstName = family.adult_child_name.split(' ')[0]

    // Send welcome WhatsApp message
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
          to: whatsapp,
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

    const waData = await response.json()
    if (!response.ok) {
      console.error('WhatsApp welcome failed:', waData)
      // Still return the parent — they were added, just the message failed
      return NextResponse.json({ parent, warning: 'Parent added but welcome message failed' })
    }

    return NextResponse.json({ parent })

  } catch (err) {
    console.error('Add parent error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
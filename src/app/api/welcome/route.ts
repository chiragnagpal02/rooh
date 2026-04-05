import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

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

    const name = family.parent_name.split(' ')[0]

    const message = `Namaste ${name} 🙏

Your family has set up Rooh for you - a safe place to preserve your stories and memories for them.

All you need to do is send me a voice note, in any language, whenever you feel like sharing something. A memory, a story, something important - anything at all.

I'll make sure it reaches your family safely.

Try it now - just press and hold the microphone button and start talking. 😊`

    await sendWhatsAppMessage(family.parent_whatsapp, message)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Welcome message error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ prompts: [] })

  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('adult_child_email', email)
    .single()

  if (!family) return NextResponse.json({ prompts: [] })

  const { data: prompts } = await supabaseAdmin
    .from('prompt_log')
    .select('*')
    .eq('family_id', family.id)
    .order('sent_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ prompts: prompts || [] })
}
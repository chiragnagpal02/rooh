import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { recording_id } = await req.json()

  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('adult_child_email', user.email)
    .single()

  if (!family) {
    return NextResponse.json({ error: 'Family not found' }, { status: 404 })
  }

  // Upsert — safe to call multiple times
  await supabaseAdmin
    .from('seen_recordings')
    .upsert({
      family_id: family.id,
      recording_id
    }, { onConflict: 'family_id,recording_id' })

  return NextResponse.json({ success: true })
}
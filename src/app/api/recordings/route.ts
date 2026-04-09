import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('adult_child_email', user.email)
    .single()

  if (!family) {
    return NextResponse.json({ recordings: [], parents: [], lastActive: null })
  }

  // Fetch all parents for this family
  const { data: parents } = await supabaseAdmin
    .from('parents')
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: true })

  // Most recent last_active across all parents
  const lastActive = parents?.reduce((latest, p) => {
    if (!p.last_active) return latest
    if (!latest) return p.last_active
    return p.last_active > latest ? p.last_active : latest
  }, null as string | null) ?? null

  const { data, error } = await supabaseAdmin
    .from('recordings')
    .select('*, parents(name)')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get seen recording IDs
  const { data: seenData } = await supabaseAdmin
    .from('seen_recordings')
    .select('recording_id')
    .eq('family_id', family.id)

  const seenIds = new Set((seenData || []).map(s => s.recording_id))

  const recordingsWithSignedUrls = await Promise.all(
    (data || []).map(async (recording) => {
      if (!recording.audio_url) return { ...recording, is_new: !seenIds.has(recording.id) }
      const urlParts = recording.audio_url.split('/recordings/')
      if (urlParts.length < 2) return { ...recording, is_new: !seenIds.has(recording.id) }
      const filePath = urlParts[1]
      const { data: signedData } = await supabaseAdmin
        .storage
        .from('recordings')
        .createSignedUrl(filePath, 3600)
      if (!signedData) return { ...recording, is_new: !seenIds.has(recording.id) }
      return {
        ...recording,
        audio_url: signedData.signedUrl,
        is_new: !seenIds.has(recording.id)
      }
    })
  )

  return NextResponse.json({
    recordings: recordingsWithSignedUrls,
    parents: parents || [],
    lastActive,
  })
}
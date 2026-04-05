import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get family for this logged-in user only
  const { data: family } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('adult_child_email', user.email)
    .single()

  if (!family) {
    return NextResponse.json({ recordings: [] })
  }

  // Only fetch recordings for this family
  const { data, error } = await supabaseAdmin
    .from('recordings')
    .select('*')
    .eq('family_id', family.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate signed URLs
  const recordingsWithSignedUrls = await Promise.all(
    (data || []).map(async (recording) => {
      if (!recording.audio_url) return recording
      const urlParts = recording.audio_url.split('/recordings/')
      if (urlParts.length < 2) return recording
      const filePath = urlParts[1]
      const { data: signedData } = await supabaseAdmin
        .storage
        .from('recordings')
        .createSignedUrl(filePath, 3600)
      if (!signedData) return recording
      return { ...recording, audio_url: signedData.signedUrl }
    })
  )

  return NextResponse.json({ recordings: recordingsWithSignedUrls })
}
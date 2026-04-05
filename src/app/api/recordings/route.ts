import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate signed URLs for each recording
  const recordingsWithSignedUrls = await Promise.all(
    (data || []).map(async (recording) => {
      if (!recording.audio_url) return recording

      // Extract the file path from the public URL
      const urlParts = recording.audio_url.split('/recordings/')
      if (urlParts.length < 2) return recording

      const filePath = urlParts[1]

      // Generate a signed URL valid for 1 hour
      const { data: signedData, error: signedError } = await supabaseAdmin
        .storage
        .from('recordings')
        .createSignedUrl(filePath, 3600)

      if (signedError || !signedData) return recording

      return {
        ...recording,
        audio_url: signedData.signedUrl
      }
    })
  )

  return NextResponse.json({ recordings: recordingsWithSignedUrls })
}
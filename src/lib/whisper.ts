import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<{ text: string; language: string }> {
  // Convert Buffer to Uint8Array to satisfy TypeScript
  const uint8Array = new Uint8Array(audioBuffer)
  const blob = new Blob([uint8Array], { type: 'audio/ogg' })
  const file = new File([blob], filename, { type: 'audio/ogg' })

  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json'
  })

  return {
    text: response.text,
    language: (response as any).language || 'unknown'
  }
}
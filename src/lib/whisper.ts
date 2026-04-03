import OpenAI from 'openai'
import { Readable } from 'stream'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<{ text: string; language: string }> {
  // Convert buffer to a File object that OpenAI accepts
  const file = new File([audioBuffer], filename, { type: 'audio/ogg' })

  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json' // gives us language detection
  })

  return {
    text: response.text,
    language: (response as any).language || 'unknown'
  }
}
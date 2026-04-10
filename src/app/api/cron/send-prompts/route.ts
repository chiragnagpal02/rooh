import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayUTC = now.toISOString()

  // Fetch all families with an active schedule
  const { data: families, error } = await supabaseAdmin
    .from('families')
    .select('*, parents(name, whatsapp)')
    .not('prompt_schedule', 'is', null)
    .eq('prompt_schedule_paused', false)

  if (error || !families) {
    console.error('Cron fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch families' }, { status: 500 })
  }

  const results: { familyId: string; status: string }[] = []

  for (const family of families) {
    try {
      const schedule = family.prompt_schedule as {
        day: string; time: string; frequency: string; timezone: string
      }

      // Check if today is the scheduled day in the parent's timezone
      const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: schedule.timezone }))
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const todayInTz = dayNames[nowInTz.getDay()]

      if (todayInTz !== schedule.day) {
        results.push({ familyId: family.id, status: 'skipped: wrong day' })
        continue
      }

      // Check frequency — for every 2 weeks / monthly, check last sent
      if (schedule.frequency !== 'Every week') {
        const { data: lastPrompt } = await supabaseAdmin
          .from('prompt_log')
          .select('sent_at')
          .eq('family_id', family.id)
          .eq('prompt_category', 'scheduled')
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        if (lastPrompt) {
          const lastSent = new Date(lastPrompt.sent_at)
          const daysSinceLast = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24))

          if (schedule.frequency === 'Every 2 weeks' && daysSinceLast < 13) {
            results.push({ familyId: family.id, status: 'skipped: too soon (2 weeks)' })
            continue
          }
          if (schedule.frequency === 'Every month' && daysSinceLast < 27) {
            results.push({ familyId: family.id, status: 'skipped: too soon (monthly)' })
            continue
          }
        }
      }

      // Fetch recent prompt history to avoid repetition
      const { data: recentPrompts } = await supabaseAdmin
        .from('prompt_log')
        .select('prompt_text')
        .eq('family_id', family.id)
        .order('sent_at', { ascending: false })
        .limit(10)

      const recentTopics = recentPrompts?.map(p => p.prompt_text).join('\n') || 'None yet'

      // Generate a personalised prompt via Claude
      const parentNames = (family.parents as any[]).map((p: any) => p.name).join(', ')
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are generating a WhatsApp prompt for an elderly parent named ${parentNames} to record a voice memory for their family.

Recent prompts already sent (avoid similar topics):
${recentTopics}

Generate ONE warm, specific, open-ended question in English that invites a personal story or memory. Keep it under 2 sentences. Do not include greetings or sign-offs — just the question itself.`
        }]
      })

      const promptText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : 'What is a memory from your childhood that still makes you smile?'

      // Send to all parents in this family
      for (const parent of (family.parents as any[])) {
        const waResponse = await fetch(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: parent.whatsapp,
              type: 'template',
              template: {
                name: 'rooh_prompt',
                language: { code: 'en' },
                components: [{
                  type: 'body',
                  parameters: [
                    { type: 'text', text: parent.name.split(' ')[0] },
                    { type: 'text', text: promptText },
                  ],
                }],
              },
            }),
          }
        )

        if (!waResponse.ok) {
          const err = await waResponse.json()
          console.error(`WhatsApp failed for ${parent.name}:`, err)
        }
      }

      // Log to prompt_log
      await supabaseAdmin.from('prompt_log').insert({
        family_id: family.id,
        prompt_text: promptText,
        prompt_category: 'scheduled',
      })

      results.push({ familyId: family.id, status: 'sent' })

    } catch (err) {
      console.error(`Error processing family ${family.id}:`, err)
      results.push({ familyId: family.id, status: `error: ${String(err)}` })
    }
  }

  console.log('Cron results:', results)
  return NextResponse.json({ success: true, processed: results.length, results })
}
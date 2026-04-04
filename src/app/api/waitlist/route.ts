import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Add to Resend Audience
    await resend.contacts.create({
      email,
      firstName: name || '',
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    })

    // Send welcome email
    await resend.emails.send({
      from: 'Chirag at Rooh <hello@rooh.family>',
      to: email,
      subject: "Welcome to Rooh, " + (name || 'friend'),
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #1C1917;">
          <p style="font-size: 22px; font-weight: 600; margin: 0 0 24px;">Rooh</p>
          
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
            Thank you for joining the Rooh waitlist.
          </p>
          
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
            You are among the first people who believe that our parents' stories, 
            memories, and everything they carry deserve to be kept safe - not 
            lost quietly with time.
          </p>

          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 16px;">
            We are in early access right now, testing with a small group of families. 
            You will hear from me personally when your spot is ready.
          </p>

          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
            In the meantime - call your parents.
          </p>

          <p style="font-size: 16px; line-height: 1.7; margin: 0;">
            Chirag<br>
            <span style="color: #6B7280; font-size: 14px;">Founder, Rooh</span>
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">
            Rooh - The soul of your family, always with you.
          </p>
        </div>
      `
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
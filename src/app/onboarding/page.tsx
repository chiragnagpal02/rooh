'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [adultName, setAdultName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentWhatsapp, setParentWhatsapp] = useState('')
  const [adultWhatsapp, setAdultWhatsapp] = useState('')

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email || '')

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('adult_child_email', user.email)
      .single()

    if (family) { router.push('/dashboard') }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

async function handleFinish() {
  if (!adultName || !parentName || !parentWhatsapp) return
  setLoading(true)
  setError('')

  try {
    const { data: newFamily, error: insertError } = await supabase
      .from('families')
      .insert({
        adult_child_email: userEmail,
        adult_child_name: adultName,
        parent_name: parentName,
        parent_whatsapp: parentWhatsapp.replace(/\s/g, '').replace('+', ''),
        adult_child_whatsapp: adultWhatsapp
          ? adultWhatsapp.replace(/\s/g, '').replace('+', '')
          : null,
        notify_email: true,
        notify_whatsapp: !!adultWhatsapp,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // Show the actual error so we can see it
      setError(`Error: ${insertError.message} (code: ${insertError.code})`)
      setLoading(false)
      return
    }

    if (newFamily) {
      await fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_id: newFamily.id })
      })
    }

    setStep(4)
  } catch (err) {
    console.error('Caught error:', err)
    setError(`Unexpected error: ${String(err)}`)
    setLoading(false)
  }
}

  const inputStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: '15px',
    border: '1px solid #D6CEC4',
    borderRadius: '10px',
    background: '#FFF9F4',
    color: '#1C1917',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  }

  const btnStyle: React.CSSProperties = {
    padding: '14px',
    background: '#1C1917',
    color: '#FDF8F3',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.15s'
  }

  return (
    <main style={{
      background: '#FDF8F3',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px'
    }}>

      <div style={{ position: 'fixed', top: '16px', right: '24px' }}>
        <button onClick={handleSignOut} style={{ fontSize: '13px', color: '#78716C', background: 'none', border: '0.5px solid #E8E0D5', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="120" height="38" viewBox="0 0 120 38" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 8px', display: 'block' }}>
            <path d="M5 19 Q8 10 11 19 Q14 28 17 19" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="24" y="27" fontFamily="Georgia, serif" fontSize="26" fontWeight="400" fill="#1C1917" letterSpacing="1">Rooh</text>
          </svg>
        </div>

        {/* Context banner */}
        {step !== 4 && (
          <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🙏</span>
            <p style={{ fontSize: '13px', color: '#085041', margin: 0, lineHeight: 1.6 }}>
              Your account is ready - you just need to connect your first parent to get started. This takes about 2 minutes.
            </p>
          </div>
        )}

        {/* Step indicator — 3 dots now */}
        {step !== 4 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: s === step ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: s === step ? '#1D9E75' : s < step ? '#9FE1CB' : '#D6CEC4',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
        )}

        {/* Step 1 — Your name */}
        {step === 1 && (
          <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '32px' }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1C1917', margin: '0 0 8px' }}>
              First, tell us your name
            </h1>
            <p style={{ fontSize: '14px', color: '#78716C', margin: '0 0 28px', lineHeight: 1.6 }}>
              This is how we'll personalise your family archive.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>Your name</label>
                <input type="text" placeholder="e.g. Chirag" value={adultName} onChange={e => setAdultName(e.target.value)} style={inputStyle} autoFocus />
              </div>
              <button onClick={() => adultName && setStep(2)} disabled={!adultName} style={{ ...btnStyle, opacity: !adultName ? 0.5 : 1 }}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Parent details */}
        {step === 2 && (
          <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '32px' }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1C1917', margin: '0 0 8px' }}>
              Now, tell us about your parent
            </h1>
            <p style={{ fontSize: '14px', color: '#78716C', margin: '0 0 4px', lineHeight: 1.6 }}>
              We'll connect them via WhatsApp so they can start sharing memories in their own language, at their own pace.
            </p>
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 24px', lineHeight: 1.5 }}>
              You can add more family members from your dashboard later.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>Their name</label>
                <input type="text" placeholder="e.g. Amma, Papa, Maa" value={parentName} onChange={e => setParentName(e.target.value)} style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>Their WhatsApp number</label>
                <input type="tel" placeholder="e.g. 919876543210" value={parentWhatsapp} onChange={e => setParentWhatsapp(e.target.value)} style={inputStyle} />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Include country code without "+". e.g. 91 for India, 65 for Singapore.
                </p>
              </div>
              {error && <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', width: 'auto', padding: '14px 20px' }}>
                  Back
                </button>
                <button onClick={() => parentName && parentWhatsapp && setStep(3)} disabled={!parentName || !parentWhatsapp} style={{ ...btnStyle, flex: 1, opacity: !parentName || !parentWhatsapp ? 0.5 : 1 }}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Your WhatsApp (optional) */}
        {step === 3 && (
          <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '32px' }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1C1917', margin: '0 0 8px' }}>
              Where should we notify you?
            </h1>
            <p style={{ fontSize: '14px', color: '#78716C', margin: '0 0 4px', lineHeight: 1.6 }}>
              Get a WhatsApp message when {parentName} records a new memory.
            </p>
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 24px', lineHeight: 1.5 }}>
              Optional — you'll always get email notifications. You can change this later in Settings.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Email — pre-filled, non-editable */}
              <div style={{ padding: '14px 18px', border: '1px solid #D6CEC4', borderRadius: '10px', background: '#F5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 2px' }}>Email (always on)</p>
                  <p style={{ fontSize: '14px', color: '#78716C', margin: 0 }}>{userEmail}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#085041' }}>On</span>
              </div>

              {/* WhatsApp — optional */}
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                  Your WhatsApp number <span style={{ color: '#A8A29E' }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 6591234567"
                  value={adultWhatsapp}
                  onChange={e => setAdultWhatsapp(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Include country code without "+". e.g. 65 for Singapore, 91 for India.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', width: 'auto', padding: '14px 20px' }}>
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  style={{ ...btnStyle, flex: 1, opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? 'Setting up...' : adultWhatsapp ? 'Finish setup' : 'Skip for now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && (
          <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FAF6', border: '2px solid #1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
              🙏
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 400, color: '#1C1917', margin: '0 0 12px' }}>
              Rooh is ready, {adultName}.
            </h1>
            <p style={{ fontSize: '15px', color: '#57534E', margin: '0 0 16px', lineHeight: 1.6 }}>
              We've saved {parentName}'s details.
            </p>
            <p style={{ fontSize: '14px', color: '#78716C', margin: '0 0 12px', lineHeight: 1.6, background: '#F0FAF6', padding: '12px 16px', borderRadius: '10px', border: '0.5px solid #9FE1CB' }}>
              {parentName} will receive a welcome message on WhatsApp and can start recording memories right away.
            </p>
            {adultWhatsapp && (
              <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 12px', lineHeight: 1.5 }}>
                You'll get a WhatsApp notification each time {parentName} records something new.
              </p>
            )}
            <p style={{ fontSize: '13px', color: '#A8A29E', margin: '0 0 28px', lineHeight: 1.5 }}>
              You can manage notifications and add more family members from your dashboard.
            </p>
            <button onClick={() => router.push('/dashboard')} style={btnStyle}>
              Go to your archive
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
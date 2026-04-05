'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

type Step = 1 | 2 | 3

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

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserEmail(user.email || '')

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('adult_child_email', user.email)
      .single()

    if (family) {
      router.push('/dashboard')
    }
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
      const { error: insertError } = await supabase
        .from('families')
        .insert({
          adult_child_email: userEmail,
          adult_child_name: adultName,
          parent_name: parentName,
          parent_whatsapp: parentWhatsapp.replace(/\s/g, ''),
        })

      if (insertError) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setStep(3)
    } catch {
      setError('Something went wrong. Please try again.')
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

      {/* Sign out button — fixed top right */}
      <div style={{ position: 'fixed', top: '16px', right: '24px' }}>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: '13px',
            color: '#78716C',
            background: 'none',
            border: '0.5px solid #E8E0D5',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer'
          }}
        >
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

        {/* Context banner — steps 1 and 2 only */}
        {step !== 3 && (
          <div style={{
            background: '#F0FAF6',
            border: '0.5px solid #9FE1CB',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🙏</span>
            <p style={{
              fontSize: '13px',
              color: '#085041',
              margin: 0,
              lineHeight: 1.6
            }}>
              Your account is ready - you just need to connect your first parent to get started. This takes about 2 minutes.
            </p>
          </div>
        )}

        {/* Step indicator */}
        {step !== 3 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
            {[1, 2].map(s => (
              <div
                key={s}
                style={{
                  width: s === step ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: s === step ? '#1D9E75' : '#D6CEC4',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Step 1 — Adult child name */}
        {step === 1 && (
          <div style={{
            background: '#FFF9F4',
            border: '0.5px solid #E8E0D5',
            borderRadius: '16px',
            padding: '32px'
          }}>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              fontWeight: 400,
              color: '#1C1917',
              margin: '0 0 8px'
            }}>
              First, tell us your name
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 28px',
              lineHeight: 1.6
            }}>
              This is how we'll personalise your family archive.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                  Your name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chirag"
                  value={adultName}
                  onChange={e => setAdultName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <button
                onClick={() => adultName && setStep(2)}
                disabled={!adultName}
                style={{ ...btnStyle, opacity: !adultName ? 0.5 : 1 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Parent details */}
        {step === 2 && (
          <div style={{
            background: '#FFF9F4',
            border: '0.5px solid #E8E0D5',
            borderRadius: '16px',
            padding: '32px'
          }}>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              fontWeight: 400,
              color: '#1C1917',
              margin: '0 0 8px'
            }}>
              Now, tell us about your parent
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 4px',
              lineHeight: 1.6
            }}>
              We'll connect them via WhatsApp so they can start sharing memories in their own language, at their own pace.
            </p>
            <p style={{
              fontSize: '13px',
              color: '#A8A29E',
              margin: '0 0 24px',
              lineHeight: 1.5
            }}>
              You can add more family members from your dashboard later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                  Their name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amma, Papa, Maa"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                  Their WhatsApp number
                </label>
                <input
                  type="tel"
                  placeholder="eg. 919876543210"
                  value={parentWhatsapp}
                  onChange={e => setParentWhatsapp(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Include country code without the "+" sign: Example, 91 for India, 65 for Singapore.
                </p>
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    ...btnStyle,
                    background: 'transparent',
                    color: '#78716C',
                    border: '0.5px solid #D6CEC4',
                    width: 'auto',
                    padding: '14px 20px'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading || !parentName || !parentWhatsapp}
                  style={{
                    ...btnStyle,
                    flex: 1,
                    opacity: loading || !parentName || !parentWhatsapp ? 0.5 : 1
                  }}
                >
                  {loading ? 'Setting up...' : 'Set up Rooh'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div style={{
            background: '#FFF9F4',
            border: '0.5px solid #E8E0D5',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#F0FAF6',
              border: '2px solid #1D9E75',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              🙏
            </div>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '24px',
              fontWeight: 400,
              color: '#1C1917',
              margin: '0 0 12px'
            }}>
              Rooh is ready, {adultName}.
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#57534E',
              margin: '0 0 16px',
              lineHeight: 1.6
            }}>
              We've saved {parentName}'s details.
            </p>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 12px',
              lineHeight: 1.6,
              background: '#F0FAF6',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '0.5px solid #9FE1CB'
            }}>
              Once your WhatsApp is connected, {parentName} will receive a gentle welcome message and can start recording memories right away.
            </p>
            <p style={{
              fontSize: '13px',
              color: '#A8A29E',
              margin: '0 0 28px',
              lineHeight: 1.5
            }}>
              You can add more family members from your dashboard at any time.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={btnStyle}
            >
              Go to your archive
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
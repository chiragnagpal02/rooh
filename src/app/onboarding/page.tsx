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

    // If family already exists, skip onboarding
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('adult_child_email', user.email)
      .single()

    if (family) {
      router.push('/dashboard')
    }
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
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <svg width="120" height="38" viewBox="0 0 120 38" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 8px', display: 'block' }}>
            <path d="M5 19 Q8 10 11 19 Q14 28 17 19" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="24" y="27" fontFamily="Georgia, serif" fontSize="26" fontWeight="400" fill="#1C1917" letterSpacing="1">Rooh</text>
          </svg>
        </div>

        {/* Step indicator */}
        {step !== 3 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
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
              Welcome to Rooh
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 28px',
              lineHeight: 1.6
            }}>
              Let's set up your family archive. This takes about 2 minutes.
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
              Tell us about your parent
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 28px',
              lineHeight: 1.6
            }}>
              We'll send them a gentle welcome message on WhatsApp — in their language, at their pace.
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
                  placeholder="+91 98765 43210"
                  value={parentWhatsapp}
                  onChange={e => setParentWhatsapp(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Include country code. e.g. +91 for India, +65 for Singapore.
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
              margin: '0 0 8px',
              lineHeight: 1.6
            }}>
              We've saved {parentName}'s details.
            </p>
            <p style={{
              fontSize: '14px',
              color: '#78716C',
              margin: '0 0 32px',
              lineHeight: 1.6,
              background: '#F0FAF6',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '0.5px solid #9FE1CB'
            }}>
              Once your WhatsApp is connected, {parentName} will receive their first message and can start recording memories right away.
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
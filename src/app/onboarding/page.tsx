'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase'

type Step = 1 | 2 | 3 | 4

const COUNTRIES = [
  { name: 'India', code: '91', flag: '🇮🇳' },
  { name: 'Singapore', code: '65', flag: '🇸🇬' },
  { name: 'UAE', code: '971', flag: '🇦🇪' },
  { name: 'UK', code: '44', flag: '🇬🇧' },
  { name: 'USA', code: '1', flag: '🇺🇸' },
  { name: 'Canada', code: '1', flag: '🇨🇦' },
  { name: 'Australia', code: '61', flag: '🇦🇺' },
  { name: 'Malaysia', code: '60', flag: '🇲🇾' },
  { name: 'New Zealand', code: '64', flag: '🇳🇿' },
  { name: 'Germany', code: '49', flag: '🇩🇪' },
  { name: 'Netherlands', code: '31', flag: '🇳🇱' },
  { name: 'Sri Lanka', code: '94', flag: '🇱🇰' },
  { name: 'Bangladesh', code: '880', flag: '🇧🇩' },
  { name: 'Pakistan', code: '92', flag: '🇵🇰' },
  { name: 'Nepal', code: '977', flag: '🇳🇵' },
]

interface ConfirmModalProps {
  parentName: string
  parentNumber: string
  onConfirm: () => void
  onEdit: () => void
  loading: boolean
}

// ✅ At top level — outside OnboardingPage
function PhoneInput({
  country, onCountryChange, number, onNumberChange, placeholder
}: {
  country: typeof COUNTRIES[0]
  onCountryChange: (c: typeof COUNTRIES[0]) => void
  number: string
  onNumberChange: (n: string) => void
  placeholder: string
}) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <select
        value={country.code + country.name}
        onChange={e => {
          const found = COUNTRIES.find(c => c.code + c.name === e.target.value)
          if (found) onCountryChange(found)
        }}
        style={{ padding: '14px 12px', fontSize: '14px', border: '1px solid #D6CEC4', borderRadius: '10px', background: '#FFF9F4', color: '#1C1917', outline: 'none', cursor: 'pointer', flexShrink: 0, width: '130px' }}
      >
        {COUNTRIES.map(c => (
          <option key={c.code + c.name} value={c.code + c.name}>
            {c.flag} +{c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        placeholder={placeholder}
        value={number}
        onChange={e => onNumberChange(e.target.value.replace(/[^0-9\s]/g, ''))}
        style={{ padding: '14px 18px', fontSize: '15px', border: '1px solid #D6CEC4', borderRadius: '10px', background: '#FFF9F4', color: '#1C1917', outline: 'none', flex: 1, boxSizing: 'border-box' as const }}
      />
    </div>
  )
}

function ConfirmModal({ parentName, parentNumber, onConfirm, onEdit, loading }: ConfirmModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px'
    }}>
      <div style={{
        background: '#FFF9F4', border: '0.5px solid #E8E0D5',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🙏</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 400, color: '#1C1917', margin: '0 0 6px' }}>
            Ready to connect {parentName.split(' ')[0]}?
          </h2>
          <p style={{ fontSize: '13px', color: '#78716C', margin: 0, lineHeight: 1.6 }}>
            We'll send a welcome WhatsApp message to this number
          </p>
        </div>

        {/* Number confirmation */}
        <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#085041', margin: '0 0 4px', fontWeight: 500 }}>{parentName}</p>
          <p style={{ fontSize: '18px', color: '#1C1917', margin: 0, fontWeight: 500, letterSpacing: '0.02em' }}>
            +{parentNumber}
          </p>
        </div>

        <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 16px', textAlign: 'center', lineHeight: 1.5 }}>
          Make sure this number is active on WhatsApp before confirming.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onEdit}
            disabled={loading}
            style={{ padding: '12px 20px', background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: '12px', background: '#1C1917', color: '#FDF8F3', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Setting up...' : 'Yes, send welcome message'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const [adultName, setAdultName] = useState('')
  const [parentName, setParentName] = useState('')

  // Parent WhatsApp — split into country + number
  const [parentCountry, setParentCountry] = useState(COUNTRIES[0])
  const [parentNumber, setParentNumber] = useState('')

  // Adult WhatsApp — split into country + number
  const [adultCountry, setAdultCountry] = useState(COUNTRIES[1]) // default Singapore
  const [adultNumber, setAdultNumber] = useState('')

  // Combined numbers
  const parentWhatsapp = `${parentCountry.code}${parentNumber.replace(/\s/g, '')}`
  const adultWhatsapp = adultNumber ? `${adultCountry.code}${adultNumber.replace(/\s/g, '')}` : ''

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email || '')
    const { data: family } = await supabase.from('families').select('id').eq('adult_child_email', user.email).single()
    if (family) { router.push('/dashboard') }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleFinish() {
    setShowConfirm(false)
    setLoading(true)
    setError('')

    try {
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          adult_child_email: userEmail,
          adult_child_name: adultName,
          adult_child_whatsapp: adultWhatsapp || null,
          notify_email: true,
          notify_whatsapp: !!adultWhatsapp,
        })
        .select()
        .single()

      if (familyError) {
        setError(`Error: ${familyError.message} (code: ${familyError.code})`)
        setLoading(false)
        return
      }

      const { data: newParent, error: parentError } = await supabase
        .from('parents')
        .insert({
          family_id: newFamily.id,
          name: parentName,
          whatsapp: parentWhatsapp,
        })
        .select()
        .single()

      if (parentError) {
        if (parentError.code === '23505') {
          setError('This WhatsApp number is already connected to another account.')
        } else {
          setError(`Error: ${parentError.message} (code: ${parentError.code})`)
        }
        setLoading(false)
        return
      }

      if (newParent) {
        await fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: newParent.id })
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
    padding: '14px 18px', fontSize: '15px', border: '1px solid #D6CEC4',
    borderRadius: '10px', background: '#FFF9F4', color: '#1C1917',
    outline: 'none', width: '100%', boxSizing: 'border-box'
  }

  const btnStyle: React.CSSProperties = {
    padding: '14px', background: '#1C1917', color: '#FDF8F3', border: 'none',
    borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
    width: '100%', transition: 'opacity 0.15s'
  }

  const selectStyle: React.CSSProperties = {
    padding: '14px 12px', fontSize: '14px', border: '1px solid #D6CEC4',
    borderRadius: '10px', background: '#FFF9F4', color: '#1C1917',
    outline: 'none', cursor: 'pointer', flexShrink: 0
  }

  
  return (
    <main style={{ background: '#FDF8F3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>

      {/* Confirmation modal */}
      {showConfirm && (
        <ConfirmModal
          parentName={parentName}
          parentNumber={parentWhatsapp}
          onConfirm={handleFinish}
          onEdit={() => setShowConfirm(false)}
          loading={loading}
        />
      )}

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
              Your account is ready — you just need to connect your first parent to get started. This takes about 2 minutes.
            </p>
          </div>
        )}

        {/* Step indicator */}
        {step !== 4 && (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: s === step ? '24px' : '8px', height: '8px', borderRadius: '4px',
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
                <PhoneInput
                  country={parentCountry}
                  onCountryChange={setParentCountry}
                  number={parentNumber}
                  onNumberChange={setParentNumber}
                  placeholder="e.g. 9876543210"
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Enter the number without the country code — we've got that covered.
                </p>
              </div>
              {error && <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', width: 'auto', padding: '14px 20px' }}>
                  Back
                </button>
                <button
                  onClick={() => parentName && parentNumber && setStep(3)}
                  disabled={!parentName || !parentNumber}
                  style={{ ...btnStyle, flex: 1, opacity: !parentName || !parentNumber ? 0.5 : 1 }}
                >
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

              {/* Email — pre-filled */}
              <div style={{ padding: '14px 18px', border: '1px solid #D6CEC4', borderRadius: '10px', background: '#F5F0EA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 2px' }}>Email (always on)</p>
                  <p style={{ fontSize: '14px', color: '#78716C', margin: 0 }}>{userEmail}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#085041' }}>On</span>
              </div>

              {/* Adult WhatsApp — optional, with country picker */}
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                  Your WhatsApp number <span style={{ color: '#A8A29E' }}>(optional)</span>
                </label>
                <PhoneInput
                  country={adultCountry}
                  onCountryChange={setAdultCountry}
                  number={adultNumber}
                  onNumberChange={setAdultNumber}
                  placeholder="e.g. 91234567"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', width: 'auto', padding: '14px 20px' }}>
                  Back
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  style={{ ...btnStyle, flex: 1, opacity: loading ? 0.5 : 1 }}
                >
                  {adultNumber ? 'Finish setup' : 'Skip for now'}
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
            {adultNumber && (
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
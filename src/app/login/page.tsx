'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Incorrect email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '14px 18px',
    fontSize: '15px',
    border: '1px solid #D6CEC4',
    borderRadius: '10px',
    background: '#FDF8F3',
    color: '#1C1917',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
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
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <svg width="120" height="38" viewBox="0 0 120 38" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 8px', display: 'block' }}>
            <path d="M5 19 Q8 10 11 19 Q14 28 17 19" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="24" y="27" fontFamily="Georgia, serif" fontSize="26" fontWeight="400" fill="#1C1917" letterSpacing="1">Rooh</text>
          </svg>
          <p style={{ fontSize: '13px', color: '#78716C', margin: 0 }}>
            The soul of your family, always with you.
          </p>
        </div>

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
            Sign in to Rooh
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#78716C',
            margin: '0 0 24px',
            lineHeight: 1.5
          }}>
            Enter your email and password to access your family archive.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                padding: '14px',
                background: '#1C1917',
                color: '#FDF8F3',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 500,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                opacity: loading || !email || !password ? 0.6 : 1,
                transition: 'opacity 0.15s',
                marginTop: '4px'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            {error && (
              <p style={{ fontSize: '13px', color: '#DC2626', margin: 0, textAlign: 'center' }}>{error}</p>
            )}
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#A8A29E',
          marginTop: '24px'
        }}>
          Don't have an account? Contact Chirag to get set up.
        </p>

      </div>
    </main>
  )
}
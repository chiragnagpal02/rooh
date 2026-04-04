'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
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

        {!sent ? (
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
              Enter your email and we will send you a magic link. No password needed.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  padding: '14px 18px',
                  fontSize: '15px',
                  border: '1px solid #D6CEC4',
                  borderRadius: '10px',
                  background: '#FDF8F3',
                  color: '#1C1917',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box' as const
                }}
              />
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  padding: '14px',
                  background: '#1C1917',
                  color: '#FDF8F3',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  opacity: loading || !email ? 0.6 : 1,
                  transition: 'opacity 0.15s'
                }}
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
              {error && (
                <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
              )}
            </form>
          </div>
        ) : (
          <div style={{
            background: '#F0FAF6',
            border: '1px solid #A7F3D0',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '32px', margin: '0 0 16px' }}>🙏</p>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              color: '#065F46',
              margin: '0 0 12px'
            }}>
              Check your email
            </h2>
            <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 20px', lineHeight: 1.6 }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{
                fontSize: '13px',
                color: '#047857',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Use a different email
            </button>
          </div>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#A8A29E',
          marginTop: '24px'
        }}>
          Don't have an account?{' '}
          <a href="/" style={{ color: '#1D9E75', textDecoration: 'none' }}>
            Learn about Rooh
          </a>
        </p>

      </div>
    </main>
  )
}
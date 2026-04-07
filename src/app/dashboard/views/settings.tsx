'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props { userEmail: string }

export default function SettingsView({ userEmail }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createSupabaseBrowser()
  const router = useRouter()

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSaving(false)
  }

  const inputStyle = { padding: '12px 14px', fontSize: '14px', border: '0.5px solid #E8E0D5', borderRadius: '10px', background: '#FDF8F3', color: '#1C1917', outline: 'none', width: '100%', boxSizing: 'border-box' } as React.CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Account</p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 4px' }}>Email address</p>
          <p style={{ fontSize: '14px', color: '#1C1917', margin: 0 }}>{userEmail}</p>
        </div>
      </div>

      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Change password</p>
        </div>
        <form onSubmit={handleChangePassword} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#78716C', margin: '0 0 6px' }}>New password</p>
            <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#78716C', margin: '0 0 6px' }}>Confirm new password</p>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
          </div>
          {message && <p style={{ fontSize: '13px', color: message.includes('successfully') ? '#085041' : '#DC2626', margin: 0 }}>{message}</p>}
          <button type="submit" disabled={saving || !newPassword || !confirmPassword} style={{ padding: '11px', background: '#1C1917', color: '#FDF8F3', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: saving || !newPassword ? 0.6 : 1 }}>
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
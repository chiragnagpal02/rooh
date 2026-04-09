'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props { userEmail: string }

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: enabled ? '#1D9E75' : '#E8E0D5', position: 'relative', transition: 'background 0.2s', flexShrink: 0
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        position: 'absolute', top: '3px', transition: 'left 0.2s',
        left: enabled ? '23px' : '3px'
      }} />
    </button>
  )
}

export default function SettingsView({ userEmail }: Props) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true)
  const [adultWhatsapp, setAdultWhatsapp] = useState('')
  const [whatsappInput, setWhatsappInput] = useState('')
  const [editingWhatsapp, setEditingWhatsapp] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')

  const supabase = createSupabaseBrowser()

  useEffect(() => { fetchNotifPrefs() }, [])

  async function fetchNotifPrefs() {
    const { data } = await supabase
      .from('families')
      .select('notify_email, notify_whatsapp, adult_child_whatsapp')
      .eq('adult_child_email', userEmail)
      .single()

    if (data) {
      setNotifyEmail(data.notify_email ?? true)
      setNotifyWhatsapp(data.notify_whatsapp ?? true)
      setAdultWhatsapp(data.adult_child_whatsapp || '')
      setWhatsappInput(data.adult_child_whatsapp || '')
    }
  }

  async function handleToggle(field: 'notify_email' | 'notify_whatsapp', val: boolean) {
    if (field === 'notify_email') setNotifyEmail(val)
    else setNotifyWhatsapp(val)

    await supabase
      .from('families')
      .update({ [field]: val })
      .eq('adult_child_email', userEmail)
  }

  async function handleSaveWhatsapp() {
    setSavingNotifs(true)
    setNotifMessage('')
    const cleaned = whatsappInput.replace(/\s/g, '').replace('+', '')
    const { error } = await supabase
      .from('families')
      .update({ adult_child_whatsapp: cleaned })
      .eq('adult_child_email', userEmail)

    if (error) {
      setNotifMessage('Failed to save. Please try again.')
    } else {
      setAdultWhatsapp(cleaned)
      setEditingWhatsapp(false)
      setNotifMessage('Saved.')
      setTimeout(() => setNotifMessage(''), 2000)
    }
    setSavingNotifs(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setMessage(error.message) }
    else { setMessage('Password updated successfully.'); setNewPassword(''); setConfirmPassword('') }
    setSaving(false)
  }

  const inputStyle = {
    padding: '12px 14px', fontSize: '14px', border: '0.5px solid #E8E0D5',
    borderRadius: '10px', background: '#FDF8F3', color: '#1C1917', outline: 'none',
    width: '100%', boxSizing: 'border-box'
  } as React.CSSProperties

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Account */}
      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Account</p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '12px', color: '#A8A29E', margin: '0 0 4px' }}>Email address</p>
          <p style={{ fontSize: '14px', color: '#1C1917', margin: 0 }}>{userEmail}</p>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Notifications</p>
          <p style={{ fontSize: '12px', color: '#A8A29E', margin: '4px 0 0' }}>Get notified when your parent records a new memory</p>
        </div>

        {/* Email toggle */}
        <div style={rowStyle}>
          <div>
            <p style={{ fontSize: '14px', color: '#1C1917', margin: '0 0 2px' }}>Email</p>
            <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>{userEmail}</p>
          </div>
          <Toggle enabled={notifyEmail} onChange={val => handleToggle('notify_email', val)} />
        </div>

        {/* WhatsApp toggle */}
        <div style={{ ...rowStyle, borderBottom: notifyWhatsapp ? '0.5px solid #F5F0EA' : 'none' }}>
          <div>
            <p style={{ fontSize: '14px', color: '#1C1917', margin: '0 0 2px' }}>WhatsApp</p>
            <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
              {adultWhatsapp ? `+${adultWhatsapp}` : 'No number added yet'}
            </p>
          </div>
          <Toggle enabled={notifyWhatsapp} onChange={val => handleToggle('notify_whatsapp', val)} />
        </div>

        {/* WhatsApp number input — shown when toggle is on */}
        {notifyWhatsapp && (
          <div style={{ padding: '16px 20px' }}>
            {!editingWhatsapp && adultWhatsapp ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: '#57534E', margin: 0 }}>+{adultWhatsapp}</p>
                <button
                  onClick={() => setEditingWhatsapp(true)}
                  style={{ fontSize: '13px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="tel"
                  placeholder="e.g. 6591234567"
                  value={whatsappInput}
                  onChange={e => setWhatsappInput(e.target.value)}
                  style={inputStyle}
                  autoFocus={editingWhatsapp}
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>
                  Include country code without "+". e.g. 65 for Singapore, 91 for India.
                </p>
                <button
                  onClick={handleSaveWhatsapp}
                  disabled={savingNotifs || !whatsappInput}
                  style={{
                    padding: '10px', background: '#1C1917', color: '#FDF8F3', border: 'none',
                    borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    opacity: savingNotifs || !whatsappInput ? 0.6 : 1
                  }}
                >
                  {savingNotifs ? 'Saving...' : 'Save number'}
                </button>
                {notifMessage && (
                  <p style={{ fontSize: '13px', color: '#085041', margin: 0 }}>{notifMessage}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change password */}
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
          {message && (
            <p style={{ fontSize: '13px', color: message.includes('successfully') ? '#085041' : '#DC2626', margin: 0 }}>{message}</p>
          )}
          <button
            type="submit"
            disabled={saving || !newPassword || !confirmPassword}
            style={{ padding: '11px', background: '#1C1917', color: '#FDF8F3', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: saving || !newPassword ? 0.6 : 1 }}
          >
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

    </div>
  )
}
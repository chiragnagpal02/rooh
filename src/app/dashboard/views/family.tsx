'use client'

import { useState } from 'react'
import { Parent } from '../page'

interface Props {
  familyId: string
  parents: Parent[]
  userEmail: string
  onParentAdded: (parent: Parent) => void
}

const AVATAR_COLORS = [
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#FAECE7', color: '#712B13' },
]

export default function FamilyView({ familyId, parents, userEmail, onParentAdded }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [parentName, setParentName] = useState('')
  const [parentWhatsapp, setParentWhatsapp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successName, setSuccessName] = useState('')

  async function handleAddParent() {
    if (!parentName || !parentWhatsapp) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/add-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          name: parentName,
          whatsapp: parentWhatsapp.replace(/\s/g, '').replace('+', ''),
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === '23505') {
          setError('This WhatsApp number is already connected to another account.')
        } else {
          setError(data.error || 'Something went wrong. Please try again.')
        }
        setSubmitting(false)
        return
      }

      onParentAdded(data.parent)
      setSuccessName(parentName.split(' ')[0])
      setParentName('')
      setParentWhatsapp('')
      setShowModal(false)
      setSubmitting(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  function closeModal() {
    setShowModal(false)
    setParentName('')
    setParentWhatsapp('')
    setError('')
  }

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: '14px',
    border: '0.5px solid #E8E0D5',
    borderRadius: '10px',
    background: '#FFF9F4',
    color: '#1C1917',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Success banner */}
      {successName && (
        <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🙏</span>
          <p style={{ fontSize: '13px', color: '#085041', margin: 0 }}>
            {successName} has been added and sent a welcome message on WhatsApp.
          </p>
          <button onClick={() => setSuccessName('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9FE1CB', fontSize: '18px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Connected parents */}
      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Connected parents</p>
        </div>

        {parents.map((parent, i) => {
          const avatarStyle = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <div
              key={parent.id}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                borderBottom: i < parents.length - 1 ? '0.5px solid #F5F0EA' : 'none'
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: avatarStyle.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '15px', fontFamily: 'Georgia, serif',
                color: avatarStyle.color, fontWeight: 500, flexShrink: 0
              }}>
                {parent.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: '0 0 2px' }}>{parent.name}</p>
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>+{parent.whatsapp} · WhatsApp connected</p>
              </div>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#085041', flexShrink: 0 }}>
                Active
              </span>
            </div>
          )
        })}

        {/* Add parent button */}
        <div style={{ padding: '12px 20px', borderTop: '0.5px solid #F5F0EA' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%', padding: '10px', border: '0.5px dashed #D6CEC4',
              borderRadius: '10px', background: 'transparent', color: '#78716C',
              fontSize: '13px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add another parent
          </button>
        </div>
      </div>

      {/* Invite a sibling — coming soon */}
      <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1C1917', margin: '0 0 8px' }}>Invite a sibling</p>
        <p style={{ fontSize: '13px', color: '#78716C', margin: '0 0 16px', lineHeight: 1.6 }}>
          Share this archive with your brother or sister so they can read and listen too.
        </p>
        <button style={{ padding: '10px 20px', background: 'white', color: '#1C1917', border: '0.5px solid #E8E0D5', borderRadius: '8px', fontSize: '13px', cursor: 'not-allowed', opacity: 0.6 }}>
          Coming soon
        </button>
      </div>

      {/* Add parent modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px',
              padding: '28px', width: '100%', maxWidth: '400px'
            }}
          >
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 400, color: '#1C1917', margin: '0 0 6px' }}>
              Add another parent
            </h2>
            <p style={{ fontSize: '13px', color: '#78716C', margin: '0 0 24px', lineHeight: 1.6 }}>
              They'll receive a WhatsApp welcome message and can start sending voice notes right away.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>Their name</label>
                <input
                  type="text"
                  placeholder="e.g. Papa, Nani, Dadi"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#78716C', display: 'block', marginBottom: '6px' }}>Their WhatsApp number</label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={parentWhatsapp}
                  onChange={e => setParentWhatsapp(e.target.value)}
                  style={inputStyle}
                />
                <p style={{ fontSize: '12px', color: '#A8A29E', margin: '6px 0 0' }}>
                  Include country code without "+". e.g. 91 for India, 65 for Singapore.
                </p>
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={closeModal}
                  style={{ padding: '12px 20px', background: 'transparent', color: '#78716C', border: '0.5px solid #D6CEC4', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddParent}
                  disabled={submitting || !parentName || !parentWhatsapp}
                  style={{
                    flex: 1, padding: '12px', background: '#1C1917', color: '#FDF8F3',
                    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                    cursor: submitting || !parentName || !parentWhatsapp ? 'not-allowed' : 'pointer',
                    opacity: submitting || !parentName || !parentWhatsapp ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Adding...' : 'Add & send welcome'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
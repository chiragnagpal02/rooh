'use client'

interface Props {
  parentName: string
  parentWhatsapp: string
}

export default function FamilyView({ parentName, parentWhatsapp }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F5F0EA' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Connected parents</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontFamily: 'Georgia, serif', color: '#085041', fontWeight: 500 }}>
            {parentName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: '0 0 2px' }}>{parentName}</p>
            <p style={{ fontSize: '12px', color: '#A8A29E', margin: 0 }}>+{parentWhatsapp} · WhatsApp connected</p>
          </div>
          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#085041' }}>Active</span>
        </div>
      </div>

      <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1C1917', margin: '0 0 8px' }}>Add another parent</p>
        <p style={{ fontSize: '13px', color: '#78716C', margin: '0 0 16px', lineHeight: 1.6 }}>Connect your other parent, grandparent, or any family elder to preserve their stories too.</p>
        <button style={{ padding: '10px 20px', background: 'white', color: '#1C1917', border: '0.5px solid #E8E0D5', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          Coming soon
        </button>
      </div>

      <div style={{ background: '#FFF9F4', border: '0.5px solid #E8E0D5', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#1C1917', margin: '0 0 8px' }}>Invite a sibling</p>
        <p style={{ fontSize: '13px', color: '#78716C', margin: '0 0 16px', lineHeight: 1.6 }}>Share this archive with your brother or sister so they can read and listen too.</p>
        <button style={{ padding: '10px 20px', background: 'white', color: '#1C1917', border: '0.5px solid #E8E0D5', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
          Coming soon
        </button>
      </div>
    </div>
  )
}
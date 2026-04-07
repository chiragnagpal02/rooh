'use client'

import { Recording } from '@/types'

function aggregateEntities(recordings: Recording[]) {
  const entities = {
    medical: [] as any[], medicines: [] as any[], insurance: [] as any[],
    bank: [] as any[], contacts: [] as any[], property: [] as any[],
  }
  recordings.forEach(r => {
    const e = r.extracted_entities
    if (!e) return
    if (e.medical) entities.medical.push(...e.medical)
    if (e.medicines) entities.medicines.push(...e.medicines)
    if (e.insurance) entities.insurance.push(...e.insurance)
    if (e.bank) entities.bank.push(...e.bank)
    if (e.contacts) entities.contacts.push(...e.contacts)
    if (e.property) entities.property.push(...e.property)
  })
  Object.keys(entities).forEach(key => {
    const k = key as keyof typeof entities
    entities[k] = entities[k].filter((item, index, self) =>
      index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(item))
    )
  })
  return entities
}

interface Props { recordings: Recording[] }

export default function ImportantInfoView({ recordings }: Props) {
  const entities = aggregateEntities(recordings)
  const hasData = Object.values(entities).some(arr => arr.length > 0)

  const sections = [
    { key: 'medical' as const, label: 'Doctors', color: '#3C3489', bg: '#EEEDFE', render: (v: any) => [v.name, v.role, v.contact].filter(Boolean).join(' · ') },
    { key: 'medicines' as const, label: 'Medicines', color: '#085041', bg: '#E1F5EE', render: (v: any) => [v.name, v.frequency].filter(Boolean).join(' · ') },
    { key: 'insurance' as const, label: 'Insurance', color: '#633806', bg: '#FAEEDA', render: (v: any) => [v.provider, v.number, v.type].filter(Boolean).join(' · ') },
    { key: 'bank' as const, label: 'Bank accounts', color: '#712B13', bg: '#FAECE7', render: (v: any) => [v.name, v.branch, v.details].filter(Boolean).join(' · ') },
    { key: 'contacts' as const, label: 'Important contacts', color: '#0C447C', bg: '#E6F1FB', render: (v: any) => [v.name, v.relation, v.number].filter(Boolean).join(' · ') },
    { key: 'property' as const, label: 'Property & documents', color: '#444441', bg: '#F1EFE8', render: (v: any) => [v.description, v.location].filter(Boolean).join(' · ') },
  ]

  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '16px', border: '0.5px solid #E8E0D5' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1C1917', margin: '0 0 8px' }}>No information extracted yet</p>
        <p style={{ fontSize: '14px', color: '#A8A29E', margin: 0 }}>As your parent records voice notes mentioning doctors, medicines, or bank details — they'll appear here automatically.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '12px', padding: '14px 16px' }}>
        <p style={{ fontSize: '13px', color: '#085041', margin: 0 }}>
          This information is automatically extracted from all of your parent's voice recordings. Keep this page handy — it's your family's emergency reference.
        </p>
      </div>
      {sections.map(({ key, label, color, bg, render }) => {
        const items = entities[key]
        if (!items || items.length === 0) return null
        return (
          <div key={key} style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #F5F0EA', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1C1917', margin: 0 }}>{label}</p>
              <span style={{ fontSize: '12px', color: '#A8A29E', marginLeft: 'auto' }}>{items.length} {items.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item: any, i: number) => (
                <div key={i} style={{ background: bg, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: color, lineHeight: 1.5 }}>
                  {render(item)}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
'use client'

import { Recording, MedicalContact, Medicine, Symptom, Appointment } from '@/types'
import { Parent } from '../page'
import { useState } from 'react'

interface Props {
  recordings: Recording[]
  parents: Parent[]
}

type HealthTab = 'doctors' | 'medicines' | 'symptoms' | 'appointments'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type DoctorEntry = MedicalContact & { recordingId: string; recordingDate: string; parentName: string; mentions: number }
type MedicineEntry = Medicine & { recordingId: string; recordingDate: string; parentName: string; mentions: number }
type SymptomEntry = Symptom & { recordingId: string; recordingDate: string; parentName: string; mentions: number }
type AppointmentEntry = Appointment & { recordingId: string; recordingDate: string; parentName: string; mentions: number }

export default function HealthView({ recordings, parents }: Props) {
  const [activeTab, setActiveTab] = useState<HealthTab>('doctors')

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p.name]))

  // Aggregate all health data
  const allDoctors: DoctorEntry[] = []
  const allMedicines: MedicineEntry[] = []
  const allSymptoms: SymptomEntry[] = []
  const allAppointments: AppointmentEntry[] = []

  recordings.forEach(r => {
    const entities = r.extracted_entities as any
    const parentName = (r as any).parent_id
      ? parentMap[(r as any).parent_id] || 'Your parent'
      : parents[0]?.name || 'Your parent'

    entities?.medical?.forEach((m: MedicalContact) => {
      if (m.name) allDoctors.push({ ...m, recordingId: r.id, recordingDate: r.created_at, parentName, mentions: 1 })
    })
    entities?.medicines?.forEach((m: Medicine) => {
      if (m.name) allMedicines.push({ ...m, recordingId: r.id, recordingDate: r.created_at, parentName, mentions: 1 })
    })
    entities?.symptoms?.forEach((s: Symptom) => {
      if (s.description) allSymptoms.push({ ...s, recordingId: r.id, recordingDate: r.created_at, parentName, mentions: 1 })
    })
    entities?.appointments?.forEach((a: Appointment) => {
      if (a.doctor || a.reason) allAppointments.push({ ...a, recordingId: r.id, recordingDate: r.created_at, parentName, mentions: 1 })
    })
  })

  // Deduplicate — keep most recent, count mentions
  function deduplicateByKey<T extends { recordingDate: string; mentions: number }>(
    items: T[],
    keyFn: (item: T) => string
  ): T[] {
    const map = new Map<string, T>()
    items.forEach(item => {
      const key = keyFn(item).toLowerCase().trim()
      if (!key) return
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { ...item, mentions: 1 })
      } else {
        // Keep most recent, increment mention count
        const isNewer = item.recordingDate > existing.recordingDate
        map.set(key, {
          ...(isNewer ? item : existing),
          mentions: existing.mentions + 1
        })
      }
    })
    return Array.from(map.values())
  }

  const doctors = deduplicateByKey(allDoctors, d => d.name)
  const medicines = deduplicateByKey(allMedicines, m => m.name)
  const symptoms = deduplicateByKey(allSymptoms, s => s.description)
  const appointments = deduplicateByKey(allAppointments, a => `${a.doctor || ''}${a.reason || ''}`)

  const tabs: { key: HealthTab; label: string; count: number }[] = [
    { key: 'doctors', label: 'Doctors', count: doctors.length },
    { key: 'medicines', label: 'Medicines', count: medicines.length },
    { key: 'symptoms', label: 'Symptoms', count: symptoms.length },
    { key: 'appointments', label: 'Appointments', count: appointments.length },
  ]

  const isEmpty = doctors.length === 0 && medicines.length === 0 && symptoms.length === 0 && appointments.length === 0

  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '16px', border: '0.5px solid #E8E0D5' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏥</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: '#1C1917', margin: '0 0 8px' }}>No health information yet</p>
        <p style={{ fontSize: '14px', color: '#A8A29E', margin: '0 auto', lineHeight: 1.6, maxWidth: '320px' }}>
          When your parent mentions doctors, medicines, or health updates in a voice note, they'll appear here automatically.
        </p>
      </div>
    )
  }

  const mentionBadge = (count: number) => count > 1 ? (
    <span style={{ fontSize: '11px', background: '#F1EFE8', color: '#78716C', padding: '2px 8px', borderRadius: '20px', marginLeft: '6px' }}>
      mentioned {count}×
    </span>
  ) : null

  return (
    <div>
      {/* Info banner */}
      <div style={{ background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>🙏</span>
        <p style={{ fontSize: '13px', color: '#085041', margin: 0, lineHeight: 1.6 }}>
          Health information is automatically extracted from voice notes. Always verify important details directly with your parent or their doctor.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '0.5px solid #E8E0D5' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', fontSize: '13px',
              color: activeTab === tab.key ? '#1C1917' : '#78716C',
              cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #1C1917' : '2px solid transparent',
              fontWeight: activeTab === tab.key ? 500 : 400,
              marginBottom: '-0.5px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                fontSize: '11px',
                background: activeTab === tab.key ? '#1C1917' : '#F1EFE8',
                color: activeTab === tab.key ? 'white' : '#78716C',
                padding: '1px 6px', borderRadius: '20px'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Doctors */}
      {activeTab === 'doctors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {doctors.length === 0 ? <EmptyTab message="No doctors mentioned yet in voice notes." /> : (
            doctors.map((doc, i) => (
              <div key={i} style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    🩺
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>{doc.name}</p>
                      {mentionBadge(doc.mentions)}
                    </div>
                    {doc.role && <p style={{ fontSize: '12px', color: '#78716C', margin: '0 0 6px' }}>{doc.role}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {doc.contact && (
                        <span style={{ fontSize: '12px', background: '#F0FAF6', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '3px 10px', color: '#085041' }}>
                          📞 {doc.contact}
                        </span>
                      )}
                      {doc.hospital && (
                        <span style={{ fontSize: '12px', background: '#F5F0EA', borderRadius: '8px', padding: '3px 10px', color: '#57534E' }}>
                          🏥 {doc.hospital}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>{formatDate(doc.recordingDate)}</p>
                    <p style={{ fontSize: '11px', color: '#C8C0B8', margin: 0 }}>{doc.parentName.split(' ')[0]}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Medicines */}
      {activeTab === 'medicines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {medicines.length === 0 ? <EmptyTab message="No medicines mentioned yet in voice notes." /> : (
            medicines.map((med, i) => (
              <div key={i} style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    💊
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>{med.name}</p>
                      {mentionBadge(med.mentions)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {med.frequency && (
                        <span style={{ fontSize: '12px', background: '#EEEDFE', borderRadius: '8px', padding: '3px 10px', color: '#3C3489' }}>
                          {med.frequency}
                        </span>
                      )}
                      {med.dosage && (
                        <span style={{ fontSize: '12px', background: '#F5F0EA', borderRadius: '8px', padding: '3px 10px', color: '#57534E' }}>
                          {med.dosage}
                        </span>
                      )}
                      {med.condition && (
                        <span style={{ fontSize: '12px', background: '#F5F0EA', borderRadius: '8px', padding: '3px 10px', color: '#57534E' }}>
                          For: {med.condition}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>{formatDate(med.recordingDate)}</p>
                    <p style={{ fontSize: '11px', color: '#C8C0B8', margin: 0 }}>{med.parentName.split(' ')[0]}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Symptoms */}
      {activeTab === 'symptoms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {symptoms.length === 0 ? <EmptyTab message="No symptoms mentioned yet in voice notes." /> : (
            symptoms.map((sym, i) => (
              <div key={i} style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    🌡️
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>{sym.description}</p>
                      {mentionBadge(sym.mentions)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {sym.duration && (
                        <span style={{ fontSize: '12px', background: '#FAECE7', borderRadius: '8px', padding: '3px 10px', color: '#712B13' }}>
                          Duration: {sym.duration}
                        </span>
                      )}
                      {sym.severity && (
                        <span style={{ fontSize: '12px', background: '#FAECE7', borderRadius: '8px', padding: '3px 10px', color: '#712B13' }}>
                          {sym.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>{formatDate(sym.recordingDate)}</p>
                    <p style={{ fontSize: '11px', color: '#C8C0B8', margin: 0 }}>{sym.parentName.split(' ')[0]}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointments */}
      {activeTab === 'appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {appointments.length === 0 ? <EmptyTab message="No appointments mentioned yet in voice notes." /> : (
            appointments.map((apt, i) => (
              <div key={i} style={{ background: 'white', border: '0.5px solid #E8E0D5', borderRadius: '14px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    📅
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      {apt.doctor && <p style={{ fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: 0 }}>Dr. {apt.doctor}</p>}
                      {mentionBadge(apt.mentions)}
                    </div>
                    {apt.reason && <p style={{ fontSize: '13px', color: '#57534E', margin: '0 0 6px' }}>{apt.reason}</p>}
                    {apt.date && (
                      <span style={{ fontSize: '12px', background: '#FAEEDA', borderRadius: '8px', padding: '3px 10px', color: '#633806' }}>
                        📅 {apt.date}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#A8A29E', margin: '0 0 2px' }}>{formatDate(apt.recordingDate)}</p>
                    <p style={{ fontSize: '11px', color: '#C8C0B8', margin: 0 }}>{apt.parentName.split(' ')[0]}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', background: 'white', borderRadius: '14px', border: '0.5px solid #E8E0D5' }}>
      <p style={{ fontSize: '14px', color: '#A8A29E', margin: 0 }}>{message}</p>
    </div>
  )
}
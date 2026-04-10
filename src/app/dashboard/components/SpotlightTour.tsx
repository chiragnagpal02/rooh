'use client'

import { useState } from 'react'

interface TourStep {
  target: string
  title: string
  description: string
  position: 'right' | 'top' | 'bottom'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'memories',
    title: 'Memories',
    description: 'Every voice note your parent sends on WhatsApp appears here — automatically transcribed, translated, and searchable.',
    position: 'right',
  },
  {
    target: 'health',
    title: 'Health log',
    description: 'Doctors, medicines, and symptoms are automatically extracted from voice notes and organised here. No forms needed.',
    position: 'right',
  },
  {
    target: 'prompts',
    title: 'Prompts',
    description: 'Send your parent a gentle question on WhatsApp to inspire their next memory. Ask about childhood, recipes, life advice.',
    position: 'right',
  },
  {
    target: 'family',
    title: 'Family',
    description: 'Add more parents or family elders, and eventually invite siblings to share the archive with you.',
    position: 'right',
  },
]

interface Props {
  onComplete: () => void
  isMobile: boolean
}

export default function SpotlightTour({ onComplete, isMobile }: Props) {
  const [step, setStep] = useState(0)
  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#FFF9F4', border: '0.5px solid #E8E0D5',
        borderRadius: '20px', padding: '28px',
        width: '100%', maxWidth: '380px',
        position: 'relative',
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              height: '4px', flex: 1, borderRadius: '2px',
              background: i <= step ? '#1D9E75' : '#E8E0D5',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: '#F0FAF6', border: '0.5px solid #9FE1CB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', fontSize: '22px',
        }}>
          {step === 0 && '🎙️'}
          {step === 1 && '🏥'}
          {step === 2 && '💬'}
          {step === 3 && '👨‍👩‍👧'}
        </div>

        <p style={{ fontSize: '11px', fontWeight: 500, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
          {step + 1} of {TOUR_STEPS.length}
        </p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#1C1917', margin: '0 0 10px' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '14px', color: '#57534E', lineHeight: 1.7, margin: '0 0 24px' }}>
          {current.description}
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onComplete}
            style={{ padding: '10px 16px', background: 'transparent', color: '#A8A29E', border: '0.5px solid #E8E0D5', borderRadius: '10px', fontSize: '13px', cursor: 'pointer' }}
          >
            Skip tour
          </button>
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            style={{ flex: 1, padding: '10px', background: '#1C1917', color: '#FDF8F3', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            {isLast ? 'Done 🙏' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
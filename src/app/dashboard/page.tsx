'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Recording } from '@/types'
import { useRouter } from 'next/navigation'
import LayoutShell from './layout-shell'

export interface Parent {
  id: string
  family_id: string
  name: string
  whatsapp: string
  created_at: string
  last_active: string | null
}

export default function Dashboard() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(true)
  const [familyId, setFamilyId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [adultName, setAdultName] = useState('')
  const [lastActive, setLastActive] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email || '')

    const { data: family } = await supabase
      .from('families')
      .select('id, adult_child_name')
      .eq('adult_child_email', user.email)
      .single()

    if (!family) { router.push('/onboarding'); return }

    setFamilyId(family.id)
    setAdultName(family.adult_child_name)
    setChecking(false)

    const res = await fetch('/api/recordings')
    const data = await res.json()
    if (data.recordings) setRecordings(data.recordings)
    if (data.parents) setParents(data.parents)
    if (data.lastActive) setLastActive(data.lastActive)
    setLoading(false)
  }

  async function handleMarkSeen(recordingId: string) {
    await fetch('/api/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recording_id: recordingId })
    })
    setRecordings(prev => prev.map(r =>
      r.id === recordingId ? { ...r, is_new: false } : r
    ))
  }

  function handleParentAdded(newParent: Parent) {
    setParents(prev => [...prev, newParent])
  }

  if (checking) {
    return (
      <main style={{ background: '#FDF8F3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#A8A29E' }}>Loading...</p>
      </main>
    )
  }

  return (
    <LayoutShell
      recordings={recordings}
      parents={parents}
      familyId={familyId}
      userEmail={userEmail}
      adultName={adultName}
      lastActive={lastActive}
      loading={loading}
      onMarkSeen={handleMarkSeen}
      onParentAdded={handleParentAdded}
    />
  )
}
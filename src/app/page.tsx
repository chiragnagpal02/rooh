'use client'

import posthog from 'posthog-js'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-medium text-gray-900 mb-3">روح</h1>
        <h2 className="text-2xl font-medium text-gray-900 mb-4">Rooh</h2>
        <p className="text-gray-500 text-lg mb-8">
          The soul of your family, always with you.
        </p>
        <a
          href="/dashboard"
          onClick={() => posthog.capture('archive_opened')}
          className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Open archive
        </a>
      </div>
    </main>
  )
}

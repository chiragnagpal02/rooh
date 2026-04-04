import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rooh - The soul of your family, always with you.',
  description: 'A voice-first family archive where your parents share their stories, memories, and important information - organised automatically for you.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
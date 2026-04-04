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
  const isDev = process.env.NEXT_PUBLIC_ENV !== 'production'

  return (
  <html lang="en" suppressHydrationWarning>
    <body suppressHydrationWarning>
      {isDev && (
        <div style={{
          background: '#1D9E75',
          color: 'white',
          textAlign: 'center',
          padding: '4px',
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.05em'
        }}>
          DEV ENVIRONMENT — not production
        </div>
      )}
      {children}
    </body>
  </html>
)
}

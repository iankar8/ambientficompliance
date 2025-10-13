import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ArcanaRed - Stop AI Agents Before They Drain Your Accounts',
  description: 'The first adversarial testing platform that simulates AI-driven financial fraud—then shows you exactly how to prevent it.',
  keywords: 'AI fraud prevention, adversarial testing, financial security, bot detection, fraud prevention',
  openGraph: {
    title: 'ArcanaRed - AI Adversarial Testing for Financial Workflows',
    description: 'Simulate AI-driven attacks on your staging environment. Capture evidence. Deploy defenses.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

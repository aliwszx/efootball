import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'eFootball Tournaments',
  description: 'Qoşul, yarış, qalib gəl və mükafat qazan.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="az">
      <body className="min-h-screen bg-[#06070a] text-white antialiased">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute right-0 top-40 h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[280px] w-[280px] rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
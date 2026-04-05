import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { Poppins, Inter, Open_Sans } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-open-sans',
})

export const metadata: Metadata = {
  title: 'eFootball Tournaments',
  description: 'Qoşul, yarış, qalib gəl və mükafat qazan.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body className={`${poppins.variable} ${inter.variable} ${openSans.variable} min-h-screen bg-[#02060E] text-white antialiased font-inter`}>
        <div className="relative min-h-screen overflow-x-hidden">

          {/* Arxa fon qradientləri — Crimson Noir */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C50337]/8 blur-[120px]" />
            <div className="absolute right-[-10%] top-[30%] h-[400px] w-[400px] rounded-full bg-[#C50337]/6 blur-[100px]" />
            <div className="absolute bottom-0 left-[-5%] h-[350px] w-[350px] rounded-full bg-[#C50337]/4 blur-[100px]" />
            {/* Noise texture */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
          </div>

          <Navbar />
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  )
}

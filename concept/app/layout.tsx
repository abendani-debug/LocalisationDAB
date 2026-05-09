import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "MapsDab — Trouvez un DAB qui marche, avant d'y aller",
  description: "L'app communautaire qui vous dit en temps réel où retirer du cash en Algérie, sans mauvaise surprise. Signalements anonymes, carte interactive.",
  keywords: ['DAB', 'distributeur', 'Algérie', 'retrait', 'cash', 'banque', 'carte', 'temps réel'],
  authors: [{ name: 'MapsDab' }],
  openGraph: {
    title: 'MapsDab — Trouvez un DAB qui marche',
    description: 'La carte communautaire des DABs en Algérie. Signalements en temps réel.',
    url: 'https://mapsdab.com',
    siteName: 'MapsDab',
    locale: 'fr_DZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MapsDab — Trouvez un DAB qui marche',
    description: 'La carte communautaire des DABs en Algérie.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MobileApplication',
              name: 'MapsDab',
              description: "L'app communautaire de localisation des DABs en Algérie",
              url: 'https://mapsdab.com',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'iOS, Android, Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'DZD' },
              publisher: { '@type': 'Organization', name: 'MapsDab', url: 'https://mapsdab.com' },
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

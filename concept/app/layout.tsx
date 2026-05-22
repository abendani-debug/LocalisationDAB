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
  metadataBase: new URL('https://mapsdab.com'),
  title: {
    default: "MapsDab — Trouvez un DAB qui marche, avant d'y aller",
    template: '%s | MapsDab',
  },
  description: "La carte communautaire qui vous dit en temps réel où retirer du cash en Algérie, sans mauvaise surprise. Signalements anonymes, 1 286 DABs indexés.",
  keywords: ['DAB', 'distributeur automatique', 'Algérie', 'retrait', 'cash', 'banque', 'carte interactive', 'signalement', 'BNA', 'CPA', 'BADR', 'BDL', 'Alger'],
  authors: [{ name: 'MapsDab', url: 'https://mapsdab.com' }],
  creator: 'MapsDab',
  publisher: 'MapsDab',
  alternates: {
    canonical: 'https://mapsdab.com/concept',
  },
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/images/logo.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/images/logo.png',
  },
  openGraph: {
    title: 'MapsDab — Trouvez un DAB qui marche, avant d\'y aller',
    description: 'La carte communautaire des DABs en Algérie. Signalements en temps réel, 1 286 DABs indexés. Gratuit et anonyme.',
    url: 'https://mapsdab.com/concept',
    siteName: 'MapsDab',
    locale: 'fr_DZ',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'MapsDab — La carte des DABs en Algérie',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MapsDab — Trouvez un DAB qui marche, avant d\'y aller',
    description: 'La carte communautaire des DABs en Algérie. Signalements en temps réel.',
    images: ['/images/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'MapsDab',
                url: 'https://mapsdab.com',
                logo: 'https://mapsdab.com/images/logo.png',
                sameAs: [],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'MapsDab',
                url: 'https://mapsdab.com/concept',
                description: 'La carte communautaire des DABs en Algérie',
                inLanguage: 'fr-DZ',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'MapsDab',
                description: 'La carte communautaire de localisation des DABs en Algérie. Signalements anonymes en temps réel.',
                url: 'https://mapsdab.com',
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Web',
                inLanguage: 'fr-DZ',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'DZD' },
                publisher: { '@type': 'Organization', name: 'MapsDab', url: 'https://mapsdab.com' },
                areaServed: { '@type': 'Country', name: 'Algeria' },
              },
            ]),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

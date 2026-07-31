# MapsDab Vitrine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un site vitrine one-page Next.js 14 dans `LocalisationDAB/concept/` pour présenter MapsDab aux citoyens et aux banques.

**Architecture:** One-page avec App Router, composants React Server Components par défaut sauf animations (Client Components). Textes externalisés dans `messages/fr.json`. Palette Tailwind centralisée.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS · Framer Motion · Lucide React · shadcn/ui · next-themes

---

## Task 1 : Initialisation du projet

**Files:**
- Create: `concept/` (dossier Next.js complet)
- Create: `concept/tailwind.config.ts`
- Create: `concept/tsconfig.json`
- Create: `concept/next.config.ts`

- [ ] **Step 1 : Initialiser Next.js**

Depuis `LocalisationDAB/` :
```bash
npx create-next-app@latest concept \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

- [ ] **Step 2 : Installer les dépendances**

```bash
cd concept
npm install framer-motion lucide-react next-themes
npm install -D @types/node
npx shadcn@latest init -y
```

Répondre aux prompts shadcn :
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 3 : Installer les composants shadcn nécessaires**

```bash
npx shadcn@latest add button card accordion dialog
```

- [ ] **Step 4 : Copier le logo**

```bash
mkdir -p public/images
cp "../Logos/Logo - ATM locator.jpg" public/images/logo.jpg
```

- [ ] **Step 5 : Vérifier que le projet démarre**

```bash
npm run dev
```

Ouvrir http://localhost:3000 — page Next.js par défaut visible. ✓

- [ ] **Step 6 : Commit**

```bash
cd ..
git add concept/
git commit -m "feat(concept): init Next.js 14 + shadcn/ui + framer-motion"
```

---

## Task 2 : Configuration Tailwind + styles globaux

**Files:**
- Modify: `concept/tailwind.config.ts`
- Modify: `concept/styles/globals.css`
- Create: `concept/lib/utils.ts`

- [ ] **Step 1 : Remplacer tailwind.config.ts**

```ts
// concept/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#00C896',
        'primary-dark': '#00A87E',
        secondary: '#2563EB',
        'secondary-dark': '#1D4ED8',
        accent:    '#FF6B35',
        danger:    '#EF4444',
        warning:   '#FFB800',
        dark:      '#0F172A',
        surface:   '#F8FAFC',
        border:    '#E2E8F0',
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display:  ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #00C896 0%, #2563EB 100%)',
        'gradient-brand-r': 'linear-gradient(135deg, #2563EB 0%, #00C896 100%)',
      },
      boxShadow: {
        'primary': '0 8px 30px rgba(0, 200, 150, 0.25)',
        'secondary': '0 8px 30px rgba(37, 99, 235, 0.25)',
        'card': '0 2px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'count-up': 'countUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2 : Mettre à jour globals.css**

```css
/* concept/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 248 250 252;
    --foreground: 15 23 42;
  }
  .dark {
    --background: 15 23 42;
    --foreground: 248 250 252;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-surface text-dark antialiased;
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-gradient-brand bg-clip-text text-transparent;
  }
  .section-padding {
    @apply py-16 md:py-24 px-4 md:px-8 lg:px-16;
  }
}
```

- [ ] **Step 3 : Créer lib/utils.ts**

```ts
// concept/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4 : Vérifier**

```bash
npm run dev
```

Page toujours visible, pas d'erreur de compilation. ✓

- [ ] **Step 5 : Commit**

```bash
git add concept/tailwind.config.ts concept/styles/globals.css concept/lib/utils.ts
git commit -m "feat(concept): palette Tailwind + styles globaux"
```

---

## Task 3 : Textes — messages/fr.json

**Files:**
- Create: `concept/messages/fr.json`

- [ ] **Step 1 : Créer le fichier de textes**

```json
// concept/messages/fr.json
{
  "nav": {
    "concept": "Concept",
    "features": "Fonctionnalités",
    "banks": "Pour les banques",
    "faq": "FAQ",
    "cta": "Télécharger l'app"
  },
  "hero": {
    "badge": "Signalements en temps réel",
    "h1": "Trouvez un DAB qui marche.\nAvant d'y aller.",
    "subtitle": "L'app communautaire qui vous dit en temps réel où retirer du cash, sans mauvaise surprise.",
    "cta_primary": "Télécharger maintenant",
    "cta_secondary": "Voir comment ça marche",
    "trust": "Déjà 2 400 utilisateurs · 180 signalements / jour",
    "before_title": "Avant",
    "before_text": "Vous allez au DAB. Il est vide. Trajet pour rien.",
    "after_title": "Avec MapsDab",
    "after_text": "Carte vérifiée. DAB dispo à 300m. Vous y allez direct.",
    "stat_dabs": "1 286",
    "stat_dabs_label": "DABs indexés",
    "stat_uptime": "24/7",
    "stat_uptime_label": "Mises à jour",
    "stat_free": "100%",
    "stat_free_label": "Gratuit & anonyme",
    "live_label": "Signalements live"
  },
  "problem": {
    "h2": "Combien de fois êtes-vous parti pour rien ?",
    "subtitle": "Le DAB en panne, le distributeur vide, la file qui n'en finit plus… On connaît.",
    "card1_title": "DAB en panne",
    "card1_text": "L'écran noir. La machine qui avale votre carte. Le panneau « hors service » découvert trop tard.",
    "card2_title": "Plus de cash",
    "card2_text": "Vous avez fait 2 km pour rien. Le distributeur est vide depuis ce matin. Personne ne vous a prévenu.",
    "card3_title": "File interminable",
    "card3_text": "Un seul DAB fonctionnel dans le quartier. Dix personnes devant vous. Votre rendez-vous dans 20 minutes.",
    "transition": "Et si la communauté pouvait vous prévenir avant ?"
  },
  "how": {
    "h2": "Le principe Waze, appliqué aux DAB",
    "subtitle": "Simple, rapide, anonyme. La communauté alimente la carte en temps réel.",
    "step1_title": "Géolocalisez-vous",
    "step1_text": "On vous affiche tous les DAB dans votre rayon, triés par distance.",
    "step2_title": "Consultez les statuts",
    "step2_text": "Vert = dispo, orange = vide, rouge = en panne. Mis à jour par la communauté.",
    "step3_title": "Signalez à votre tour",
    "step3_text": "En 1 tap après votre passage. Anonyme. Ça prend 3 secondes.",
    "step4_title": "Gagnez du temps",
    "step4_text": "Et aidez les milliers d'utilisateurs qui passent après vous."
  },
  "features": {
    "h2": "Tout ce qu'il vous faut",
    "subtitle": "Une app pensée pour être utilisée dans la rue, en 10 secondes.",
    "f1_title": "Carte temps réel",
    "f1_text": "Tous les DAB autour de vous, mis à jour en permanence par la communauté.",
    "f2_title": "Statut du cash",
    "f2_text": "Disponible, partiel ou vide — vous savez avant de vous déplacer.",
    "f3_title": "Signalement de panne",
    "f3_text": "Signalez une panne en 1 tap. Validé par la communauté pour éviter les abus.",
    "f4_title": "DAB favoris",
    "f4_text": "Ajoutez vos DAB habituels. Recevez une notification si l'un d'eux tombe en panne.",
    "f5_title": "Filtres par banque",
    "f5_text": "Affichez uniquement les DABs de votre banque pour éviter les frais.",
    "f6_title": "Itinéraire optimal",
    "f6_text": "On vous guide vers le DAB fiable le plus proche, pas juste le plus près."
  },
  "showcase": {
    "h2": "L'app en action",
    "subtitle": "Pensée pour être intuitive dès la première utilisation.",
    "s1_title": "Carte interactive",
    "s1_text": "Visualisez tous les DABs autour de vous. Vert, orange, rouge — l'état en un coup d'œil.",
    "s2_title": "Fiche détaillée",
    "s2_text": "Adresse, banque, statut, dernière mise à jour, avis de la communauté. Tout y est.",
    "s3_title": "Signalement rapide",
    "s3_text": "3 boutons. 1 tap. Anonyme. Votre signalement est pris en compte immédiatement."
  },
  "b2b": {
    "h2": "Vous gérez un parc de DABs ?",
    "subtitle": "On a une offre pour vous.",
    "description": "Transformez les remontées de la communauté en intelligence opérationnelle pour votre réseau.",
    "b1_title": "Visibilité temps réel",
    "b1_text": "État de votre réseau par agence et par zone géographique, actualisé en continu.",
    "b2_title": "Données qualifiées",
    "b2_text": "Pannes récurrentes, taux de disponibilité, zones critiques. Des insights actionnables.",
    "b3_title": "Réactivité accrue",
    "b3_text": "Interventions priorisées intelligemment grâce aux alertes automatiques.",
    "mention": "Dashboard pro · API disponibles · Conformité RGPD",
    "cta": "Demander une démo",
    "form_name": "Nom complet",
    "form_bank": "Nom de la banque / institution",
    "form_email": "Email professionnel",
    "form_message": "Votre message (optionnel)",
    "form_submit": "Envoyer la demande",
    "form_title": "Demander une démo",
    "form_subtitle": "Notre équipe vous répond sous 24h."
  },
  "stats": {
    "h2": "MapsDab en chiffres",
    "subtitle": "Une communauté qui grandit chaque jour.",
    "s1_value": 1286,
    "s1_label": "DABs référencés",
    "s2_value": 180,
    "s2_label": "Signalements / jour",
    "s3_value": 12,
    "s3_label": "Villes couvertes",
    "s4_value": 4.8,
    "s4_label": "Note moyenne ★"
  },
  "faq": {
    "h2": "Questions fréquentes",
    "q1": "Comment ça marche concrètement ?",
    "a1": "Ouvrez l'app, activez la géolocalisation, et vous voyez instantanément tous les DABs autour de vous avec leur statut. Si vous passez devant un DAB, vous pouvez signaler son état en 1 tap — anonymement. Ces signalements alimentent la carte en temps réel pour tous les utilisateurs.",
    "q2": "Mes données de localisation sont-elles partagées ?",
    "a2": "Non. Votre position sert uniquement à afficher les DABs proches de vous, en local sur votre appareil. Elle n'est jamais transmise à nos serveurs ni à des tiers. Les signalements sont 100% anonymes.",
    "q3": "L'application est-elle gratuite ?",
    "a3": "Oui, complètement gratuite pour les citoyens. Sans abonnement, sans publicité intrusive. Le modèle économique repose sur une offre B2B pour les établissements bancaires.",
    "q4": "Quelles banques sont couvertes ?",
    "a4": "Toutes les grandes banques algériennes : BNA, CPA, BADR, BDL, BEA, SGA, CIB, BNP Paribas El Djazaïr, Arab Bank, et d'autres. La liste s'agrandit grâce aux contributions de la communauté.",
    "q5": "Comment signaler un DAB manquant sur la carte ?",
    "a5": "Directement depuis l'app : appuyez sur le bouton « + Proposer un DAB », placez le marqueur sur la carte et renseignez les informations. Votre proposition est examinée et validée par notre équipe.",
    "q6": "Disponible sur iOS et Android ?",
    "a6": "L'application web est accessible depuis n'importe quel navigateur mobile. Les applications natives iOS et Android sont en cours de développement et seront disponibles prochainement."
  },
  "cta_final": {
    "h2": "Prêt à ne plus jamais courir\naprès un DAB en panne ?",
    "subtitle": "Rejoignez la communauté MapsDab. Gratuit, anonyme, utile.",
    "app_store": "Télécharger sur l'App Store",
    "google_play": "Disponible sur Google Play",
    "sms_placeholder": "Votre numéro de téléphone",
    "sms_cta": "Recevoir le lien par SMS"
  },
  "footer": {
    "tagline": "La carte communautaire des DABs en Algérie.",
    "product": "Produit",
    "company": "Entreprise",
    "legal": "Légal",
    "contact_col": "Contact",
    "map": "La carte",
    "how": "Comment ça marche",
    "banks": "Pour les banques",
    "about": "À propos",
    "blog": "Blog",
    "press": "Presse",
    "privacy": "Politique de confidentialité",
    "terms": "CGU",
    "legal_mentions": "Mentions légales",
    "contact_email": "contact@mapsdab.com",
    "copyright": "© 2026 MapsDab. Tous droits réservés.",
    "lang_fr": "FR",
    "lang_ar": "AR",
    "lang_en": "EN"
  },
  "testimonials": {
    "h2": "Ce qu'ils en pensent",
    "t1_text": "Enfin une app qui me dit si le DAB est vide avant de faire 3 km ! J'ai économisé tellement de temps.",
    "t1_name": "Karim B.",
    "t1_role": "Utilisateur, Alger",
    "t2_text": "Je signale systématiquement après chaque retrait. La communauté m'a aidé, je rends la pareille.",
    "t2_name": "Amira S.",
    "t2_role": "Utilisatrice, Oran",
    "t3_text": "Simple, rapide, utile. Exactement ce dont on avait besoin. Le concept Waze pour les DAB, c'est brillant.",
    "t3_name": "Mohamed T.",
    "t3_role": "Utilisateur, Constantine",
    "t4_text": "Nous avons réduit nos délais d'intervention de 40% grâce aux remontées communautaires. ROI très rapide.",
    "t4_name": "Direction Réseau",
    "t4_role": "Grande banque nationale"
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add concept/messages/
git commit -m "feat(concept): textes FR externalisés dans messages/fr.json"
```

---

## Task 4 : Layout global — app/layout.tsx

**Files:**
- Modify: `concept/app/layout.tsx`
- Create: `concept/components/providers/ThemeProvider.tsx`

- [ ] **Step 1 : Créer ThemeProvider**

```tsx
// concept/components/providers/ThemeProvider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

- [ ] **Step 2 : Remplacer app/layout.tsx**

```tsx
// concept/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import '@/styles/globals.css'

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
  title: 'MapsDab — Trouvez un DAB qui marche, avant d\'y aller',
  description: 'L\'app communautaire qui vous dit en temps réel où retirer du cash en Algérie, sans mauvaise surprise. Signalements anonymes, carte interactive.',
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3 : Vérifier**

```bash
npm run dev
```

Pas d'erreur TypeScript. ✓

- [ ] **Step 4 : Commit**

```bash
git add concept/app/layout.tsx concept/components/
git commit -m "feat(concept): layout global + fonts + theme provider"
```

---

## Task 5 : Composants UI atomiques

**Files:**
- Create: `concept/components/ui/LiveBadge.tsx`
- Create: `concept/components/ui/PhoneMockup.tsx`
- Create: `concept/components/ui/StatCounter.tsx`
- Create: `concept/components/ui/FeatureCard.tsx`
- Create: `concept/components/ui/StepCard.tsx`
- Create: `concept/components/ui/MapAnimation.tsx`

- [ ] **Step 1 : LiveBadge — badge pulsant "live"**

```tsx
// concept/components/ui/LiveBadge.tsx
'use client'

interface LiveBadgeProps {
  label: string
  className?: string
}

export function LiveBadge({ label, className = '' }: LiveBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="text-xs font-semibold text-primary">{label}</span>
    </div>
  )
}
```

- [ ] **Step 2 : PhoneMockup — device frame stylisé**

```tsx
// concept/components/ui/PhoneMockup.tsx
import { cn } from '@/lib/utils'

interface PhoneMockupProps {
  children: React.ReactNode
  className?: string
  shadowColor?: string
}

export function PhoneMockup({ children, className, shadowColor = 'rgba(0,200,150,0.2)' }: PhoneMockupProps) {
  return (
    <div
      className={cn('relative mx-auto w-[240px]', className)}
      style={{ filter: `drop-shadow(0 24px 40px ${shadowColor})` }}
    >
      {/* Frame */}
      <div className="relative bg-dark rounded-[2.5rem] p-2 border-4 border-dark">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-dark rounded-full z-10" />
        {/* Screen */}
        <div className="bg-surface rounded-[2rem] overflow-hidden min-h-[420px] relative">
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : StatCounter — compteur animé**

```tsx
// concept/components/ui/StatCounter.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface StatCounterProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function StatCounter({ value, label, prefix = '', suffix = '', decimals = 0 }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 1800
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(parseFloat((eased * value).toFixed(decimals)))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value, decimals])

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl md:text-5xl font-black text-white mb-1">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
      </div>
      <div className="text-sm font-medium text-white/70">{label}</div>
    </div>
  )
}
```

- [ ] **Step 4 : FeatureCard**

```tsx
// concept/components/ui/FeatureCard.tsx
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  text: string
  iconColor?: string
  iconBg?: string
  className?: string
}

export function FeatureCard({ icon: Icon, title, text, iconColor = 'text-primary', iconBg = 'bg-primary/10', className }: FeatureCardProps) {
  return (
    <div className={cn(
      'group p-6 rounded-2xl border border-border bg-white dark:bg-dark/50',
      'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
      className
    )}>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <h3 className="font-display font-bold text-dark dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{text}</p>
    </div>
  )
}
```

- [ ] **Step 5 : StepCard**

```tsx
// concept/components/ui/StepCard.tsx
'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StepCardProps {
  number: number
  icon: LucideIcon
  title: string
  text: string
  mockup: React.ReactNode
  index: number
}

export function StepCard({ number, icon: Icon, title, text, mockup, index }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="flex flex-col items-center text-center gap-4"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-primary">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark text-white text-xs font-black flex items-center justify-center">
          {number}
        </div>
      </div>
      <div className="bg-white dark:bg-dark/60 rounded-2xl border border-border p-3 w-full max-w-[160px] shadow-card">
        {mockup}
      </div>
      <div>
        <h3 className="font-display font-bold text-dark dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{text}</p>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 6 : MapAnimation — carte hero animée**

```tsx
// concept/components/ui/MapAnimation.tsx
'use client'

import { useEffect, useState } from 'react'

type Marker = { id: number; x: number; y: number; color: string; label: string; ping: boolean }

const INITIAL_MARKERS: Marker[] = [
  { id: 1, x: 22, y: 30, color: '#00C896', label: 'BNA · Dispo', ping: true },
  { id: 2, x: 55, y: 48, color: '#FF6B35', label: 'CPA · Vide', ping: false },
  { id: 3, x: 75, y: 25, color: '#EF4444', label: 'SGA · Panne', ping: false },
  { id: 4, x: 40, y: 65, color: '#00C896', label: 'BADR · Dispo', ping: true },
]

const POSITIONS = [
  { x: 30, y: 20 }, { x: 60, y: 55 }, { x: 15, y: 60 },
  { x: 80, y: 40 }, { x: 50, y: 30 }, { x: 70, y: 70 },
]

export function MapAnimation() {
  const [markers, setMarkers] = useState<Marker[]>(INITIAL_MARKERS)
  const [nextId, setNextId] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      const colors = ['#00C896', '#FF6B35', '#EF4444']
      const labels = ['BNA · Dispo', 'CPA · Vide', 'BEA · Panne', 'BADR · Dispo', 'BDL · Vide']
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const label = labels[Math.floor(Math.random() * labels.length)]
      const newMarker: Marker = { id: nextId, x: pos.x, y: pos.y, color, label, ping: true }
      setMarkers(prev => [...prev.slice(-5), newMarker])
      setNextId(n => n + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [nextId])

  return (
    <div className="relative w-full h-full bg-blue-50 dark:bg-blue-950/30 rounded-2xl overflow-hidden border border-border">
      {/* Grille de carte simulée */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Fausses routes */}
        <line x1="0" y1="40%" x2="100%" y2="45%" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="30%" y1="0" x2="35%" y2="100%" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="60%" y1="0" x2="65%" y2="100%" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="0" y1="70%" x2="100%" y2="65%" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>

      {/* Markers */}
      {markers.map(marker => (
        <div
          key={marker.id}
          className="absolute transition-all duration-500"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          {marker.ping && (
            <div
              className="absolute -inset-2 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: marker.color }}
            />
          )}
          <div
            className="relative w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer"
            style={{ backgroundColor: marker.color }}
          />
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: marker.color }}
          >
            {marker.label}
          </div>
        </div>
      ))}

      {/* Label Alger */}
      <div className="absolute top-3 left-3 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
        Alger · Carte interactive
      </div>
    </div>
  )
}
```

- [ ] **Step 7 : Commit**

```bash
git add concept/components/ui/
git commit -m "feat(concept): composants UI atomiques (LiveBadge, PhoneMockup, StatCounter, FeatureCard, StepCard, MapAnimation)"
```

---

## Task 6 : Header + Footer

**Files:**
- Create: `concept/components/layout/Header.tsx`
- Create: `concept/components/layout/Footer.tsx`

- [ ] **Step 1 : Header avec glassmorphism et burger mobile**

```tsx
// concept/components/layout/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import fr from '@/messages/fr.json'

const NAV_LINKS = [
  { label: fr.nav.concept, href: '#comment-ca-marche' },
  { label: fr.nav.features, href: '#fonctionnalites' },
  { label: fr.nav.banks, href: '#banques' },
  { label: fr.nav.faq, href: '#faq' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-dark/80 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/images/logo.jpg" alt="MapsDab" width={40} height={40} className="rounded-lg" />
          </a>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-dark/70 dark:text-white/70 hover:text-dark dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA desktop */}
          <a
            href="#telecharger"
            className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-primary"
          >
            <Download className="w-4 h-4" />
            {fr.nav.cta}
          </a>

          {/* Burger mobile */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-black/5 transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-dark dark:text-white" />
          </button>
        </div>
      </header>

      {/* Menu mobile plein écran */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-0 z-50 bg-white dark:bg-dark flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Image src="/images/logo.jpg" alt="MapsDab" width={36} height={36} className="rounded-lg" />
              <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
                <X className="w-6 h-6 text-dark dark:text-white" />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-2 flex-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-xl font-semibold text-dark dark:text-white py-3 border-b border-border/50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="p-6">
              <a
                href="#telecharger"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary text-white text-base font-bold py-4 rounded-2xl shadow-primary"
              >
                <Download className="w-5 h-5" />
                {fr.nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2 : Footer**

```tsx
// concept/components/layout/Footer.tsx
import Image from 'next/image'
import { Twitter, Facebook, Instagram, Linkedin } from 'lucide-react'
import fr from '@/messages/fr.json'

export function Footer() {
  const columns = [
    {
      title: fr.footer.product,
      links: [
        { label: fr.footer.map, href: 'https://mapsdab.com' },
        { label: fr.footer.how, href: '#comment-ca-marche' },
        { label: fr.footer.banks, href: '#banques' },
      ],
    },
    {
      title: fr.footer.company,
      links: [
        { label: fr.footer.about, href: '#' },
        { label: fr.footer.blog, href: '#' },
        { label: fr.footer.press, href: '#' },
      ],
    },
    {
      title: fr.footer.legal,
      links: [
        { label: fr.footer.privacy, href: '#' },
        { label: fr.footer.terms, href: '#' },
        { label: fr.footer.legal_mentions, href: '#' },
      ],
    },
    {
      title: fr.footer.contact_col,
      links: [
        { label: fr.footer.contact_email, href: `mailto:${fr.footer.contact_email}` },
      ],
    },
  ]

  return (
    <footer className="bg-dark text-white/70 pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image src="/images/logo.jpg" alt="MapsDab" width={48} height={48} className="rounded-xl mb-3" />
            <p className="text-sm leading-relaxed">{fr.footer.tagline}</p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" aria-label="Réseau social" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {/* Colonnes */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-xs">{fr.footer.copyright}</p>
          {/* Sélecteur langue */}
          <div className="flex gap-1">
            {['FR', 'AR', 'EN'].map(lang => (
              <button
                key={lang}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  lang === 'FR' ? 'bg-primary text-white' : 'hover:bg-white/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Aucune erreur. ✓

- [ ] **Step 4 : Commit**

```bash
git add concept/components/layout/
git commit -m "feat(concept): Header sticky glassmorphism + Footer 4 colonnes"
```

---

## Task 7 : Section Hero

**Files:**
- Create: `concept/components/sections/Hero.tsx`

- [ ] **Step 1 : Créer Hero.tsx**

```tsx
// concept/components/sections/Hero.tsx
'use client'

import { motion } from 'framer-motion'
import { Download, ArrowDown } from 'lucide-react'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { MapAnimation } from '@/components/ui/MapAnimation'
import fr from '@/messages/fr.json'

const LIVE_SIGNALS = [
  { color: '#00C896', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', name: 'DAB BNA — Hydra', status: 'Disponible', time: '2 min' },
  { color: '#FF6B35', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', name: 'DAB CPA — Bab Ezzouar', status: 'Vide', time: '8 min' },
  { color: '#EF4444', bg: 'bg-red-50 border-red-200', text: 'text-red-700', name: 'DAB SGA — Bir Mourad Raïs', status: 'En panne', time: '15 min' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-surface dark:bg-dark">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

        {/* GAUCHE */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <LiveBadge label={fr.hero.badge} />

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-dark dark:text-white leading-tight">
            Trouvez un DAB qui marche.{' '}
            <span className="text-gradient">Avant d'y aller.</span>
          </h1>

          <p className="text-lg text-dark/60 dark:text-white/60 leading-relaxed max-w-lg">
            {fr.hero.subtitle}
          </p>

          {/* Avant / Après */}
          <div className="flex gap-3">
            <div className="flex-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <div className="text-xs font-black text-red-600 mb-2">😤 {fr.hero.before_title}</div>
              <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{fr.hero.before_text}</div>
            </div>
            <div className="flex items-center text-secondary font-bold text-lg">→</div>
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="text-xs font-black text-emerald-600 mb-2">😌 {fr.hero.after_title}</div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{fr.hero.after_text}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { value: fr.hero.stat_dabs, label: fr.hero.stat_dabs_label },
              { value: fr.hero.stat_uptime, label: fr.hero.stat_uptime_label },
              { value: fr.hero.stat_free, label: fr.hero.stat_free_label },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-black text-dark dark:text-white">{stat.value}</div>
                <div className="text-xs text-dark/50 dark:text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#telecharger"
              id="telecharger"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full shadow-primary transition-all hover:scale-105"
            >
              <Download className="w-5 h-5" />
              {fr.hero.cta_primary}
            </a>
            <a
              href="#comment-ca-marche"
              className="flex items-center gap-2 border border-border hover:border-primary text-dark dark:text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              {fr.hero.cta_secondary}
            </a>
          </div>

          <p className="text-xs text-dark/40 dark:text-white/40">{fr.hero.trust}</p>
        </motion.div>

        {/* DROITE */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          {/* Carte animée */}
          <div className="relative h-64 md:h-72 rounded-2xl overflow-hidden border border-border shadow-card">
            <MapAnimation />
          </div>

          {/* Flux live */}
          <div>
            <p className="text-xs font-bold text-dark/40 dark:text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />
              {fr.hero.live_label}
            </p>
            <div className="flex flex-col gap-2">
              {LIVE_SIGNALS.map((sig, i) => (
                <motion.div
                  key={sig.name}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className={`flex items-center gap-3 ${sig.bg} border rounded-xl px-4 py-3`}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-dark dark:text-white truncate">{sig.name}</div>
                    <div className={`text-xs font-bold ${sig.text}`}>{sig.status}</div>
                  </div>
                  <div className="text-xs text-dark/40">{sig.time}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : Assembler dans page.tsx pour tester**

```tsx
// concept/app/page.tsx
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3 : Vérifier visuellement**

```bash
npm run dev
```

Ouvrir http://localhost:3000 — Hero visible avec carte animée, markers pulsants, flux live. ✓

- [ ] **Step 4 : Commit**

```bash
git add concept/components/sections/Hero.tsx concept/app/page.tsx
git commit -m "feat(concept): section Hero avec carte animée + avant/après + flux live"
```

---

## Task 8 : Sections Problème + Comment ça marche

**Files:**
- Create: `concept/components/sections/Problem.tsx`
- Create: `concept/components/sections/HowItWorks.tsx`

- [ ] **Step 1 : Problem.tsx**

```tsx
// concept/components/sections/Problem.tsx
'use client'

import { motion } from 'framer-motion'
import fr from '@/messages/fr.json'

const PROBLEMS = [
  { emoji: '🔴', title: fr.problem.card1_title, text: fr.problem.card1_text, color: 'border-danger/20 bg-red-50 dark:bg-red-950/20' },
  { emoji: '💸', title: fr.problem.card2_title, text: fr.problem.card2_text, color: 'border-warning/20 bg-yellow-50 dark:bg-yellow-950/20' },
  { emoji: '⏱️', title: fr.problem.card3_title, text: fr.problem.card3_text, color: 'border-accent/20 bg-orange-50 dark:bg-orange-950/20' },
]

export function Problem() {
  return (
    <section className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.problem.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.problem.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-6 ${p.color}`}
            >
              <div className="text-3xl mb-4">{p.emoji}</div>
              <h3 className="font-display font-bold text-lg text-dark dark:text-white mb-2">{p.title}</h3>
              <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-brand text-white font-bold text-lg md:text-xl px-8 py-4 rounded-2xl shadow-primary">
            {fr.problem.transition}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : HowItWorks.tsx**

```tsx
// concept/components/sections/HowItWorks.tsx
'use client'

import { motion } from 'framer-motion'
import { MapPin, Eye, MessageSquare, Zap } from 'lucide-react'
import fr from '@/messages/fr.json'

const STEPS = [
  {
    icon: MapPin,
    title: fr.how.step1_title,
    text: fr.how.step1_text,
    mockup: (
      <div className="text-center py-2">
        <div className="text-2xl mb-1">📍</div>
        <div className="text-[10px] font-semibold text-dark/70">Position détectée</div>
        <div className="text-[10px] text-primary font-bold">7 DABs à proximité</div>
      </div>
    ),
  },
  {
    icon: Eye,
    title: fr.how.step2_title,
    text: fr.how.step2_text,
    mockup: (
      <div className="space-y-1.5">
        {[
          { color: '#00C896', label: 'BNA', status: 'Dispo' },
          { color: '#FF6B35', label: 'CPA', status: 'Vide' },
          { color: '#EF4444', label: 'SGA', status: 'Panne' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-medium text-dark/80">{item.label}</span>
            <span className="text-[9px] ml-auto font-bold" style={{ color: item.color }}>{item.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageSquare,
    title: fr.how.step3_title,
    text: fr.how.step3_text,
    mockup: (
      <div className="space-y-1.5">
        {['✅ Disponible', '💸 Vide', '🔧 En panne'].map(label => (
          <div key={label} className="text-[10px] text-center font-semibold border border-border rounded-lg py-1.5 cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors">
            {label}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    title: fr.how.step4_title,
    text: fr.how.step4_text,
    mockup: (
      <div className="text-center py-2">
        <div className="text-2xl mb-1">🎉</div>
        <div className="text-[10px] font-bold text-primary">Merci !</div>
        <div className="text-[10px] text-dark/60">Signalement envoyé</div>
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="section-padding bg-surface dark:bg-dark">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.how.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.how.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-primary">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark dark:bg-white text-white dark:text-dark text-xs font-black flex items-center justify-center">
                  {i + 1}
                </div>
              </div>
              <div className="bg-white dark:bg-dark/60 rounded-2xl border border-border p-3 w-full shadow-card">
                {step.mockup}
              </div>
              <div>
                <h3 className="font-display font-bold text-dark dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3 : Ajouter dans page.tsx**

```tsx
// concept/app/page.tsx
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4 : Vérifier**

```bash
npm run dev
```

Scroll : Problem et HowItWorks apparaissent avec animations. ✓

- [ ] **Step 5 : Commit**

```bash
git add concept/components/sections/Problem.tsx concept/components/sections/HowItWorks.tsx concept/app/page.tsx
git commit -m "feat(concept): sections Problème + Comment ça marche"
```

---

## Task 9 : Sections Features + Showcase

**Files:**
- Create: `concept/components/sections/Features.tsx`
- Create: `concept/components/sections/Showcase.tsx`

- [ ] **Step 1 : Features.tsx**

```tsx
// concept/components/sections/Features.tsx
'use client'

import { motion } from 'framer-motion'
import { Map, Banknote, AlertTriangle, Bell, Filter, Navigation } from 'lucide-react'
import { FeatureCard } from '@/components/ui/FeatureCard'
import fr from '@/messages/fr.json'

const FEATURES = [
  { icon: Map, title: fr.features.f1_title, text: fr.features.f1_text, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  { icon: Banknote, title: fr.features.f2_title, text: fr.features.f2_text, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { icon: AlertTriangle, title: fr.features.f3_title, text: fr.features.f3_text, iconColor: 'text-accent', iconBg: 'bg-orange-50' },
  { icon: Bell, title: fr.features.f4_title, text: fr.features.f4_text, iconColor: 'text-secondary', iconBg: 'bg-blue-50' },
  { icon: Filter, title: fr.features.f5_title, text: fr.features.f5_text, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
  { icon: Navigation, title: fr.features.f6_title, text: fr.features.f6_text, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">{fr.features.h2}</h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.features.subtitle}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2 : Showcase.tsx**

```tsx
// concept/components/sections/Showcase.tsx
'use client'

import { motion } from 'framer-motion'
import { PhoneMockup } from '@/components/ui/PhoneMockup'
import fr from '@/messages/fr.json'

function MapScreen() {
  return (
    <div className="h-full bg-blue-50 p-3 relative overflow-hidden">
      <div className="text-[10px] font-bold text-slate-500 mb-2">📍 Alger · 7 DABs</div>
      <div className="bg-blue-100 rounded-xl h-40 relative overflow-hidden mb-3">
        {[
          { top: '25%', left: '20%', color: '#00C896' },
          { top: '45%', left: '55%', color: '#FF6B35' },
          { top: '20%', left: '70%', color: '#EF4444' },
          { top: '60%', left: '35%', color: '#00C896' },
        ].map((m, i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full border-2 border-white shadow" style={{ top: m.top, left: m.left, backgroundColor: m.color }} />
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { color: '#00C896', name: 'BNA Hydra', dist: '0.3 km', status: 'Dispo' },
          { color: '#FF6B35', name: 'CPA Bab E.', dist: '0.8 km', status: 'Vide' },
        ].map(item => (
          <div key={item.name} className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold text-dark flex-1">{item.name}</span>
            <span className="text-[9px] text-slate-400">{item.dist}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailScreen() {
  return (
    <div className="h-full bg-white p-3">
      <div className="text-[10px] font-bold text-dark mb-1">DAB BNA — Hydra</div>
      <div className="text-[9px] text-slate-400 mb-3">12 Rue Hassiba Ben Bouali</div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold text-emerald-700">Disponible · mis à jour il y a 4 min</span>
      </div>
      <div className="text-[9px] font-semibold text-dark/60 mb-2">Derniers signalements</div>
      {['✅ Dispo · 4 min', '✅ Dispo · 22 min', '💸 Vide · 1h'].map(s => (
        <div key={s} className="text-[9px] text-dark/50 py-1 border-b border-border/50">{s}</div>
      ))}
    </div>
  )
}

function SignalScreen() {
  return (
    <div className="h-full bg-white p-3 flex flex-col">
      <div className="text-[10px] font-bold text-dark mb-0.5">Signaler l'état</div>
      <div className="text-[9px] text-slate-400 mb-4">DAB BNA — Hydra · Anonyme</div>
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { emoji: '✅', label: 'Disponible', active: true },
          { emoji: '💸', label: 'Vide', active: false },
          { emoji: '🔧', label: 'En panne', active: false },
        ].map(b => (
          <div key={b.label} className={`rounded-xl p-2 text-center border-2 ${b.active ? 'border-primary bg-primary/10' : 'border-border'}`}>
            <div className="text-lg mb-0.5">{b.emoji}</div>
            <div className="text-[8px] font-bold text-dark/70">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-primary text-white text-[10px] font-bold text-center py-2.5 rounded-xl mt-auto">
        Envoyer
      </div>
    </div>
  )
}

const SLIDES = [
  { title: fr.showcase.s1_title, text: fr.showcase.s1_text, screen: <MapScreen />, shadow: 'rgba(0,200,150,0.2)', reverse: false },
  { title: fr.showcase.s2_title, text: fr.showcase.s2_text, screen: <DetailScreen />, shadow: 'rgba(37,99,235,0.2)', reverse: true },
  { title: fr.showcase.s3_title, text: fr.showcase.s3_text, screen: <SignalScreen />, shadow: 'rgba(255,107,53,0.2)', reverse: false },
]

export function Showcase() {
  return (
    <section className="section-padding bg-surface dark:bg-dark overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">{fr.showcase.h2}</h2>
          <p className="text-dark/60 dark:text-white/60">{fr.showcase.subtitle}</p>
        </motion.div>

        <div className="space-y-24">
          {SLIDES.map((slide, i) => (
            <div key={slide.title} className={`flex flex-col ${slide.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
              <motion.div
                initial={{ opacity: 0, x: slide.reverse ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand text-white font-black text-lg mb-4">
                  {i + 1}
                </div>
                <h3 className="font-display text-2xl font-black text-dark dark:text-white mb-3">{slide.title}</h3>
                <p className="text-dark/60 dark:text-white/60 leading-relaxed">{slide.text}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: slide.reverse ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex-1 flex justify-center"
              >
                <PhoneMockup shadowColor={slide.shadow}>
                  {slide.screen}
                </PhoneMockup>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3 : Ajouter dans page.tsx**

```tsx
// concept/app/page.tsx — remplacer
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Features } from '@/components/sections/Features'
import { Showcase } from '@/components/sections/Showcase'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Showcase />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4 : Vérifier**

```bash
npm run dev
```

Features et Showcase visibles, phones flottants avec contenu simulé. ✓

- [ ] **Step 5 : Commit**

```bash
git add concept/components/sections/Features.tsx concept/components/sections/Showcase.tsx concept/app/page.tsx
git commit -m "feat(concept): sections Fonctionnalités + Showcase avec phone mockups"
```

---

## Task 10 : Sections B2B + Stats + FAQ

**Files:**
- Create: `concept/components/sections/B2B.tsx`
- Create: `concept/components/sections/Stats.tsx`
- Create: `concept/components/sections/FAQ.tsx`
- Create: `concept/app/api/contact/route.ts`

- [ ] **Step 1 : Route API contact (stub)**

```ts
// concept/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('[Contact B2B]', body)
  // TODO: brancher Resend ou Formspree ici
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2 : B2B.tsx**

```tsx
// concept/components/sections/B2B.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Database, Zap, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import fr from '@/messages/fr.json'

const BENEFITS = [
  { icon: BarChart3, title: fr.b2b.b1_title, text: fr.b2b.b1_text, color: 'text-secondary', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { icon: Database, title: fr.b2b.b2_title, text: fr.b2b.b2_text, color: 'text-primary', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: Zap, title: fr.b2b.b3_title, text: fr.b2b.b3_text, color: 'text-accent', bg: 'bg-orange-50 dark:bg-orange-950/30' },
]

export function B2B() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = Object.fromEntries(new FormData(e.currentTarget))
    await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setLoading(false)
    setSent(true)
  }

  return (
    <section id="banques" className="section-padding bg-[#F1F5F9] dark:bg-dark">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Building2 className="w-3.5 h-3.5" />
            Offre professionnelle
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">{fr.b2b.h2}</h2>
          <p className="text-xl font-semibold text-secondary mb-3">{fr.b2b.subtitle}</p>
          <p className="text-dark/60 dark:text-white/60 max-w-2xl mx-auto">{fr.b2b.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-6 ${b.bg} border border-border`}
            >
              <b.icon className={`w-8 h-8 ${b.color} mb-4`} />
              <h3 className="font-display font-bold text-dark dark:text-white mb-2">{b.title}</h3>
              <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-dark/40 dark:text-white/40 mb-6">{fr.b2b.mention}</p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-secondary hover:bg-secondary-dark text-white font-bold px-8 py-3 rounded-full shadow-secondary transition-all hover:scale-105"
          >
            {fr.b2b.cta}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black">{fr.b2b.form_title}</DialogTitle>
            <DialogDescription>{fr.b2b.form_subtitle}</DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-dark dark:text-white">Demande envoyée !</p>
              <p className="text-sm text-dark/60 mt-1">Nous vous répondons sous 24h.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name', label: fr.b2b.form_name, type: 'text' },
                { name: 'bank', label: fr.b2b.form_bank, type: 'text' },
                { name: 'email', label: fr.b2b.form_email, type: 'email' },
              ].map(field => (
                <div key={field.name}>
                  <label className="text-sm font-medium text-dark dark:text-white block mb-1">{field.label}</label>
                  <input
                    name={field.name}
                    type={field.type}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary bg-white dark:bg-dark text-dark dark:text-white"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-dark dark:text-white block mb-1">{fr.b2b.form_message}</label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary bg-white dark:bg-dark text-dark dark:text-white resize-none"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-secondary text-white font-bold rounded-xl py-3">
                {loading ? 'Envoi…' : fr.b2b.form_submit}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
```

- [ ] **Step 3 : Stats.tsx**

```tsx
// concept/components/sections/Stats.tsx
import { StatCounter } from '@/components/ui/StatCounter'
import fr from '@/messages/fr.json'

export function Stats() {
  const stats = [
    { value: fr.stats.s1_value as number, label: fr.stats.s1_label },
    { value: fr.stats.s2_value as number, label: fr.stats.s2_label },
    { value: fr.stats.s3_value as number, label: fr.stats.s3_label },
    { value: fr.stats.s4_value as number, label: fr.stats.s4_label, decimals: 1 },
  ]

  return (
    <section className="py-16 bg-gradient-brand">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-2">{fr.stats.h2}</h2>
          <p className="text-white/70">{fr.stats.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <StatCounter key={s.label} value={s.value} label={s.label} decimals={(s as any).decimals ?? 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4 : FAQ.tsx**

```tsx
// concept/components/sections/FAQ.tsx
'use client'

import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import fr from '@/messages/fr.json'

const ITEMS = [
  { q: fr.faq.q1, a: fr.faq.a1 },
  { q: fr.faq.q2, a: fr.faq.a2 },
  { q: fr.faq.q3, a: fr.faq.a3 },
  { q: fr.faq.q4, a: fr.faq.a4 },
  { q: fr.faq.q5, a: fr.faq.a5 },
  { q: fr.faq.q6, a: fr.faq.a6 },
]

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">{fr.faq.h2}</h2>
        </motion.div>
        <Accordion type="single" collapsible className="space-y-3">
          {ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <AccordionItem value={`item-${i}`} className="border border-border rounded-2xl px-6 overflow-hidden bg-surface dark:bg-dark/50">
                <AccordionTrigger className="text-sm font-semibold text-dark dark:text-white text-left py-4 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-dark/60 dark:text-white/60 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
```

- [ ] **Step 5 : Ajouter dans page.tsx**

```tsx
// concept/app/page.tsx
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Features } from '@/components/sections/Features'
import { Showcase } from '@/components/sections/Showcase'
import { B2B } from '@/components/sections/B2B'
import { Stats } from '@/components/sections/Stats'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Showcase />
        <B2B />
        <Stats />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 6 : Vérifier**

```bash
npm run dev
```

B2B, Stats (compteurs animés), FAQ accordion visibles. Formulaire B2B s'ouvre en Dialog. ✓

- [ ] **Step 7 : Commit**

```bash
git add concept/components/sections/B2B.tsx concept/components/sections/Stats.tsx concept/components/sections/FAQ.tsx concept/app/api/ concept/app/page.tsx
git commit -m "feat(concept): sections B2B + Stats + FAQ + route API contact stub"
```

---

## Task 11 : CTA Final + Bonus (dark mode, témoignages, easter egg)

**Files:**
- Create: `concept/components/sections/FinalCTA.tsx`
- Create: `concept/components/sections/Testimonials.tsx`
- Create: `concept/components/ui/EasterEgg.tsx`
- Modify: `concept/app/page.tsx`

- [ ] **Step 1 : FinalCTA.tsx**

```tsx
// concept/components/sections/FinalCTA.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import fr from '@/messages/fr.json'

function AppStoreBadge() {
  return (
    <div className="flex items-center gap-3 bg-dark border border-white/20 text-white px-5 py-3 rounded-2xl hover:bg-dark/80 transition-colors cursor-pointer">
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <div>
        <div className="text-[9px] text-white/60 leading-none">Télécharger sur</div>
        <div className="text-sm font-bold leading-tight">App Store</div>
      </div>
    </div>
  )
}

function PlayStoreBadge() {
  return (
    <div className="flex items-center gap-3 bg-dark border border-white/20 text-white px-5 py-3 rounded-2xl hover:bg-dark/80 transition-colors cursor-pointer">
      <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0">
        <path fill="#00C896" d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
      </svg>
      <div>
        <div className="text-[9px] text-white/60 leading-none">Disponible sur</div>
        <div className="text-sm font-bold leading-tight">Google Play</div>
      </div>
    </div>
  )
}

export function FinalCTA() {
  const [phone, setPhone] = useState('')
  const [smsSent, setSmsSent] = useState(false)

  function handleSMS(e: React.FormEvent) {
    e.preventDefault()
    console.log('[SMS stub]', phone)
    setSmsSent(true)
  }

  return (
    <section id="telecharger" className="py-24 px-4 bg-gradient-brand relative overflow-hidden">
      {/* Décorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative"
      >
        <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
          {fr.cta_final.h2}
        </h2>
        <p className="text-white/80 text-lg mb-10">{fr.cta_final.subtitle}</p>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <AppStoreBadge />
          <PlayStoreBadge />
        </div>

        {/* Champ SMS */}
        {smsSent ? (
          <p className="text-white/80 text-sm">✅ Lien envoyé ! Vérifiez vos SMS.</p>
        ) : (
          <form onSubmit={handleSMS} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={fr.cta_final.sms_placeholder}
              className="flex-1 bg-white/15 border border-white/30 text-white placeholder-white/50 px-4 py-3 rounded-full text-sm focus:outline-none focus:border-white/60"
            />
            <button
              type="submit"
              className="bg-white text-primary font-bold px-6 py-3 rounded-full text-sm hover:bg-white/90 transition-colors flex-shrink-0"
            >
              {fr.cta_final.sms_cta}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2 : Testimonials.tsx**

```tsx
// concept/components/sections/Testimonials.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import fr from '@/messages/fr.json'

const TESTIMONIALS = [
  { text: fr.testimonials.t1_text, name: fr.testimonials.t1_name, role: fr.testimonials.t1_role, stars: 5 },
  { text: fr.testimonials.t2_text, name: fr.testimonials.t2_name, role: fr.testimonials.t2_role, stars: 5 },
  { text: fr.testimonials.t3_text, name: fr.testimonials.t3_name, role: fr.testimonials.t3_role, stars: 5 },
  { text: fr.testimonials.t4_text, name: fr.testimonials.t4_name, role: fr.testimonials.t4_role, stars: 5, isBank: true },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(t)
  }, [])

  const item = TESTIMONIALS[current]

  return (
    <section className="section-padding bg-surface dark:bg-dark text-center overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-black text-dark dark:text-white mb-12">
          {fr.testimonials.h2}
        </h2>
        <div className="relative min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className={`bg-white dark:bg-dark/60 rounded-3xl p-8 border shadow-card w-full ${item.isBank ? 'border-secondary/30' : 'border-border'}`}
            >
              <div className="flex justify-center gap-0.5 mb-4">
                {Array.from({ length: item.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-dark/80 dark:text-white/80 leading-relaxed mb-6 italic">"{item.text}"</p>
              <div>
                <div className="font-bold text-dark dark:text-white">{item.name}</div>
                <div className="text-sm text-dark/50 dark:text-white/50">{item.role}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Témoignage ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3 : EasterEgg — ours au scroll rapide**

```tsx
// concept/components/ui/EasterEgg.tsx
'use client'

import { useEffect, useState } from 'react'

export function EasterEgg() {
  const [visible, setVisible] = useState(false)
  const [lastY, setLastY] = useState(0)
  const [lastTime, setLastTime] = useState(0)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>

    function onScroll() {
      const now = Date.now()
      const y = window.scrollY
      const dt = now - lastTime
      if (dt > 0) {
        const velocity = Math.abs(y - lastY) / dt
        if (velocity > 3) {
          setVisible(true)
          clearTimeout(hideTimer)
          hideTimer = setTimeout(() => setVisible(false), 1800)
        }
      }
      setLastY(y)
      setLastTime(now)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(hideTimer) }
  }, [lastY, lastTime])

  if (!visible) return null

  return (
    <div className="fixed bottom-8 right-8 z-50 pointer-events-none animate-bounce">
      <div className="text-5xl" role="img" aria-label="Ours MapsDab">🐻</div>
    </div>
  )
}
```

- [ ] **Step 4 : page.tsx final complet**

```tsx
// concept/app/page.tsx
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Features } from '@/components/sections/Features'
import { Showcase } from '@/components/sections/Showcase'
import { B2B } from '@/components/sections/B2B'
import { Stats } from '@/components/sections/Stats'
import { Testimonials } from '@/components/sections/Testimonials'
import { FAQ } from '@/components/sections/FAQ'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { Footer } from '@/components/layout/Footer'
import { EasterEgg } from '@/components/ui/EasterEgg'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Showcase />
        <B2B />
        <Stats />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <EasterEgg />
    </>
  )
}
```

- [ ] **Step 5 : Vérifier**

```bash
npm run dev
```

Page complète. Testimonials tournent automatiquement. Ours apparaît au scroll rapide. ✓

- [ ] **Step 6 : Commit**

```bash
git add concept/components/sections/FinalCTA.tsx concept/components/sections/Testimonials.tsx concept/components/ui/EasterEgg.tsx concept/app/page.tsx
git commit -m "feat(concept): CTA final + témoignages carrousel + easter egg ours"
```

---

## Task 12 : SEO, dark mode toggle + vérification finale

**Files:**
- Create: `concept/public/sitemap.xml`
- Create: `concept/public/robots.txt`
- Modify: `concept/app/layout.tsx` (JSON-LD)
- Create: `concept/components/ui/DarkModeToggle.tsx`
- Modify: `concept/components/layout/Header.tsx`

- [ ] **Step 1 : sitemap.xml + robots.txt**

```xml
<!-- concept/public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mapsdab.com</loc>
    <lastmod>2026-05-08</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

```txt
# concept/public/robots.txt
User-agent: *
Allow: /
Sitemap: https://mapsdab.com/sitemap.xml
```

- [ ] **Step 2 : JSON-LD dans layout.tsx**

Ajouter dans `<head>` de `layout.tsx` :

```tsx
// Ajouter dans concept/app/layout.tsx, à l'intérieur de <head>
// (Next.js App Router : utiliser la prop `metadata` pour JSON-LD via script)
// Ajouter dans le <body> juste après :
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
```

- [ ] **Step 3 : DarkModeToggle**

```tsx
// concept/components/ui/DarkModeToggle.tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      aria-label="Changer le thème"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4 text-white" />
        : <Moon className="w-4 h-4 text-dark" />
      }
    </button>
  )
}
```

- [ ] **Step 4 : Ajouter DarkModeToggle dans Header**

Dans `concept/components/layout/Header.tsx`, ajouter avant le bouton burger :

```tsx
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'

// Dans le JSX, après le CTA desktop et avant le burger :
<DarkModeToggle />
```

- [ ] **Step 5 : Build de production**

```bash
npm run build
```

Zéro erreur TypeScript et zéro erreur de build. ✓

Si erreurs : corriger les imports manquants ou les types stricts.

- [ ] **Step 6 : Vérifier le site complet**

```bash
npm run dev
```

Checklist finale :
- [ ] Header sticky avec glassmorphism au scroll
- [ ] Hero : carte animée avec pings, flux live, avant/après, stats, double CTA
- [ ] Problème : 3 cards + transition narrative
- [ ] Comment ça marche : 4 étapes avec mini-mockups animés au scroll
- [ ] Fonctionnalités : grille 6 features
- [ ] Showcase : 3 phones flottants layout alterné
- [ ] B2B : fond distinct, formulaire dialog fonctionnel
- [ ] Stats : compteurs animés au scroll
- [ ] Témoignages : carrousel auto avec dots
- [ ] FAQ : accordion smooth
- [ ] CTA Final : badges App Store / Google Play + champ SMS
- [ ] Footer : 4 colonnes + sélecteur langue
- [ ] Dark mode : toggle fonctionnel
- [ ] Easter egg : ours au scroll rapide
- [ ] Mobile : responsive OK sur 320px
- [ ] `npm run build` : zéro erreur

- [ ] **Step 7 : Commit final**

```bash
git add concept/public/ concept/components/ui/DarkModeToggle.tsx
git commit -m "feat(concept): SEO (sitemap, robots, JSON-LD) + dark mode toggle + vérification finale"
```

---

## Récapitulatif — Ce qui reste à brancher

| Élément | Action |
|---|---|
| Liens App Store / Google Play | Remplacer `href="#"` quand les apps sont publiées |
| Formulaire B2B | `concept/app/api/contact/route.ts` → brancher Resend ou Formspree |
| Stats réelles | Remplacer les valeurs statiques dans `fr.json` par un fetch `https://mapsdab.com/api/admin/stats` |
| Analytics | `npm i @vercel/analytics` + `<Analytics />` dans `layout.tsx` |
| Déploiement | `cd concept && vercel --prod` |

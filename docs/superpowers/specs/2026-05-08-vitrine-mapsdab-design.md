# Spec — Site Vitrine MapsDab

**Date :** 2026-05-08
**Statut :** Validé
**Dossier cible :** `LocalisationDAB/concept/`
**Déploiement :** Vercel (après validation locale)

---

## 1. Objectif

Site vitrine one-page pour présenter l'application MapsDab (mapsdab.com) — localisation communautaire de DAB en temps réel. Double cible : citoyens (sections ludiques) et agences bancaires (section B2B sobre).

---

## 2. Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 14+ App Router | Framework |
| TypeScript | strict | Typage |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | latest | Animations |
| Lucide React | latest | Icônes |
| shadcn/ui | latest | Composants (Button, Card, Accordion, Dialog) |
| next/font | — | Space Grotesk + Inter |
| next/image | — | Optimisation images |

**Performance cible :** Lighthouse ≥ 95 Performance / ≥ 95 Accessibility / 100 Best Practices / ≥ 95 SEO

---

## 3. Structure du projet

```
LocalisationDAB/
└── concept/
    ├── app/
    │   ├── layout.tsx          ← metadata, fonts, theme provider
    │   ├── page.tsx            ← assemblage des sections
    │   └── api/
    │       └── contact/
    │           └── route.ts    ← stub formulaire B2B
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   └── Footer.tsx
    │   ├── sections/
    │   │   ├── Hero.tsx
    │   │   ├── Problem.tsx
    │   │   ├── HowItWorks.tsx
    │   │   ├── Features.tsx
    │   │   ├── Showcase.tsx
    │   │   ├── B2B.tsx
    │   │   ├── Stats.tsx
    │   │   ├── FAQ.tsx
    │   │   └── FinalCTA.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── FeatureCard.tsx
    │       ├── StepCard.tsx
    │       ├── StatCounter.tsx
    │       ├── FAQItem.tsx
    │       ├── PhoneMockup.tsx
    │       ├── LiveBadge.tsx
    │       └── MapAnimation.tsx
    ├── lib/
    │   └── utils.ts
    ├── messages/
    │   └── fr.json             ← tous les textes externalisés
    ├── public/
    │   └── images/
    │       └── logo.jpg        ← Logo - ATM locator.jpg (copié depuis Logos/)
    ├── styles/
    │   └── globals.css
    ├── tailwind.config.ts      ← palette complète centralisée
    ├── tsconfig.json           ← strict: true
    └── package.json
```

---

## 4. Identité visuelle

### Palette (centralisée dans tailwind.config.ts)

```ts
colors: {
  primary:   '#00C896',  // vert — cash dispo, CTA principaux
  secondary: '#2563EB',  // bleu — confiance, technologie
  accent:    '#FF6B35',  // orange — signalement, alerte
  danger:    '#EF4444',  // rouge — panne, vide
  warning:   '#FFB800',  // jaune — partiel
  dark:      '#0F172A',  // texte principal
  surface:   '#F8FAFC',  // fond global
  border:    '#E2E8F0',  // bordures
}
```

### Typographie
- **Headings h1/h2** : Space Grotesk (700/800/900)
- **Body + UI** : Inter (400/500/600)
- Coins : `rounded-2xl` / `rounded-3xl` généralisés
- Ombres : teintées dans la couleur de l'élément (jamais noir pur)

### Logo
- Fichier : `public/images/logo.jpg` (ours qui "dab" + pin coloré + texte "Maps Dab")
- Usage : header (h=40px), footer (h=32px)

### Mockups
- 100% codés (SVG + HTML/CSS) — pas de screenshots réels
- Device frames stylisés (phone mockup en CSS pur)
- Contenu simulé : carte avec markers vert/orange/rouge, liste DABs, modal signalement

---

## 5. Sections détaillées

### Header (sticky)
- Logo gauche + navigation (Concept / Fonctionnalités / Pour les banques / FAQ)
- CTA "Télécharger l'app" à droite (bouton arrondi primary)
- Glassmorphism au scroll (`backdrop-blur`, `bg-white/80`)
- Burger menu plein écran sur mobile avec animation slide

### Hero
- Layout split : texte gauche / visuel droite
- **Gauche :** badge live pulsant + headline h1 fort + sous-titre + bloc Avant/Après + 3 stats (1 286 DABs, 24/7, 100% gratuit) + double CTA
- **Droite :** carte animée (markers qui pulsent toutes les 3s, nouveaux pings aléatoires) + flux signalements live défilant
- Trust line : "Déjà X utilisateurs · Y signalements / jour"

### Problème
- Titre empathique avec humour léger
- 3 cards horizontales (stack mobile) : 🔴 Panne / 💸 Vide / ⏱️ File d'attente
- Transition narrative : "Et si la communauté pouvait vous prévenir avant ?"

### Comment ça marche
- Titre : "Le principe Waze, appliqué aux DAB"
- 4 étapes avec icône animée + mini-mockup d'écran + texte court
- Apparition fade+slide au scroll (Framer Motion whileInView)

### Fonctionnalités
- Grille 3×2 desktop / 1 col mobile
- 6 features : Carte temps réel / Statut cash / Signalement panne / DAB favoris / Filtres banque / Itinéraire optimal
- Icône colorée dans carré arrondi + titre + 2 lignes

### Showcase (Démo)
- 3 PhoneMockup flottants avec contenu différent (carte, fiche DAB, signalement)
- Layout alterné texte/mockup avec légère parallax au scroll
- Ombre teintée sous chaque phone

### B2B (Agences bancaires)
- Fond distinct (gris très clair `#F1F5F9`) — rupture visuelle claire
- 3 colonnes bénéfices pro : Visibilité / Données / Réactivité
- Mention : "Dashboard pro · API disponibles · Conformité RGPD"
- CTA "Demander une démo" → Dialog shadcn/ui avec formulaire (nom, banque, email, message)
- Route API `/api/contact` : log + réponse 200 (stub Resend-ready)

### Stats / Trust
- Bandeau pleine largeur, fond gradient vert→bleu
- 4 StatCounter animés au scroll : DABs référencés / Signalements/jour / Villes / Note ★
- Animation countUp via Framer Motion useInView

### FAQ
- 6 questions (voir brief)
- Accordion shadcn/ui, animation smooth

### CTA Final
- Gradient signature vert→bleu
- Accroche h2 forte
- 2 boutons App Store + Google Play (SVG badges officiels)
- Champ SMS optionnel (numéro → log API stub)

### Footer
- Logo + tagline
- 4 colonnes : Produit / Entreprise / Légal / Contact
- Réseaux sociaux (Lucide icons)
- Sélecteur langue FR/AR/EN (préparé i18n, RTL anticipé)
- Copyright + liens légaux

---

## 6. Bonus

| Feature | Implémentation |
|---|---|
| Mode sombre | `next-themes` + classes Tailwind `dark:` |
| Carte hero animée | SVG + setTimeout, pings toutes les 3s positions aléatoires |
| Témoignages | Carrousel Framer Motion (3 citoyens + 1 banque) |
| Easter egg ours | Apparaît en position fixed au scroll très rapide (velocité > seuil) |

---

## 7. SEO & Accessibilité

- Meta tags complets + OG + Twitter Card dans `layout.tsx`
- JSON-LD Schema.org : `MobileApplication` + `Organization`
- `sitemap.xml` + `robots.txt` statiques dans `/public`
- Balisage sémantique strict (header, main, section, article, footer)
- WCAG AA minimum, navigation clavier, `aria-label` exhaustifs
- `prefers-reduced-motion` respecté (Framer Motion `reducedMotion`)

---

## 8. i18n (préparation)

- Tous les textes dans `messages/fr.json`
- Structure prête pour `ar.json` (RTL) et `en.json`
- Classes Tailwind `rtl:` anticipées sur les composants directionnels

---

## 9. Ce qui reste à brancher après validation

- Vrais liens App Store / Google Play (quand l'app sera publiée)
- Formulaire B2B → Resend ou Formspree (remplacer le stub `/api/contact`)
- Analytics → Vercel Analytics (1 ligne à décommenter)
- Vraies stats (DABs, signalements) → fetch depuis l'API mapsdab.com
- Déploiement Vercel → `vercel --prod` depuis `/concept`

# Onboarding Screens — Design Spec

## Objectif

Afficher 4 slides explicatifs après le splash screen, uniquement lors de la première visite d'un nouvel utilisateur, pour présenter les fonctionnalités principales de Map's DAB.

---

## Déclenchement

- Vérifié dans `App.jsx` après la fin du splash screen
- Clé localStorage : `mapsdab_onboarding_done`
- Si la clé est absente → afficher l'onboarding
- Si la clé est présente → passer directement à `HomePage`
- À la fermeture de l'onboarding (slide finale ou "Passer") → écrire `mapsdab_onboarding_done = "1"` en localStorage

---

## Contenu des slides

| # | Titre | Description | Visuel |
|---|---|---|---|
| 1 | Trouvez les distributeurs près de vous | Carte interactive avec les distributeurs autour de vous, en temps réel | `screenshot-1778171931782.png` |
| 2 | L'état des distributeurs en direct | La communauté signale si un distributeur est disponible, vide ou en panne | `screenshot-1778171970133.png` |
| 3 | Complétez la carte | Un distributeur manquant ? Signalez-le en un tap pour aider la communauté | *(screenshot à ajouter : `screenshot-onboarding-3.png`)* |
| 4 | *(slide finale — pas de screenshot)* | — | Fond dégradé bleu, logo + nom de l'app, bouton "C'est parti !" |

> Les screenshots sont placés dans `frontend/public/` et référencés par chemin relatif (`/screenshot-xxx.png`).

---

## Layout

### Slides 1–3 (split layout)

```
┌─────────────────────────────┐
│  [Passer]          (top right, texte bleu-600, sm)
│                             │
│   Screenshot                │  ← 60% de la hauteur de l'écran
│   object-cover, arrondi bas │    (rounded-b-2xl, shadow)
│   (coins bas arrondis)      │
│                             │
├─────────────────────────────┤
│                             │  ← 40% restant, fond blanc
│  Titre                      │    (text-xl font-bold text-gray-900)
│  Description                │    (text-sm text-slate-500, mt-2)
│                             │
│  ● ○ ○ ○      [Suivant →]  │  ← dots + bouton bleu-600
└─────────────────────────────┘
```

### Slide 4 (finale)

```
┌─────────────────────────────┐
│                             │
│   Logo (img /logo.png)      │  ← fond dégradé from-blue-600 to-blue-800
│   Map's DAB                 │    texte blanc, centré
│                             │
│   [  C'est parti !  ]       │  ← bouton blanc, texte bleu-600
│                             │
└─────────────────────────────┘
```

---

## Navigation

| Action | Comportement |
|---|---|
| Swipe gauche | Slide suivante (seuil minimum 50px) |
| Swipe droite | Slide précédente |
| Tap dot | Aller à la slide correspondante |
| Bouton "Suivant" | Slide suivante |
| Bouton "Passer" (slides 1–3) | Aller directement à la slide 4 |
| Bouton "C'est parti !" (slide 4) | Fermer l'onboarding, écrire localStorage |

- Transition entre slides : `translate-x` CSS avec `transition-transform duration-300`
- Pas de transition en boucle (la slide 4 n'a pas de "Suivant")

---

## i18n

Clés à ajouter dans les fichiers de traduction (`fr.json`, `ar.json`) :

```json
"onboarding": {
  "skip": "Passer",
  "next": "Suivant",
  "start": "C'est parti !",
  "slide1_title": "Trouvez les distributeurs près de vous",
  "slide1_desc": "Carte interactive avec les distributeurs autour de vous, en temps réel",
  "slide2_title": "L'état des distributeurs en direct",
  "slide2_desc": "La communauté signale si un distributeur est disponible, vide ou en panne",
  "slide3_title": "Complétez la carte",
  "slide3_desc": "Un distributeur manquant ? Signalez-le en un tap pour aider la communauté"
}
```

---

## Architecture — Fichiers

| Action | Fichier |
|---|---|
| Créer | `frontend/src/components/UI/OnboardingScreen.jsx` |
| Modifier | `frontend/src/App.jsx` — état `showOnboarding`, logique localStorage |
| Modifier | `frontend/public/locales/fr/translation.json` — clés `onboarding.*` |
| Modifier | `frontend/public/locales/ar/translation.json` — clés `onboarding.*` |
| Ajouter | `frontend/public/screenshot-onboarding-3.png` — screenshot pour slide 3 |

---

## Logique dans App.jsx

```
splash terminé
  → lire localStorage('mapsdab_onboarding_done')
    → absent : afficher OnboardingScreen (showOnboarding = true)
    → présent : afficher HomePage directement

OnboardingScreen appelle onDone()
  → écrire localStorage('mapsdab_onboarding_done', '1')
  → showOnboarding = false
  → afficher HomePage
```

---

## Hors scope

- Pas de replay de l'onboarding depuis les paramètres
- Pas d'animation entre slides autre que translate-x
- Pas de version desktop spécifique (l'onboarding est centré, max-width 480px sur desktop)

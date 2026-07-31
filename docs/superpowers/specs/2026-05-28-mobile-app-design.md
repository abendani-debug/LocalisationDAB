# Design — Application Mobile MapsDab
*Date : 2026-05-28*

## Contexte

Application mobile iOS + Android pour MapsDab (mapsdab.com). Reprend l'expérience web à l'identique — mêmes données, même backend, même charte visuelle. Objectif v1 : build de test (Expo Go + APK Android) pour valider le concept avant publication en store.

---

## Architecture générale

**Repo** : `LocalisationDAB-mobile/` — repo Git séparé (Option A)

**Stack**
```
Expo SDK 52+ (managed workflow)
Expo Router          — file-based routing (comme Next.js)
react-native-maps    — Google Maps Android / Apple Maps iOS
TanStack Query       — server state, cache, refetch
expo-location        — géolocalisation native
expo-secure-store    — stockage sécurisé (JWT)
AsyncStorage         — stockage persistant (cookie UUID, votes, langue)
axios                — appels API (même config que le web)
i18next              — internationalisation FR/EN
```

**Backend** : aucun changement. L'app consomme `https://mapsdab.com/api` — même API REST + Socket.io que le web.

---

## Navigation & Écrans

### Structure Expo Router

```
mobile/app/
├── (tabs)/
│   ├── _layout.tsx        ← Tab bar : Accueil | Favoris | Profil
│   ├── index.tsx          ← Accueil (Carte + toggle Liste)
│   ├── favoris.tsx        ← DABs favoris (connecté uniquement)
│   └── profil.tsx         ← Connexion / infos compte
├── dab/
│   └── [id].tsx           ← Détail DAB
├── auth/
│   ├── login.tsx          ← Formulaire login
│   └── register.tsx       ← Formulaire inscription
└── _layout.tsx            ← Root layout (QueryClient, AuthContext, i18n)
```

### Flux de navigation

```
Tab Accueil
  → Carte (défaut) ──→ tap marker → callout → "Voir détail" → /dab/[id]
  → Toggle Liste   ──→ tap card   ──────────────────────────→ /dab/[id]

/dab/[id]
  → 3 boutons signalement (géoloc ≤ 1km obligatoire)
  → Avis (lecture libre, écriture si connecté)
  → ⭐ Favori (si connecté)
  → 🧭 Y aller (ouvre Google Maps / Plans natif)

Tab Favoris  → liste DABs sauvegardés → /dab/[id]
Tab Profil   → non connecté → /auth/login ou /auth/register
             → connecté    → nom, email, déconnexion
```

### Écran Accueil — Carte

- Carte plein écran (`react-native-maps`), **sans barre de recherche superposée**
- La géolocalisation centre automatiquement sur la position de l'utilisateur
- Toggle Carte / Liste dans la barre sous le header (pas sur la carte)
- FAB "recentrer" : icône `maps_target.png` (pin orange MapsDab) dans carré blanc arrondi
- Marker utilisateur : `maps_target.png` (72×72, même asset que le web)
- Markers DAB : cercle avec **vrai logo banque** (pas d'abréviation) + bordure colorée selon état + pointe triangulaire (identique au web, logique `bankConfig.js` réutilisée)
  - Logos Wikimedia SVG → chargés via URI (`<Image source={{ uri: logoUrl }}`)
  - Logos locaux (AGB, Al Baraka, Housing Bank) → copiés de `frontend/public/logos/` vers `mobile/assets/logos/`
- **Pas de barre de recherche superposée sur la carte** — la géoloc centre automatiquement, la carte reste plein écran épurée
- Tap sur marker → callout : nom, banque, distance, badges statut, boutons "Voir détail" + "Y aller"

### Couleurs statuts (identiques au web)

| État | Couleur bordure marker |
|---|---|
| disponible | `#16a34a` (vert) |
| vide | `#ea580c` (orange) |
| en_panne | `#dc2626` (rouge) |
| aucun signalement | `#9ca3af` (neutre) |

---

## Composants

### Copiés sans modification

| Fichier | Usage |
|---|---|
| `bankConfig.js` | Config visuelle 18 banques (logos, couleurs, regex) |
| `formatUtils.js` | `haversineKm()`, `formatDistance()` |
| `i18n/locales/fr.json` | Traductions FR |
| `i18n/locales/en.json` | Traductions EN |

### Adaptés (logique identique, syntaxe React Native)

| Web | Mobile | Changements |
|---|---|---|
| `DABCard.jsx` | `DABCard.tsx` | `<div>` → `<View>`, CSS → StyleSheet |
| `SignalementButton.jsx` | `SignalementButton.tsx` | Même 4 états géoloc |
| `DABDetail.jsx` | `DABDetail.tsx` | Même structure, mini-carte native |
| `LoginForm.jsx` | `LoginForm.tsx` | `<input>` → `<TextInput>` |
| `RegisterForm.jsx` | `RegisterForm.tsx` | idem |
| `useDABs.js` | `useDABs.ts` | Identique |
| `useGeolocation.js` | `useGeolocation.ts` | `navigator.geolocation` → `expo-location` |
| `signalementApi.js` | `signalementApi.ts` | `localStorage` → `AsyncStorage` + `expo-secure-store` |
| `authApi.js` | `authApi.ts` | Identique |
| `dabApi.js` | `dabApi.ts` | Identique |

---

## Stockage local

| Donnée | Web | Mobile |
|---|---|---|
| Cookie UUID anti-spam | `localStorage` | `AsyncStorage` |
| JWT token | `localStorage` | `expo-secure-store` |
| Votes locaux 4h | `localStorage` | `AsyncStorage` |
| Langue (FR/EN) | `localStorage` | `AsyncStorage` |

Aucune base de données locale — toutes les données viennent de `mapsdab.com/api`.

---

## Charte visuelle

Identique au web :
- Fond blanc `#ffffff`, bordures `#e2e8f0`
- Accent bleu `#2563eb`
- Texte principal `#0f172a`, secondaire `#94a3b8`
- Cards `rounded-xl` (borderRadius 12), ombres légères
- Badges statut : vert `#16a34a`, amber `#d97706`, rouge `#dc2626`
- Police système (`-apple-system` / `Roboto`)

---

## Déploiement v1 (test)

- **Expo Go** : scan QR code sur téléphone, zéro build
- **EAS Build Android** : `eas build --platform android --profile preview` → APK partageable sans Play Store
- Pas de publication store pour la v1

## Déploiement v2 (production)

- Apple Developer ($99/an) → App Store
- Google Play ($25 one-time) → Play Store
- `eas submit` pour les deux plateformes

---

## Périmètre v1 — fonctionnalités

- [x] Carte avec markers banques + statuts
- [x] Toggle Carte / Liste
- [x] Détail DAB (infos, mini-carte, avis)
- [x] Signalements anonymes (géoloc ≤ 1km obligatoire)
- [x] Créer un compte / se connecter
- [x] Favoris (si connecté)
- [x] Navigation vers le DAB (app Maps native)
- [x] FR / EN

## Hors périmètre v1

- Push notifications (v2)
- Mode hors-ligne
- Publication App Store / Play Store
- Admin mobile

# MapsDab Mobile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer l'application mobile MapsDab (iOS + Android) avec Expo, reprenant l'expérience web à l'identique — carte avec markers banques, signalements anonymes géolocalisés, auth optionnelle, favoris.

**Architecture:** Repo séparé `LocalisationDAB-mobile/`, Expo managed workflow. Réutilisation maximale du code web (bankConfig, formatUtils, api, i18n). Backend inchangé — consommation de `https://mapsdab.com/api`.

**Tech Stack:** Expo SDK 52, Expo Router, react-native-maps, TanStack Query, expo-location, expo-secure-store, AsyncStorage, axios, i18next

---

## Fichiers créés

```
LocalisationDAB-mobile/
├── app.json                         ← config Expo (nom, icône, bundle ID)
├── package.json
├── tsconfig.json
├── .env                             ← EXPO_PUBLIC_API_URL
├── assets/
│   ├── maps_target.png              ← copié de frontend/public/
│   ├── logo.png                     ← copié de frontend/public/
│   └── logos/                       ← AGB, Al Baraka, Housing Bank (copié de frontend/public/logos/)
│       ├── agb_bank_logo.png
│       ├── AL_Braka_bank_logo.png
│       ├── Essalam_bank_logo.png
│       └── housing_bank_logo.png
├── src/
│   ├── constants/
│   │   └── colors.ts                ← palette identique au web
│   ├── utils/
│   │   ├── bankConfig.ts            ← copié du web, logoUrl locaux adaptés
│   │   ├── formatUtils.ts           ← copié du web
│   │   └── storage.ts               ← wrappers AsyncStorage + SecureStore
│   ├── i18n/
│   │   ├── index.ts                 ← init i18next
│   │   └── locales/
│   │       ├── fr.json              ← copié du web
│   │       └── en.json              ← copié du web
│   ├── api/
│   │   ├── axiosConfig.ts           ← adapté (SecureStore au lieu de localStorage)
│   │   ├── dabApi.ts                ← copié du web
│   │   ├── authApi.ts               ← copié du web
│   │   ├── avisApi.ts               ← copié du web
│   │   └── signalementApi.ts        ← adapté (AsyncStorage au lieu de localStorage)
│   ├── context/
│   │   └── AuthContext.tsx          ← adapté (SecureStore au lieu de localStorage)
│   ├── hooks/
│   │   ├── useAuth.ts               ← copié du web
│   │   ├── useDABs.ts               ← adapté (TanStack Query)
│   │   └── useGeolocation.ts        ← adapté (expo-location)
│   └── components/
│       ├── DABCard.tsx              ← adapté (View/StyleSheet)
│       ├── DABMarker.tsx            ← nouveau (react-native-maps custom marker)
│       ├── SignalementButton.tsx    ← adapté (View/StyleSheet)
│       ├── AvisList.tsx             ← adapté
│       └── AvisForm.tsx             ← adapté
└── app/
    ├── _layout.tsx                  ← Root layout (providers)
    ├── (tabs)/
    │   ├── _layout.tsx              ← Tab bar
    │   ├── index.tsx                ← Accueil (Carte + Liste)
    │   ├── favoris.tsx              ← Favoris
    │   └── profil.tsx               ← Profil
    ├── dab/
    │   └── [id].tsx                 ← Détail DAB
    └── auth/
        ├── login.tsx
        └── register.tsx
```

---

## Task 1 : Bootstrap du projet Expo

**Files:**
- Create: `LocalisationDAB-mobile/` (répertoire racine — créer EN DEHORS de LocalisationDAB/)

- [ ] **Step 1 : Créer le projet Expo**

```bash
cd ~/Documents   # ou le répertoire parent souhaité
npx create-expo-app@latest LocalisationDAB-mobile --template blank-typescript
cd LocalisationDAB-mobile
```

- [ ] **Step 2 : Installer les dépendances**

```bash
npx expo install expo-router react-native-maps expo-location expo-secure-store @react-native-async-storage/async-storage
npx expo install @tanstack/react-query axios i18next react-i18next
npx expo install react-native-safe-area-context react-native-screens
```

- [ ] **Step 3 : Configurer app.json**

Remplacer le contenu de `app.json` par :

```json
{
  "expo": {
    "name": "MapsDab",
    "slug": "mapsdab",
    "version": "1.0.0",
    "scheme": "mapsdab",
    "orientation": "portrait",
    "icon": "./assets/logo.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.mapsdab.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "MapsDab utilise votre position pour afficher les DABs proches."
      }
    },
    "android": {
      "package": "com.mapsdab.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/logo.png",
        "backgroundColor": "#ffffff"
      },
      "config": {
        "googleMaps": {
          "apiKey": "REMPLACER_PAR_CLE_GOOGLE_MAPS_ANDROID"
        }
      },
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    "plugins": [
      "expo-router",
      "expo-location",
      [
        "react-native-maps",
        {
          "googleMapsApiKey": "REMPLACER_PAR_CLE_GOOGLE_MAPS_ANDROID"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 4 : Configurer tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 5 : Créer .env**

```
EXPO_PUBLIC_API_URL=https://mapsdab.com/api
EXPO_PUBLIC_MAP_DEFAULT_LAT=36.7372
EXPO_PUBLIC_MAP_DEFAULT_LNG=3.0865
EXPO_PUBLIC_MAP_DEFAULT_ZOOM=13
```

- [ ] **Step 6 : Copier les assets depuis le repo web**

```bash
# Depuis la racine de LocalisationDAB-mobile/
cp ../LocalisationDAB/frontend/public/maps_target.png assets/maps_target.png
cp ../LocalisationDAB/frontend/public/logo.png assets/logo.png
mkdir -p assets/logos
cp ../LocalisationDAB/frontend/public/logos/agb_bank_logo.png assets/logos/
cp ../LocalisationDAB/frontend/public/logos/AL_Braka_bank_logo.png assets/logos/
cp ../LocalisationDAB/frontend/public/logos/Essalam_bank_logo.png assets/logos/
cp ../LocalisationDAB/frontend/public/logos/housing_bank_logo.png assets/logos/
```

- [ ] **Step 7 : Vérifier que l'app démarre**

```bash
npx expo start
```

Attendu : QR code affiché, pas d'erreur dans la console.

- [ ] **Step 8 : Commit**

```bash
git init && git add -A
git commit -m "feat: bootstrap Expo project MapsDab mobile"
```

---

## Task 2 : Constantes, storage, i18n

**Files:**
- Create: `src/constants/colors.ts`
- Create: `src/utils/storage.ts`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/fr.json`
- Create: `src/i18n/locales/en.json`

- [ ] **Step 1 : Créer la palette de couleurs**

`src/constants/colors.ts` :

```typescript
export const COLORS = {
  // Accents
  blue600: '#2563eb',
  blue50: '#eff6ff',

  // Statuts
  green600: '#16a34a',
  green50: '#f0fdf4',
  amber500: '#d97706',
  amber50: '#fffbeb',
  red600: '#dc2626',
  orange600: '#ea580c',
  orange50: '#fff7ed',

  // Neutres
  white: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  gray900: '#0f172a',

  // Marker neutre
  neutral400: '#9ca3af',
} as const;

export const STATUS_BORDER: Record<string, string> = {
  green:   COLORS.green600,
  orange:  COLORS.orange600,
  red:     COLORS.red600,
  neutral: COLORS.neutral400,
};
```

- [ ] **Step 2 : Créer les wrappers storage**

`src/utils/storage.ts` :

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// JWT — stockage sécurisé
export const saveToken = (token: string) => SecureStore.setItemAsync('token', token);
export const getToken  = () => SecureStore.getItemAsync('token');
export const removeToken = () => SecureStore.deleteItemAsync('token');

// Données non sensibles — AsyncStorage
export const saveItem   = (key: string, value: string) => AsyncStorage.setItem(key, value);
export const getItem    = (key: string) => AsyncStorage.getItem(key);
export const removeItem = (key: string) => AsyncStorage.removeItem(key);
```

- [ ] **Step 3 : Copier les fichiers de traduction**

```bash
mkdir -p src/i18n/locales
cp ../LocalisationDAB/frontend/src/i18n/locales/fr.json src/i18n/locales/fr.json
cp ../LocalisationDAB/frontend/src/i18n/locales/en.json src/i18n/locales/en.json
```

- [ ] **Step 4 : Créer l'initialisation i18n**

`src/i18n/index.ts` :

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getItem, saveItem } from '@/utils/storage';
import fr from './locales/fr.json';
import en from './locales/en.json';

export const initI18n = async () => {
  const saved = await getItem('lang');
  await i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: saved || 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });
};

export const switchLang = async () => {
  const next = i18n.language === 'fr' ? 'en' : 'fr';
  await i18n.changeLanguage(next);
  await saveItem('lang', next);
};

export default i18n;
```

- [ ] **Step 5 : Commit**

```bash
git add src/constants/ src/utils/storage.ts src/i18n/
git commit -m "feat: constants, storage wrappers, i18n"
```

---

## Task 3 : API layer + AuthContext

**Files:**
- Create: `src/api/axiosConfig.ts`
- Create: `src/api/dabApi.ts`
- Create: `src/api/authApi.ts`
- Create: `src/api/avisApi.ts`
- Create: `src/api/signalementApi.ts`
- Create: `src/utils/bankConfig.ts`
- Create: `src/utils/formatUtils.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1 : Créer axiosConfig**

`src/api/axiosConfig.ts` :

```typescript
import axios from 'axios';
import { getToken, removeToken } from '@/utils/storage';
import { router } from 'expo-router';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://mapsdab.com/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      router.replace('/auth/login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2 : Créer dabApi (copie exacte du web)**

`src/api/dabApi.ts` :

```typescript
import api from './axiosConfig';

export const getDABs = (params?: Record<string, unknown>) =>
  api.get('/dabs', { params }).then((r) => r.data);

export const getNearbyDABs = (lat: number, lng: number, radius = 2, extra: Record<string, unknown> = {}) =>
  api.get('/dabs/nearby', { params: { lat, lng, radius, ...extra } }).then((r) => r.data);

export const getDAB = (id: number | string) =>
  api.get(`/dabs/${id}`).then((r) => r.data);

export const proposerDAB = (data: Record<string, unknown>) =>
  api.post('/dabs/proposer', data).then((r) => r.data);
```

- [ ] **Step 3 : Créer authApi**

`src/api/authApi.ts` :

```typescript
import api from './axiosConfig';

export const register = (data: { nom: string; email: string; password: string }) =>
  api.post('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);
```

- [ ] **Step 4 : Créer avisApi**

`src/api/avisApi.ts` :

```typescript
import api from './axiosConfig';

export const getAvis = (dabId: number | string) =>
  api.get(`/dabs/${dabId}/avis`).then((r) => r.data);

export const postAvis = (dabId: number | string, data: { note: number; commentaire?: string }) =>
  api.post(`/dabs/${dabId}/avis`, data).then((r) => r.data);

export const deleteAvis = (dabId: number | string, avisId: number | string) =>
  api.delete(`/dabs/${dabId}/avis/${avisId}`).then((r) => r.data);
```

- [ ] **Step 5 : Créer signalementApi (adapté — AsyncStorage)**

`src/api/signalementApi.ts` :

```typescript
import { v4 as uuidv4 } from 'uuid';
import api from './axiosConfig';
import { getItem, saveItem, removeItem } from '@/utils/storage';

// Note: installer uuid → npx expo install uuid
// et ajouter: import 'react-native-get-random-values'; dans app/_layout.tsx

const VOTE_DURATION_MS = 4 * 60 * 60 * 1000; // 4h

const getCookieId = async (): Promise<string> => {
  let id = await getItem('dab_cookie_id');
  if (!id) {
    id = uuidv4();
    await saveItem('dab_cookie_id', id);
  }
  return id;
};

export const getLocalVote = async (dabId: number | string) => {
  try {
    const raw = await getItem(`dab_vote_${dabId}`);
    if (!raw) return null;
    const vote = JSON.parse(raw);
    if (new Date(vote.expires_at) <= new Date()) {
      await removeItem(`dab_vote_${dabId}`);
      return null;
    }
    return vote as { etat: string; nb_updates: number; expires_at: string };
  } catch {
    return null;
  }
};

const saveLocalVote = async (dabId: number | string, etat: string, nb_updates: number) => {
  const expires_at = new Date(Date.now() + VOTE_DURATION_MS).toISOString();
  await saveItem(`dab_vote_${dabId}`, JSON.stringify({ etat, nb_updates, expires_at }));
};

export const getSignalements = (dabId: number | string) =>
  api.get(`/dabs/${dabId}/signalements`).then((r) => r.data);

export const submitSignalement = async (
  dabId: number | string,
  etat: string,
  userLat: number,
  userLng: number
) => {
  const cookieId = await getCookieId();
  const res = await api.post(`/dabs/${dabId}/signalements`, {
    etat, cookieId, userLat, userLng,
  });
  const modified = res.data?.data?.modified ?? false;
  await saveLocalVote(dabId, etat, modified ? 1 : 0);
  return res.data;
};
```

- [ ] **Step 6 : Installer uuid**

```bash
npx expo install uuid react-native-get-random-values
```

- [ ] **Step 7 : Copier bankConfig et formatUtils**

```bash
cp ../LocalisationDAB/frontend/src/utils/bankConfig.js src/utils/bankConfig.ts
cp ../LocalisationDAB/frontend/src/utils/formatUtils.js src/utils/formatUtils.ts
```

Modifier dans `src/utils/bankConfig.ts` — remplacer les 4 logoUrl locaux :
```typescript
// AGB
logoUrl: require('../../assets/logos/agb_bank_logo.png'),
// Al Baraka
logoUrl: require('../../assets/logos/AL_Braka_bank_logo.png'),
// Banque Es Salam
logoUrl: require('../../assets/logos/Essalam_bank_logo.png'),
// Housing Bank
logoUrl: require('../../assets/logos/housing_bank_logo.png'),
```

Les logos Wikimedia restent en URL string — chargés via `<Image source={{ uri: logoUrl }}`.

Ajouter le type d'export en bas de `bankConfig.ts` :
```typescript
export type BankConfig = {
  key: string; abbr: string; bg: string; text: string;
  label: string; logoUrl: string | number | null; logoSize?: number;
  match: RegExp;
};
```

- [ ] **Step 8 : Créer AuthContext**

`src/context/AuthContext.tsx` :

```typescript
import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getMe } from '@/api/authApi';
import { saveToken, getToken, removeToken } from '@/utils/storage';

type User = { id: number; nom: string; email: string; role: string };

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await getToken();
      if (!saved) { setLoading(false); return; }
      setToken(saved);
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        await removeToken();
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (tokenValue: string, userData: User) => {
    await saveToken(tokenValue);
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 9 : Créer useAuth**

`src/hooks/useAuth.ts` :

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

- [ ] **Step 10 : Commit**

```bash
git add src/api/ src/context/ src/hooks/useAuth.ts src/utils/bankConfig.ts src/utils/formatUtils.ts
git commit -m "feat: api layer, AuthContext, bankConfig, formatUtils"
```

---

## Task 4 : Hooks métier (useGeolocation, useDABs)

**Files:**
- Create: `src/hooks/useGeolocation.ts`
- Create: `src/hooks/useDABs.ts`

- [ ] **Step 1 : Créer useGeolocation (expo-location)**

`src/hooks/useGeolocation.ts` :

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

const DEFAULT_LAT = parseFloat(process.env.EXPO_PUBLIC_MAP_DEFAULT_LAT || '36.7372');
const DEFAULT_LNG = parseFloat(process.env.EXPO_PUBLIC_MAP_DEFAULT_LNG || '3.0865');

type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
type Position = { lat: number; lng: number };

export default function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [status, setStatus]     = useState<GeoStatus>('idle');
  const subscriptionRef         = useRef<Location.LocationSubscription | null>(null);

  const startWatch = useCallback(async () => {
    if (subscriptionRef.current) return;
    subscriptionRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      ({ coords }) => {
        setPosition({
          lat: Math.round(coords.latitude  * 10000) / 10000,
          lng: Math.round(coords.longitude * 10000) / 10000,
        });
      }
    );
  }, []);

  useEffect(() => {
    // Vérifier si permission déjà accordée au montage
    Location.getForegroundPermissionsAsync().then(({ status: s }) => {
      if (s === 'granted') { setStatus('granted'); startWatch(); }
    });
    return () => { subscriptionRef.current?.remove(); };
  }, [startWatch]);

  const requestLocation = useCallback(async () => {
    setStatus('requesting');
    const { status: s } = await Location.requestForegroundPermissionsAsync();
    if (s !== 'granted') { setStatus('denied'); return; }
    setStatus('granted');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setPosition({
      lat: Math.round(loc.coords.latitude  * 10000) / 10000,
      lng: Math.round(loc.coords.longitude * 10000) / 10000,
    });
    startWatch();
  }, [startWatch]);

  const defaultPosition = useRef<Position>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const displayPosition = position || defaultPosition.current;
  const isDefault = status !== 'granted' || position === null;

  return { position: displayPosition, status, isDefault, requestLocation };
}
```

- [ ] **Step 2 : Créer useDABs (TanStack Query)**

`src/hooks/useDABs.ts` :

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNearbyDABs } from '@/api/dabApi';

type Position = { lat: number; lng: number };
type Filters = { banque_id?: number; statut?: string; radius?: number };

export default function useDABs(position: Position, filters: Filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dabs', position.lat, position.lng, filters],
    queryFn: () => getNearbyDABs(position.lat, position.lng, filters.radius || 2, {
      ...(filters.banque_id && { banque_id: filters.banque_id }),
      ...(filters.statut    && { statut: filters.statut }),
    }),
    select: (res) => res.data || [],
    staleTime: 60_000, // 1 minute
  });

  const updateDAB = (dabId: number, updates: Record<string, unknown>) => {
    queryClient.setQueryData(
      ['dabs', position.lat, position.lng, filters],
      (old: { data: unknown[] } | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.map((d: Record<string, unknown>) => d.id === dabId ? { ...d, ...updates } : d) };
      }
    );
  };

  return { dabs: data || [], loading: isLoading, error, refetch, updateDAB };
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/hooks/
git commit -m "feat: useGeolocation (expo-location), useDABs (TanStack Query)"
```

---

## Task 5 : Root layout + Tab bar

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1 : Créer le root layout**

`app/_layout.tsx` :

```typescript
import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from '@/context/AuthContext';
import { initI18n } from '@/i18n';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => { initI18n(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2 : Créer le tab layout**

`app/(tabs)/_layout.tsx` :

```typescript
import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: COLORS.blue600,
      tabBarInactiveTintColor: COLORS.slate400,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.slate200,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      header: () => (
        <View style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.slate200,
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Image source={require('../../assets/logo.png')} style={{ height: 40, width: 120 }} resizeMode="contain" />
        </View>
      ),
    }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home', 'Accueil'), tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="favoris"
        options={{ title: t('nav.favorites', 'Favoris'), tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: t('nav.profile', 'Profil'), tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <View style={{ opacity: color === COLORS.blue600 ? 1 : 0.5 }}><Image source={{ uri: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }} style={{ width: 0, height: 0 }} /><View style={{ fontSize: 20 }}>{/* emoji */}</View></View>;
}
```

Note : pour les icônes de tab, remplacer `TabIcon` par une solution emoji simple :

```typescript
import { Text } from 'react-native';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
```

- [ ] **Step 3 : Vérifier le rendu**

```bash
npx expo start
```

Attendu : tab bar avec 3 onglets visible, logo en header.

- [ ] **Step 4 : Commit**

```bash
git add app/_layout.tsx app/'(tabs)'/_layout.tsx
git commit -m "feat: root layout, tab bar navigation"
```

---

## Task 6 : Composant DABMarker (carte custom marker)

**Files:**
- Create: `src/components/DABMarker.tsx`

- [ ] **Step 1 : Créer DABMarker**

`src/components/DABMarker.tsx` :

```typescript
import { View, Image, StyleSheet, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { getBankConfig } from '@/utils/bankConfig';
import { etatColor } from '@/utils/formatUtils';
import { COLORS, STATUS_BORDER } from '@/constants/colors';

type DAB = {
  id: number; nom: string; adresse?: string; banque_nom?: string;
  latitude: string | number; longitude: string | number;
  statut: string; etat_communautaire?: string; distance_km?: number;
};

type Props = {
  dab: DAB;
  onSelect: (id: number) => void;
};

export default function DABMarker({ dab, onSelect }: Props) {
  const statusColor = etatColor(dab);
  const borderColor = STATUS_BORDER[statusColor] || COLORS.neutral400;
  const bankCfg = getBankConfig(dab.banque_nom) || getBankConfig(dab.nom);

  const logoSource = bankCfg?.logoUrl
    ? (typeof bankCfg.logoUrl === 'string'
        ? { uri: bankCfg.logoUrl }
        : bankCfg.logoUrl)
    : null;

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(String(dab.latitude)),
        longitude: parseFloat(String(dab.longitude)),
      }}
      tracksViewChanges={false}
    >
      {/* Marker visuel : cercle logo + pointe */}
      <View style={styles.markerContainer}>
        <View style={[styles.circle, { borderColor }]}>
          {logoSource ? (
            <Image
              source={logoSource}
              style={{ width: bankCfg?.logoSize || 24, height: bankCfg?.logoSize || 24 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.abbr, { color: bankCfg?.text || COLORS.white }]}>
              {bankCfg?.abbr || '🏧'}
            </Text>
          )}
        </View>
        {/* Pointe triangulaire */}
        <View style={[styles.tip, { borderTopColor: borderColor }]} />
      </View>

      {/* Callout (popup au tap) */}
      <Callout onPress={() => onSelect(dab.id)} tooltip>
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <View style={[styles.calloutLogo, { backgroundColor: bankCfg?.bg || COLORS.blue600 }]}>
              {logoSource ? (
                <Image source={logoSource} style={{ width: 20, height: 20 }} resizeMode="contain" />
              ) : (
                <Text style={{ color: bankCfg?.text || COLORS.white, fontSize: 8, fontWeight: '900' }}>
                  {bankCfg?.abbr || '🏧'}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.calloutName} numberOfLines={1}>{dab.nom}</Text>
              <Text style={styles.calloutSub}>
                {bankCfg?.label || ''}{dab.distance_km != null ? ` • ${Math.round(dab.distance_km * 1000)}m` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.calloutBadges}>
            <StatusBadge statut={dab.statut} etat={dab.etat_communautaire} />
          </View>
          <View style={styles.calloutBtn}>
            <Text style={styles.calloutBtnText}>Voir détail →</Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

function StatusBadge({ statut, etat }: { statut: string; etat?: string }) {
  const statutColor = statut === 'actif' ? COLORS.green600 : COLORS.red600;
  return (
    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
      <View style={[styles.badge, { backgroundColor: statutColor }]}>
        <Text style={styles.badgeText}>● {statut}</Text>
      </View>
      {etat && (
        <View style={[styles.badge, { backgroundColor: etat === 'disponible' ? COLORS.green600 : etat === 'vide' ? COLORS.amber500 : COLORS.red600 }]}>
          <Text style={styles.badgeText}>👥 {etat}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: { alignItems: 'center' },
  circle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  tip: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },
  abbr: { fontSize: 10, fontWeight: '900' },
  callout: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    minWidth: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
    borderWidth: 1, borderColor: COLORS.slate200,
  },
  calloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  calloutLogo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  calloutName: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  calloutSub: { fontSize: 11, color: COLORS.slate400 },
  calloutBadges: { flexDirection: 'row', gap: 4, marginBottom: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  calloutBtn: { backgroundColor: COLORS.blue600, borderRadius: 8, padding: 8, alignItems: 'center' },
  calloutBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/DABMarker.tsx
git commit -m "feat: DABMarker custom marker avec logos banques"
```

---

## Task 7 : Écran Accueil — Carte + Liste

**Files:**
- Create: `app/(tabs)/index.tsx`
- Create: `src/components/DABCard.tsx`

- [ ] **Step 1 : Créer DABCard**

`src/components/DABCard.tsx` :

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getBankConfig } from '@/utils/bankConfig';
import { etatColor, formatDistance } from '@/utils/formatUtils';
import { COLORS } from '@/constants/colors';

type DAB = {
  id: number; nom: string; adresse?: string; banque_nom?: string;
  statut: string; etat_communautaire?: string; vote_dominant?: string;
  distance_km?: number;
};

const BADGE_COLOR: Record<string, string> = {
  green: COLORS.green600, orange: COLORS.amber500, red: COLORS.red600,
};
const ETAT_COLOR: Record<string, string> = {
  disponible: COLORS.green600, vide: COLORS.amber500, en_panne: COLORS.red600,
};

export default function DABCard({ dab, onPress }: { dab: DAB; onPress: () => void }) {
  const { t } = useTranslation();
  const color = etatColor(dab);
  const bankCfg = getBankConfig(dab.banque_nom) || getBankConfig(dab.nom);
  const etatKey = dab.etat_communautaire || dab.vote_dominant;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.icon}><Text style={{ fontSize: 18 }}>🏧</Text></View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{dab.nom}</Text>
          {dab.adresse && <Text style={styles.addr} numberOfLines={1}>{dab.adresse}</Text>}
        </View>
        {dab.distance_km != null && (
          <Text style={styles.distance}>{formatDistance(dab.distance_km)}</Text>
        )}
      </View>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: BADGE_COLOR[color] || '#e5e7eb' }]}>
          <Text style={styles.badgeText}>● {dab.statut}</Text>
        </View>
        {bankCfg && <Text style={styles.bankName}>{bankCfg.label}</Text>}
        {etatKey && (
          <View style={[styles.badge, { backgroundColor: ETAT_COLOR[etatKey] || '#e5e7eb' }]}>
            <Text style={styles.badgeText}>👥 {t(`signalement.${etatKey === 'disponible' ? 'available' : etatKey === 'vide' ? 'empty' : 'broken'}`)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.slate200,
    padding: 12, marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.blue50, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  addr: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  distance: { fontSize: 12, color: COLORS.slate400 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bankName: { fontSize: 10, color: COLORS.slate500 },
});
```

- [ ] **Step 2 : Créer l'écran Accueil**

`app/(tabs)/index.tsx` :

```typescript
import { useState, useRef } from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import useGeolocation from '@/hooks/useGeolocation';
import useDABs from '@/hooks/useDABs';
import DABMarker from '@/components/DABMarker';
import DABCard from '@/components/DABCard';
import { COLORS } from '@/constants/colors';

export default function AccueilScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [view, setView] = useState<'carte' | 'liste'>('carte');
  const { position, status, isDefault, requestLocation } = useGeolocation();
  const { dabs, loading } = useDABs(position);
  const mapRef = useRef<MapView>(null);

  const goToDAB = (id: number) => router.push(`/dab/${id}`);

  const centerOnUser = () => {
    if (isDefault) { requestLocation(); return; }
    mapRef.current?.animateToRegion({
      latitude: position.lat, longitude: position.lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 500);
  };

  return (
    <View style={styles.container}>
      {/* Toggle Carte / Liste */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'carte' && styles.toggleActive]}
          onPress={() => setView('carte')}
        >
          <Text style={[styles.toggleText, view === 'carte' && styles.toggleTextActive]}>🗺️ {t('nav.map', 'Carte')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'liste' && styles.toggleActive]}
          onPress={() => setView('liste')}
        >
          <Text style={[styles.toggleText, view === 'liste' && styles.toggleTextActive]}>📋 {t('nav.list', 'Liste')}</Text>
        </TouchableOpacity>
      </View>

      {view === 'carte' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: position.lat, longitude: position.lng,
              latitudeDelta: 0.05, longitudeDelta: 0.05,
            }}
          >
            {/* Marker position utilisateur */}
            {!isDefault && (
              <Marker coordinate={{ latitude: position.lat, longitude: position.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                <Image source={require('../../assets/maps_target.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
              </Marker>
            )}

            {/* Markers DABs */}
            {dabs.map((dab) => (
              <DABMarker key={dab.id} dab={dab} onSelect={goToDAB} />
            ))}
          </MapView>

          {/* FAB recentrer */}
          <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
            <Image source={require('../../assets/maps_target.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dabs}
          keyExtractor={(d) => String(d.id)}
          renderItem={({ item }) => <DABCard dab={item} onPress={() => goToDAB(item.id)} />}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  toggle: { flexDirection: 'row', gap: 4, padding: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate200 },
  toggleBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.slate100, alignItems: 'center' },
  toggleActive: { backgroundColor: COLORS.blue600 },
  toggleText: { fontSize: 13, fontWeight: '600', color: COLORS.slate500 },
  toggleTextActive: { color: COLORS.white },
  mapContainer: { flex: 1 },
  fab: {
    position: 'absolute', bottom: 16, right: 16,
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.slate200,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  list: { padding: 12 },
});
```

- [ ] **Step 3 : Vérifier le rendu**

```bash
npx expo start
```

Attendu : carte affichée, markers visibles, toggle Carte/Liste fonctionnel.

- [ ] **Step 4 : Commit**

```bash
git add app/'(tabs)'/index.tsx src/components/DABCard.tsx
git commit -m "feat: écran accueil carte + liste, markers banques"
```

---

## Task 8 : Écran Détail DAB + Signalement

**Files:**
- Create: `app/dab/[id].tsx`
- Create: `src/components/SignalementButton.tsx`
- Create: `src/components/AvisList.tsx`

- [ ] **Step 1 : Créer SignalementButton**

`src/components/SignalementButton.tsx` :

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { submitSignalement, getLocalVote } from '@/api/signalementApi';
import { haversineKm, formatDistance } from '@/utils/formatUtils';
import { COLORS } from '@/constants/colors';

const GEO_LIMIT_KM = 1;

const ETATS = [
  { key: 'disponible', emoji: '✅', borderActive: COLORS.green600, bgActive: '#f0fdf4' },
  { key: 'vide',       emoji: '💸', borderActive: COLORS.amber500, bgActive: '#fffbeb' },
  { key: 'en_panne',   emoji: '🔧', borderActive: COLORS.red600,   bgActive: '#fef2f2' },
];

type Props = {
  dabId: number; dabLat: number; dabLng: number;
  geoStatus: string; userPosition: { lat: number; lng: number } | null;
  requestLocation: () => void; onSuccess?: (data: unknown) => void;
};

export default function SignalementButton({ dabId, dabLat, dabLng, geoStatus, userPosition, requestLocation, onSuccess }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);
  const [myVote, setMyVote]       = useState<{ etat: string; nb_updates: number } | null>(null);
  const [modifyMode, setModifyMode] = useState(false);

  useEffect(() => {
    getLocalVote(dabId).then(setMyVote);
  }, [dabId]);

  const distanceKm = geoStatus === 'granted' && userPosition
    ? haversineKm(userPosition.lat, userPosition.lng, dabLat, dabLng) : null;
  const tooFar = distanceKm !== null && distanceKm > GEO_LIMIT_KM;

  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <View style={styles.box}>
        <Text style={styles.boxText}>{t('signalement.geo_idle')}</Text>
        <TouchableOpacity style={styles.btnBlue} onPress={requestLocation} disabled={geoStatus === 'requesting'}>
          <Text style={styles.btnText}>{geoStatus === 'requesting' ? '…' : t('signalement.geo_activate')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (geoStatus === 'denied' || geoStatus === 'unavailable') {
    return (
      <View style={[styles.box, { borderColor: COLORS.red600 }]}>
        <Text style={{ color: COLORS.red600, fontSize: 13, textAlign: 'center' }}>{t('signalement.geo_denied')}</Text>
      </View>
    );
  }

  if (tooFar) {
    return (
      <View style={[styles.box, { borderColor: COLORS.amber500 }]}>
        <Text style={{ color: COLORS.amber500, fontSize: 13, textAlign: 'center' }}>
          {t('signalement.geo_too_far', { distance: formatDistance(distanceKm!) })}
        </Text>
      </View>
    );
  }

  const handleSignal = async (etat: string) => {
    if (!userPosition) return;
    setLoading(true);
    try {
      const res = await submitSignalement(dabId, etat, userPosition.lat, userPosition.lng);
      const wasModified = res.data?.modified ?? false;
      setMyVote({ etat, nb_updates: wasModified ? 1 : 0 });
      setModifyMode(false);
      onSuccess?.(res.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) alert(t('signalement.same_state'));
      else if (status === 429) alert(t('signalement.already_modified'));
      else alert(t('signalement.error'));
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  if (myVote && !modifyMode) {
    return (
      <View style={[styles.box, { borderColor: COLORS.blue600, backgroundColor: COLORS.blue50 }]}>
        <Text style={{ color: COLORS.blue600, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
          {t('signalement.already_voted', { etat: myVote.etat })}
        </Text>
        {myVote.nb_updates === 0 ? (
          <TouchableOpacity style={styles.btnBlue} onPress={() => { setModifyMode(true); setSelected(null); }}>
            <Text style={styles.btnText}>{t('signalement.modify')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: COLORS.slate400, fontSize: 12 }}>{t('signalement.already_modified')}</Text>
        )}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.grid}>
        {ETATS.map(({ key, emoji, borderActive, bgActive }) => (
          <TouchableOpacity
            key={key}
            style={[styles.etatBtn, selected === key && { borderColor: borderActive, backgroundColor: bgActive }]}
            onPress={() => setSelected(key)}
            disabled={loading}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.slate700 }}>
              {t(`signalement.${key === 'disponible' ? 'available' : key === 'vide' ? 'empty' : 'broken'}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.btnBlue, (!selected || loading) && styles.btnDisabled]}
        disabled={!selected || loading}
        onPress={() => selected && handleSignal(selected)}
      >
        {loading ? <ActivityIndicator color={COLORS.white} /> : (
          <Text style={styles.btnText}>{modifyMode ? t('signalement.modify') : t('signalement.send')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.slate200, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  boxText: { fontSize: 13, color: COLORS.slate500, marginBottom: 10, textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  etatBtn: { flex: 1, borderWidth: 2, borderColor: COLORS.slate200, borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: COLORS.white },
  btnBlue: { backgroundColor: COLORS.blue600, borderRadius: 12, padding: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: COLORS.slate200 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
```

- [ ] **Step 2 : Créer AvisList**

`src/components/AvisList.tsx` :

```typescript
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getAvis } from '@/api/avisApi';
import { COLORS } from '@/constants/colors';

export default function AvisList({ dabId }: { dabId: number }) {
  const { data } = useQuery({
    queryKey: ['avis', dabId],
    queryFn: () => getAvis(dabId),
    select: (res) => res.data || [],
  });

  if (!data?.length) return (
    <Text style={{ color: COLORS.slate400, fontSize: 13, fontStyle: 'italic' }}>Aucun avis</Text>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(a) => String(a.id)}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.avis}>
          <Text style={styles.note}>{'⭐'.repeat(item.note)}</Text>
          {item.commentaire && <Text style={styles.comment}>{item.commentaire}</Text>}
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  avis: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.slate100, borderRadius: 10, padding: 10, marginBottom: 6 },
  note: { fontSize: 13 },
  comment: { fontSize: 13, color: COLORS.slate700, marginTop: 2 },
  date: { fontSize: 11, color: COLORS.slate400, marginTop: 4 },
});
```

- [ ] **Step 3 : Créer l'écran Détail DAB**

`app/dab/[id].tsx` :

```typescript
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MapView, { Marker } from 'react-native-maps';
import { getDAB } from '@/api/dabApi';
import { getBankConfig } from '@/utils/bankConfig';
import { etatColor, formatDistance } from '@/utils/formatUtils';
import useGeolocation from '@/hooks/useGeolocation';
import SignalementButton from '@/components/SignalementButton';
import AvisList from '@/components/AvisList';
import { COLORS, STATUS_BORDER } from '@/constants/colors';

export default function DABDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { position, status, requestLocation } = useGeolocation();

  const { data: dab, isLoading } = useQuery({
    queryKey: ['dab', id],
    queryFn: () => getDAB(id!),
    select: (res) => res.data,
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={COLORS.blue600} /></View>;
  if (!dab) return null;

  const bankCfg = getBankConfig(dab.banque_nom) || getBankConfig(dab.nom);
  const statusColor = etatColor(dab);
  const borderColor = STATUS_BORDER[statusColor] || COLORS.neutral400;

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dab.latitude},${dab.longitude}`;
    Linking.openURL(url);
  };

  const etatKey = dab.etat_communautaire || dab.vote_dominant;
  const ETAT_COLOR: Record<string, string> = { disponible: COLORS.green600, vide: COLORS.amber500, en_panne: COLORS.red600 };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={{ fontSize: 20, color: COLORS.slate500 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail DAB</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Infos banque */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={[styles.bankLogo, { backgroundColor: bankCfg?.bg || COLORS.blue600 }]}>
            {bankCfg?.logoUrl ? (
              <Image
                source={typeof bankCfg.logoUrl === 'string' ? { uri: bankCfg.logoUrl } : bankCfg.logoUrl}
                style={{ width: 28, height: 28 }} resizeMode="contain"
              />
            ) : (
              <Text style={{ color: bankCfg?.text || COLORS.white, fontSize: 10, fontWeight: '900' }}>{bankCfg?.abbr || '🏧'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dabName}>{dab.nom}</Text>
            {dab.adresse && <Text style={styles.dabAddr}>{dab.adresse}</Text>}
          </View>
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: dab.statut === 'actif' ? COLORS.green600 : COLORS.red600 }]}>
            <Text style={styles.badgeText}>● {dab.statut}</Text>
          </View>
          {etatKey && (
            <View style={[styles.badge, { backgroundColor: ETAT_COLOR[etatKey] || '#6b7280' }]}>
              <Text style={styles.badgeText}>👥 {etatKey}</Text>
            </View>
          )}
          {bankCfg && <Text style={styles.bankLabel}>{bankCfg.label}</Text>}
          {dab.distance_km != null && <Text style={styles.bankLabel}>{formatDistance(dab.distance_km)}</Text>}
        </View>
      </View>

      {/* Mini-carte */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOCALISATION</Text>
        <View style={styles.mapMini}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: parseFloat(dab.latitude), longitude: parseFloat(dab.longitude),
              latitudeDelta: 0.005, longitudeDelta: 0.005,
            }}
            scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}
          >
            <Marker
              coordinate={{ latitude: parseFloat(dab.latitude), longitude: parseFloat(dab.longitude) }}
              anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}
            >
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.miniCircle, { borderColor }]}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: bankCfg?.text || COLORS.white }}>
                    {bankCfg?.abbr || '🏧'}
                  </Text>
                </View>
                <View style={[styles.miniTip, { borderTopColor: borderColor }]} />
              </View>
            </Marker>
          </MapView>
        </View>
      </View>

      {/* Signalement */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SIGNALER L'ÉTAT</Text>
        <SignalementButton
          dabId={dab.id}
          dabLat={parseFloat(dab.latitude)}
          dabLng={parseFloat(dab.longitude)}
          geoStatus={status}
          userPosition={position}
          requestLocation={requestLocation}
        />
      </View>

      {/* Bouton Y aller */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.btnNav} onPress={openMaps}>
          <Text style={styles.btnNavText}>🧭 Y aller</Text>
        </TouchableOpacity>
      </View>

      {/* Avis */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>AVIS</Text>
        <AvisList dabId={dab.id} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate200, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  back: { width: 32, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  infoCard: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate100, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  bankLogo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dabName: { fontSize: 15, fontWeight: '700', color: COLORS.gray900 },
  dabAddr: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  bankLabel: { fontSize: 10, color: COLORS.slate500 },
  section: { backgroundColor: COLORS.white, borderRadius: 12, margin: 12, marginBottom: 0, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.slate400, letterSpacing: 0.5, marginBottom: 10 },
  mapMini: { height: 120, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.slate100 },
  miniCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  miniTip: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  btnNav: { backgroundColor: COLORS.blue600, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnNavText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Step 4 : Commit**

```bash
git add app/dab/ src/components/SignalementButton.tsx src/components/AvisList.tsx
git commit -m "feat: écran détail DAB, signalement, avis"
```

---

## Task 9 : Auth (Login + Register) + Tab Profil

**Files:**
- Create: `app/auth/login.tsx`
- Create: `app/auth/register.tsx`
- Create: `app/(tabs)/profil.tsx`

- [ ] **Step 1 : Créer LoginScreen**

`app/auth/login.tsx` :

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/api/authApi';
import useAuth from '@/hooks/useAuth';
import { COLORS } from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs'); return; }
    setLoading(true); setError('');
    try {
      const res = await login({ email, password });
      await authLogin(res.data.token, res.data.user);
      router.replace('/(tabs)/profil');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🏧</Text>
        <Text style={styles.title}>MapsDab</Text>
        <Text style={styles.subtitle}>Localisez les DABs près de vous</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="votre@email.com" placeholderTextColor={COLORS.slate400} />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={COLORS.slate400} />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Se connecter</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.link}>Créer un compte</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={styles.linkGray}>← Retour sans connexion</Text>
        </TouchableOpacity>

        <Text style={styles.anonymous}>Les signalements sont anonymes sans compte</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e40af', textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.slate400, textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.slate500, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.gray900, marginBottom: 16 },
  btn: { backgroundColor: COLORS.blue600, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  link: { color: COLORS.blue600, textAlign: 'center', fontSize: 14, marginBottom: 8 },
  linkGray: { color: COLORS.slate400, textAlign: 'center', fontSize: 13 },
  error: { backgroundColor: '#fef2f2', color: COLORS.red600, borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 },
  anonymous: { textAlign: 'center', fontSize: 11, color: COLORS.slate400, marginTop: 24 },
});
```

- [ ] **Step 2 : Créer RegisterScreen**

`app/auth/register.tsx` :

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/api/authApi';
import useAuth from '@/hooks/useAuth';
import { login } from '@/api/authApi';
import { COLORS } from '@/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [nom, setNom]           = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    if (!nom || !email || !password) { setError('Remplissez tous les champs'); return; }
    setLoading(true); setError('');
    try {
      await register({ nom, email, password });
      const res = await login({ email, password });
      await authLogin(res.data.token, res.data.user);
      router.replace('/(tabs)/profil');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={styles.title}>Créer un compte</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" placeholderTextColor={COLORS.slate400} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="votre@email.com" placeholderTextColor={COLORS.slate400} />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 caractères" placeholderTextColor={COLORS.slate400} />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Créer mon compte</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>← Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: COLORS.gray900, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.slate500, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.gray900, marginBottom: 16 },
  btn: { backgroundColor: COLORS.blue600, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  link: { color: COLORS.blue600, textAlign: 'center', fontSize: 14 },
  error: { backgroundColor: '#fef2f2', color: COLORS.red600, borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13 },
});
```

- [ ] **Step 3 : Créer Tab Profil**

`app/(tabs)/profil.tsx` :

```typescript
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '@/hooks/useAuth';
import { COLORS } from '@/constants/colors';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.blue600} /></View>;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.title}>Mon compte</Text>
        <Text style={styles.subtitle}>Connectez-vous pour accéder à vos favoris et laisser des avis.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => router.push('/auth/register')}>
          <Text style={styles.btnGhostText}>Créer un compte</Text>
        </TouchableOpacity>
        <Text style={styles.anon}>Les signalements sont anonymes sans compte</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>{user?.nom}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.red600, marginTop: 40 }]} onPress={logout}>
        <Text style={styles.btnText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.slate500, textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: COLORS.blue600, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  btnGhost: { borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  btnGhostText: { color: COLORS.gray900, fontWeight: '600', fontSize: 15 },
  anon: { fontSize: 11, color: COLORS.slate400, textAlign: 'center', marginTop: 24 },
});
```

- [ ] **Step 4 : Commit**

```bash
git add app/auth/ app/'(tabs)'/profil.tsx
git commit -m "feat: login, register, écran profil"
```

---

## Task 10 : Tab Favoris

**Files:**
- Create: `app/(tabs)/favoris.tsx`

- [ ] **Step 1 : Créer la gestion des favoris**

Les favoris sont stockés en `AsyncStorage` sous la clé `favorites` (liste d'IDs JSON).

Ajouter dans `src/utils/storage.ts` :

```typescript
// Favoris
export const getFavorites = async (): Promise<number[]> => {
  const raw = await getItem('favorites');
  return raw ? JSON.parse(raw) : [];
};

export const toggleFavorite = async (dabId: number): Promise<boolean> => {
  const favs = await getFavorites();
  const exists = favs.includes(dabId);
  const updated = exists ? favs.filter((id) => id !== dabId) : [...favs, dabId];
  await saveItem('favorites', JSON.stringify(updated));
  return !exists; // true = ajouté, false = supprimé
};
```

- [ ] **Step 2 : Créer l'écran Favoris**

`app/(tabs)/favoris.tsx` :

```typescript
import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { getFavorites } from '@/utils/storage';
import { getDAB } from '@/api/dabApi';
import DABCard from '@/components/DABCard';
import useAuth from '@/hooks/useAuth';
import { COLORS } from '@/constants/colors';

export default function FavorisScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [favIds, setFavIds] = useState<number[]>([]);

  useFocusEffect(useCallback(() => {
    getFavorites().then(setFavIds);
  }, []));

  const queries = useQueries({
    queries: favIds.map((id) => ({
      queryKey: ['dab', id],
      queryFn: () => getDAB(id),
      select: (res: { data: unknown }) => res.data,
    })),
  });

  const loading = queries.some((q) => q.isLoading);
  const dabs = queries.map((q) => q.data).filter(Boolean);

  if (!isAuthenticated) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>⭐</Text>
        <Text style={styles.emptyTitle}>Vos favoris</Text>
        <Text style={styles.emptyText}>Connectez-vous pour sauvegarder vos DABs favoris.</Text>
      </View>
    );
  }

  if (loading) return <View style={styles.empty}><ActivityIndicator color={COLORS.blue600} /></View>;

  if (!dabs.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>⭐</Text>
        <Text style={styles.emptyTitle}>Aucun favori</Text>
        <Text style={styles.emptyText}>Ajoutez des DABs en favori depuis leur page de détail.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={dabs}
      keyExtractor={(d) => String((d as { id: number }).id)}
      renderItem={({ item }) => <DABCard dab={item as never} onPress={() => router.push(`/dab/${(item as { id: number }).id}`)} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.white },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray900, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.slate500, textAlign: 'center' },
  list: { padding: 12 },
});
```

- [ ] **Step 3 : Ajouter le bouton ⭐ dans le détail DAB**

Dans `app/dab/[id].tsx`, ajouter l'import et le state favori :

```typescript
// Ajouter en haut du fichier
import { toggleFavorite, getFavorites } from '@/utils/storage';

// Dans le composant, après les autres states :
const [isFav, setIsFav] = useState(false);

useEffect(() => {
  if (dab) getFavorites().then((favs) => setIsFav(favs.includes(dab.id)));
}, [dab]);

const handleToggleFav = async () => {
  if (!dab) return;
  const added = await toggleFavorite(dab.id);
  setIsFav(added);
};
```

Remplacer `<View style={{ width: 32 }} />` dans le header par :

```typescript
<TouchableOpacity onPress={handleToggleFav} style={{ width: 32, alignItems: 'center' }}>
  <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
</TouchableOpacity>
```

- [ ] **Step 4 : Commit**

```bash
git add app/'(tabs)'/favoris.tsx src/utils/storage.ts app/dab/'[id]'.tsx
git commit -m "feat: favoris (AsyncStorage), bouton étoile dans détail"
```

---

## Task 11 : Test sur Expo Go + Build APK

**Files:** aucun nouveau fichier

- [ ] **Step 1 : Tester sur Expo Go**

```bash
npx expo start
```

- Scanner le QR code avec l'app **Expo Go** sur un téléphone Android ou iOS
- Vérifier : carte chargée, markers visibles, navigation, signalement, auth

- [ ] **Step 2 : Installer EAS CLI**

```bash
npm install -g eas-cli
eas login
```

- [ ] **Step 3 : Initialiser EAS**

```bash
eas build:configure
```

Choisir : Android + iOS. Cela crée `eas.json`.

- [ ] **Step 4 : Créer un profil preview dans eas.json**

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

- [ ] **Step 5 : Lancer le build APK Android**

```bash
eas build --platform android --profile preview
```

Attendu : URL de téléchargement du `.apk` à la fin du build (~10-15 minutes).

- [ ] **Step 6 : Commit final**

```bash
git add eas.json
git commit -m "feat: config EAS build preview APK"
```

---

## Vérification spec

| Exigence spec | Task couverte |
|---|---|
| Carte avec markers logos banques + statuts | Task 6, 7 |
| Toggle Carte / Liste | Task 7 |
| Pas de barre de recherche sur la carte | Task 7 |
| Marker utilisateur = maps_target.png | Task 7 |
| FAB recentrer = maps_target.png | Task 7 |
| Détail DAB (infos, mini-carte, avis) | Task 8 |
| Signalements anonymes géoloc ≤ 1km | Task 8 |
| Créer un compte / se connecter | Task 9 |
| Favoris (AsyncStorage) | Task 10 |
| Navigation vers DAB (Linking) | Task 8 |
| FR / EN (i18next) | Task 2 |
| Expo Go + EAS Build APK | Task 11 |

# Spec — Mobile : MapLibre natif + Geofencing + Notifications push
**Date :** 2026-07-31
**Projet :** LocalisationDAB-mobile
**Statut :** Validé — prêt pour implémentation

---

## 1. Contexte et objectif

L'application mobile existe déjà (`LocalisationDAB-mobile/`) avec la carte en WebView/Leaflet. L'objectif de cette évolution est double :

1. **Migrer la carte vers MapLibre natif** — meilleure performance, rendu 60fps, base nécessaire pour l'intégration geofencing
2. **Ajouter le geofencing + notifications push** — notifier l'utilisateur quand il passe à 50m d'un DAB sans signalement récent, pour augmenter la participation communautaire

---

## 2. Décisions validées

| Paramètre | Valeur |
|---|---|
| Librairie carte | `@maplibre/maplibre-react-native` (déjà installée) |
| Tuiles | OpenStreetMap (gratuites, pas de clé API) |
| Trigger notification | Geofencing natif `expo-location` `startGeofencingAsync()` |
| Rayon geofence | 50m par DAB |
| Condition de notification | Uniquement si aucun vote actif sur ce DAB dans les 4h |
| Fréquence limite | Aucune — uniquement la condition 4h |
| DABs surveillés simultanément | 15 plus proches (limite iOS : 20 max) |
| Mise à jour des régions | Quand l'utilisateur se déplace de >500m |
| Livraison notification | Locale (`expo-notifications`) — pas de serveur |
| Backend | Aucun changement requis |

---

## 3. Section 1 — Migration carte MapLibre natif

### 3.1 Composant à remplacer

`src/components/WebMapView.tsx` (WebView + Leaflet injecté) → remplacé par `src/components/NativeMapView.tsx` (MapLibre natif).

### 3.2 NativeMapView.tsx

**Props identiques à WebMapView :** `dabs`, `userPosition`, `onMarkerPress`, `flyTo`, `highlight`

**Implémentation :**
- `<MapLibreGL.MapView>` avec tuiles OSM : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- `<MapLibreGL.Camera>` pour `flyTo` et zoom initial
- `<MapLibreGL.LocationPuck>` pour la position utilisateur (remplace le marker `maps_target.png`)
- Marqueurs DAB : `<MapLibreGL.MarkerView>` par DAB (adapté pour les logos banques)
- Tap marqueur → callback `onMarkerPress(dabId)` → navigation `app/dab/[id].tsx`
- Bordure colorée selon état : vert (`disponible`), orange (`vide`), rouge (`en_panne`), gris (aucun)

### 3.3 Intégration dans app/(tabs)/index.tsx

Remplacement de `<WebMapView>` par `<NativeMapView>` avec les mêmes props. Aucun changement de logique dans l'écran parent.

### 3.4 Configuration app.json

Ajouter le plugin MapLibre si requis par la version SDK :
```json
{
  "plugins": ["@maplibre/maplibre-react-native"]
}
```

---

## 4. Section 2 — Geofencing + Notifications push

### 4.1 Package à installer

```bash
npx expo install expo-notifications
```

(`expo-task-manager` et `expo-location` sont déjà présents.)

### 4.2 Configuration app.json

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/logo.png",
        "color": "#1e40af"
      }],
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "MapsDab utilise votre position pour vous alerter quand un DAB proche n'a pas été signalé récemment.",
        "locationAlwaysPermission": "MapsDab utilise votre position en arrière-plan pour détecter les DABs proches.",
        "isIosBackgroundLocationEnabled": true
      }]
    ]
  }
}
```

### 4.3 Tâche background — `src/tasks/geofencingTask.ts`

```
Nom de la tâche : GEOFENCING_TASK

Déclenchement : entrée dans une région (EventType.ENTER)

Logique :
  1. Récupérer dabId depuis les données de la région
  2. Appel GET /api/dabs/:dabId/signalements
  3. Si totalVotes === 0 ou aucun vote actif → envoyer notification locale
  4. Sinon → ignorer silencieusement
```

**Contenu de la notification :**
- Titre : `📍 [nom du DAB]`
- Corps : `Quel est son état ? Aide la communauté MapsDab`
- Data : `{ dabId }` (pour navigation au tap)

### 4.4 Hook — `src/hooks/useGeofencing.ts`

```
Responsabilités :
  1. Vérifier que les permissions background location sont accordées
  2. Récupérer les 15 DABs les plus proches (depuis le cache TanStack Query)
  3. Appeler startGeofencingAsync(GEOFENCING_TASK, regions)
     - regions = DABs.slice(0, 15).map(d => ({
         identifier: String(d.id),
         latitude: d.latitude,
         longitude: d.longitude,
         radius: 50,
         notifyOnEnter: true,
         notifyOnExit: false
       }))
  4. Se re-exécuter si userPosition change de >500m (haversineKm)
  5. Stopper le geofencing si permissions révoquées
```

### 4.5 Service notifications — `src/utils/notifications.ts`

```
Fonctions exportées :
  - requestNotificationPermission() → boolean
  - sendLocalNotification(dabId, dabNom) → void
  - setupNotificationTapHandler() → navigation vers app/dab/[id]
```

### 4.6 Intégration dans `app/_layout.tsx`

Au montage du root layout :
1. `requestNotificationPermission()`
2. `requestBackgroundPermissionsAsync()` (expo-location)
3. `setupNotificationTapHandler()`
4. Initialiser `useGeofencing()` si les deux permissions sont accordées

Si l'utilisateur refuse une permission → geofencing désactivé silencieusement, app fonctionne normalement.

---

## 5. Flux complet utilisateur

```
1. Utilisateur ouvre l'app → permissions demandées (localisation background + notifs)
2. App démarre le geofencing sur les 15 DABs les plus proches
3. Utilisateur ferme l'app → geofencing continue en arrière-plan (OS natif)
4. Utilisateur passe à 50m d'un DAB
5. OS déclenche GEOFENCING_TASK
6. Task vérifie l'API → DAB sans vote depuis 4h
7. Notification locale apparaît : "📍 Nom du DAB — Quel est son état ?"
8. Utilisateur tape la notification → app s'ouvre sur app/dab/[id].tsx
9. Boutons de signalement visibles immédiatement
```

---

## 6. Fichiers à créer / modifier

### Nouveaux fichiers
| Fichier | Rôle |
|---|---|
| `src/components/NativeMapView.tsx` | Carte MapLibre native |
| `src/tasks/geofencingTask.ts` | Tâche background geofencing |
| `src/hooks/useGeofencing.ts` | Gestion des régions géofencées |
| `src/utils/notifications.ts` | Permissions + envoi + tap handler |

### Fichiers modifiés
| Fichier | Modification |
|---|---|
| `app/(tabs)/index.tsx` | `WebMapView` → `NativeMapView` |
| `app/_layout.tsx` | Init permissions + geofencing + tap handler |
| `app.json` | Plugins expo-notifications, expo-location background, UIBackgroundModes |
| `package.json` | Ajout `expo-notifications` |

### Fichiers supprimés
| Fichier | Raison |
|---|---|
| `src/components/WebMapView.tsx` | Remplacé par NativeMapView |
| `src/utils/leaflet-*.ts` | Plus nécessaires |

---

## 7. Contraintes et limites

- **iOS max 20 régions** géofencées simultanément → on utilise 15 pour rester dans les limites
- **Android background location** : depuis Android 11, l'utilisateur doit accorder "Toujours autoriser" manuellement dans les paramètres système → message explicatif requis
- **Pas de geofencing sans connexion** : le check API nécessite internet. Sans connexion, la notification n'est pas envoyée (fail silencieux)
- **Apple Developer Account** : requis pour background location iOS (confirmé disponible)
- **EAS Build requis** : les permissions background nécessitent un build natif (pas Expo Go)

---

## 8. Hors périmètre (v2)

- Serveur push (Expo Push Service) pour notifications initiées côté serveur
- Notifications groupées ("3 DABs proches non signalés")
- Historique des notifications
- Paramètre utilisateur pour activer/désactiver les notifs

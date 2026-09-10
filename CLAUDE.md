# CLAUDE.md — LocalisationDAB
# Fil conducteur du projet pour Claude Code
# Ce fichier est lu automatiquement par Claude Code à chaque session.
# Ne jamais le supprimer. Le mettre à la racine du dossier LocalisationDAB/

---

## 🎯 IDENTITÉ DU PROJET

**Nom** : LocalisationDAB
**Type** : Application web full-stack
**Objectif** : Permettre aux utilisateurs de localiser les DAB (Distributeurs
Automatiques de Billets) à proximité, et de signaler anonymement leur état
(argent disponible, vide, en panne) en temps réel.

---

## 🏗️ STACK TECHNIQUE

| Couche      | Technologie            | Version  |
|-------------|------------------------|----------|
| Backend     | Node.js + Express      | 18+ / 4.x|
| Base de données | PostgreSQL         | 14+      |
| Temps réel  | Socket.io              | 4.x      |
| Frontend    | React + Vite           | 18+ / 5.x|
| Carte       | Leaflet.js + OpenStreetMap | 1.9+ |
| Auth        | JWT + bcryptjs         | —        |
| Validation  | express-validator + Zod| —        |
| Cron        | node-cron              | 3.x      |
| Import data | Google Places API      | clé API requise |

---

## 📁 STRUCTURE DU PROJET

```
LocalisationDAB/
├── CLAUDE.md                 ← CE FICHIER (ne pas déplacer)
├── README.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js         ← Pool PostgreSQL
│   │   │   ├── env.js        ← Validation variables d'env
│   │   │   └── socket.js     ← Init Socket.io
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dabController.js
│   │   │   ├── banqueController.js
│   │   │   ├── serviceController.js
│   │   │   ├── avisController.js
│   │   │   └── signalementController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js     ← Vérif JWT
│   │   │   ├── roleMiddleware.js     ← Admin/user
│   │   │   ├── validateMiddleware.js ← express-validator
│   │   │   ├── rateLimiter.js        ← globalLimiter + authLimiter + signalLimiter
│   │   │   └── errorHandler.js       ← Catch global
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── DAB.js
│   │   │   ├── Banque.js
│   │   │   ├── Service.js
│   │   │   ├── Avis.js
│   │   │   ├── Signalement.js
│   │   │   └── HistoriqueStatut.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── dabRoutes.js
│   │   │   ├── banqueRoutes.js
│   │   │   ├── serviceRoutes.js
│   │   │   ├── avisRoutes.js
│   │   │   └── signalementRoutes.js
│   │   ├── validators/
│   │   │   ├── authValidator.js
│   │   │   ├── dabValidator.js
│   │   │   ├── avisValidator.js
│   │   │   └── signalementValidator.js
│   │   ├── utils/
│   │   │   ├── geoUtils.js       ← Formule Haversine
│   │   │   ├── responseUtils.js  ← successResponse / errorResponse
│   │   │   └── osmImport.js      ← Import DAB/agences via Google Places API
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/
│   │   └── 001_init.sql
│   ├── seeds/
│   │   └── seed.sql
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── dab.test.js
│   │   ├── avis.test.js
│   │   └── signalement.test.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axiosConfig.js
    │   │   ├── dabApi.js
    │   │   ├── authApi.js
    │   │   ├── avisApi.js
    │   │   └── signalementApi.js
    │   ├── components/
    │   │   ├── Map/
    │   │   │   ├── MapView.jsx
    │   │   │   ├── DABMarker.jsx
    │   │   │   └── MapControls.jsx
    │   │   ├── DAB/
    │   │   │   ├── DABCard.jsx
    │   │   │   ├── DABDetail.jsx
    │   │   │   ├── DABList.jsx
    │   │   │   └── DABFilters.jsx
    │   │   ├── Signalement/
    │   │   │   ├── SignalementButton.jsx  ← 3 boutons anonymes
    │   │   │   ├── SignalementModal.jsx
    │   │   │   └── SignalementBadge.jsx
    │   │   ├── Auth/
    │   │   │   ├── LoginForm.jsx
    │   │   │   └── RegisterForm.jsx
    │   │   ├── Avis/
    │   │   │   ├── AvisForm.jsx
    │   │   │   └── AvisList.jsx
    │   │   └── UI/
    │   │       ├── Spinner.jsx
    │   │       ├── ErrorMessage.jsx
    │   │       ├── SearchBar.jsx
    │   │       └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   ├── useGeolocation.js
    │   │   ├── useDABs.js
    │   │   ├── useAuth.js
    │   │   └── useSocket.js
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── DABDetailPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AdminDABList.jsx
    │   │       ├── AdminDABForm.jsx
    │   │       └── AdminSignalements.jsx
    │   ├── utils/
    │   │   └── formatUtils.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── .env
    ├── .env.example
    └── package.json
```

---

## 🗄️ SCHÉMA BASE DE DONNÉES

### Tables principales

| Table               | Rôle                                        |
|---------------------|---------------------------------------------|
| `users`             | Comptes utilisateurs (user + admin)         |
| `banques`           | Référentiel des banques                     |
| `dabs`              | DAB avec coordonnées GPS et statut          |
| `services`          | Services disponibles (retrait, dépôt…)     |
| `dab_services`      | Pivot DAB ↔ Services                        |
| `avis`              | Notes et commentaires des utilisateurs      |
| `signalements`      | Signalements anonymes (3 états)             |
| `historique_statuts`| Audit trail de tous les changements         |

### Colonnes clés de la table `dabs`

```
id, nom, adresse, latitude, longitude,
statut              → admin : actif / hors_service / maintenance
etat_communautaire  → votes : disponible / vide / en_panne
etat_communautaire_at, nb_votes_actifs,
banque_id (FK), osm_id (import OSM), created_at, updated_at
```

### Signalement — règles métier

- **3 états** : `disponible` | `vide` | `en_panne`
- **Anonyme** : aucun compte requis
- **Anti-spam** : IP hashée (SHA-256 salé) + cookie UUID → 1 signal / DAB / 4h
- **Seuil** : 2+ votes du même état → mise à jour `etat_communautaire`
- **Expiration** : votes valides 4h seulement (`expires_at`) — 24h si signalement admin
- **Verrou week-end admin** (`Signalement.computeExpiresAt`) : un signalement **admin** avec état `vide` ou `en_panne`, créé le **jeudi à partir de 16h (heure Algérie, UTC+1)**, reste valide jusqu'au **dimanche 7h** au lieu des 24h habituelles — un DAB vide/en panne le jeudi soir a de fortes chances de le rester tout le week-end (pas de réapprovisionnement/réparation avant dimanche). Un signalement admin `disponible` garde toujours 24h (un DAB plein le jeudi peut se vider avec l'usage réel pendant le week-end, notamment en zone commerciale à fort trafic). Le reste de la semaine (et les signalements non-admin) ne sont pas concernés. Si un nouveau signalement arrive pendant cette fenêtre (admin ou utilisateur), il recalcule `etat_communautaire` normalement — le verrou n'empêche pas les mises à jour, il ne fait qu'étendre la durée par défaut en absence de nouveau signalement.
- **IP jamais stockée brute** → conformité RGPD obligatoire

---

## 🌐 ROUTES API COMPLÈTES

### Auth
```
POST   /api/auth/register
POST   /api/auth/login          ← authLimiter (10 req/15min)
GET    /api/auth/me             ← JWT requis
PUT    /api/auth/password       ← JWT requis
```

### DAB
```
GET    /api/dabs                ← ?lat=&lng=&radius=&banque_id=&statut=&page=&limit=
GET    /api/dabs/nearby         ← ?lat=&lng=&radius= (défaut 2km)
GET    /api/dabs/:id
POST   /api/dabs                ← admin uniquement
PUT    /api/dabs/:id            ← admin uniquement
DELETE /api/dabs/:id            ← admin uniquement
```

### Propositions communautaires
```
POST   /api/dabs/proposer                         ← propositionLimiter (3 req/heure/IP), anonyme
                                                     body: { nom, type_lieu, latitude, longitude, banque_id?, adresse? }
GET    /api/dabs/propositions                     ← admin uniquement
POST   /api/dabs/propositions/:id/approuver       ← admin uniquement → is_verified=true
DELETE /api/dabs/propositions/:id/rejeter         ← admin uniquement → supprime l'entrée
```

### Signalements (ANONYMES)
```
GET    /api/dabs/:id/signalements   ← résumé des votes actifs (public)
POST   /api/dabs/:id/signalements   ← signalLimiter (5 req/heure/IP)
                                       body: { etat, cookieId }
                                       réponse: { votes, etatCommunautaire, totalVotes }
```

### Avis (authentifiés)
```
GET    /api/dabs/:id/avis
POST   /api/dabs/:id/avis           ← JWT requis
DELETE /api/dabs/:id/avis/:avisId   ← JWT requis (owner ou admin)
```

### Référentiels publics
```
GET    /api/banques
GET    /api/services
```

### Admin
```
GET    /api/admin/stats
GET    /api/admin/signalements/stats
POST   /api/admin/import-google     ← déclenche import manuel Google Places
POST   /api/dabs/:id/signalements/resoudre ← remet statut à actif
```

---

## ⚡ WEBSOCKET — ÉVÉNEMENTS

### Événements émis par le serveur → clients
```
dab_update  →  { dabId, etatCommunautaire, totalVotes, votes[], timestamp }
dab_statut_change → { dabId, statut, source, timestamp }
```

### Événements émis par les clients → serveur
```
join_dab(dabId)   → rejoindre la room d'un DAB spécifique
leave_dab(dabId)  → quitter la room
```

### Rooms Socket.io
- `dab_${id}` → room spécifique pour un DAB (détail page)
- global → tous les clients (carte principale)

---

## 🔒 RÈGLES DE SÉCURITÉ — NON NÉGOCIABLES

Ces règles s'appliquent à chaque fichier généré, sans exception :

1. **Helmet.js** configuré avec tous les headers sur toutes les routes
2. **CORS** restreint à `CORS_ORIGIN` uniquement
3. **Rate limiting** : global (100/15min) + auth (10/15min) + signal (5/h)
4. **JWT** : secret min 64 chars, expiration configurée
5. **Passwords** : bcrypt avec minimum 12 rounds
6. **Requêtes SQL** : TOUJOURS paramétrées ($1, $2…) — jamais de concaténation
7. **IP** : jamais stockée brute → SHA-256 avec sel depuis env
8. **Body** : limité à 10kb (`express.json({ limit: '10kb' })`)
9. **password_hash** : jamais retourné dans les réponses API
10. **Erreurs auth** : messages génériques (ne pas révéler si email existe)
11. **.env** : dans .gitignore, jamais commité
12. **Inputs** : validés ET sanitisés côté backend (express-validator)
13. **Suppression** : toujours demander confirmation explicite avant DELETE

---

## 🔄 IMPORT GOOGLE PLACES — FONCTIONNEMENT

- **Source** : Google Places API (Nearby Search) — clé API requise (`GOOGLE_PLACES_API_KEY`)
- **Types** : `type=atm` + `type=bank` (agences bancaires)
- **Déduplication** : par `place_id` (stocké dans la colonne `osm_id` avec préfixe `google_`)
- **Conflit** : `ON CONFLICT (osm_id) DO UPDATE` → upsert propre
- **Cron** : tous les jours à 3h du matin
- **Coordonnées par défaut** : depuis `DEFAULT_LAT` / `DEFAULT_LNG` en .env
- **Rayon** : `SEARCH_RADIUS_KM` en .env (défaut : 20km)
- **Manuel** : `POST /api/admin/import-google` pour déclencher à la demande

---

## 📋 ÉTAT D'AVANCEMENT DU PROJET

Mettre à jour cette section à chaque session Claude Code.

### Phase 1 — Backend ✅ COMPLÉTÉ
- [x] Initialisation package.json + npm install
- [x] Configuration .env (utilisateur root, Google Places API Key)
- [x] Migration SQL (001_init.sql)
- [x] Seeds (seed.sql)
- [x] config/ (db, env, socket)
- [x] utils/ (geoUtils, responseUtils, osmImport ← Google Places)
- [x] middlewares/ (auth, role, validate, rateLimiter, errorHandler)
- [x] validators/ (auth, dab, avis, signalement)
- [x] models/ (tous)
- [x] controllers/ (tous)
- [x] routes/ (tous — avis + signalements imbriqués dans dabRoutes)
- [x] app.js + server.js
- [x] Route GET /api/admin/signalements/stats ajoutée
- [x] .gitignore

### Phase 2 — Frontend ✅ COMPLÉTÉ
- [x] Initialisation package.json + npm install
- [x] Configuration vite + .env
- [x] api/ (axiosConfig, dabApi, authApi, avisApi, signalementApi)
- [x] context/AuthContext.jsx
- [x] hooks/ (useGeolocation, useDABs, useAuth, useSocket)
- [x] components/UI/ (Spinner, ErrorMessage, SearchBar, Navbar)
- [x] components/Map/ (MapView, DABMarker, MapControls)
- [x] components/DAB/ (DABCard, DABDetail, DABList, DABFilters)
- [x] components/Signalement/ (SignalementButton, SignalementModal, SignalementBadge)
- [x] components/Auth/ (LoginForm, RegisterForm)
- [x] components/Avis/ (AvisForm, AvisList)
- [x] pages/ (HomePage, DABDetailPage, LoginPage, RegisterPage, admin/*)
- [x] App.jsx + main.jsx
- [x] index.html + vite.config.js
- [x] .gitignore

### Phase 2.5 — Propositions communautaires ✅ COMPLÉTÉ (2026-04-05)
- [x] Migration 002_add_community_dab.sql (colonnes source, is_verified, type_lieu)
- [x] Modèle DAB.js : propose(), findPropositions(), approuverProposition(), rejeterProposition()
- [x] Controller dabController.js : proposer, getPropositions, approuver, rejeter
- [x] Validator proposerValidator (avec type_lieu obligatoire)
- [x] Route POST /api/dabs/proposer (anonyme, propositionLimiter 3/h)
- [x] Routes admin GET|POST|DELETE /api/dabs/propositions/:id
- [x] rateLimiter.js : propositionLimiter ajouté
- [x] Frontend : AddDABModal.jsx (formulaire de proposition)
- [x] Frontend : MapView.jsx mis à jour (bouton flottant + mode ajout + clic carte)
- [x] Frontend : AdminPropositions.jsx (page admin modération)
- [x] Frontend : App.jsx route /admin/propositions
- [x] Frontend : AdminDashboard.jsx compteur + lien propositions

### Phase 3 — Tests & déploiement (à faire)
- [ ] Tests unitaires backend (auth, dab, avis, signalement)
- [ ] Import Google Places initial (vérifier clé API)
- [ ] Déploiement backend (Railway ou Render)
- [ ] Déploiement frontend (Vercel ou Netlify)
- [ ] README.md final

---

## 💡 DÉCISIONS TECHNIQUES IMPORTANTES

Ces décisions ont été prises et ne doivent pas être remises en question
sans discussion explicite avec l'utilisateur.

| Décision | Choix retenu | Raison |
|---|---|---|
| Carte | Leaflet.js + OpenStreetMap | 100% gratuit, pas de clé API |
| Import DAB/agences | Google Places API (Nearby Search) | Données riches, agences bancaires incluses |
| Auth signalement | Aucune (anonyme) | Maximiser la participation |
| Anti-spam | IP hashée + cookie UUID | RGPD + efficacité |
| Temps réel | Socket.io | Simple, fiable, compatible Express |
| États signalement | 3 seulement | Clarté UX : disponible/vide/en_panne |
| Durée vote | 4 heures | Informations fraîches, pas trop restrictif |
| Seuil activation | 2 votes | Assez bas pour être utile dès le départ |
| Déploiement | Railway (back) + Vercel (front) | Gratuit, supporte Node.js |

---

## 🚨 RÈGLES POUR CLAUDE CODE

1. **Toujours lire ce fichier en premier** avant de commencer une session
2. **Mettre à jour la checklist** (Phase 1/2/3) après chaque fichier créé
3. **Demander confirmation** avant tout `npm install` ou modification de BDD
4. **Ne jamais modifier** les décisions techniques sans en informer l'utilisateur
5. **Tester la syntaxe** de chaque fichier avant de passer au suivant
6. **Respecter l'ordre** de génération défini dans les phases
7. **Signaler immédiatement** toute ambiguïté ou incohérence détectée
8. **Ne jamais stocker d'IP brute** → toujours hacher avec IP_SALT
9. **Chaque controller** doit utiliser `express-async-errors` (pas de try/catch manuel)
10. **Format de réponse** : toujours via `successResponse` / `errorResponse` de responseUtils.js

---

## 📞 VARIABLES D'ENVIRONNEMENT REQUISES

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/localisation_dab
JWT_SECRET=                    # min 64 caractères aléatoires
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
BCRYPT_ROUNDS=12
IP_SALT=                       # min 32 caractères aléatoires
SIGNALEMENT_SEUIL=2
SIGNALEMENT_DUREE_HEURES=4
DEFAULT_LAT=36.7372            # Latitude centre import Google Places
DEFAULT_LNG=3.0865             # Longitude centre import Google Places
SEARCH_RADIUS_KM=20
GOOGLE_PLACES_API_KEY=         # Clé API Google Places (Maps Platform)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_MAP_DEFAULT_LAT=36.7372
VITE_MAP_DEFAULT_LNG=3.0865
VITE_MAP_DEFAULT_ZOOM=13
```

---

## 🧪 COMMANDES UTILES

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon src/server.js
npm test             # jest

# Migrations
psql $DATABASE_URL -f migrations/001_init.sql
psql $DATABASE_URL -f seeds/seed.sql

# Frontend
cd frontend
npm install
npm run dev          # vite

# Import Google Places manuel (depuis backend/)
node -e "require('./src/utils/osmImport').syncGooglePlaces().then(console.log)"
```

---

*Dernière mise à jour : 2026-03-24 — Phase 1 & 2 complétées, corrections appliquées*
*Chef de projet : Claude (assistant Anthropic)*
*Version du projet : 1.0.0-alpha*

# Journal de développement — LocalisationDAB

---

## Session du 2026-04-24

### Contexte
Préparation de la version de production avant déploiement final.
Stack : Node.js + Express + PostgreSQL (Render) / React + Vite (Vercel).

---

### Réalisations

#### 1. Identité visuelle — Logo
- Création d'un logo via **Canva AI** (4 candidats générés) pour l'app renommée **"localiseMyDab"**
- Fichier source : `Logos/Logo - ATM locator.png` (1313×1313px)
- Rognage automatique du blanc autour du logo via **jimp** → `frontend/public/logo.png` (1233×957px)
- Remplacement de l'emoji 💳 dans la Navbar par le vrai logo PNG
- Favicon `index.html` mis à jour pour pointer vers `/logo.png`
- Taille finale dans la Navbar : `h-14` (56px) pour une bonne lisibilité mobile

#### 2. Écran de démarrage (Splash Screen)
- Création du composant `frontend/src/components/UI/SplashScreen.jsx`
- Affichage du logo en plein écran pendant **3 secondes** à l'ouverture de l'app
- Fondu de disparition progressif (600ms) à partir de 2.4s
- **Logique 24h** : le splash ne s'affiche qu'**une seule fois par tranche de 24h** par utilisateur via `localStorage` (`splash_last_shown`)
- Intégration dans `App.jsx` avant le BrowserRouter

#### 3. Marker de position utilisateur sur la carte
- Remplacement du bonhomme rouge SVG (`USER_ICON` dans `MapView.jsx`) par l'ours du logo
- Première version : logo complet `/logo.png` (52×52px)
- Deuxième version : logo rogné à 65% de hauteur pour supprimer le texte
- Version finale : fichier `Logos/logo_carte.png` (858×754px) fourni par l'utilisateur — ours sans texte, sans rognage → `frontend/public/bear-marker.png`
- Taille du marker : **72×72px** avec pointe indicatrice en dessous

#### 4. Infrastructure / Déploiement
- Discussion sur la configuration serveur recommandée pour la production :
  - **Hetzner CX32** (4 vCPU / 8GB RAM / 80GB SSD) à ~8€/mois
  - Architecture : Vercel (frontend) + VPS avec nginx + PM2 + PostgreSQL
- Tous les changements buildés et pushés sur **GitHub → Render + Vercel** (déploiement automatique)

---

### Commits du jour
| Hash | Description |
|------|-------------|
| `dd37ae2` | fix(navbar): increase logo size for better mobile visibility |
| `6b68f13` | feat(map): use logo_carte (bear without text) as user position marker |
| `bd0f2bd` | feat(map): enlarge bear marker and use text-free bear image |
| `55c327b` | feat(map): replace red stick figure with bear logo as user position marker |
| `3938b48` | feat(ui): add logo and splash screen |

---

### Fichiers créés / modifiés
| Fichier | Action |
|---------|--------|
| `frontend/public/logo.png` | Créé — logo principal rogné |
| `frontend/public/bear-marker.png` | Créé — ours sans texte pour marker carte |
| `frontend/src/components/UI/SplashScreen.jsx` | Créé |
| `frontend/src/components/UI/Navbar.jsx` | Modifié — logo PNG + taille |
| `frontend/src/App.jsx` | Modifié — intégration SplashScreen + logique 24h |
| `frontend/src/components/Map/MapView.jsx` | Modifié — USER_ICON remplacé par ours |
| `frontend/index.html` | Modifié — favicon mis à jour |

---

### Points en suspens
- [ ] Taille de l'ours sur la carte à valider visuellement sur mobile
- [ ] Tests unitaires backend (Phase 3)
- [ ] Import Google Places initial (vérifier clé API)
- [ ] README.md final

---

*Rédigé le 2026-04-24 — Session Claude Code*

---

## Session du 2026-04-26

### Contexte
Nettoyage et assainissement de la base de données de production (Render PostgreSQL).
Objectif : ne conserver que des DABs réels, correctement liés à leur banque.

---

### Réalisations

#### 1. Ajout de nouvelles banques au référentiel
Banques ajoutées manuellement dans la table `banques` (production) :
| ID | Nom |
|----|-----|
| 1923 | ABC Banque (Arab Banking Corporation) |
| 1924 | Fransabank |
| 1925 | Housing Bank |
| 1926 | Trust Bank Algeria |
| 1927 | Arab Bank Algeria |
| 1928 | Natixis Algérie |
| 1929 | Banque d'Algérie *(supprimée en fin de session)* |

#### 2. Nettoyage massif des entrées non-ATM
Suppression de ~120+ entrées importées par erreur via Google Places (type=bank) :
- Cafés, agences d'assurance, opérateurs télécom, agences de voyage, bureaux gouvernementaux
- Méthode : patterns ILIKE / regex sur noms connus (CAAT, CIAR, CNMA, Ooredoo, Mobilis, etc.)

#### 3. Liaison des DABs à leur banque (`banque_id`)
Mise à jour en masse via `UPDATE dabs SET banque_id = X WHERE nom ILIKE/~* pattern` :
- Variantes arabes et françaises de BNA, BEA, CPA, BADR, BDL, CNEP, AGB, Algérie Poste
- Traductions anglaises (Agricultural Development Bank → BADR, National Bank of Algeria → BNA, etc.)
- Dahabia / EDAHABIA → Algérie Poste (carte CCP)
- 28 DABs ABC liés à ABC Banque (ID 1923)
- Banque Extérieure BBA 109 → BEA (ID 3)
- B.A.D.R Banque + Banque De l'Agriculture → BADR (ID 5)

#### 4. Suppression de la Banque d'Algérie (banque centrale)
- **Constat** : la Banque d'Algérie est la banque centrale (équivalent Banque de France) — elle n'a aucun DAB public
- **Action** : suppression des 25 entrées "Bank of Algeria / بنك الجزائر / Banque Centrale" + retrait de la banque du référentiel
- **Résultat** : entrée ID 1929 supprimée de la table `banques`

---

### État final de la base de données
- **Total DABs** : 1 698
- **Sans banque_id** : ~99 (tous des ATMs génériques légitimes : ATM, DAB, Distributeur, GAB, صراف آلي…)
- **Répartition par banque** :

| Banque | DABs |
|--------|------|
| BNA | 258 |
| CNEP | 254 |
| CPA | 239 |
| BEA | 199 |
| BADR | 138 |
| Algérie Poste | 132 |
| BDL | 87 |
| SGA | 67 |
| AGB | 63 |
| ABC Banque | 28 |
| Al Baraka | 26 |
| BNP Paribas | 22 |
| Natixis | 17 |
| Trust Bank | 17 |
| Fransabank | 16 |
| Arab Bank | 16 |
| Es Salam | 12 |
| Housing Bank | 7 |

---

### Points en suspens
- [ ] Taille de l'ours sur la carte à valider visuellement sur mobile
- [ ] Tests unitaires backend (Phase 3)
- [ ] Import Google Places initial (vérifier clé API)
- [ ] README.md final
- [ ] `bankConfig.js` : vérifier la correspondance visuelle pour Housing Bank, Trust Bank, Natixis, ABC, Arab Bank (logos/couleurs OK mais à tester sur prod)

---

*Rédigé le 2026-04-26 — Session Claude Code*

---

## Session du 2026-05-02

### Contexte
Mise en production sur VPS Octenium. Nettoyage BDD, configuration Nginx/SSL, déploiement frontend, corrections de bugs.

---

### Réalisations

#### 1. Accès SSH Claude → VPS
- Génération clé ed25519 : `ssh-keygen -t ed25519 -f /tmp/claude_vps_key -N ""`
- Ajout clé publique dans `~/.ssh/authorized_keys` sur le VPS
- Connexion directe : `ssh -i /tmp/claude_vps_key root@164.132.116.135`
- Permet l'exécution de commandes SQL et bash directement depuis Claude Code

#### 2. Nettoyage complet BDD VPS (PostgreSQL)
**Avant** : 1 290 DABs, 1 286 sans banque_id, 13 banques
**Après** : 1 124 DABs propres, 18 banques, 1 022 liés à leur banque, 102 génériques

Opérations effectuées :
- Ajout 6 banques : ABC Banque, Fransabank, Housing Bank, Trust Bank Algeria, Arab Bank Algeria, Natixis Algérie
- Suppression Banque Es Salam (0 DABs)
- Liaison Algérie Poste : variantes françaises + arabes (CCP, DAB Poste, بريد الجزائر...)
- Suppression 150+ faux ATMs : assurances (CAAT, CIAR, Trust Assurance), télécoms (Djezzy, Mobilis, Algérie Télécom), agences de voyage, trésoreries, CNAS, cafés, leasing, administrations
- Suppression Banque d'Algérie (banque centrale, pas de DABs publics)
- Liaison toutes banques via patterns ILIKE français + arabes
- Procédure complète sauvegardée dans `backend/docs/nettoyage_bdd.md`

#### 3. Correction logo CNEP
- URL Wikimedia `Logo_CNEP_banque_1_DZ.svg` retournait 404
- Nouvelle URL fonctionnelle : `Logo_CNEP_banque_DZ.svg`
- Fichier modifié : `frontend/src/utils/bankConfig.js`

#### 4. Correction CORS
- `CORS_ORIGIN=http://164.132.116.135` → `https://localizemaydab.com`
- Fichier : `/var/www/LocalisationDAB/backend/.env` sur le VPS
- Restart PM2 : `pm2 restart localisation-dab --update-env`

#### 5. Correction URL API frontend (VITE_API_URL)
- Le frontend buildé pointait vers Render (`https://localisationdab-1.onrender.com/api`)
- Build de production VPS : `VITE_API_URL=https://localizemaydab.com/api npm run build`
- Déploiement : `scp -r dist/. root@164.132.116.135:/var/www/LocalisationDAB/frontend/dist/`

---

### Bugs introduits et corrigés

#### ❌ Bug 1 — `développement local` mappé sur BADR au lieu de BDL
- **Erreur** : `UPDATE dabs SET banque_id = 5 WHERE ... nom ILIKE '%développement local%'`
- **Cause** : BADR = agriculture, BDL = développement **local** — confusion
- **Correction** : `UPDATE dabs SET banque_id = 6 WHERE banque_id = 5 AND nom ILIKE '%développement local%'`
- **Règle** : BDL = Banque de Développement **Local** (ID 6), BADR = Banque d'Agriculture et Développement Rural (ID 5)

#### ❌ Bug 2 — Build avec `VITE_API_URL=/api` → WebSocket cassé
- **Erreur** : `wss://c/socket.io/` au lieu de `wss://localizemaydab.com/socket.io/`
- **Cause** : `useSocket.js` fait `.replace('/api', '')` → `/api` devient `''` → socket.io produit une URL invalide
- **Mauvaise tentative 1** : Remplacer par `window.location.origin` — n'a pas résolu (artefact de minification)
- **Mauvaise tentative 2** : Passer `undefined` à socket.io — n'a pas résolu non plus
- **Correction finale** : Builder avec URL absolue `VITE_API_URL=https://localizemaydab.com/api`
- **Règle** : Pour le build VPS, toujours utiliser une URL absolue, jamais une URL relative comme `/api`

#### ❌ Bug 3 — `pg_dump` version mismatch (16 vs 18)
- **Erreur** : `server version: 18.3; pg_dump version: 16.13`
- **Cause** : Render utilise PostgreSQL 18, le VPS a pg_dump 16 par défaut
- **Correction** : Installer `postgresql-client-18` via le repo officiel PostgreSQL
- **Règle** : Toujours vérifier la version de pg_dump avant un dump cross-server

#### ❌ Bug 4 — Commande `pg_dump` avec URL en paramètre cassée par le shell
- **Erreur** : Le shell interprétait l'URL comme une commande séparée
- **Cause** : Caractères spéciaux (`@`, `//`) dans l'URL non échappés correctement
- **Correction** : Utiliser les paramètres `-h`, `-U`, `-d` séparément + `PGPASSWORD=...`
- **Règle** : Pour pg_dump avec URL complexe, préférer les flags séparés à la connection string

---

### Workflow de déploiement VPS établi

```bash
# 1. Build frontend avec URL absolue VPS
cd frontend
VITE_API_URL=https://localizemaydab.com/api npm run build

# 2. Déployer sur VPS
scp -i /tmp/claude_vps_key -r dist/. root@164.132.116.135:/var/www/LocalisationDAB/frontend/dist/

# 3. Redémarrer backend si .env modifié
ssh -i /tmp/claude_vps_key root@164.132.116.135 "source ~/.nvm/nvm.sh && pm2 restart localisation-dab --update-env"
```

---

### Variables d'environnement correctes (VPS)

| Variable | Valeur |
|---|---|
| `CORS_ORIGIN` | `https://localizemaydab.com` |
| `NODE_ENV` | `production` |
| `VITE_API_URL` (build) | `https://localizemaydab.com/api` |

---

*Rédigé le 2026-05-02 — Session Claude Code*

---

## Session du 2026-05-03

### Contexte
Amélioration de l'app en production (localizemaydab.com). Mise en place du workflow branches + nouvelles fonctionnalités.

---

### Réalisations

#### 1. Workflow branches Git établi
- Création de la branche `develop` depuis `main`
- **Règle** : tout développement se fait sur `develop`, jamais sur `main` directement
- Render (backend) redéployé depuis `develop`
- Vercel génère des preview URLs automatiques pour `develop`
- `main` = production VPS uniquement, mergé sur demande explicite

#### 2. Correction CPA/BNA — confusion sur la carte
- 2 DABs "Algerian Popular Loan" avaient `banque_id = 2` (BNA) au lieu de `1` (CPA)
- Correction directe sur la BDD VPS : `UPDATE dabs SET banque_id = 1 WHERE banque_id = 2 AND nom ILIKE '%algerian popular%'`
- Script `nettoyage_bdd.md` mis à jour avec le pattern manquant + query corrective

#### 3. Bouton de localisation — icône ours
- Remplacement du 📍 par l'image `bear-marker.png` dans le bouton "Ma position" (bas droite de la carte)
- Fichier modifié : `frontend/src/components/Map/MapControls.jsx`

#### 4. Modération admin rapide sur la carte
- Nouveau composant `AdminQuickEditModal.jsx`
- Quand connecté en admin, un bouton **"✏️ Modération admin"** apparaît dans le popup de chaque marqueur
- Permet de : changer la banque associée (dropdown) ou supprimer le DAB (avec confirmation)
- La carte se rafraîchit automatiquement après chaque action
- Fichiers modifiés : `DABMarker.jsx`, `MapView.jsx`, `HomePage.jsx`

#### 5. Logos Fransabank et Trust Bank
- **Fransabank** : logo trouvé sur le site officiel `fransabank.dz` → URL directe fonctionnelle
- **Trust Bank** : URL directe depuis `trustbank.dz` (CORS bloquant côté serveur, à résoudre en local ultérieurement)
- Fichier modifié : `frontend/src/utils/bankConfig.js`

#### 6. Page CGU (Conditions Générales d'Utilisation)
- Nouvelle page `/cgu` bilingue (FR/EN) — langue détectée via i18n
- Contenu adapté à l'app : anonymat des signalements, absence d'usage commercial des données, IP jamais stockée brute, référence loi algérienne n°18-07
- **Mobile** : lien dans le menu burger (traduit FR/EN)
- **Desktop** : lien "CGU" dans la navbar + footer discret sur les pages hors carte
- Le footer est masqué sur `/` pour ne pas gêner la navigation sur la carte
- Fichiers créés/modifiés : `CGUPage.jsx`, `App.jsx`, `Navbar.jsx`, `fr.json`, `en.json`

---

### Commits du jour
| Hash | Description |
|------|-------------|
| `23d7133` | fix(banks): correct CNEP logo URL and fix CPA/BNA mapping in cleanup script |
| `5c74dbf` | feat(map): replace 📍 locate button with bear icon |
| `09ca804` | feat(admin): add quick moderation panel on map markers |
| `abbbdc4` | feat(banks): add logos for Fransabank and Trust Bank Algeria |
| `b679fbd` | feat(legal): add CGU page with mobile burger menu link and desktop footer |
| `463bc3a` | feat(nav): add CGU link in desktop navbar |
| `39ce40a` | feat(cgu): add English version of Terms of Use |
| `36a0a95` | fix(nav): translate CGU link in burger menu (fr/en) |

---

### Points en suspens
- [ ] Logo Trust Bank : CORS bloquant → télécharger en local dans `frontend/public/logos/trust_bank_logo.png`
- [ ] Taille de l'ours sur la carte à valider visuellement sur mobile
- [ ] Tests unitaires backend (Phase 3)
- [ ] Import Google Places initial (vérifier clé API)
- [ ] README.md final

---

*Rédigé le 2026-05-03 — Session Claude Code*

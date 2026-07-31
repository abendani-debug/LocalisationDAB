# Spec — Architecture Multi-Pays MapsDab

**Date :** 2026-06-12
**Statut :** Approuvé — en attente d'implémentation
**Auteur :** Session Claude Code + utilisateur

---

## Contexte & Motivation

MapsDab est actuellement déployé uniquement pour l'Algérie (mapsdab.com, ~1 124 DABs en prod).
L'extension France est sur la branche `develop` (Tasks 1-5 commitées, import pas encore lancé).

L'objectif de cette spec est de poser l'architecture multi-pays **avant** de déployer la France,
afin que la France devienne le premier "deuxième pays" dans le nouveau système — proprement,
sans dette technique.

### Valeur différenciante confirmée

MapsDab n'est pas un simple annuaire de DABs. La vraie valeur est :
> **Savoir si y'a du cash dans le DAB avant de s'y déplacer.**

Aucun concurrent mondial (Mastercard ATM Hunter, Visa Locator, Google Maps) ne propose
de signalement communautaire de disponibilité cash en temps réel. Le seul précédent
(CashNoCash, Inde 2016) était une réponse de crise, aujourd'hui dormante.
**Le créneau mondial est vierge.**

### Cibles utilisateurs
- Voyageurs dans un pays inconnu (cas d'usage principal)
- Locaux qui veulent éviter un déplacement inutile (DAB vide)
- Expatriés avec besoin régulier

### Monétisation envisagée (inspiration Waze)
- Branded Pins bancaires (banques paient pour mettre leurs DABs en avant)
- Vente de données anonymisées aux banques/fintechs (stats disponibilité par zone/heure)
- Alertes premium (notifier quand un DAB est de nouveau dispo)

---

## Décisions d'architecture

### Source de données
Google Places API uniquement. Déploiement progressif pays par pays selon coût/bénéfice et trafic.

### UX sélection de pays
**Approche retenue : géoloc automatique + changement manuel**
- Géoloc détecte le pays → carte centrée automatiquement
- Sélecteur manuel (emoji flag + nom) en haut de carte pour changer
- Pas de page d'accueil avec sélection — on reste sur la carte directement

---

## Section 1 — Modèle de données

### Nouvelle table `pays`

```sql
CREATE TABLE pays (
  id           SERIAL PRIMARY KEY,
  code_iso     CHAR(2) NOT NULL UNIQUE,   -- 'FR', 'DZ', 'MA'...
  nom          VARCHAR(100) NOT NULL,     -- 'Algérie', 'France'
  center_lat   DECIMAL(9,6) NOT NULL,     -- coordonnées centre carte
  center_lng   DECIMAL(9,6) NOT NULL,
  bbox_min_lat DECIMAL(9,6) NOT NULL,     -- bounding box pour géodétection
  bbox_max_lat DECIMAL(9,6) NOT NULL,
  bbox_min_lng DECIMAL(9,6) NOT NULL,
  bbox_max_lng DECIMAL(9,6) NOT NULL,
  default_zoom SMALLINT DEFAULT 6,
  is_active    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

La bbox est indispensable pour détecter automatiquement le pays de l'utilisateur
à partir de ses coordonnées GPS.

### Modification table `dabs`

```sql
-- Ajout nullable d'abord (zero downtime), backfill, contrainte ensuite si besoin
ALTER TABLE dabs ADD COLUMN country_code CHAR(2) REFERENCES pays(code_iso);

-- Index obligatoire — toutes les requêtes carte filtreront par ce champ
CREATE INDEX idx_dabs_country_code ON dabs(country_code);

-- Backfill des DABs existants (tous algériens en prod)
UPDATE dabs SET country_code = 'DZ' WHERE country_code IS NULL;
```

### Données initiales

```sql
INSERT INTO pays (code_iso, nom, center_lat, center_lng,
  bbox_min_lat, bbox_max_lat, bbox_min_lng, bbox_max_lng,
  default_zoom, is_active)
VALUES
  ('DZ', 'Algérie', 28.0339, 1.6596,
    18.9680, 37.0940, -8.6700, 11.9990, 6, true),
  ('FR', 'France',  46.2276, 2.2137,
    41.3330, 51.1240, -5.1420, 9.5620,  6, true);
```

---

## Section 2 — UX Frontend

### Comportement au chargement

1. App tente la géoloc navigateur
2. Coordonnées GPS comparées aux `bbox` des pays `is_active = true` → détection pays
3. Carte centrée sur `center_lat/center_lng` avec `default_zoom` du pays détecté
4. Fallback : Algérie (pays par défaut) si géoloc refusée ou pays non actif

### Sélecteur de pays

Barre en haut de la carte :
```
[ 🇩🇿 Algérie ▾ ]
```
- Dropdown avec uniquement les pays `is_active = true`, triés par trafic
- Chaque entrée : emoji flag (calculé depuis code_iso côté frontend) + nom
- Pas de recherche pour l'instant (liste courte au démarrage)

### Pays non encore déployé

Si l'utilisateur est géolocalisé dans un pays inactif → message discret sous la carte :
> *"MapsDab n'est pas encore disponible dans votre pays. M'avertir quand ça arrive →"*

Lien vers formulaire email simple → liste d'attente pour valider la demande avant d'investir.

### Ce qui NE change pas
- Carte, marqueurs, signalements, filtres → comportement identique
- Géoloc rayon 1km déjà en place → inchangée

---

## Section 3 — Admin Panel + Import

### Nouvelle page `/admin/pays`

Tableau listant tous les pays avec :
- Nombre de DABs actifs
- Date du dernier import
- Statut actif/inactif (toggle)
- Boutons : Activer/Désactiver, Importer, (Ajouter un pays)

### Route backend import par pays

```
POST /api/admin/import-google
body: { country: 'FR' }   // paramètre optionnel, défaut = tous les pays actifs
```

Chaque pays a son propre module d'import (ex. `frImport.js`, `dzImport.js`)
ou un import générique paramétré par liste de villes/coordonnées.

### Cron quotidien (3h du matin)

`syncAll()` enchaîne l'import de tous les pays `is_active = true` automatiquement.

### Ce qui NE change pas
- Dashboard admin `/admin` inchangé — ajout d'un lien vers `/admin/pays`
- Route `POST /api/admin/import-google` reste compatible (sans paramètre = comportement actuel)

---

## Workflow de déploiement

1. **Local** — développer + tester
2. **GitHub** — push sur `develop` quand validé en local
3. **VPS prod** — déployer sur mapsdab.com uniquement après validation GitHub

## Ordre d'implémentation recommandé

1. Migration SQL : table `pays` + colonne `country_code` sur `dabs` + backfill DZ
2. Modifier `frImport.js` pour assigner `country_code = 'FR'` à chaque DAB inséré
3. Lancer l'import France (Task 6 du plan précédent)
4. Route GET `/api/pays` (liste des pays actifs — publique)
5. Sélecteur de pays frontend (composant `CountrySelector`)
6. Logique de géodétection frontend (bbox matching)
7. Page admin `/admin/pays`
8. Route POST `/api/admin/import-google` avec paramètre `country`
9. Push GitHub + déploiement VPS

---

## Fichiers impactés

| Action | Fichier |
|---|---|
| Créer | `backend/migrations/004_add_pays_table.sql` |
| Modifier | `backend/src/utils/frImport.js` (ajouter country_code='FR') |
| Modifier | `backend/src/utils/osmImport.js` (ajouter country_code='DZ') |
| Créer | `backend/src/routes/paysRoutes.js` |
| Modifier | `backend/src/app.js` (monter paysRoutes) |
| Créer | `frontend/src/components/UI/CountrySelector.jsx` |
| Modifier | `frontend/src/components/Map/MapView.jsx` (géodétection + centrage) |
| Modifier | `frontend/src/api/dabApi.js` (passer country_code dans les requêtes) |
| Créer | `frontend/src/pages/admin/AdminPays.jsx` |
| Modifier | `frontend/src/App.jsx` (route /admin/pays) |

---

*Spec validée en session le 2026-06-12*
*Recherche concurrentielle effectuée — créneau mondial confirmé vierge*

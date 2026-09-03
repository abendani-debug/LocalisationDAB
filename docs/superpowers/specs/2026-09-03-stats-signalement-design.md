# Stats de signalement par banque et par DAB — Design

## Objectif

Donner à l'admin MapsDab une vue comparative des banques (taux de disponibilité,
volume de participation, tendance, points chauds), et permettre à une banque
partenaire de consulter ses propres chiffres via son token embed existant.

**Double usage :**
- **Interne** : piloter le produit, identifier les banques/DAB à problème
- **Commercial** : argument chiffré pour les banques partenaires (notamment
  dans le cadre du widget embed — voir `2026-07-06-embed-widget.md`)

## Contrainte de départ

La table `signalements` ne contient qu'une fenêtre glissante courte : les
votes expirés (4h, 24h pour les votes admin) sont **supprimés** par le cron
`deleteExpired()` (`backend/src/models/Signalement.js`). Cette suppression
n'est pas juste du nettoyage — elle est nécessaire à cause des contraintes
`UNIQUE (dab_id, ip_hash)` et `UNIQUE (dab_id, cookie_id)`, qui empêchent un
même utilisateur anonyme de revoter sur un DAB tant que son ancien vote
existe. On ne peut donc pas simplement arrêter la suppression : il faut
archiver avant de supprimer.

## Schéma de données

Nouvelle migration `006_signalements_archive.sql` :

```sql
CREATE TABLE IF NOT EXISTS signalements_archive (
  id          SERIAL PRIMARY KEY,
  dab_id      INTEGER     NOT NULL REFERENCES dabs(id) ON DELETE CASCADE,
  etat        VARCHAR(20) NOT NULL,
  source      VARCHAR(20) NOT NULL DEFAULT 'communaute',
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archive_dab     ON signalements_archive (dab_id);
CREATE INDEX IF NOT EXISTS idx_archive_created ON signalements_archive (created_at);
```

Ni `ip_hash` ni `cookie_id` ne sont archivés — inutiles pour les stats, et ça
renforce l'anonymat déjà en place (ces champs ne survivent pas à l'expiration
du vote).

## Modification du cron de nettoyage

`deleteExpired()` dans `backend/src/models/Signalement.js` devient une seule
requête atomique (CTE `DELETE ... RETURNING` + `INSERT`), pas besoin de gérer
une transaction explicite côté app :

```sql
WITH expired AS (
  DELETE FROM signalements WHERE expires_at <= NOW() RETURNING dab_id, etat, created_at
)
INSERT INTO signalements_archive (dab_id, etat, created_at)
SELECT dab_id, etat, created_at FROM expired
```

## Logique métier centralisée

Nouveau `backend/src/models/StatsService.js` — un seul endroit pour toute
l'agrégation, appelé par les deux controllers (admin et embed) pour éviter
de dupliquer le SQL :

- `getStatsBanque(banqueId, period)` — taux de disponibilité, volume, courbe
  d'évolution, classement des DAB les plus signalés vide/en panne, pour une
  banque donnée
- `getStatsToutesBanques(period)` — vue comparative toutes banques confondues
  (pour l'admin uniquement)

`period` = nombre de jours (`7`, `30`, `90`) ou `all` pour tout l'historique.
Toutes les requêtes filtrent sur `signalements_archive.created_at`, couvertes
par les index créés ci-dessus. L'agrégation par banque s'appuie sur
`idx_dabs_banque` (déjà existant) pour joindre `dabs.banque_id`.

## Validation

Nouveau `backend/src/validators/statsValidator.js` : whiteliste `period` sur
`['7', '30', '90', 'all']` via `express-validator`, conforme au reste du
projet (aucune query string libre n'atteint le SQL).

## Routes API

```
GET /api/admin/stats/banques           ← admin, StatsService.getStatsToutesBanques()
GET /api/admin/stats/banques/:id       ← admin, StatsService.getStatsBanque()
GET /api/embed/:token/stats            ← public token-gated, StatsService.getStatsBanque()
```

- Toutes acceptent `?period=7|30|90|all` (défaut `30`)
- Réponses via `successResponse`/`errorResponse` (`utils/responseUtils.js`)
- `/api/embed/:token/stats` réutilise la validation de token déjà écrite pour
  `/api/embed/:token/dabs` — la fonction `validateToken()` actuellement
  privée dans `embedController.js` est extraite en helper partagé (exportée
  ou déplacée dans un module commun) pour être appelée par la nouvelle route
  sans duplication

## Frontend

**Vue admin** — `frontend/src/pages/admin/AdminStatsBanques.jsx` :
tableau comparatif de toutes les banques (taux dispo, volume, tendance) +
drill-down par banque (courbe d'évolution + classement des DAB les plus
signalés vide/en panne). Lien ajouté dans `AdminDashboard.jsx`, route
`/admin/stats-banques` protégée par `AdminRoute`.

**Vue banque partenaire** — `frontend/src/pages/EmbedStatsPage.jsx` :
route `/embed/:token/stats`, même charte visuelle qu'`EmbedPage.jsx`
(légère, sans navbar), scopée à la banque du token — pas de sélecteur
d'autre banque, pas de comparaison avec la concurrence.

**Dépendance** : Recharts pour les courbes (nouvelle dépendance, absente du
projet actuellement). Chargée uniquement sur ces deux pages via
`React.lazy` / code splitting au niveau route, pour ne pas alourdir le
bundle des visiteurs de la carte principale.

## Évolutivité

À l'échelle actuelle (~18-20k DAB, volume de signalements modeste), des
requêtes `GROUP BY` directes sur `signalements_archive` restent rapides
longtemps. Si le volume grossit au point de ralentir les agrégations, le
palier suivant est une table `signalement_stats_daily` (banque_id, dab_id,
jour, compteurs par état) alimentée par un cron nocturne, avec purge de
l'archive brute après une rétention type 90 jours. Ce palier n'est pas
construit maintenant (YAGNI) mais reste activable sans migration de rupture,
puisque l'archive contient déjà tout le détail nécessaire pour l'alimenter.

## Hors scope

- Pas d'export PDF/CSV automatisé pour les banques (partagé manuellement par
  l'admin si besoin, pour l'instant)
- Pas de notification proactive aux banques ("votre taux de dispo a baissé")
- Pas de comparaison anonymisée entre banques visible côté banque partenaire
- Pas de table de rollup quotidien (`signalement_stats_daily`) — voir
  section Évolutivité

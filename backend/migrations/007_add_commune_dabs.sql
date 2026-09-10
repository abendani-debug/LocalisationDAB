-- 007_add_commune_dabs.sql
-- Ajoute la commune (résolue via limites administratives ADM3, point-dans-polygone)
-- pour affiner les stats géographiques. Backfillée séparément via scripts/backfillCommunes.js.
ALTER TABLE dabs ADD COLUMN IF NOT EXISTS commune VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_dabs_commune ON dabs (commune);

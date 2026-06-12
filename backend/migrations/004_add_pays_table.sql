-- backend/migrations/004_add_pays_table.sql
-- Ajout de l'architecture multi-pays : table pays + country_code sur dabs.
-- Backfill : tous les DABs existants sont algériens → country_code = 'DZ'.

CREATE TABLE pays (
  id           SERIAL PRIMARY KEY,
  code_iso     CHAR(2)       NOT NULL UNIQUE,
  nom          VARCHAR(100)  NOT NULL,
  center_lat   DECIMAL(9,6)  NOT NULL,
  center_lng   DECIMAL(9,6)  NOT NULL,
  bbox_min_lat DECIMAL(9,6)  NOT NULL,
  bbox_max_lat DECIMAL(9,6)  NOT NULL,
  bbox_min_lng DECIMAL(9,6)  NOT NULL,
  bbox_max_lng DECIMAL(9,6)  NOT NULL,
  default_zoom SMALLINT      NOT NULL DEFAULT 6,
  is_active    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO pays (code_iso, nom, center_lat, center_lng,
  bbox_min_lat, bbox_max_lat, bbox_min_lng, bbox_max_lng,
  default_zoom, is_active)
VALUES
  ('DZ', 'Algérie', 28.0339,  1.6596,
    18.9680, 37.0940, -8.6700, 11.9990, 6, true),
  ('FR', 'France',  46.2276,  2.2137,
    41.3330, 51.1240, -5.1420,  9.5620, 6, true);

ALTER TABLE dabs
  ADD COLUMN country_code CHAR(2) REFERENCES pays(code_iso);

-- Backfill : tous les DABs existants sont en Algérie
UPDATE dabs SET country_code = 'DZ' WHERE country_code IS NULL;

-- Index pour les requêtes de filtrage par pays
CREATE INDEX idx_dabs_country_code ON dabs(country_code);

-- 006_signalements_archive.sql
CREATE TABLE IF NOT EXISTS signalements_archive (
  id          SERIAL PRIMARY KEY,
  dab_id      INTEGER     NOT NULL REFERENCES dabs(id) ON DELETE CASCADE,
  etat        VARCHAR(20) NOT NULL,
  source      VARCHAR(20) NOT NULL DEFAULT 'communaute',
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archive_dab     ON signalements_archive (dab_id);
CREATE INDEX IF NOT EXISTS idx_archive_created ON signalements_archive (created_at);

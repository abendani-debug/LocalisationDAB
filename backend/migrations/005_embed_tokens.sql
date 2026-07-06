-- 005_embed_tokens.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS embed_tokens (
  id               SERIAL PRIMARY KEY,
  token            UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  banque_id        INTEGER      NOT NULL REFERENCES banques(id) ON DELETE CASCADE,
  label            VARCHAR(100) NOT NULL,
  allowed_domains  TEXT[]       DEFAULT NULL,
  trial_ends_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embed_tokens_token  ON embed_tokens (token);
CREATE INDEX IF NOT EXISTS idx_embed_tokens_banque ON embed_tokens (banque_id);

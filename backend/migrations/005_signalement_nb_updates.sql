-- Migration 005 : ajout nb_updates sur signalements
-- Permet de limiter la modification d'un vote à 1 fois dans la fenêtre de 4h

ALTER TABLE signalements
  ADD COLUMN IF NOT EXISTS nb_updates INTEGER NOT NULL DEFAULT 0;

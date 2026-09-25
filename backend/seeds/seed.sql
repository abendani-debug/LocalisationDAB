-- =============================================================
-- seed.sql — Données de test pour LocalisationDAB
-- À exécuter après migrations/001_init.sql
-- =============================================================

-- -------------------------------------------------------------
-- Banques
-- -------------------------------------------------------------
INSERT INTO banques (nom) VALUES
  ('CPA'),
  ('BNA'),
  ('BEA'),
  ('CNEP'),
  ('BADR'),
  ('BDL'),
  ('AGB'),
  ('Algerie Poste'),
  ('Société Générale Algérie'),
  ('BNP Paribas El Djazaïr'),
  ('Banque Salam'),
  ('Banque Es Salam'),
  ('Al Baraka Bank')
ON CONFLICT (nom) DO NOTHING;

-- -------------------------------------------------------------
-- Services
-- -------------------------------------------------------------
INSERT INTO services (nom, description) VALUES
  ('retrait',   'Retrait d''espèces'),
  ('depot',     'Dépôt d''espèces'),
  ('virement',  'Virement bancaire'),
  ('solde',     'Consultation de solde'),
  ('pmr',       'Accès PMR (personnes à mobilité réduite)')
ON CONFLICT (nom) DO NOTHING;

-- -------------------------------------------------------------
-- Comptes de test (admin + utilisateur)
--
-- Ce fichier ne crée AUCUN identifiant : un mot de passe en dur ici,
-- commité dans un dépôt Git, finit tôt ou tard par fuiter (c'est
-- exactement ce qui est arrivé — cf. audit de sécurité du 2026-09-25 :
-- le mot de passe admin par défaut est resté en clair sur GitHub public
-- pendant des mois et n'avait jamais été changé en prod).
--
-- Pour créer un compte admin de test après un nouveau setup :
--   node scripts/create-admin.js <email>
-- Le script génère un mot de passe aléatoire, l'affiche UNE SEULE FOIS
-- dans le terminal, et ne l'écrit jamais dans un fichier.
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- DAB de test (Alger centre)
-- -------------------------------------------------------------
INSERT INTO dabs (nom, adresse, latitude, longitude, statut, banque_id) VALUES
  (
    'DAB CPA — Place Audin',
    'Place du 1er Mai, Alger Centre',
    36.7372, 3.0865,
    'actif',
    (SELECT id FROM banques WHERE nom = 'CPA')
  ),
  (
    'DAB BNA — Didouche Mourad',
    'Rue Didouche Mourad, Alger',
    36.7420, 3.0590,
    'actif',
    (SELECT id FROM banques WHERE nom = 'BNA')
  ),
  (
    'DAB BEA — Bab Ezzouar',
    'Avenue de l''Université, Bab Ezzouar',
    36.7195, 3.1834,
    'maintenance',
    (SELECT id FROM banques WHERE nom = 'BEA')
  ),
  (
    'DAB CNEP — Hussein Dey',
    'Rue des Frères Bouadou, Hussein Dey',
    36.7310, 3.1200,
    'hors_service',
    (SELECT id FROM banques WHERE nom = 'CNEP')
  )
ON CONFLICT (osm_id) DO NOTHING;

-- -------------------------------------------------------------
-- Association DAB ↔ Services
-- -------------------------------------------------------------
INSERT INTO dab_services (dab_id, service_id)
SELECT d.id, s.id
FROM dabs d, services s
WHERE d.nom = 'DAB CPA — Place Audin'
  AND s.nom IN ('retrait', 'solde')
ON CONFLICT DO NOTHING;

INSERT INTO dab_services (dab_id, service_id)
SELECT d.id, s.id
FROM dabs d, services s
WHERE d.nom = 'DAB BNA — Didouche Mourad'
  AND s.nom IN ('retrait', 'depot', 'solde', 'pmr')
ON CONFLICT DO NOTHING;

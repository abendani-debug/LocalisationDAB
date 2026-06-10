-- 003_add_french_banks.sql
-- Ajout des banques françaises disposant de distributeurs publics.
-- BNP Paribas et Société Générale existent déjà sous leur nom algérien
-- (BNP Paribas El Djazaïr / Société Générale Algérie).
-- On crée ici leurs entités françaises + les banques exclusivement françaises.

INSERT INTO banques (nom, logo_url) VALUES
  ('BNP Paribas',           'https://upload.wikimedia.org/wikipedia/commons/8/85/BNP_Paribas_logo.svg'),
  ('Société Générale',      'https://upload.wikimedia.org/wikipedia/commons/c/cd/Logo-SG-Soci%C3%A9t%C3%A9-G%C3%A9n%C3%A9rale.svg'),
  ('Crédit Agricole',       'https://upload.wikimedia.org/wikipedia/commons/1/1d/Logo_Cr%C3%A9dit_Agricole.svg'),
  ('LCL',                   'https://upload.wikimedia.org/wikipedia/commons/a/a8/LCL_logo_2019.svg'),
  ('La Banque Postale',     'https://upload.wikimedia.org/wikipedia/commons/5/54/La_Banque_Postale.svg'),
  ('CIC',                   'https://upload.wikimedia.org/wikipedia/commons/5/5e/CIC_logo_2021.svg'),
  ('Crédit Mutuel',         'https://upload.wikimedia.org/wikipedia/commons/2/26/Cr%C3%A9dit_Mutuel_logo.svg'),
  ('Banque Populaire',      'https://upload.wikimedia.org/wikipedia/commons/8/82/Banques-populaires-logo.svg'),
  ('Caisse d''Épargne',     'https://upload.wikimedia.org/wikipedia/commons/8/8d/Caisse_d%27%C3%A9pargne_logo.svg'),
  ('HSBC France',           'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg'),
  ('Bred Banque Populaire', NULL)
ON CONFLICT (nom) DO NOTHING;

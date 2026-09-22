-- 008_detach_foreign_algerie_poste.sql
-- Fix de données : des bureaux de poste européens (Post Office UK/Irlande,
-- Poste Italiane, etc.) importés via OSM avaient été rattachés à la banque
-- "Algerie Poste" par un matching de nom trop large ("post"/"poste"),
-- alors qu'ils sont tagués country_code = 'FR' (déjà incorrect en soi —
-- ce ne sont même pas des DAB français) et n'ont rien à voir avec cette
-- banque algérienne.
--
-- On les détache (banque_id = NULL) plutôt que de les supprimer, pour
-- rester cohérent avec l'état de la base locale où ces mêmes
-- enregistrements (mêmes id) n'ont jamais été rattachés à aucune banque.
--
-- Join sur le nom plutôt que sur un id codé en dur : banque_id pour
-- "Algerie Poste" diffère entre environnements (8 en prod, 10 en local).
-- Idempotent : ne matche plus rien une fois appliqué.

UPDATE dabs d
SET banque_id = NULL
FROM banques b
WHERE d.banque_id = b.id
  AND b.nom = 'Algerie Poste'
  AND d.country_code = 'FR';

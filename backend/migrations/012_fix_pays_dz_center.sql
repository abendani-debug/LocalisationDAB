-- 012_fix_pays_dz_center.sql
-- Le center_lat/center_lng de l'Algérie (28.0339, 1.6596) était le centroïde
-- géométrique du pays — un point en plein Sahara, près de la frontière
-- malienne. Comme la quasi-totalité des DAB/population se concentre sur la
-- bande côtière nord, sélectionner "Algérie" dans le menu pays envoyait la
-- carte sur une zone vide (0 DAB visible), donnant l'impression que l'app
-- ne fonctionne pas pour ce pays. Remplacé par Alger (36.7372, 3.0865),
-- cohérent avec DEFAULT_LAT/DEFAULT_LNG déjà utilisés ailleurs dans le
-- projet pour ce même pays.
-- Idempotent : ne fait rien si déjà corrigé.

UPDATE pays
SET center_lat = 36.7372,
    center_lng = 3.0865
WHERE code_iso = 'DZ'
  AND center_lat = 28.0339
  AND center_lng = 1.6596;

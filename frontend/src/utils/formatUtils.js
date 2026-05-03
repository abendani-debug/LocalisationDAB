export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('fr-DZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
};

export const formatDistance = (km) => {
  if (km == null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

export const statutLabel = (statut) => ({
  actif:        'Actif',
  hors_service: 'Hors service',
  maintenance:  'Maintenance',
}[statut] || statut);

export const etatLabel = (etat) => ({
  disponible: 'Argent disponible',
  vide:       'DAB vide',
  en_panne:   'En panne',
}[etat] || '—');

export const etatColor = (dab) => {
  // État confirmé (2+ votes) — priorité maximale
  if (dab.etat_communautaire === 'en_panne')  return 'red';
  if (dab.etat_communautaire === 'vide')       return 'orange';
  if (dab.etat_communautaire === 'disponible') return 'green';
  // Statut admin
  if (dab.statut === 'hors_service')           return 'red';
  if (dab.statut === 'maintenance')            return 'orange';
  // Vote dominant (1 vote — non confirmé mais visible)
  if (dab.vote_dominant === 'en_panne')        return 'red';
  if (dab.vote_dominant === 'vide')            return 'orange';
  if (dab.vote_dominant === 'disponible')      return 'green';
  return 'neutral';
};

export const starRating = (note) => '★'.repeat(note) + '☆'.repeat(5 - note);

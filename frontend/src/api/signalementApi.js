import { v4 as uuidv4 } from 'uuid';
import api from './axiosConfig';

const VOTE_DURATION_MS = 4 * 60 * 60 * 1000; // 4h

const getCookieId = () => {
  let id = localStorage.getItem('dab_cookie_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('dab_cookie_id', id);
  }
  return id;
};

export const getLocalVote = (dabId) => {
  try {
    const raw = localStorage.getItem(`dab_vote_${dabId}`);
    if (!raw) return null;
    const vote = JSON.parse(raw);
    if (new Date(vote.expires_at) <= new Date()) {
      localStorage.removeItem(`dab_vote_${dabId}`);
      return null;
    }
    return vote; // { etat, nb_updates, expires_at }
  } catch {
    return null;
  }
};

const saveLocalVote = (dabId, etat, nb_updates) => {
  const expires_at = new Date(Date.now() + VOTE_DURATION_MS).toISOString();
  localStorage.setItem(`dab_vote_${dabId}`, JSON.stringify({ etat, nb_updates, expires_at }));
};

export const getSignalements = (dabId) =>
  api.get(`/dabs/${dabId}/signalements`).then((r) => r.data);

export const submitSignalement = async (dabId, etat, userLat, userLng) => {
  const res = await api.post(`/dabs/${dabId}/signalements`, {
    etat, cookieId: getCookieId(), userLat, userLng,
  });
  const modified = res.data?.data?.modified ?? false;
  saveLocalVote(dabId, etat, modified ? 1 : 0);
  return res.data;
};

export const resoudreSignalements = (dabId) =>
  api.post(`/dabs/${dabId}/signalements/resoudre`).then((r) => r.data);

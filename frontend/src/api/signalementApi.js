import { v4 as uuidv4 } from 'uuid';
import api from './axiosConfig';

const getCookieId = () => {
  let id = localStorage.getItem('dab_cookie_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('dab_cookie_id', id);
  }
  return id;
};

export const getSignalements = (dabId) =>
  api.get(`/dabs/${dabId}/signalements`).then((r) => r.data);

export const submitSignalement = (dabId, etat, userLat, userLng) =>
  api
    .post(`/dabs/${dabId}/signalements`, { etat, cookieId: getCookieId(), userLat, userLng })
    .then((r) => r.data);

export const resoudreSignalements = (dabId) =>
  api.post(`/dabs/${dabId}/signalements/resoudre`).then((r) => r.data);

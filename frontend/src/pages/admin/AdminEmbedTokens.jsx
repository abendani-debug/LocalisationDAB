import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function AdminEmbedTokens() {
  const [tokens, setTokens]     = useState([]);
  const [banques, setBanques]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ banque_id: '', label: '', allowed_domains: '' });
  const [creating, setCreating] = useState(false);

  const fetchTokens = () =>
    api.get('/embed/admin/tokens').then((r) => setTokens(r.data.data));

  useEffect(() => {
    Promise.all([
      fetchTokens(),
      api.get('/banques').then((r) => setBanques(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.banque_id || !form.label) return toast.error('Banque et label requis.');
    setCreating(true);
    try {
      const domains = form.allowed_domains
        ? form.allowed_domains.split(',').map((d) => d.trim()).filter(Boolean)
        : null;
      await api.post('/embed/admin/tokens', {
        banque_id: parseInt(form.banque_id),
        label: form.label,
        allowed_domains: domains,
      });
      toast.success('Token créé.');
      setForm({ banque_id: '', label: '', allowed_domains: '' });
      await fetchTokens();
    } catch {
      toast.error('Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await api.patch(`/embed/admin/tokens/${id}`, { is_active: !currentActive });
      await fetchTokens();
    } catch {
      toast.error('Erreur.');
    }
  };

  const handleExtend = async (id) => {
    try {
      await api.post(`/embed/admin/tokens/${id}/extend`, { days: 30 });
      toast.success('Essai prolongé de 30 jours.');
      await fetchTokens();
    } catch {
      toast.error('Erreur.');
    }
  };

  const copySnippet = (token) => {
    const snippet = `<iframe src="${BASE_URL}/embed/${token}" width="100%" height="500" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;
    navigator.clipboard.writeText(snippet);
    toast.success('Snippet copié !');
  };

  if (loading) return <div className="py-16 flex justify-center"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Formulaire création */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Nouveau token</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Banque *</label>
            <select
              value={form.banque_id}
              onChange={(e) => setForm({ ...form, banque_id: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-[180px]"
            >
              <option value="">Sélectionner…</option>
              {banques.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Label *</label>
            <input
              type="text"
              placeholder="ex: CPA - Site principal"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-[220px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Domaines autorisés (optionnel, virgule)</label>
            <input
              type="text"
              placeholder="ex: cpa.dz, www.cpa.dz"
              value={form.allowed_domains}
              onChange={(e) => setForm({ ...form, allowed_domains: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-[260px]"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            {creating ? '…' : 'Créer token'}
          </button>
        </form>
      </div>

      {/* Liste tokens */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        {tokens.length === 0 && (
          <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucun token créé.</p>
        )}
        {tokens.map((t, i) => {
          const expired = new Date(t.trial_ends_at) < new Date();
          return (
            <div
              key={t.id}
              className={`px-5 py-4 ${i < tokens.length - 1 ? 'border-b border-slate-100' : ''} ${!t.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.banque_nom}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{t.token}</p>
                  {t.allowed_domains?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">Domaines : {t.allowed_domains.join(', ')}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    !t.is_active ? 'bg-slate-100 text-slate-500' :
                    expired ? 'bg-red-100 text-red-600' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {!t.is_active ? 'Désactivé' : expired ? 'Expiré' : 'Actif'}
                  </span>
                  <p className="text-xs text-slate-400">
                    Essai jusqu'au {new Date(t.trial_ends_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => copySnippet(t.token)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                >
                  📋 Copier snippet
                </button>
                <button
                  onClick={() => handleToggle(t.id, t.is_active)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium cursor-pointer"
                >
                  {t.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => handleExtend(t.id)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium cursor-pointer"
                >
                  +30 jours
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

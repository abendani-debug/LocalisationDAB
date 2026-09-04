// frontend/src/pages/admin/AdminPays.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const isoToFlag = (code) =>
  [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');

export default function AdminPays() {
  const [pays, setPays]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [importing, setImporting] = useState(null);

  const fetchPays = () => {
    setLoading(true);
    api.get('/admin/pays')
      .then(r => setPays(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPays(); }, []);

  const handleToggle = async (code_iso) => {
    try {
      await api.patch(`/admin/pays/${code_iso}/toggle`);
      toast.success(`Statut ${code_iso} mis à jour`);
      fetchPays();
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleImport = async (code_iso) => {
    if (!window.confirm(`Lancer l'import Google Places pour ${code_iso} ?\nCela peut prendre 15-30 min.`)) return;
    setImporting(code_iso);
    try {
      const r = await api.post(`/admin/pays/${code_iso}/import`);
      const d = r.data.data;
      toast.success(`Import ${code_iso} terminé — ${d.inserted ?? 0} insérés`);
      fetchPays();
    } catch (e) {
      toast.error(`Erreur import : ${e.response?.data?.message || e.message}`);
    } finally {
      setImporting(null);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Spinner /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-900 m-0">Gestion des pays</h1>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Pays</th>
              <th className="px-4 py-3">DABs</th>
              <th className="px-4 py-3">Dernier import</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pays.map((p, i) => (
              <tr key={p.code_iso} className={i < pays.length - 1 ? 'border-b border-slate-100' : ''}>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-800">
                    {isoToFlag(p.code_iso)} {p.nom}
                  </span>
                  <span className="ml-2 text-slate-400 text-xs">{p.code_iso}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{(p.nb_dabs || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-500 text-sm">
                  {p.dernier_import
                    ? new Date(p.dernier_import).toLocaleDateString('fr-FR')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.is_active ? '✅ Actif' : '⏸ Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(p.code_iso)}
                      className="px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {p.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleImport(p.code_iso)}
                      disabled={importing === p.code_iso}
                      className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white transition-colors cursor-pointer"
                    >
                      {importing === p.code_iso ? 'Import…' : 'Importer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

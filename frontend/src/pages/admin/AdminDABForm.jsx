import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDAB, createDAB, updateDAB } from '../../api/dabApi';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

export default function AdminDABForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [banques, setBanques] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    nom: '', adresse: '', latitude: '', longitude: '', statut: 'actif', banque_id: '',
  });

  const FIELDS = [
    ['nom',       t('admin.field_name'),    'text'],
    ['adresse',   t('admin.field_address'), 'text'],
    ['latitude',  t('admin.field_lat'),     'number'],
    ['longitude', t('admin.field_lng'),     'number'],
  ];

  useEffect(() => {
    api.get('/banques').then((r) => setBanques(r.data.data || [])).catch(() => {});
    if (isEdit) {
      getDAB(id)
        .then((r) => {
          const d = r.data;
          setForm({ nom: d.nom || '', adresse: d.adresse || '', latitude: d.latitude || '', longitude: d.longitude || '', statut: d.statut || 'actif', banque_id: d.banque_id || '' });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await updateDAB(id, form); toast.success(t('admin.updated')); }
      else        { await createDAB(form);      toast.success(t('admin.created')); }
      navigate('/admin/dabs');
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Spinner /></div>;

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors';
  const labelClass = 'block mb-1 text-sm font-medium text-gray-700';

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {FIELDS.map(([key, label, type]) => (
          <div key={key}>
            <label className={labelClass}>{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              required={label.includes('*')}
              step="any"
              className={inputClass}
            />
          </div>
        ))}

        <div>
          <label className={labelClass}>{t('admin.field_status')}</label>
          <select value={form.statut} onChange={(e) => handleChange('statut', e.target.value)} className={inputClass}>
            <option value="actif">{t('filters.active')}</option>
            <option value="hors_service">{t('filters.out_of_service')}</option>
            <option value="maintenance">{t('filters.maintenance')}</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('admin.field_bank')}</label>
          <select value={form.banque_id} onChange={(e) => handleChange('banque_id', e.target.value)} className={inputClass}>
            <option value="">{t('admin.none')}</option>
            {banques.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/dabs')}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            {t('admin.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? t('admin.saving') : t('admin.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

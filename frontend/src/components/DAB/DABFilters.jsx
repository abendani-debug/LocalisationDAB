import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';

const RAYONS = [
  { value: 1,  label: '1 km' },
  { value: 2,  label: '2 km' },
  { value: 5,  label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
];

function ChipRow({ label, items, activeValue, onSelect, getKey, getLabel }) {
  return (
    <div className="px-4 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {items.map((item) => {
          const key   = getKey(item);
          const text  = getLabel(item);
          const active = String(activeValue) === String(key);
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-all cursor-pointer
                ${active
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DABFilters({ onFiltersChange, countryCode = null }) {
  const { t } = useTranslation();
  const [banques, setBanques] = useState([]);
  const [filters, setFilters] = useState({ banque_id: '', statut: '', radius: 2 });

  const STATUTS = [
    { value: '',              label: t('filters.all') },
    { value: 'actif',         label: t('filters.active') },
    { value: 'hors_service',  label: t('filters.out_of_service') },
    { value: 'maintenance',   label: t('filters.maintenance') },
  ];

  useEffect(() => {
    const params = countryCode ? `?country_code=${countryCode}` : '';
    api.get(`/banques${params}`).then((r) => setBanques(r.data.data || [])).catch(() => {});
    // Reset bank filter when country changes (banque_id might not exist in new country)
    setFilters(prev => {
      if (!prev.banque_id) return prev;
      const next = { ...prev, banque_id: '' };
      onFiltersChange(next);
      return next;
    });
  }, [countryCode]);

  const handleChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  const banqueItems = [{ id: '', nom: t('filters.all_banks') }, ...banques];

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      <ChipRow
        label={t('filters.bank')}
        items={banqueItems}
        activeValue={filters.banque_id}
        onSelect={(v) => handleChange('banque_id', v)}
        getKey={(b) => b.id}
        getLabel={(b) => b.nom}
      />
      <ChipRow
        label={t('filters.status')}
        items={STATUTS}
        activeValue={filters.statut}
        onSelect={(v) => handleChange('statut', v)}
        getKey={(s) => s.value}
        getLabel={(s) => s.label}
      />
      <ChipRow
        label={t('filters.radius')}
        items={RAYONS}
        activeValue={filters.radius}
        onSelect={(v) => handleChange('radius', Number(v))}
        getKey={(r) => r.value}
        getLabel={(r) => r.label}
      />
    </div>
  );
}

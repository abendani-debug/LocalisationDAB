// frontend/src/components/Stats/TopDabProblematiques.jsx
// Utilisé par AdminStatsBanques.jsx (admin MapsDab) et EmbedStatsPage.jsx
// (banque partenaire, via son token embed) — même rendu, mêmes données
// (StatsService.getStatsBanque alimente les deux).

const COLORS = { disponible: '#16a34a', vide: '#f59e0b', en_panne: '#dc2626' };

export default function TopDabProblematiques({ title, items = [] }) {
  return (
    <>
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun signalement négatif sur cette période.</p>
      ) : (
        <div className="border border-[#e5eeec] rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#f7faf9] border-b border-[#e5eeec]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Distributeur</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Dispo</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Vide</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">En panne</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d, i) => (
                <tr
                  key={d.id}
                  className={i < items.length - 1 ? 'border-b border-[#e5eeec]' : ''}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{d.nom}</p>
                    <p className="text-xs text-slate-500">{d.adresse}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: COLORS.disponible }}>
                    {d.total_disponible}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: COLORS.vide }}>
                    {d.total_vide}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: COLORS.en_panne }}>
                    {d.total_en_panne}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

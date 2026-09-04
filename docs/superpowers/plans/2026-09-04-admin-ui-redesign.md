# Refonte UI/UX Admin (Pilote) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le shell Navbar public partagé par un vrai layout admin (sidebar + header) sur toutes les routes `/admin/*`, et redessiner le contenu visuel de `AdminDashboard` et `AdminStatsBanques` avec la palette de marque MapsDab (teal/corail).

**Architecture:** Deux nouveaux composants (`AdminSidebar`, `AdminHeader`) composés dans un troisième (`AdminLayout`) qui enveloppe chaque route `/admin/*` dans `App.jsx`, à la place du `Navbar` public. Les 6 pages admin hors pilote héritent du nouveau shell sans modification de leur propre code. `AdminDashboard` et `AdminStatsBanques` sont réhabillés visuellement (couleurs, suppression des éléments de navigation désormais redondants avec la sidebar) sans changement de logique.

**Tech Stack:** React 18, React Router v6, Tailwind CSS (classes utilitaires + valeurs arbitraires `bg-[#...]` pour la palette de marque)

**Full spec:** `docs/superpowers/specs/2026-09-04-admin-ui-redesign-design.md`

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `frontend/src/components/admin/AdminSidebar.jsx` | Créer | Navigation latérale (7 liens + badge propositions) |
| `frontend/src/components/admin/AdminHeader.jsx` | Créer | Titre de page + switch langue + menu utilisateur |
| `frontend/src/components/admin/AdminLayout.jsx` | Créer | Compose sidebar + header + zone de contenu, gère le tiroir mobile |
| `frontend/src/App.jsx` | Modifier | Toutes les routes `/admin/*` enveloppées dans `AdminLayout`, `Navbar`/footer public masqués sur ces routes |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Modifier | Cartes KPI, suppression des boutons de navigation (remplacés par la sidebar) |
| `frontend/src/pages/admin/AdminStatsBanques.jsx` | Modifier | Recoloration (teal/corail), suppression du titre/lien retour redondants |

---

## Task 1 — `AdminSidebar.jsx`

**Files:**
- Create: `frontend/src/components/admin/AdminSidebar.jsx`

- [ ] **Créer le composant**

```jsx
// frontend/src/components/admin/AdminSidebar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import useAuth from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin',               label: 'Dashboard',     icon: '🏠' },
  { to: '/admin/dabs',          label: 'Distributeurs', icon: '🏧' },
  { to: '/admin/signalements',  label: 'Signalements',  icon: '🚩' },
  { to: '/admin/propositions',  label: 'Propositions',  icon: '➕', showBadge: true },
  { to: '/admin/pays',          label: 'Pays',           icon: '🌍' },
  { to: '/admin/embed',         label: 'Widgets Embed', icon: '🔗' },
  { to: '/admin/stats-banques', label: 'Stats Banques', icon: '📊' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [nbPropositions, setNbPropositions] = useState(0);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setNbPropositions(r.data.data?.propositions?.total || 0))
      .catch(() => {});
  }, []);

  const isActive = (to) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  return (
    <aside className="w-[210px] min-h-screen bg-[#0b3b36] text-white flex flex-col py-[18px] flex-shrink-0">
      <Link to="/" className="flex items-center gap-2 px-[18px] pb-5 no-underline text-white">
        <div className="w-[26px] h-[26px] rounded-[7px] bg-[#e35d43] flex items-center justify-center text-[13px]">📍</div>
        <span className="font-bold text-sm tracking-[.2px]">Map's Dab</span>
      </Link>

      <nav className="px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2.5 rounded-lg text-sm flex items-center justify-between no-underline ${
                active ? 'bg-teal-500 text-white font-semibold' : 'text-[#a9d4ce] hover:bg-white/5'
              }`}
            >
              <span>{item.icon} {item.label}</span>
              {item.showBadge && nbPropositions > 0 && (
                <span className="bg-[#e35d43] text-white text-[10px] font-bold rounded-full px-[7px] py-px leading-normal">
                  {nbPropositions}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-[18px] pt-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-teal-500 text-[11px] flex items-center justify-center font-bold flex-shrink-0">
          {user?.nom ? user.nom.charAt(0).toUpperCase() : '?'}
        </div>
        <span className="text-xs text-[#a9d4ce] truncate">{user?.nom || 'Admin'}</span>
      </div>
    </aside>
  );
}
```

- [ ] **Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd frontend && npx esbuild src/components/admin/AdminSidebar.jsx --bundle --format=esm --jsx=automatic --external:react --external:react-dom --external:react-router-dom --external:../../api/axiosConfig --external:../../hooks/useAuth --outfile=/dev/null
```

Résultat attendu : pas d'erreur, juste la taille du bundle affichée.

- [ ] **Commit**

```bash
git add frontend/src/components/admin/AdminSidebar.jsx
git commit -m "feat(frontend): composant AdminSidebar — navigation admin par sidebar"
```

---

## Task 2 — `AdminHeader.jsx`

**Files:**
- Create: `frontend/src/components/admin/AdminHeader.jsx`

- [ ] **Créer le composant**

Réutilise la logique de switch langue et de déconnexion déjà présente dans
`frontend/src/components/UI/Navbar.jsx` (mêmes clés i18n `nav.logout_success`,
`nav.logout` — déjà définies dans `frontend/src/i18n/locales/fr.json` et `en.json`,
aucune nouvelle clé à ajouter).

```jsx
// frontend/src/components/admin/AdminHeader.jsx
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import i18n from '../../i18n';

export default function AdminHeader({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
    toast.success(t('nav.logout_success'));
  };

  const handleLangSwitch = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className="h-16 bg-white border-b border-[#e5eeec] flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 cursor-pointer border-none bg-transparent"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
          <span className="block w-5 h-0.5 bg-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-[#0b3b36] m-0">{title}</h1>
      </div>

      <div className="flex items-center gap-2 relative" ref={menuRef}>
        <button
          onClick={handleLangSwitch}
          className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
        >
          {i18n.language === 'fr' ? 'FR' : 'EN'}
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer border-none bg-transparent"
        >
          <div className="w-7 h-7 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
            {user?.nom ? user.nom.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-sm text-slate-700">{user?.nom}</span>
        </button>

        {menuOpen && (
          <div className="absolute top-12 right-0 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-slate-50 cursor-pointer border-none bg-transparent"
            >
              {t('nav.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Vérifier la clé i18n `nav.logout_success` et `nav.logout` existent bien**

```bash
cd frontend && grep -c "logout" src/i18n/locales/fr.json
```

Résultat attendu : au moins `2` (les deux clés déjà utilisées par `Navbar.jsx`, donc déjà présentes — si `0`, arrêter et signaler, ne pas deviner les clés).

- [ ] **Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd frontend && npx esbuild src/components/admin/AdminHeader.jsx --bundle --format=esm --jsx=automatic --external:react --external:react-dom --external:react-router-dom --external:react-i18next --external:react-hot-toast --external:../../hooks/useAuth --external:../../i18n --outfile=/dev/null
```

Résultat attendu : pas d'erreur.

- [ ] **Commit**

```bash
git add frontend/src/components/admin/AdminHeader.jsx
git commit -m "feat(frontend): composant AdminHeader — titre de page, langue, déconnexion"
```

---

## Task 3 — `AdminLayout.jsx`

**Files:**
- Create: `frontend/src/components/admin/AdminLayout.jsx`

- [ ] **Créer le composant**

```jsx
// frontend/src/components/admin/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f7faf9]">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Sidebar mobile — tiroir */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd frontend && npx esbuild src/components/admin/AdminLayout.jsx --bundle --format=esm --jsx=automatic --external:react --external:./AdminSidebar --external:./AdminHeader --outfile=/dev/null
```

Résultat attendu : pas d'erreur.

- [ ] **Commit**

```bash
git add frontend/src/components/admin/AdminLayout.jsx
git commit -m "feat(frontend): composant AdminLayout — compose sidebar + header + tiroir mobile"
```

---

## Task 4 — Intégrer `AdminLayout` dans `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1 : Ajouter l'import**

Ajouter après `import Navbar from './components/UI/Navbar';` :

```js
import AdminLayout from './components/admin/AdminLayout';
```

- [ ] **Step 2 : Masquer le `Navbar` et le footer public sur les routes admin**

Dans `AppRoutes()`, remplacer :

```jsx
function AppRoutes() {
  const location = useLocation();
  const { t, i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    document.title = t('page_title');
  }, [t, i18nInstance.language]);
  const noFooterPaths = ['/', '/dab'];
  const showFooter = !noFooterPaths.some((p) => location.pathname === p || location.pathname.startsWith('/dab/'));

  return (
    <>
      <Navbar />
      <Routes>
```

Par :

```jsx
function AppRoutes() {
  const location = useLocation();
  const { t, i18n: i18nInstance } = useTranslation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    document.title = t('page_title');
  }, [t, i18nInstance.language]);
  const noFooterPaths = ['/', '/dab'];
  const showFooter = !isAdminRoute && !noFooterPaths.some((p) => location.pathname === p || location.pathname.startsWith('/dab/'));

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
```

- [ ] **Step 3 : Envelopper chaque route `/admin/*` dans `AdminLayout`**

Remplacer le bloc des routes admin :

```jsx
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dabs" element={<AdminRoute><AdminDABList /></AdminRoute>} />
        <Route path="/admin/dabs/new" element={<AdminRoute><AdminDABForm /></AdminRoute>} />
        <Route path="/admin/dabs/:id/edit" element={<AdminRoute><AdminDABForm /></AdminRoute>} />
        <Route path="/admin/signalements"  element={<AdminRoute><AdminSignalements /></AdminRoute>} />
        <Route path="/admin/propositions"  element={<AdminRoute><AdminPropositions /></AdminRoute>} />
        <Route path="/admin/pays"          element={<AdminRoute><AdminPays /></AdminRoute>} />
        <Route path="/admin/embed"         element={<AdminRoute><AdminEmbedTokens /></AdminRoute>} />
        <Route
          path="/admin/stats-banques"
          element={
            <AdminRoute>
              <Suspense fallback={null}>
                <AdminStatsBanques />
              </Suspense>
            </AdminRoute>
          }
        />
```

Par :

```jsx
        <Route path="/admin" element={<AdminRoute><AdminLayout title="Dashboard"><AdminDashboard /></AdminLayout></AdminRoute>} />
        <Route path="/admin/dabs" element={<AdminRoute><AdminLayout title="Distributeurs"><AdminDABList /></AdminLayout></AdminRoute>} />
        <Route path="/admin/dabs/new" element={<AdminRoute><AdminLayout title="Nouveau distributeur"><AdminDABForm /></AdminLayout></AdminRoute>} />
        <Route path="/admin/dabs/:id/edit" element={<AdminRoute><AdminLayout title="Modifier le distributeur"><AdminDABForm /></AdminLayout></AdminRoute>} />
        <Route path="/admin/signalements"  element={<AdminRoute><AdminLayout title="Signalements"><AdminSignalements /></AdminLayout></AdminRoute>} />
        <Route path="/admin/propositions"  element={<AdminRoute><AdminLayout title="Propositions"><AdminPropositions /></AdminLayout></AdminRoute>} />
        <Route path="/admin/pays"          element={<AdminRoute><AdminLayout title="Pays"><AdminPays /></AdminLayout></AdminRoute>} />
        <Route path="/admin/embed"         element={<AdminRoute><AdminLayout title="Widgets Embed"><AdminEmbedTokens /></AdminLayout></AdminRoute>} />
        <Route
          path="/admin/stats-banques"
          element={
            <AdminRoute>
              <AdminLayout title="Stats de signalement par banque">
                <Suspense fallback={null}>
                  <AdminStatsBanques />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
```

- [ ] **Step 4 : Vérifier que l'app compile**

```bash
cd frontend && npm run build 2>&1 | tail -10
```

Résultat attendu : `✓ built in ...`, toujours 2 chunks lazy séparés (`AdminStatsBanques-*.js`, `EmbedStatsPage-*.js`, `LineChart-*.js`) en plus du bundle principal — la structure de lazy-loading du Task 10 du plan précédent ne doit pas régresser.

- [ ] **Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(frontend): App.jsx — AdminLayout sur toutes les routes /admin/*"
```

---

## Task 5 — Redessiner `AdminDashboard.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`

- [ ] **Remplacer le contenu du fichier**

Le titre de page vient désormais de `AdminHeader` (passé via la prop `title` sur
`AdminLayout` dans `App.jsx`), donc le `<h1>` disparaît. Les boutons de navigation
(Distributeurs, Signalements, Propositions, Pays, Widgets Embed, Stats banques)
disparaissent aussi — ils sont remplacés par les liens de la sidebar. Seul le bouton
d'action réel (Import Google Places, qui déclenche une action et non une navigation)
reste dans le contenu de la page.

```jsx
// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleImportGoogle = async () => {
    setImporting(true);
    try {
      const res = await api.post('/admin/import-google');
      const d = res.data.data;
      toast.success(t('admin.import_success', { inserted: d.inserted, updated: d.updated }));
    } catch {
      toast.error(t('admin.import_error'));
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Spinner /></div>;

  const totalDABs      = stats?.dabs?.reduce((s, r) => s + r.total, 0) || 0;
  const nbPropositions = stats?.propositions?.total || 0;

  return (
    <div>
      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label={t('admin.total_dabs')}        value={totalDABs} />
        <KPICard label={t('admin.users')}              value={stats?.users?.total || 0} />
        <KPICard label={t('admin.active_reports')}     value={stats?.signalements?.total || 0} />
        <KPICard label={t('admin.pending_proposals')}  value={nbPropositions} highlight={nbPropositions > 0} />
      </div>

      {/* Action */}
      <div className="mb-6">
        <button
          onClick={handleImportGoogle}
          disabled={importing}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          {importing ? t('admin.importing') : t('admin.import_google')}
        </button>
      </div>

      {/* Répartition statuts */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{t('admin.status_distribution')}</h2>
        <div className="bg-white border border-[#e5eeec] rounded-xl overflow-hidden">
          {stats?.dabs?.map((row, i) => (
            <div
              key={row.statut}
              className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < stats.dabs.length - 1 ? 'border-b border-[#e5eeec]' : ''}`}
            >
              <span className="text-gray-700 capitalize">{row.statut}</span>
              <strong className="text-[#0b3b36]">{row.total}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, highlight = false }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${highlight ? 'border-[#e35d43]' : 'border-[#e5eeec]'}`}>
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`m-0 mt-1.5 text-2xl font-extrabold ${highlight ? 'text-[#e35d43]' : 'text-[#0b3b36]'}`}>{value}</p>
    </div>
  );
}
```

- [ ] **Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd frontend && npx esbuild src/pages/admin/AdminDashboard.jsx --bundle --format=esm --jsx=automatic --external:react --external:react-i18next --external:../../api/axiosConfig --external:../../components/UI/Spinner --external:react-hot-toast --outfile=/dev/null
```

Résultat attendu : pas d'erreur.

- [ ] **Commit**

```bash
git add frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat(frontend): AdminDashboard — cartes KPI, navigation déplacée vers la sidebar"
```

---

## Task 6 — Recolorer `AdminStatsBanques.jsx`

**Files:**
- Modify: `frontend/src/pages/admin/AdminStatsBanques.jsx`

Aucun changement de logique (fetch, état, effets, dropdown, drill-down) — uniquement
les classes visuelles. Le titre "Stats de signalement par banque" et le lien
"← Retour au dashboard" disparaissent (redondants avec `AdminHeader` et la sidebar).
Les couleurs sémantiques d'état (`ETAT_COLORS` : vert/rouge/orange pour
disponible/vide/en_panne) restent inchangées — elles indiquent un statut, pas la
marque. Seules les couleurs de marque (bordures, fonds, éléments interactifs) passent
au bleu → teal / slate → palette `#e5eeec`/`#f7faf9`.

- [ ] **Remplacer le contenu du fichier**

```jsx
// frontend/src/pages/admin/AdminStatsBanques.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PERIODS = [
  { value: '7',   label: '7 jours' },
  { value: '30',  label: '30 jours' },
  { value: '90',  label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

const ETAT_COLORS = { disponible: '#16a34a', vide: '#dc2626', en_panne: '#f59e0b' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne' };

function pivotEvolution(rows) {
  const byJour = {};
  rows.forEach(({ jour, etat, total }) => {
    const key = jour.slice(0, 10);
    if (!byJour[key]) byJour[key] = { jour: key, disponible: 0, vide: 0, en_panne: 0 };
    byJour[key][etat] = total;
  });
  return Object.values(byJour).sort((a, b) => a.jour.localeCompare(b.jour));
}

export default function AdminStatsBanques() {
  const [period, setPeriod]               = useState('30');
  const [banques, setBanques]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchBanques = useCallback(() => {
    setLoading(true);
    api.get('/admin/stats/banques', { params: { period } })
      .then((r) => setBanques(r.data.data.banques))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { fetchBanques(); }, [fetchBanques]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let ignore = false;
    setDetail(null);
    setDetailLoading(true);
    api.get(`/admin/stats/banques/${selectedId}`, { params: { period } })
      .then((r) => { if (!ignore) setDetail(r.data.data); })
      .catch(() => { if (!ignore) setDetail(null); })
      .finally(() => { if (!ignore) setDetailLoading(false); });
    return () => { ignore = true; };
  }, [selectedId, period]);

  const evolutionData = detail ? pivotEvolution(detail.evolution) : [];

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
              period === p.value ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : banques.length === 0 ? (
        <div className="bg-white border border-[#e5eeec] rounded-xl mb-8">
          <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucune banque sur cette période.</p>
        </div>
      ) : (
        <div className="mb-8">
          <label htmlFor="banque-select" className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Banque
          </label>
          <select
            id="banque-select"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer"
          >
            <option value="">— Choisir une banque —</option>
            {[...banques]
              .sort((a, b) => a.banque_nom.localeCompare(b.banque_nom))
              .map((b) => (
                <option key={b.banque_id} value={b.banque_id}>
                  {b.banque_nom} — {b.total_signalements} signalement{b.total_signalements > 1 ? 's' : ''}
                  {b.taux_disponibilite !== null ? ` (${b.taux_disponibilite}%)` : ''}
                </option>
              ))}
          </select>
        </div>
      )}

      {selectedId && (
        <div className="bg-white border border-[#e5eeec] rounded-xl p-5">
          {detailLoading || !detail ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#0b3b36] mb-4">{detail.banque.nom}</h2>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {(() => {
                  const totalParEtat = detail.parEtat.reduce((s, e) => s + e.total, 0);
                  return ['disponible', 'vide', 'en_panne'].map((etat) => {
                    const count = detail.parEtat.find((e) => e.etat === etat)?.total || 0;
                    const pct = totalParEtat > 0 ? Math.round((count / totalParEtat) * 100) : null;
                    return (
                      <div key={etat} className="border border-[#e5eeec] rounded-lg p-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: ETAT_COLORS[etat] }}>
                          {ETAT_LABELS[etat]}
                        </p>
                        <p className="text-2xl font-bold text-[#0b3b36]">{count}</p>
                        <p className="text-xs text-slate-400">{pct !== null ? `${pct}%` : '—'}</p>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend formatter={(key) => ETAT_LABELS[key] || key} />
                    {Object.keys(ETAT_COLORS).map((etat) => (
                      <Line
                        key={etat}
                        type="monotone"
                        dataKey={etat}
                        stroke={ETAT_COLORS[etat]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                DAB les plus signalés vide/en panne
              </h3>
              {detail.topDabProblematiques.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun signalement négatif sur cette période.</p>
              ) : (
                <div className="space-y-2">
                  {detail.topDabProblematiques.map((d) => (
                    <div key={d.id} className="flex justify-between items-center text-sm px-3 py-2 bg-[#f7faf9] rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{d.nom}</p>
                        <p className="text-xs text-slate-500">{d.adresse}</p>
                      </div>
                      <span className="font-bold text-red-600">{d.total_negatif}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd frontend && npx esbuild src/pages/admin/AdminStatsBanques.jsx --bundle --format=esm --jsx=automatic --external:react --external:../../api/axiosConfig --external:../../components/UI/Spinner --external:recharts --outfile=/dev/null
```

Résultat attendu : pas d'erreur.

- [ ] **Commit**

```bash
git add frontend/src/pages/admin/AdminStatsBanques.jsx
git commit -m "feat(frontend): AdminStatsBanques — recoloration teal/corail, retrait titre redondant"
```

---

## Task 7 — Build + vérification manuelle complète

**Files:** Aucun — vérification uniquement.

- [ ] **Step 1 : Build complet**

```bash
cd frontend && npm run build 2>&1 | tail -15
```

Résultat attendu : `✓ built in ...`, sans nouvelle erreur. Les chunks lazy
`AdminStatsBanques-*.js`, `EmbedStatsPage-*.js`, `LineChart-*.js` doivent toujours
apparaître séparément du bundle principal (vérifie que le bundle principal n'a pas
grossi de plus de quelques Ko — s'il grossit de dizaines de Ko, `AdminLayout` ou un
de ses enfants importe probablement quelque chose qui casse le code-splitting).

- [ ] **Step 2 : Démarrer le serveur de dev et se connecter en admin**

```bash
cd frontend && npm run dev
```

Se connecter avec un compte admin réel via `/login`.

- [ ] **Step 3 : Checklist de vérification manuelle**

- [ ] `/admin` (Dashboard) : sidebar teal foncé visible à gauche, 7 liens, item
      "Dashboard" en surbrillance teal vif, cartes KPI affichées, bouton "Import
      Google Places" fonctionnel
- [ ] Badge corail sur "Propositions" dans la sidebar si des propositions sont en
      attente (comparer avec le chiffre affiché sur `/admin/propositions`)
- [ ] `/admin/stats-banques` : sidebar toujours visible, item "Stats Banques" actif,
      dropdown de sélection de banque fonctionnel, drill-down (ventilation
      disponible/vide/en_panne + courbe + top DAB) fonctionnel comme avant
- [ ] Cliquer sur chacun des 6 autres liens de la sidebar (Distributeurs,
      Signalements, Propositions, Pays, Widgets Embed) : la page s'affiche
      normalement à l'intérieur du nouveau shell, sans erreur console, sans
      contenu cassé (leur style interne reste l'ancien, seul le shell autour change)
- [ ] Réduire la largeur de la fenêtre sous 768px : la sidebar desktop disparaît, un
      bouton hamburger apparaît dans le header, cliquer dessus ouvre le tiroir avec
      la même sidebar, cliquer en dehors du tiroir (zone sombre) le referme
- [ ] Bouton langue FR/EN dans le header : change la langue de l'interface
- [ ] Menu utilisateur dans le header : affiche le nom, le bouton déconnexion
      fonctionne (redirige vers `/`, toast de confirmation)
- [ ] Naviguer vers `/` (site public) : `Navbar` public inchangé, aucune trace du
      shell admin

- [ ] **Step 4 : Commit final**

```bash
git commit --allow-empty -m "chore: refonte UI/UX admin pilote (sidebar + Dashboard + Stats Banques) — vérifiée manuellement"
```

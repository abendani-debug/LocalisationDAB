// frontend/src/components/admin/AdminSidebar.jsx
import { Link, useLocation } from 'react-router-dom';
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

export default function AdminSidebar({ nbPropositions = 0, onNavigate }) {
  const location = useLocation();
  const { user } = useAuth();

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
              onClick={onNavigate}
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

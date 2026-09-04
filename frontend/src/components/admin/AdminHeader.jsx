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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="h-16 bg-white border-b border-[#e5eeec] flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onMenuClick?.()}
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
          aria-label="Menu utilisateur"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer border-none bg-transparent"
        >
          <div className="w-7 h-7 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
            {user?.nom ? user.nom.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-sm text-slate-700">{user?.nom}</span>
        </button>

        {menuOpen && (
          <div role="menu" className="absolute top-12 right-0 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <button
              role="menuitem"
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

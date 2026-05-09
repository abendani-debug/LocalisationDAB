import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import i18n from '../../i18n';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
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

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <nav className="bg-white border-b border-slate-200 px-4 h-[100px] flex items-center justify-between sticky top-0 z-[1000] shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <img src="/logo.png" alt="MapsDab logo" className="h-[100px] w-auto object-contain" />
      </Link>

      {/* Droite : switcher langue + burger */}
      <div className="flex items-center gap-2" ref={menuRef}>
        <button
          onClick={handleLangSwitch}
          className="h-[34px] px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
        >
          {i18n.language === 'fr' ? 'FR' : 'EN'}
        </button>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          className="flex flex-col gap-[5px] justify-center p-2 bg-transparent border-none cursor-pointer"
        >
          <span className="block w-[22px] h-[2px] bg-gray-700 rounded-sm transition-transform duration-200"
            style={{ transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span className="block w-[22px] h-[2px] bg-gray-700 rounded-sm transition-opacity duration-150"
            style={{ opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-[22px] h-[2px] bg-gray-700 rounded-sm transition-transform duration-200"
            style={{ transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute top-[100px] right-0 w-64 bg-white border border-slate-200 rounded-bl-xl shadow-lg z-[999] flex flex-col overflow-hidden">
            {isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="text-gray-700 no-underline px-5 py-4 text-sm border-b border-slate-100 hover:bg-slate-50">
                {t('nav.administration')}
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <span className="text-slate-500 px-5 py-4 text-sm border-b border-slate-100">
                  {t('nav.user', { name: user?.nom })}
                </span>
                <button onClick={handleLogout}
                  className="bg-transparent border-none text-gray-700 px-5 py-4 text-left cursor-pointer text-sm hover:bg-slate-50 border-b border-slate-100 w-full">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="text-gray-700 no-underline px-5 py-4 text-sm border-b border-slate-100 hover:bg-slate-50">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="text-white no-underline px-5 py-4 text-sm bg-blue-600 hover:bg-blue-700 border-b border-slate-100">
                  {t('nav.register')}
                </Link>
              </>
            )}

            {/* Séparateur section info */}
            <div className="px-5 pt-3 pb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {i18n.language === 'fr' ? 'Informations' : 'Information'}
              </span>
            </div>
            <Link to="/apropos" onClick={() => setMenuOpen(false)}
              className="text-slate-600 no-underline px-5 py-3 text-sm hover:bg-slate-50">
              {i18n.language === 'fr' ? 'À propos' : 'About'}
            </Link>
            <Link to="/confidentialite" onClick={() => setMenuOpen(false)}
              className="text-slate-600 no-underline px-5 py-3 text-sm hover:bg-slate-50">
              {i18n.language === 'fr' ? 'Confidentialité' : 'Privacy'}
            </Link>
            <Link to="/cgu" onClick={() => setMenuOpen(false)}
              className="text-slate-600 no-underline px-5 py-3 text-sm hover:bg-slate-50">
              {t('nav.cgu')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

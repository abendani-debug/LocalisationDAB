import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import useIsMobile from '../../hooks/useIsMobile';
import i18n from '../../i18n';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleLangSwitch = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-[1000] shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <img src="/logo.png" alt="localiseMyDab logo" className="h-14 w-auto object-contain" />
      </Link>

      {/* Desktop nav */}
      {!isMobile && (
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="text-sm text-slate-500 hover:text-gray-900 no-underline transition-colors">
              {t('nav.admin')}
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-500">{user?.nom}</span>
              <button
                onClick={handleLogout}
                className="h-[34px] px-4 rounded-lg border border-slate-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-500 hover:text-gray-900 no-underline transition-colors">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="h-[34px] px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors no-underline flex items-center">
                {t('nav.register')}
              </Link>
            </>
          )}
          <Link to="/cgu" className="text-xs text-slate-400 hover:text-slate-600 no-underline transition-colors">
            CGU
          </Link>
          <button
            onClick={handleLangSwitch}
            className="h-[34px] px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
          >
            FR | EN
          </button>
        </div>
      )}

      {/* Mobile hamburger + lang switcher */}
      {isMobile && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleLangSwitch}
            className="h-[30px] px-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
          >
            FR | EN
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
        </div>
      )}

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div className="absolute top-14 right-0 w-64 bg-white border border-slate-200 rounded-bl-xl shadow-lg z-[999] flex flex-col overflow-hidden">
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)}
              className="text-gray-700 no-underline px-5 py-4 text-base border-b border-slate-100 hover:bg-slate-50">
              {t('nav.administration')}
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <span className="text-slate-500 px-5 py-4 text-sm border-b border-slate-100">{t('nav.user', { name: user?.nom })}</span>
              <button onClick={handleLogout}
                className="bg-transparent border-none text-gray-700 px-5 py-4 text-left cursor-pointer text-base hover:bg-slate-50 border-b border-slate-100 w-full">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="text-gray-700 no-underline px-5 py-4 text-base border-b border-slate-100 hover:bg-slate-50">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="text-white no-underline px-5 py-4 text-base bg-blue-600 hover:bg-blue-700 border-b border-slate-100">
                {t('nav.register')}
              </Link>
            </>
          )}
          <Link to="/cgu" onClick={() => setMenuOpen(false)}
            className="text-slate-400 no-underline px-5 py-3 text-sm hover:bg-slate-50">
            {t('nav.cgu')}
          </Link>
        </div>
      )}
    </nav>
  );
}

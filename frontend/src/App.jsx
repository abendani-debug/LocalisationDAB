import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import AuthProvider from './context/AuthContext';
import useAuth from './hooks/useAuth';
import Navbar from './components/UI/Navbar';
import SplashScreen from './components/UI/SplashScreen';

import HomePage          from './pages/HomePage';
import DABDetailPage     from './pages/DABDetailPage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminDABList      from './pages/admin/AdminDABList';
import AdminDABForm      from './pages/admin/AdminDABForm';
import AdminSignalements  from './pages/admin/AdminSignalements';
import AdminPropositions  from './pages/admin/AdminPropositions';
import CGUPage            from './pages/CGUPage';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const noFooterPaths = ['/', '/dab'];
  const showFooter = !noFooterPaths.some((p) => location.pathname === p || location.pathname.startsWith('/dab/'));

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<HomePage />} />
        <Route path="/dab/:id"  element={<DABDetailPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dabs" element={<AdminRoute><AdminDABList /></AdminRoute>} />
        <Route path="/admin/dabs/new" element={<AdminRoute><AdminDABForm /></AdminRoute>} />
        <Route path="/admin/dabs/:id/edit" element={<AdminRoute><AdminDABForm /></AdminRoute>} />
        <Route path="/admin/signalements"  element={<AdminRoute><AdminSignalements /></AdminRoute>} />
        <Route path="/admin/propositions"  element={<AdminRoute><AdminPropositions /></AdminRoute>} />

        <Route path="/cgu" element={<CGUPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer discret — masqué sur la carte */}
      {showFooter && (
        <footer style={{
          textAlign: 'center', padding: '0.6rem',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.75rem', color: '#9ca3af',
        }}>
          <Link to="/cgu" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            Conditions Générales d'Utilisation
          </Link>
          {' · '}© {new Date().getFullYear()} localiseMyDab
        </footer>
      )}
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const last = localStorage.getItem('splash_last_shown');
    if (!last) return true;
    const diff = Date.now() - parseInt(last, 10);
    return diff > 24 * 60 * 60 * 1000;
  });
  const handleSplashDone = useCallback(() => {
    localStorage.setItem('splash_last_shown', Date.now().toString());
    setShowSplash(false);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {showSplash ? (
        <SplashScreen onDone={handleSplashDone} />
      ) : (
        <BrowserRouter>
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      )}
    </I18nextProvider>
  );
}

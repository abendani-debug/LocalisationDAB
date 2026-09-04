// frontend/src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nbPropositions, setNbPropositions] = useState(0);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setNbPropositions(r.data.data?.propositions?.total || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#f7faf9]">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <AdminSidebar nbPropositions={nbPropositions} />
      </div>

      {/* Sidebar mobile — tiroir */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar nbPropositions={nbPropositions} onNavigate={() => setMobileOpen(false)} />
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

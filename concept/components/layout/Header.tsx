'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Menu, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import fr from '@/messages/fr.json'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'

const NAV_LINKS = [
  { label: fr.nav.concept, href: '#comment-ca-marche' },
  { label: fr.nav.features, href: '#fonctionnalites' },
  { label: fr.nav.banks, href: '#banques' },
  { label: fr.nav.faq, href: '#faq' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-dark/80 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/images/logo.jpg" alt="MapsDab" width={40} height={40} className="rounded-lg" />
          </a>

          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-dark/70 dark:text-white/70 hover:text-dark dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#telecharger"
            className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-primary"
          >
            <Download className="w-4 h-4" />
            {fr.nav.cta}
          </a>

          <DarkModeToggle />

          <button
            className="md:hidden ml-auto p-2 rounded-lg hover:bg-black/5 transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-dark dark:text-white" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-0 z-50 bg-white dark:bg-dark flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Image src="/images/logo.jpg" alt="MapsDab" width={36} height={36} className="rounded-lg" />
              <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
                <X className="w-6 h-6 text-dark dark:text-white" />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-2 flex-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-xl font-semibold text-dark dark:text-white py-3 border-b border-border/50"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="p-6">
              <a
                href="#telecharger"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary text-white text-base font-bold py-4 rounded-2xl shadow-primary"
              >
                <Download className="w-5 h-5" />
                {fr.nav.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

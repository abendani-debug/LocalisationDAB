// concept/components/sections/FinalCTA.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import fr from '@/messages/fr.json'

function AppStoreBadge() {
  return (
    <div className="flex items-center gap-3 bg-dark border border-white/20 text-white px-5 py-3 rounded-2xl hover:bg-dark/80 transition-colors cursor-pointer">
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <div>
        <div className="text-[9px] text-white/60 leading-none">Télécharger sur</div>
        <div className="text-sm font-bold leading-tight">App Store</div>
      </div>
    </div>
  )
}

function PlayStoreBadge() {
  return (
    <div className="flex items-center gap-3 bg-dark border border-white/20 text-white px-5 py-3 rounded-2xl hover:bg-dark/80 transition-colors cursor-pointer">
      <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0">
        <path fill="#00C896" d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
      </svg>
      <div>
        <div className="text-[9px] text-white/60 leading-none">Disponible sur</div>
        <div className="text-sm font-bold leading-tight">Google Play</div>
      </div>
    </div>
  )
}

export function FinalCTA() {
  const [phone, setPhone] = useState('')
  const [smsSent, setSmsSent] = useState(false)

  function handleSMS(e: React.FormEvent) {
    e.preventDefault()
    console.log('[SMS stub]', phone)
    setSmsSent(true)
  }

  return (
    <section id="telecharger" className="py-24 px-4 bg-gradient-brand relative overflow-hidden">
      {/* Décorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative"
      >
        <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
          {fr.cta_final.h2}
        </h2>
        <p className="text-white/80 text-lg mb-10">{fr.cta_final.subtitle}</p>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <AppStoreBadge />
          <PlayStoreBadge />
        </div>

        {/* Champ SMS */}
        {smsSent ? (
          <p className="text-white/80 text-sm">✅ Lien envoyé ! Vérifiez vos SMS.</p>
        ) : (
          <form onSubmit={handleSMS} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={fr.cta_final.sms_placeholder}
              className="flex-1 bg-white/15 border border-white/30 text-white placeholder-white/50 px-4 py-3 rounded-full text-sm focus:outline-none focus:border-white/60"
            />
            <button
              type="submit"
              className="bg-white text-primary font-bold px-6 py-3 rounded-full text-sm hover:bg-white/90 transition-colors flex-shrink-0"
            >
              {fr.cta_final.sms_cta}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}

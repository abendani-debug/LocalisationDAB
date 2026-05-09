// concept/components/sections/FinalCTA.tsx
'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import fr from '@/messages/fr.json'

export function FinalCTA() {
  return (
    <section id="cta" className="py-24 px-4 bg-gradient-brand relative overflow-hidden">
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
        <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-4 leading-tight whitespace-pre-line">
          {fr.cta_final.h2}
        </h2>
        <p className="text-white/80 text-lg mb-10">{fr.cta_final.subtitle}</p>

        <a
          href="https://mapsdab.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white text-primary font-bold px-8 py-4 rounded-full text-lg hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
        >
          <MapPin className="w-5 h-5" />
          {fr.cta_final.cta}
        </a>
      </motion.div>
    </section>
  )
}

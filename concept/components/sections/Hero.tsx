'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowDown } from 'lucide-react'
import { LiveBadge } from '@/components/ui/LiveBadge'
import { MapAnimation } from '@/components/ui/MapAnimation'
import fr from '@/messages/fr.json'

const LIVE_SIGNALS = [
  { color: '#00C896', borderColor: 'border-emerald-200', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', name: 'DAB BNA — Hydra', status: 'Disponible', time: '2 min' },
  { color: '#FF6B35', borderColor: 'border-orange-200', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', name: 'DAB CPA — Bab Ezzouar', status: 'Vide', time: '8 min' },
  { color: '#EF4444', borderColor: 'border-red-200', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', name: 'DAB SGA — Bir Mourad Raïs', status: 'En panne', time: '15 min' },
]

const CAROUSEL_SLIDES = [
  { src: '/images/slide-1.png', alt: 'DABs en Algérie' },
  { src: '/images/slide-2.png', alt: 'Carte MapsDab — vue des DABs proches' },
  { src: '/images/slide-3.png', alt: 'MapsDab — détail et signalement' },
]

function MobileCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % CAROUSEL_SLIDES.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="absolute inset-0 md:hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={CAROUSEL_SLIDES[current].src}
            alt={CAROUSEL_SLIDES[current].alt}
            fill
            priority={current === 0}
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">

      {/* MOBILE : carrousel d'images */}
      <MobileCarousel />

      {/* DESKTOP / TABLETTE : vidéo de fond */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden="true"
      >
        <source src="/images/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay semi-transparent */}
      <div className="absolute inset-0 bg-white/65 dark:bg-dark/70" />

      {/* Dégradé décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">

        {/* GAUCHE */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <LiveBadge label={fr.hero.badge} />

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-dark dark:text-white leading-tight">
            Trouvez un DAB qui marche.{' '}
            <span className="text-gradient">Avant d&apos;y aller.</span>
          </h1>

          <p className="text-lg text-dark/60 dark:text-white/60 leading-relaxed max-w-lg">
            {fr.hero.subtitle}
          </p>

          {/* Avant / Après */}
          <div className="flex gap-3">
            <div className="flex-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <div className="text-xs font-black text-red-600 mb-2">😤 {fr.hero.before_title}</div>
              <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{fr.hero.before_text}</div>
            </div>
            <div className="flex items-center text-secondary font-bold text-lg px-1">→</div>
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <div className="text-xs font-black text-emerald-600 mb-2">😌 {fr.hero.after_title}</div>
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{fr.hero.after_text}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { value: fr.hero.stat_dabs, label: fr.hero.stat_dabs_label },
              { value: fr.hero.stat_uptime, label: fr.hero.stat_uptime_label },
              { value: fr.hero.stat_free, label: fr.hero.stat_free_label },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-black text-dark dark:text-white">{stat.value}</div>
                <div className="text-xs text-dark/50 dark:text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href="https://mapsdab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-full shadow-primary transition-all hover:scale-105"
            >
              <MapPin className="w-5 h-5" />
              {fr.hero.cta_primary}
            </a>
            <a
              href="#comment-ca-marche"
              className="flex items-center gap-2 border border-border hover:border-primary text-dark dark:text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              {fr.hero.cta_secondary}
            </a>
          </div>

          <p className="text-xs text-dark/40 dark:text-white/40">{fr.hero.trust}</p>
        </motion.div>

        {/* DROITE */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          {/* Carte animée */}
          <div className="relative h-64 md:h-72 rounded-2xl overflow-hidden border border-border shadow-card">
            <MapAnimation />
          </div>

          {/* Flux live */}
          <div>
            <p className="text-xs font-bold text-dark/40 dark:text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />
              {fr.hero.live_label}
            </p>
            <div className="flex flex-col gap-2">
              {LIVE_SIGNALS.map((sig, i) => (
                <motion.div
                  key={sig.name}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className={`flex items-center gap-3 ${sig.bg} border ${sig.borderColor} rounded-xl px-4 py-3`}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-dark dark:text-white truncate">{sig.name}</div>
                    <div className={`text-xs font-bold ${sig.text}`}>{sig.status}</div>
                  </div>
                  <div className="text-xs text-dark/40 dark:text-white/40">{sig.time}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

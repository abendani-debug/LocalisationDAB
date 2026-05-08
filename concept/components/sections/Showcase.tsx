'use client'

import { motion } from 'framer-motion'
import { PhoneMockup } from '@/components/ui/PhoneMockup'
import fr from '@/messages/fr.json'

function MapScreen() {
  return (
    <div className="h-full bg-blue-50 p-3 relative overflow-hidden min-h-[420px]">
      <div className="text-[10px] font-bold text-slate-500 mb-2">📍 Alger · 7 DABs</div>
      <div className="bg-blue-100 rounded-xl h-40 relative overflow-hidden mb-3">
        {[
          { top: '25%', left: '20%', color: '#00C896' },
          { top: '45%', left: '55%', color: '#FF6B35' },
          { top: '20%', left: '70%', color: '#EF4444' },
          { top: '60%', left: '35%', color: '#00C896' },
        ].map((m, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow"
            style={{ top: m.top, left: m.left, backgroundColor: m.color }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { color: '#00C896', name: 'BNA Hydra', dist: '0.3 km', status: 'Dispo' },
          { color: '#FF6B35', name: 'CPA Bab E.', dist: '0.8 km', status: 'Vide' },
        ].map(item => (
          <div key={item.name} className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold text-dark flex-1">{item.name}</span>
            <span className="text-[9px] text-slate-400">{item.dist}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailScreen() {
  return (
    <div className="h-full bg-white p-3 min-h-[420px]">
      <div className="text-[10px] font-bold text-dark mb-1">DAB BNA — Hydra</div>
      <div className="text-[9px] text-slate-400 mb-3">12 Rue Hassiba Ben Bouali</div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-bold text-emerald-700">Disponible · mis à jour il y a 4 min</span>
      </div>
      <div className="text-[9px] font-semibold text-dark/60 mb-2">Derniers signalements</div>
      {['✅ Dispo · 4 min', '✅ Dispo · 22 min', '💸 Vide · 1h'].map(s => (
        <div key={s} className="text-[9px] text-dark/50 py-1 border-b border-border/50">{s}</div>
      ))}
    </div>
  )
}

function SignalScreen() {
  return (
    <div className="h-full bg-white p-3 flex flex-col min-h-[420px]">
      <div className="text-[10px] font-bold text-dark mb-0.5">Signaler l&apos;état</div>
      <div className="text-[9px] text-slate-400 mb-4">DAB BNA — Hydra · Anonyme</div>
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { emoji: '✅', label: 'Disponible', active: true },
          { emoji: '💸', label: 'Vide',       active: false },
          { emoji: '🔧', label: 'En panne',   active: false },
        ].map(b => (
          <div
            key={b.label}
            className={`rounded-xl p-2 text-center border-2 ${b.active ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <div className="text-lg mb-0.5">{b.emoji}</div>
            <div className="text-[8px] font-bold text-dark/70">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-primary text-white text-[10px] font-bold text-center py-2.5 rounded-xl mt-auto">
        Envoyer
      </div>
    </div>
  )
}

const SLIDES = [
  {
    title: fr.showcase.s1_title,
    text:  fr.showcase.s1_text,
    screen: <MapScreen />,
    shadow: 'rgba(0,200,150,0.2)',
    reverse: false,
  },
  {
    title: fr.showcase.s2_title,
    text:  fr.showcase.s2_text,
    screen: <DetailScreen />,
    shadow: 'rgba(37,99,235,0.2)',
    reverse: true,
  },
  {
    title: fr.showcase.s3_title,
    text:  fr.showcase.s3_text,
    screen: <SignalScreen />,
    shadow: 'rgba(255,107,53,0.2)',
    reverse: false,
  },
]

export function Showcase() {
  return (
    <section className="section-padding bg-surface dark:bg-dark overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.showcase.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60">{fr.showcase.subtitle}</p>
        </motion.div>

        <div className="space-y-24">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.title}
              className={`flex flex-col ${slide.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
            >
              <motion.div
                initial={{ opacity: 0, x: slide.reverse ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand text-white font-black text-lg mb-4">
                  {i + 1}
                </div>
                <h3 className="font-display text-2xl font-black text-dark dark:text-white mb-3">{slide.title}</h3>
                <p className="text-dark/60 dark:text-white/60 leading-relaxed">{slide.text}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: slide.reverse ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex-1 flex justify-center"
              >
                <PhoneMockup shadowColor={slide.shadow}>
                  {slide.screen}
                </PhoneMockup>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

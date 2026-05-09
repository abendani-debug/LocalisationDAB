'use client'

import { motion } from 'framer-motion'
import { MapPin, Eye, MessageSquare, Zap } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import fr from '@/messages/fr.json'

interface Step {
  icon: LucideIcon
  title: string
  text: string
  mockup: React.ReactNode
}

const STEPS: Step[] = [
  {
    icon: MapPin,
    title: fr.how.step1_title,
    text: fr.how.step1_text,
    mockup: (
      <div className="text-center py-2">
        <div className="text-2xl mb-1">📍</div>
        <div className="text-[10px] font-semibold text-dark/70 dark:text-white/70">Position détectée</div>
        <div className="text-[10px] text-primary font-bold">7 DABs à proximité</div>
      </div>
    ),
  },
  {
    icon: Eye,
    title: fr.how.step2_title,
    text: fr.how.step2_text,
    mockup: (
      <div className="space-y-1.5">
        {[
          { color: '#00C896', label: 'BNA', status: 'Dispo' },
          { color: '#FF6B35', label: 'CPA', status: 'Vide' },
          { color: '#EF4444', label: 'SGA', status: 'Panne' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-medium text-dark/80 dark:text-white/80 flex-1">{item.label}</span>
            <span className="text-[9px] font-bold" style={{ color: item.color }}>{item.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageSquare,
    title: fr.how.step3_title,
    text: fr.how.step3_text,
    mockup: (
      <div className="space-y-1.5">
        {['✅ Disponible', '💸 Vide', '🔧 En panne'].map(label => (
          <div
            key={label}
            className="text-[10px] text-center font-semibold border border-border rounded-lg py-1.5"
          >
            {label}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    title: fr.how.step4_title,
    text: fr.how.step4_text,
    mockup: (
      <div className="text-center py-2">
        <div className="text-2xl mb-1">🎉</div>
        <div className="text-[10px] font-bold text-primary">Merci !</div>
        <div className="text-[10px] text-dark/60 dark:text-white/60">Signalement envoyé</div>
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="section-padding bg-surface dark:bg-dark">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.how.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.how.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-primary">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dark dark:bg-white text-white dark:text-dark text-xs font-black flex items-center justify-center">
                  {i + 1}
                </div>
              </div>
              <div className="bg-white dark:bg-dark/60 rounded-2xl border border-border p-3 w-full shadow-card">
                {step.mockup}
              </div>
              <div>
                <h3 className="font-display font-bold text-dark dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

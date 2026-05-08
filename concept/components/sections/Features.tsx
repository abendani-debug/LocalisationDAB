'use client'

import { motion } from 'framer-motion'
import { Map, Banknote, AlertTriangle, Bell, Filter, Navigation } from 'lucide-react'
import { FeatureCard } from '@/components/ui/FeatureCard'
import fr from '@/messages/fr.json'

const FEATURES = [
  { icon: Map,           title: fr.features.f1_title, text: fr.features.f1_text, iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
  { icon: Banknote,      title: fr.features.f2_title, text: fr.features.f2_text, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: AlertTriangle, title: fr.features.f3_title, text: fr.features.f3_text, iconColor: 'text-accent',     iconBg: 'bg-orange-50 dark:bg-orange-950/30' },
  { icon: Bell,          title: fr.features.f4_title, text: fr.features.f4_text, iconColor: 'text-secondary',  iconBg: 'bg-blue-50 dark:bg-blue-950/30' },
  { icon: Filter,        title: fr.features.f5_title, text: fr.features.f5_text, iconColor: 'text-purple-600', iconBg: 'bg-purple-50 dark:bg-purple-950/30' },
  { icon: Navigation,    title: fr.features.f6_title, text: fr.features.f6_text, iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
]

export function Features() {
  return (
    <section id="fonctionnalites" className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.features.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.features.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

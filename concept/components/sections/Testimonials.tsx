// concept/components/sections/Testimonials.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import fr from '@/messages/fr.json'

const TESTIMONIALS = [
  { text: fr.testimonials.t1_text, name: fr.testimonials.t1_name, role: fr.testimonials.t1_role, stars: 5 },
  { text: fr.testimonials.t2_text, name: fr.testimonials.t2_name, role: fr.testimonials.t2_role, stars: 5 },
  { text: fr.testimonials.t3_text, name: fr.testimonials.t3_name, role: fr.testimonials.t3_role, stars: 5 },
  { text: fr.testimonials.t4_text, name: fr.testimonials.t4_name, role: fr.testimonials.t4_role, stars: 5, isBank: true },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(t)
  }, [])

  const item = TESTIMONIALS[current]

  return (
    <section className="section-padding bg-surface dark:bg-dark text-center overflow-hidden">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-black text-dark dark:text-white mb-12">
          {fr.testimonials.h2}
        </h2>
        <div className="relative min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className={`bg-white dark:bg-dark/60 rounded-3xl p-8 border shadow-card w-full ${item.isBank ? 'border-secondary/30' : 'border-border'}`}
            >
              <div className="flex justify-center gap-0.5 mb-4">
                {Array.from({ length: item.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-dark/80 dark:text-white/80 leading-relaxed mb-6 italic">&ldquo;{item.text}&rdquo;</p>
              <div>
                <div className="font-bold text-dark dark:text-white">{item.name}</div>
                <div className="text-sm text-dark/50 dark:text-white/50">{item.role}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Témoignage ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

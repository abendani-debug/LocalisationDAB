'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import fr from '@/messages/fr.json'

const PROBLEMS = [
  {
    img: '/concept/images/picto_outofservice.png',
    alt: 'DAB en panne',
    title: fr.problem.card1_title,
    text: fr.problem.card1_text,
    colorClass: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
  },
  {
    img: '/concept/images/picto_nocash.png',
    alt: 'Plus de cash',
    title: fr.problem.card2_title,
    text: fr.problem.card2_text,
    colorClass: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    img: '/concept/images/picto_queue.png',
    alt: 'File interminable',
    title: fr.problem.card3_title,
    text: fr.problem.card3_text,
    colorClass: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20',
  },
]

export function Problem() {
  return (
    <section className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.problem.h2}
          </h2>
          <p className="text-dark/60 dark:text-white/60 max-w-xl mx-auto">{fr.problem.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-6 ${p.colorClass}`}
            >
              <div className="mb-4">
                <Image src={p.img} alt={p.alt} width={96} height={96} className="object-contain" />
              </div>
              <h3 className="font-display font-bold text-lg text-dark dark:text-white mb-2">{p.title}</h3>
              <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-brand text-white font-bold text-lg md:text-xl px-8 py-4 rounded-2xl shadow-primary">
            {fr.problem.transition}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

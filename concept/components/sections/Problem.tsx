'use client'

import { motion } from 'framer-motion'
import fr from '@/messages/fr.json'

function BrokenATM() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* ATM body */}
      <rect x="10" y="4" width="60" height="72" rx="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
      {/* Screen — éteint / erreur */}
      <rect x="18" y="12" width="44" height="28" rx="4" fill="#FECACA"/>
      <rect x="18" y="12" width="44" height="28" rx="4" fill="#DC2626" fillOpacity="0.15"/>
      {/* Grand X rouge sur l'écran */}
      <line x1="27" y1="19" x2="53" y2="35" stroke="#DC2626" strokeWidth="4" strokeLinecap="round"/>
      <line x1="53" y1="19" x2="27" y2="35" stroke="#DC2626" strokeWidth="4" strokeLinecap="round"/>
      {/* Fissure sur le boîtier */}
      <path d="M38 4 L42 14 L36 20 L40 28" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
      {/* Clavier */}
      <rect x="18" y="46" width="44" height="18" rx="4" fill="#FECACA" fillOpacity="0.7"/>
      <circle cx="27" cy="52" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      <circle cx="40" cy="52" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      <circle cx="53" cy="52" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      <circle cx="27" cy="59" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      <circle cx="40" cy="59" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      <circle cx="53" cy="59" r="2.5" fill="#EF4444" fillOpacity="0.4"/>
      {/* Fente carte */}
      <rect x="20" y="68" width="40" height="5" rx="2.5" fill="#FECACA"/>
    </svg>
  )
}

function EmptyATM() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* ATM body */}
      <rect x="10" y="10" width="48" height="66" rx="8" fill="#FEF9C3" stroke="#EAB308" strokeWidth="2"/>
      {/* Écran avec solde 0 */}
      <rect x="18" y="18" width="32" height="20" rx="4" fill="#FEF08A"/>
      {/* Ligne de solde */}
      <rect x="22" y="23" width="14" height="3" rx="1.5" fill="#EAB308" fillOpacity="0.4"/>
      {/* Gros 0 */}
      <rect x="29" y="28" width="10" height="7" rx="3" fill="none" stroke="#B45309" strokeWidth="2.5"/>
      {/* Clavier */}
      <rect x="18" y="44" width="32" height="22" rx="4" fill="#FEF08A" fillOpacity="0.6"/>
      <circle cx="25" cy="50" r="2" fill="#EAB308" fillOpacity="0.5"/>
      <circle cx="34" cy="50" r="2" fill="#EAB308" fillOpacity="0.5"/>
      <circle cx="43" cy="50" r="2" fill="#EAB308" fillOpacity="0.5"/>
      <circle cx="25" cy="58" r="2" fill="#EAB308" fillOpacity="0.5"/>
      <circle cx="34" cy="58" r="2" fill="#EAB308" fillOpacity="0.5"/>
      <circle cx="43" cy="58" r="2" fill="#EAB308" fillOpacity="0.5"/>
      {/* Fente cash vide */}
      <rect x="18" y="70" width="32" height="4" rx="2" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5"/>
      {/* Billets qui s'envolent */}
      <rect x="60" y="30" width="16" height="9" rx="2" fill="#EAB308" fillOpacity="0.8" transform="rotate(-20 60 30)"/>
      <rect x="63" y="17" width="13" height="7" rx="2" fill="#EAB308" fillOpacity="0.5" transform="rotate(-35 63 17)"/>
      <rect x="58" y="6" width="11" height="6" rx="2" fill="#EAB308" fillOpacity="0.25" transform="rotate(-45 58 6)"/>
      {/* Trait en pointillés (trajectoire) */}
      <path d="M54 42 Q60 28 66 12" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
    </svg>
  )
}

function LongQueue() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* ATM (petit, à droite) */}
      <rect x="58" y="20" width="18" height="48" rx="4" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5"/>
      <rect x="62" y="25" width="10" height="12" rx="2" fill="#FDBA74"/>
      <rect x="62" y="41" width="10" height="14" rx="2" fill="#FDBA74" fillOpacity="0.5"/>
      <rect x="63" y="59" width="8" height="3" rx="1.5" fill="#FDBA74"/>
      {/* Personne 1 — devant (couleur pleine) */}
      <circle cx="46" cy="32" r="6" fill="#F97316"/>
      <path d="M40 44 Q46 40 52 44 L52 62 Q46 58 40 62 Z" fill="#F97316"/>
      {/* Personne 2 */}
      <circle cx="30" cy="34" r="5.5" fill="#FB923C"/>
      <path d="M24 46 Q30 42 36 46 L36 62 Q30 58 24 62 Z" fill="#FB923C"/>
      {/* Personne 3 */}
      <circle cx="15" cy="34" r="5" fill="#FDBA74"/>
      <path d="M10 45 Q15 41 20 45 L20 60 Q15 56 10 60 Z" fill="#FDBA74"/>
      {/* Personne 4 — loin (estompée) */}
      <circle cx="4" cy="35" r="4" fill="#FED7AA" fillOpacity="0.6"/>
      <path d="M1 45 Q4 41 7 45 L7 58 Q4 54 1 58 Z" fill="#FED7AA" fillOpacity="0.5"/>
      {/* Horloge au-dessus */}
      <circle cx="14" cy="16" r="10" fill="#FFF7ED" stroke="#F97316" strokeWidth="2"/>
      <line x1="14" y1="10" x2="14" y2="16" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="20" y2="16" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const PROBLEMS = [
  {
    illustration: <BrokenATM />,
    title: fr.problem.card1_title,
    text: fr.problem.card1_text,
    colorClass: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
  },
  {
    illustration: <EmptyATM />,
    title: fr.problem.card2_title,
    text: fr.problem.card2_text,
    colorClass: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20',
  },
  {
    illustration: <LongQueue />,
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
              <div className="mb-4">{p.illustration}</div>
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

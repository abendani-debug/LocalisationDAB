'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import fr from '@/messages/fr.json'

const ITEMS = [
  { q: fr.faq.q1, a: fr.faq.a1 },
  { q: fr.faq.q2, a: fr.faq.a2 },
  { q: fr.faq.q3, a: fr.faq.a3 },
  { q: fr.faq.q4, a: fr.faq.a4 },
  { q: fr.faq.q5, a: fr.faq.a5 },
  { q: fr.faq.q6, a: fr.faq.a6 },
]

export function FAQ() {
  return (
    <section id="faq" className="section-padding bg-white dark:bg-dark/50">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.faq.h2}
          </h2>
        </motion.div>

        <Accordion multiple={false} className="space-y-3">
          {ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <AccordionItem
                value={`item-${i}`}
                className="border border-border rounded-2xl px-6 overflow-hidden bg-surface dark:bg-dark/50"
              >
                <AccordionTrigger className="text-sm font-semibold text-dark dark:text-white text-left py-4 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-dark/60 dark:text-white/60 leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

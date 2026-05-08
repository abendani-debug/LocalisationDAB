'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Database, Zap, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import fr from '@/messages/fr.json'

const BENEFITS = [
  { icon: BarChart3, title: fr.b2b.b1_title, text: fr.b2b.b1_text, iconColor: 'text-secondary', bg: 'bg-blue-50 dark:bg-blue-950/30 border border-border' },
  { icon: Database,  title: fr.b2b.b2_title, text: fr.b2b.b2_text, iconColor: 'text-primary',   bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-border' },
  { icon: Zap,       title: fr.b2b.b3_title, text: fr.b2b.b3_text, iconColor: 'text-accent',    bg: 'bg-orange-50 dark:bg-orange-950/30 border border-border' },
]

export function B2B() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = Object.fromEntries(new FormData(e.currentTarget))
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <section id="banques" className="section-padding bg-slate-100 dark:bg-dark">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Building2 className="w-3.5 h-3.5" />
            Offre professionnelle
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-dark dark:text-white mb-4">
            {fr.b2b.h2}
          </h2>
          <p className="text-xl font-semibold text-secondary mb-3">{fr.b2b.subtitle}</p>
          <p className="text-dark/60 dark:text-white/60 max-w-2xl mx-auto">{fr.b2b.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-6 ${b.bg}`}
            >
              <b.icon className={`w-8 h-8 ${b.iconColor} mb-4`} />
              <h3 className="font-display font-bold text-dark dark:text-white mb-2">{b.title}</h3>
              <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-dark/40 dark:text-white/40 mb-6">{fr.b2b.mention}</p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-secondary hover:bg-secondary-dark text-white font-bold px-8 py-3 rounded-full shadow-secondary transition-all hover:scale-105 cursor-pointer"
          >
            {fr.b2b.cta}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black">{fr.b2b.form_title}</DialogTitle>
            <DialogDescription>{fr.b2b.form_subtitle}</DialogDescription>
          </DialogHeader>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-dark dark:text-white">Demande envoyée !</p>
              <p className="text-sm text-dark/60 mt-1">Nous vous répondons sous 24h.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: 'name',  label: fr.b2b.form_name,  type: 'text'  },
                { name: 'bank',  label: fr.b2b.form_bank,  type: 'text'  },
                { name: 'email', label: fr.b2b.form_email, type: 'email' },
              ].map(field => (
                <div key={field.name}>
                  <label className="text-sm font-medium text-dark dark:text-white block mb-1">
                    {field.label}
                  </label>
                  <input
                    name={field.name}
                    type={field.type}
                    required
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary bg-white dark:bg-dark text-dark dark:text-white"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-dark dark:text-white block mb-1">
                  {fr.b2b.form_message}
                </label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary bg-white dark:bg-dark text-dark dark:text-white resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white font-bold rounded-xl py-3 cursor-pointer"
              >
                {loading ? 'Envoi…' : fr.b2b.form_submit}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

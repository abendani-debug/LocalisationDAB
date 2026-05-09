import { StatCounter } from '@/components/ui/StatCounter'
import fr from '@/messages/fr.json'

export function Stats() {
  const stats = [
    { value: fr.stats.s1_value as number, label: fr.stats.s1_label, decimals: 0 },
    { value: fr.stats.s2_value as number, label: fr.stats.s2_label, decimals: 0 },
    { value: fr.stats.s3_value as number, label: fr.stats.s3_label, decimals: 0 },
    { value: fr.stats.s4_value as number, label: fr.stats.s4_label, decimals: 1 },
  ]

  return (
    <section className="py-16 bg-gradient-brand">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-black text-white mb-2">
            {fr.stats.h2}
          </h2>
          <p className="text-white/70">{fr.stats.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <StatCounter
              key={s.label}
              value={s.value}
              label={s.label}
              decimals={s.decimals}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

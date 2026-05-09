import { type LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  text: string
  iconColor?: string
  iconBg?: string
  className?: string
}

export function FeatureCard({ icon: Icon, title, text, iconColor = 'text-primary', iconBg = 'bg-primary/10', className = '' }: FeatureCardProps) {
  return (
    <div className={`group p-6 rounded-2xl border border-border bg-white dark:bg-dark/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ${className}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="font-display font-bold text-dark dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-dark/60 dark:text-white/60 leading-relaxed">{text}</p>
    </div>
  )
}

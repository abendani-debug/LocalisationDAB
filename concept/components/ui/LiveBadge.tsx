'use client'

interface LiveBadgeProps {
  label: string
  className?: string
}

export function LiveBadge({ label, className = '' }: LiveBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="text-xs font-semibold text-primary">{label}</span>
    </div>
  )
}

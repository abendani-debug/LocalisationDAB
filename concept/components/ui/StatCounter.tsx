'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface StatCounterProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function StatCounter({ value, label, prefix = '', suffix = '', decimals = 0 }: StatCounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 1800
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(parseFloat((eased * value).toFixed(decimals)))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, value, decimals])

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl md:text-5xl font-black text-white mb-1">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
      </div>
      <div className="text-sm font-medium text-white/70">{label}</div>
    </div>
  )
}

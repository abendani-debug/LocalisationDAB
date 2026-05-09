// concept/components/ui/EasterEgg.tsx
'use client'

import { useEffect, useState } from 'react'

export function EasterEgg() {
  const [visible, setVisible] = useState(false)
  const [lastY, setLastY] = useState(0)
  const [lastTime, setLastTime] = useState(0)

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>

    function onScroll() {
      const now = Date.now()
      const y = window.scrollY
      const dt = now - lastTime
      if (dt > 0) {
        const velocity = Math.abs(y - lastY) / dt
        if (velocity > 3) {
          setVisible(true)
          clearTimeout(hideTimer)
          hideTimer = setTimeout(() => setVisible(false), 1800)
        }
      }
      setLastY(y)
      setLastTime(now)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(hideTimer) }
  }, [lastY, lastTime])

  if (!visible) return null

  return (
    <div className="fixed bottom-8 right-8 z-50 pointer-events-none animate-bounce">
      <div className="text-5xl" role="img" aria-label="Ours MapsDab">🐻</div>
    </div>
  )
}

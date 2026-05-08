'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      aria-label="Changer le thème"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4 text-white" />
        : <Moon className="w-4 h-4 text-dark" />
      }
    </button>
  )
}

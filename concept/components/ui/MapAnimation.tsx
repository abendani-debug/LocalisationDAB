'use client'

import { useEffect, useState } from 'react'

type Marker = { id: number; x: number; y: number; color: string; label: string; ping: boolean }

const INITIAL_MARKERS: Marker[] = [
  { id: 1, x: 22, y: 30, color: '#00C896', label: 'BNA · Dispo', ping: true },
  { id: 2, x: 55, y: 48, color: '#FF6B35', label: 'CPA · Vide', ping: false },
  { id: 3, x: 75, y: 25, color: '#EF4444', label: 'SGA · Panne', ping: false },
  { id: 4, x: 40, y: 65, color: '#00C896', label: 'BADR · Dispo', ping: true },
]

const POSITIONS = [
  { x: 30, y: 20 }, { x: 60, y: 55 }, { x: 15, y: 60 },
  { x: 80, y: 40 }, { x: 50, y: 30 }, { x: 70, y: 70 },
]

export function MapAnimation() {
  const [markers, setMarkers] = useState<Marker[]>(INITIAL_MARKERS)
  const [nextId, setNextId] = useState(10)

  useEffect(() => {
    const interval = setInterval(() => {
      const colors = ['#00C896', '#FF6B35', '#EF4444']
      const labels = ['BNA · Dispo', 'CPA · Vide', 'BEA · Panne', 'BADR · Dispo', 'BDL · Vide']
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const label = labels[Math.floor(Math.random() * labels.length)]
      const newMarker: Marker = { id: nextId, x: pos.x, y: pos.y, color, label, ping: true }
      setMarkers(prev => [...prev.slice(-5), newMarker])
      setNextId(n => n + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [nextId])

  return (
    <div className="relative w-full h-full bg-blue-50 dark:bg-blue-950/30 rounded-2xl overflow-hidden border border-border">
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="0" y1="40%" x2="100%" y2="45%" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="30%" y1="0" x2="35%" y2="100%" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="60%" y1="0" x2="65%" y2="100%" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="0" y1="70%" x2="100%" y2="65%" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>

      {markers.map(marker => (
        <div
          key={marker.id}
          className="absolute transition-all duration-500"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          {marker.ping && (
            <div
              className="absolute -inset-2 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: marker.color }}
            />
          )}
          <div
            className="relative w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer"
            style={{ backgroundColor: marker.color }}
          />
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: marker.color }}
          >
            {marker.label}
          </div>
        </div>
      ))}

      <div className="absolute top-3 left-3 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
        Alger · Carte interactive
      </div>
    </div>
  )
}

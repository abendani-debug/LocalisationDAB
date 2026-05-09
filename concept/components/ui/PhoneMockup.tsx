interface PhoneMockupProps {
  children: React.ReactNode
  className?: string
  shadowColor?: string
}

export function PhoneMockup({ children, className = '', shadowColor = 'rgba(0,200,150,0.2)' }: PhoneMockupProps) {
  return (
    <div
      className={`relative mx-auto w-[240px] ${className}`}
      style={{ filter: `drop-shadow(0 24px 40px ${shadowColor})` }}
    >
      <div className="relative bg-dark rounded-[2.5rem] p-2 border-4 border-dark">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-dark rounded-full z-10" />
        <div className="bg-surface rounded-[2rem] overflow-hidden min-h-[420px] relative">
          {children}
        </div>
      </div>
    </div>
  )
}

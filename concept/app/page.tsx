import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/sections/Hero'
import { Problem } from '@/components/sections/Problem'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Features } from '@/components/sections/Features'
import { Showcase } from '@/components/sections/Showcase'
import { B2B } from '@/components/sections/B2B'
import { Stats } from '@/components/sections/Stats'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Showcase />
        <B2B />
        <Stats />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-dark font-display text-2xl font-bold">MapsDab Vitrine — En construction</p>
        </div>
      </main>
      <Footer />
    </>
  )
}

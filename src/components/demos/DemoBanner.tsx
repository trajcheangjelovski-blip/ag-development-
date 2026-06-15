// components/demos/DemoBanner.tsx
// Slim sticky ribbon shown on every demo site so visitors know it's a
// sample built by AG Development — and can request one of their own.
import Link from 'next/link'

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 bg-slate-900 text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-white/90">
          <span className="inline-block bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded mr-2">
            Demo
          </span>
          Sample website built by AG Development
        </span>
        <div className="flex items-center gap-3">
          <Link href="/review" className="font-semibold text-white hover:text-blue-300 transition-colors">
            Want one like this? Get a free review →
          </Link>
          <Link href="/portfolio" className="hidden sm:inline text-white/50 hover:text-white/80 transition-colors">
            ← Portfolio
          </Link>
        </div>
      </div>
    </div>
  )
}

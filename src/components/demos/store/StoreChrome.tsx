// Shared header (announcement + nav + mobile menu) and footer for the
// Urban Threads multi-page store demo.
import Link from 'next/link'

const BASE = '/demos/store'
const links: [string, string][] = [
  ['Home', BASE],
  ['Shop', `${BASE}/shop`],
  ['About', `${BASE}/about`],
  ['Contact', `${BASE}/contact`],
]

function Logo() {
  return (
    <Link href={BASE} className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #404040 0%, #171717 100%)' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7h12l-1 13H7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      </span>
      <span className="font-extrabold text-xl tracking-tight text-neutral-900">URBAN THREADS</span>
    </Link>
  )
}

export function StoreNav({ active }: { active?: string }) {
  return (
    <>
      <div className="bg-neutral-900 text-white text-center text-xs py-2 tracking-wide">
        Free shipping on orders over $75 · 30-day returns
      </div>
      <nav className="sticky top-[37px] z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <input type="checkbox" id="nav-store" className="peer hidden" />
          <Logo />
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            {links.map(([l, h]) => (
              <Link key={h} href={h} className={`relative transition-colors hover:text-neutral-900 ${active === l ? 'text-neutral-900' : ''} after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-neutral-900 after:transition-all ${active === l ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}>{l}</Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="cursor-pointer hover:text-neutral-500">Search</span>
            <Link href={`${BASE}/shop`} className="font-semibold">Cart (0)</Link>
          </div>
          <label htmlFor="nav-store" className="md:hidden cursor-pointer text-2xl select-none">☰</label>
          <div className="absolute top-16 inset-x-0 hidden peer-checked:flex md:peer-checked:hidden flex-col gap-1 bg-white border-y border-neutral-200 p-4 shadow-lg animate-fade-up">
            {links.map(([l, h]) => <Link key={h} href={h} className="py-2 text-neutral-700 hover:text-neutral-900 transition-colors">{l}</Link>)}
            <Link href={`${BASE}/shop`} className="py-2 font-semibold border-t border-neutral-100 mt-1">Cart (0)</Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export function StoreFooter() {
  const cols: [string, string[]][] = [
    ['Shop', ['New In', 'Tops', 'Outerwear', 'Accessories', 'Footwear']],
    ['Company', ['About', 'Careers', 'Stores', 'Sustainability']],
    ['Help', ['Shipping & Returns', 'Size Guide', 'Track Order', 'Contact']],
  ]
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="font-extrabold text-lg tracking-tight text-white mb-3">URBAN THREADS</div>
          <p className="text-sm leading-relaxed">Everyday essentials made to last, designed for the way you actually live.</p>
        </div>
        {cols.map(([title, items]) => (
          <div key={title}>
            <div className="text-white font-semibold text-sm mb-3">{title}</div>
            <ul className="space-y-2 text-sm">
              {items.map(i => <li key={i}><Link href={`${BASE}/shop`} className="hover:text-white transition-colors">{i}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-800 px-6 py-6 text-center text-xs text-neutral-500">
        Urban Threads · Demo store by AG Development
      </div>
    </footer>
  )
}

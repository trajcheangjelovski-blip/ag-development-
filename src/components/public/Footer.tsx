import Link from 'next/link'
import { LogoMark } from '@/components/public/Logo'

export function PublicFooter() {
  return (
    <footer style={{ background: '#0a1628' }} className="text-white/50 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark size={32} />
              <span className="font-display font-bold text-white text-sm">AG Development</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">Websites & Remote IT Support for Small Businesses. No full-time hire. No surprise bills.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
            <div className="space-y-2.5">
              {['Website Development','WordPress Support','Shopify Support','Domain & DNS','Business Email','IT Support'].map(s => (
                <Link key={s} href="/services" className="block text-sm hover:text-white/80 transition-colors">{s}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <div className="space-y-2.5">
              {[['Portfolio','/portfolio'],['Pricing','/pricing'],['Free Review','/review'],['Contact','/contact'],['Client Portal','/login']].map(([l,h]) => (
                <Link key={l} href={h} className="block text-sm hover:text-white/80 transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <div className="space-y-2.5 text-sm">
              <div>support@ag-development.dev</div>
              <div>Response within 1 business day</div>
              <div>Mon–Fri, 9am–6pm ET</div>
              <div>Remote — Serving all US states</div>
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs">
          <span>© 2025 AG Development LLC. All rights reserved.</span>
          <span>Websites & Remote IT Support for Small Businesses</span>
        </div>
      </div>
    </footer>
  )
}

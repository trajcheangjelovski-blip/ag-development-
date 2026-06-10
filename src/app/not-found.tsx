import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-display text-8xl font-extrabold text-slate-200 leading-none mb-6">404</div>
        <h1 className="font-display text-2xl font-extrabold text-slate-800 mb-3">Page Not Found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-secondary">Go Home</Link>
          <Link href="/contact" className="btn-ghost">Contact Us</Link>
        </div>
      </div>
    </div>
  )
}

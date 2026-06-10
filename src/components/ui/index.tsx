'use client'
import { cn, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils'

// ─── Badge ────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('badge', PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-600')}>
      {priority}
    </span>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div className={cn('animate-spin rounded-full border-2 border-slate-200 border-t-blue-600', sizes[size])} />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon, title, description, action
}: {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-bold text-lg text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="font-bold" style={{ color: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981' }}>
          {used} / {total}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-extrabold text-slate-800">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, accent = false
}: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className={cn('stat-card', accent && 'bg-navy-800 border-navy-800')}>
      <div className={cn('text-xs font-semibold uppercase tracking-wider mb-2', accent ? 'text-white/60' : 'text-slate-500')}>
        {label}
      </div>
      <div className={cn('font-display text-3xl font-extrabold leading-none', accent ? 'text-white' : 'text-slate-800')}>
        {value}
      </div>
      {sub && <div className={cn('text-xs mt-1.5', accent ? 'text-white/50' : 'text-slate-400')}>{sub}</div>}
    </div>
  )
}

// ─── Alert ───────────────────────────────────────────────────────────────────
export function Alert({ type, message }: { type: 'error' | 'success' | 'warning' | 'info'; message: string }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm font-medium', styles[type])}>
      {message}
    </div>
  )
}

// ─── Section Card (for ticket sidebar items etc) ──────────────────────────────
export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 mb-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
      {children}
    </div>
  )
}

import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function currentBillingMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return format(new Date(parseInt(year), parseInt(m) - 1), 'MMMM yyyy')
}

export const STATUS_COLORS: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Waiting Client': 'bg-purple-100 text-purple-700',
  'Completed': 'bg-green-100 text-green-700',
  'Closed': 'bg-gray-100 text-gray-600',
  'New': 'bg-blue-100 text-blue-700',
  'Contacted': 'bg-amber-100 text-amber-700',
  'Proposal Sent': 'bg-purple-100 text-purple-700',
  'Won': 'bg-green-100 text-green-700',
  'Lost': 'bg-gray-100 text-gray-600',
  'Pending': 'bg-amber-100 text-amber-700',
  'Paid': 'bg-green-100 text-green-700',
  'Overdue': 'bg-red-100 text-red-700',
  'Cancelled': 'bg-gray-100 text-gray-600',
}

export const PRIORITY_COLORS: Record<string, string> = {
  'Low': 'bg-green-100 text-green-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'High': 'bg-red-100 text-red-700',
  'Urgent': 'bg-red-200 text-red-800',
}

export const TICKET_CATEGORIES = [
  'Website Issue',
  'WordPress',
  'Shopify',
  'Domain/DNS',
  'Business Email',
  'New Feature Request',
  'General IT Support',
] as const

export const TICKET_STATUSES = [
  'Open',
  'In Progress',
  'Waiting Client',
  'Completed',
  'Closed',
] as const

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const

export const LEAD_STATUSES = [
  'New', 'Contacted', 'Proposal Sent', 'Won', 'Lost'
] as const

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export const BUDGET_OPTIONS = [
  'Under $300',
  '$300–$700',
  '$700–$1,500',
  '$1,500+',
] as const

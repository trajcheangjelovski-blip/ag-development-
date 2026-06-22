// Admin RBAC: permission catalog, preset roles, and a permission check.
// Shared by both client components (menu gating, Team UI) and server routes.
// "master" implicitly has every permission. admins.manage / settings.manage are
// master-only and intentionally NOT grantable to other roles.

export type ClientScope = 'all' | 'assigned'

export const PERMISSION_GROUPS: { group: string; perms: { key: string; label: string }[] }[] = [
  { group: 'Tickets', perms: [
    { key: 'tickets.view', label: 'View tickets' },
    { key: 'tickets.reply', label: 'Reply to tickets' },
    { key: 'tickets.status', label: 'Change status' },
    { key: 'tickets.close', label: 'Close tickets' },
    { key: 'tickets.delete', label: 'Delete tickets' },
  ]},
  { group: 'Clients', perms: [
    { key: 'clients.view', label: 'View clients' },
    { key: 'clients.create', label: 'Create clients' },
    { key: 'clients.edit', label: 'Edit clients' },
    { key: 'clients.delete', label: 'Delete clients' },
    { key: 'clients.reset_password', label: 'Reset client passwords' },
  ]},
  { group: 'Leads & CRM', perms: [
    { key: 'leads.view', label: 'View leads' },
    { key: 'leads.edit', label: 'Edit leads' },
    { key: 'leads.delete', label: 'Delete leads' },
  ]},
  { group: 'Invoices', perms: [
    { key: 'invoices.view', label: 'View invoices' },
    { key: 'invoices.create', label: 'Create invoices' },
    { key: 'invoices.edit', label: 'Edit invoices' },
    { key: 'invoices.mark_paid', label: 'Mark invoices paid' },
  ]},
  { group: 'Plans & Coupons', perms: [
    { key: 'plans.view', label: 'View plans' },
    { key: 'plans.edit', label: 'Edit plans & pricing' },
  ]},
  { group: 'Reports & Statistics', perms: [
    { key: 'reports.view', label: 'View reports/stats' },
    { key: 'reports.export', label: 'Export reports/stats' },
  ]},
  { group: 'Activity Log', perms: [
    { key: 'activity.view', label: 'View activity log' },
  ]},
  { group: 'Email', perms: [
    { key: 'emails.send', label: 'Send & schedule emails' },
  ]},
]

export const ALL_GRANTABLE: string[] = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key))

// Master-only powers (not shown as grantable toggles)
export const MASTER_ONLY = ['admins.manage', 'settings.manage']

export type PresetKey = 'master' | 'manager' | 'support' | 'billing' | 'viewer'

export const PRESETS: Record<PresetKey, { label: string; description: string; permissions: string[]; scope: ClientScope }> = {
  master: {
    label: 'Master Admin',
    description: 'Full access, including managing admins and settings. The owner.',
    permissions: [...ALL_GRANTABLE], // can() short-circuits to true anyway
    scope: 'all',
  },
  manager: {
    label: 'Manager',
    description: 'Runs operations: tickets, messages, clients, leads, invoices, reports. No admin management, settings, plan pricing, or destructive deletes.',
    permissions: [
      'tickets.view', 'tickets.reply', 'tickets.status', 'tickets.close',
      'clients.view', 'clients.create', 'clients.edit', 'clients.reset_password',
      'leads.view', 'leads.edit',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.mark_paid',
      'plans.view',
      'reports.view', 'reports.export',
      'activity.view',
      'emails.send',
    ],
    scope: 'all',
  },
  support: {
    label: 'Support Agent',
    description: 'Handles tickets & messages for assigned clients. No billing, plans, settings, or deletes.',
    permissions: [
      'tickets.view', 'tickets.reply', 'tickets.status', 'tickets.close',
      'clients.view',
      'reports.view',
      'activity.view',
    ],
    scope: 'assigned',
  },
  billing: {
    label: 'Billing / Finance',
    description: 'Invoices, plans & coupons, and financial reports. No ticket handling.',
    permissions: [
      'clients.view',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.mark_paid',
      'plans.view', 'plans.edit',
      'reports.view', 'reports.export',
    ],
    scope: 'all',
  },
  viewer: {
    label: 'Viewer (read-only)',
    description: 'Can see dashboards, tickets, and stats but change nothing.',
    permissions: [
      'tickets.view', 'clients.view', 'leads.view',
      'invoices.view', 'plans.view', 'reports.view', 'activity.view',
    ],
    scope: 'all',
  },
}

type ProfileLike = {
  role?: string | null
  admin_role?: string | null
  permissions?: unknown
} | null | undefined

export function isMaster(profile: ProfileLike): boolean {
  if (!profile || profile.role !== 'admin') return false
  // Legacy admins with no admin_role set are treated as master until configured,
  // so a pre-RBAC admin is never accidentally locked out.
  return profile.admin_role === 'master' || !profile.admin_role
}

export function can(profile: ProfileLike, key: string): boolean {
  if (!profile || profile.role !== 'admin') return false
  if (isMaster(profile)) return true
  const perms = Array.isArray(profile.permissions) ? (profile.permissions as string[]) : []
  return perms.includes(key)
}

// ─── Client-side teams (multiple users per client) ─────────────────────────────
type ClientProfile = {
  role?: string | null
  client_role?: string | null
  can_view_billing?: boolean | null
  can_view_all_tickets?: boolean | null
} | null | undefined

export function isLeader(profile: ClientProfile): boolean {
  if (!profile || profile.role !== 'client') return false
  // Legacy single-user clients (no client_role) are treated as the Leader.
  return profile.client_role === 'leader' || !profile.client_role
}

export type ClientCapability = 'team' | 'billing' | 'allTickets'

export function clientCan(profile: ClientProfile, cap: ClientCapability): boolean {
  if (!profile || profile.role !== 'client') return false
  if (isLeader(profile)) return true
  if (cap === 'team') return false                       // leader-only
  if (cap === 'billing') return !!profile.can_view_billing
  if (cap === 'allTickets') return profile.can_view_all_tickets !== false
  return false
}
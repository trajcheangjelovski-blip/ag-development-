export type Role = 'admin' | 'client'

export type TicketStatus = 'Open' | 'In Progress' | 'Waiting Client' | 'Completed' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TicketCategory =
  | 'Website Issue'
  | 'WordPress'
  | 'Shopify'
  | 'Domain/DNS'
  | 'Business Email'
  | 'New Feature Request'
  | 'General IT Support'

export type LeadStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Won' | 'Lost'
export type InvoiceStatus = 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
export type CommentType = 'public' | 'internal'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  client_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SupportPackage {
  id: string
  name: string
  price: number
  requests_per_month: number
  hours_per_month: number
  response_time: string
  extra_hourly_rate: number
  is_active: boolean
  created_at: string
}

export interface Client {
  id: string
  business_name: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  package_id: string | null
  notes: string | null
  is_active: boolean
  joined_at: string
  created_at: string
  updated_at: string
  // joined
  package?: SupportPackage
}

export interface Lead {
  id: string
  business_name: string
  website: string | null
  full_name: string
  email: string
  phone: string | null
  help_type: string
  budget: string
  message: string | null
  status: LeadStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  client_id: string
  created_by: string
  title: string
  category: TicketCategory
  priority: TicketPriority
  description: string
  affected_site: string | null
  status: TicketStatus
  assigned_to: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
  creator?: Profile
}

export interface TicketComment {
  id: string
  ticket_id: string
  author_id: string
  comment_type: CommentType
  body: string
  created_at: string
  updated_at: string
  // joined
  author?: Profile
}

export interface TimeEntry {
  id: string
  ticket_id: string
  client_id: string
  logged_by: string
  work_date: string
  minutes: number
  work_note: string
  is_billable: boolean
  is_included_in_package: boolean
  billing_month: string
  created_at: string
  // joined
  logger?: Profile
}

export interface ProofUpload {
  id: string
  ticket_id: string
  uploaded_by: string
  before_note: string | null
  after_note: string | null
  before_image_url: string | null
  after_image_url: string | null
  video_link: string | null
  completion_note: string
  created_at: string
  // joined
  uploader?: Profile
}

export interface ActivityLog {
  id: string
  ticket_id: string | null
  client_id: string
  actor_id: string
  action: string
  detail: string | null
  created_at: string
  // joined
  actor?: Profile
}

export interface MonthlyReport {
  id: string
  client_id: string
  created_by: string
  report_month: string
  completed_tickets: number
  total_minutes: number
  website_updates: string | null
  recommendations: string | null
  next_improvements: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
}

export interface Invoice {
  id: string
  client_id: string
  billing_month: string
  description: string
  amount: number
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  type: 'info' | 'success' | 'warning' | 'urgent'
  is_read: boolean
  created_at: string
}

// ─── Utility types ────────────────────────────────────────────────────────────
export interface ClientUsage {
  package: SupportPackage | null
  used_requests: number
  included_requests: number
  remaining_requests: number
  used_minutes: number
  included_minutes: number
  remaining_minutes: number
  extra_minutes: number
}

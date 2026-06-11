import { createAdminClient } from '@/lib/supabase/server'

// Plan period + credit usage for a client.
// The plan runs 1 month from when it was ordered/assigned (plan_started_at →
// plan_expires_at on the clients row). Falls back to the calendar month for
// clients that don't have period dates yet.

export type PlanState = {
  pkg: any | null
  periodStart: Date
  periodEnd: Date
  expired: boolean
  usedMinutes: number
  usedRequests: number
  includedMinutes: number
  includedRequests: number
  hoursExhausted: boolean
  requestsExhausted: boolean
  exhausted: boolean
  blocked: boolean
  blockReason: string | null
}

export async function getClientPlanState(clientId: string): Promise<PlanState | null> {
  const admin = await createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('*, package:support_packages(*)')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return null

  const pkg = (client as any).package
  const now = new Date()

  let periodStart: Date
  let periodEnd: Date
  if (client.plan_started_at && client.plan_expires_at) {
    periodStart = new Date(client.plan_started_at)
    periodEnd = new Date(client.plan_expires_at)
  } else {
    // Fallback: calendar month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  const expired = now > periodEnd

  const [{ data: tickets }, { data: entries }, { data: extras }] = await Promise.all([
    admin
      .from('tickets')
      .select('id')
      .eq('client_id', clientId)
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString()),
    admin
      .from('time_entries')
      .select('minutes')
      .eq('client_id', clientId)
      .gte('created_at', periodStart.toISOString())
      .lt('created_at', periodEnd.toISOString()),
    admin
      .from('client_extras')
      .select('qty_total, qty_used, unit')
      .eq('client_id', clientId),
  ])

  const usedRequests = tickets?.length || 0
  const usedMinutes = entries?.reduce((s: number, e: any) => s + e.minutes, 0) || 0

  // Unused extra credits extend the included allowance
  const extraHoursLeft = (extras || [])
    .filter((x: any) => x.unit === 'hours')
    .reduce((s: number, x: any) => s + Math.max(0, x.qty_total - x.qty_used), 0)
  const extraTicketsLeft = (extras || [])
    .filter((x: any) => x.unit === 'tickets')
    .reduce((s: number, x: any) => s + Math.max(0, x.qty_total - x.qty_used), 0)

  const includedRequests = (pkg?.requests_per_month || 0) + extraTicketsLeft
  const includedMinutes = ((pkg?.hours_per_month || 0) + extraHoursLeft) * 60

  const requestsExhausted = includedRequests > 0 && usedRequests >= includedRequests
  const hoursExhausted = includedMinutes > 0 && usedMinutes >= includedMinutes
  const exhausted = requestsExhausted || hoursExhausted

  let blockReason: string | null = null
  if (!pkg) blockReason = 'No active support plan. Order a plan to submit tickets.'
  else if (expired) blockReason = 'Your plan period has ended. Renew your subscription to keep submitting tickets.'
  else if (requestsExhausted) blockReason = `You've used all ${includedRequests} support requests for this period.`
  else if (hoursExhausted) blockReason = `You've used all ${pkg.hours_per_month} included support hours for this period.`

  return {
    pkg,
    periodStart,
    periodEnd,
    expired,
    usedMinutes,
    usedRequests,
    includedMinutes,
    includedRequests,
    hoursExhausted,
    requestsExhausted,
    exhausted,
    blocked: !!blockReason,
    blockReason,
  }
}

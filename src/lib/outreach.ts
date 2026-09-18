import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { can } from '@/lib/permissions'
import { normalizePhone } from '@/lib/phone'

// Shared server helpers for the Viber outreach feature.

// Admin guard: must be a logged-in admin with the `outreach.send` permission.
export async function requireOutreachAdmin(): Promise<{ userId: string } | { error: NextResponse }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_role, permissions')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin' || !can(profile as any, 'outreach.send')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { userId: user.id }
}

// Friendly detection of a not-yet-migrated table (PostgREST or Postgres wording).
export function isOutreachTableMissing(message: string): boolean {
  return /outreach_(contacts|campaigns|messages)/.test(message) &&
    (/does not exist/i.test(message) || /schema cache/i.test(message) || /could not find the table/i.test(message))
}

// Substitute {company} (and a couple of aliases) into a message template.
export function renderMessage(template: string, companyName: string | null | undefined): string {
  const name = (companyName || '').trim()
  return String(template || '').replace(/\{\s*(company|company_name|firma|фирма)\s*\}/gi, name)
}

export type ImportRow = { company?: string | null; phone?: string | null; source?: string | null }
export type ParsedContact = { company_name: string | null; phone: string; source: string | null }
export type ParseResult = {
  valid: ParsedContact[]
  invalid: { input: string; reason: string }[]
  duplicatesInFile: number
}

// Normalize + de-duplicate imported rows. Returns clean contacts ready to
// upsert, plus a list of rejected inputs with reasons.
export function parseImport(rows: ImportRow[], source?: string): ParseResult {
  const valid: ParsedContact[] = []
  const invalid: { input: string; reason: string }[] = []
  const seen = new Set<string>()
  let duplicatesInFile = 0

  for (const row of rows) {
    const rawPhone = (row.phone ?? '').toString().trim()
    const company = (row.company ?? '').toString().trim()
    if (!rawPhone) {
      if (company) invalid.push({ input: company, reason: 'Missing phone' })
      continue
    }
    const phone = normalizePhone(rawPhone)
    if (!phone) {
      invalid.push({ input: rawPhone, reason: 'Invalid phone number' })
      continue
    }
    if (seen.has(phone)) { duplicatesInFile++; continue }
    seen.add(phone)
    valid.push({
      company_name: company || null,
      phone,
      source: (row.source ?? source ?? null) || null,
    })
  }
  return { valid, invalid, duplicatesInFile }
}

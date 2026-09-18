import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOutreachAdmin, isOutreachTableMissing, parseImport, type ImportRow } from '@/lib/outreach'

// GET  /api/outreach/contacts        → list contacts (+ summary counts)
// POST /api/outreach/contacts        → bulk import { rows: [{company, phone}], source }

export async function GET(request: NextRequest) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error

  const admin = await createAdminClient()
  const search = request.nextUrl.searchParams.get('q')?.trim()

  let query = admin
    .from('outreach_contacts')
    .select('id, company_name, phone, source, consent_status, opted_out, opted_out_at, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (search) query = query.or(`company_name.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data, error } = await query
  if (error) {
    if (isOutreachTableMissing(error.message)) return NextResponse.json({ tableMissing: true, contacts: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const contacts = data || []
  const summary = {
    total: contacts.length,
    consented: contacts.filter(c => c.consent_status === 'granted' && !c.opted_out).length,
    optedOut: contacts.filter(c => c.opted_out).length,
  }
  return NextResponse.json({ contacts, summary })
}

export async function POST(request: NextRequest) {
  const auth = await requireOutreachAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json().catch(() => ({})) as { rows?: ImportRow[]; source?: string; consent?: string }
  const rows = Array.isArray(body.rows) ? body.rows : []
  if (!rows.length) return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
  if (rows.length > 20000) return NextResponse.json({ error: 'Too many rows in one import (max 20,000)' }, { status: 400 })

  const { valid, invalid, duplicatesInFile } = parseImport(rows, body.source)
  if (!valid.length) {
    return NextResponse.json({ imported: 0, invalid, duplicatesInFile, error: 'No valid phone numbers found' }, { status: 400 })
  }

  const consent = body.consent === 'granted' || body.consent === 'declined' ? body.consent : 'unknown'
  const payload = valid.map(v => ({ ...v, consent_status: consent }))

  const admin = await createAdminClient()
  // Upsert on the unique phone: re-importing a number updates its company/source
  // rather than erroring. onConflict ignore-duplicates keeps existing consent.
  const { data, error } = await admin
    .from('outreach_contacts')
    .upsert(payload, { onConflict: 'phone', ignoreDuplicates: true })
    .select('id')

  if (error) {
    if (isOutreachTableMissing(error.message)) return NextResponse.json({ tableMissing: true }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const imported = data?.length ?? 0
  return NextResponse.json({
    imported,
    skippedExisting: valid.length - imported,
    duplicatesInFile,
    invalid,
  })
}

import nodemailer, { type Transporter } from 'nodemailer'
import { Resend } from 'resend'
import { getEmailSettings } from '@/lib/settings'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const TIMEOUTS = { connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000 }

// Primary delivery path. When a Resend API key is configured (admin Settings or
// RESEND_API_KEY env), all mail is sent through Resend — no SMTP needed. SMTP is
// only the fallback used when no Resend key is present. NOTE: Resend can only
// send from addresses on a domain verified in your Resend account, so every
// "from" must be on that domain (e.g. ag-development.dev).
// A file to attach. `content` is base64-encoded bytes.
export type EmailAttachment = { filename: string; content: string; contentType?: string }

async function sendViaResend(
  apiKey: string,
  opts: { from: string; to: string; replyTo?: string; subject: string; html: string; attachments?: EmailAttachment[]; headers?: Record<string, string> },
) {
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
    headers: opts.headers,
    attachments: opts.attachments?.map(a => ({ filename: a.filename, content: a.content })),
  })
  if (error) {
    const msg = typeof error === 'string' ? error : (error as { message?: string }).message
    throw new Error(msg || 'Resend rejected the email')
  }
}

// ── Notification transport ──────────────────────────────────────────────────
// The shared mailbox used for all automated NOTIFICATIONS (new ticket, lead,
// message, subscription, invoice, client invite, status updates). Configured via
// env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS. Built once and reused.
let notifTransporter: Transporter | null = null
function getNotificationTransport(): Transporter {
  if (notifTransporter) return notifTransporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('Notification email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment.')
  }
  notifTransporter = nodemailer.createTransport({
    host, port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
    ...TIMEOUTS,
  })
  return notifTransporter
}

// SMTP fallback connection (used only when no Resend key is configured).
export type SmtpConnection = {
  host: string
  port: number
  secure?: boolean
  user: string
  pass: string
  from: string        // "Name <email>" or bare email
  replyTo?: string
}

// The identity a personal email is sent under (lead replies, composed/bulk).
// `from` must be on your Resend-verified domain; `replyTo` is the admin's real
// inbox so replies come back to them. `smtp` is only used in SMTP-fallback mode.
export type PersonalSender = {
  from: string
  replyTo?: string
  smtp?: SmtpConnection
}

function buildTransport(c: SmtpConnection): Transporter {
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure ?? c.port === 465,
    auth: { user: c.user, pass: c.pass },
    ...TIMEOUTS,
  })
}

// Send a notification email. Uses Resend when configured; otherwise the shared
// SMTP notification mailbox. The "from" is the app_settings 'notification_from'
// key (default notification@ag-development.dev).
async function sendMail(payload: { to: string; subject: string; html: string; replyTo?: string }) {
  const cfg = await getEmailSettings()
  if (cfg.apiKey) {
    await sendViaResend(cfg.apiKey, {
      from: cfg.notificationFrom,
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
    })
    return
  }
  await getNotificationTransport().sendMail({
    from: cfg.notificationFrom,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
  })
}

const btn = (href: string, label: string, color = '#0f1f3d') =>
  `<a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:${color};color:white;border-radius:6px;text-decoration:none;font-weight:600;">${label}</a>`

const wrap = (body: string) =>
  `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">${body}<p style="margin-top:32px;color:#94a3b8;font-size:13px">— AG Development Team</p></div>`

// ── New ticket alert to admin ──────────────────────────────────────────────────
export async function sendNewTicketAlertToAdmin({
  adminEmail, clientName, businessName, ticketTitle, ticketId, category, priority,
}: {
  adminEmail: string
  clientName: string
  businessName: string
  ticketTitle: string
  ticketId: string
  category: string
  priority: string
}) {
  const isUrgent = ['Urgent', 'High'].includes(priority)
  try {
    await sendMail({
      to: adminEmail,
      subject: isUrgent ? `[${priority.toUpperCase()}] New Ticket: ${ticketTitle}` : `New Ticket: ${ticketTitle}`,
      html: wrap(`
        <h2 style="color:#0f1f3d;margin-bottom:4px">${isUrgent ? '🚨 ' : ''}New Support Ticket</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${[
            ['Client', `${clientName} — ${businessName}`],
            ['Title', `<strong>${ticketTitle}</strong>`],
            ['Category', category],
            ['Priority', `<span style="color:${isUrgent ? '#dc2626' : '#0f1f3d'};font-weight:700">${priority}</span>`],
          ].map(([l, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:110px">${l}</td><td style="padding:6px 0">${v}</td></tr>`).join('')}
        </table>
        ${btn(`${APP_URL}/admin/tickets/${ticketId}`, 'View Ticket →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── Ticket status update to client ────────────────────────────────────────────
export async function sendTicketStatusUpdate({
  clientEmail, clientName, ticketTitle, ticketId, oldStatus, newStatus, adminNote,
}: {
  clientEmail: string
  clientName: string
  ticketTitle: string
  ticketId: string
  oldStatus?: string
  newStatus: string
  adminNote?: string
}) {
  const subjects: Record<string, string> = {
    'Open':           `Your ticket has been received: ${ticketTitle}`,
    'In Progress':    `We're working on your ticket: ${ticketTitle}`,
    'Waiting Client': `[Action Required] We need your input: ${ticketTitle}`,
    'Completed':      `Your ticket has been completed ✅: ${ticketTitle}`,
    'Closed':         `Your ticket has been closed: ${ticketTitle}`,
  }
  const messages: Record<string, string> = {
    'Open':           'Your support request has been received and is in our queue.',
    'In Progress':    'Good news — our team has started working on your ticket.',
    'Waiting Client': '<strong style="color:#b45309">Action required:</strong> We need additional information from you to continue. Please reply or view the ticket.',
    'Completed':      '🎉 We\'ve resolved your issue! Please review the ticket and check the proof of work. If you have any questions, feel free to reopen it.',
    'Closed':         'This ticket has been closed. If you need further assistance, you can reopen it from your portal.',
  }
  try {
    await sendMail({
      to: clientEmail,
      subject: subjects[newStatus] || `Ticket Update: ${ticketTitle}`,
      html: wrap(`
        <h2 style="color:#0f1f3d">Ticket Update</h2>
        <p>Hi ${clientName},</p>
        <p>Your ticket <strong>"${ticketTitle}"</strong> has been updated.</p>
        <p style="padding:12px 16px;background:#f8fafc;border-left:3px solid #3b82f6;border-radius:4px;margin:16px 0">
          <span style="color:#64748b">${oldStatus}</span>
          <span style="margin:0 8px">→</span>
          <strong>${newStatus}</strong>
        </p>
        <p>${messages[newStatus] || `Status changed to ${newStatus}.`}</p>
        ${adminNote ? `<blockquote style="border-left:3px solid #e2e8f0;padding:8px 16px;color:#475569;margin:16px 0">${adminNote}</blockquote>` : ''}
        ${btn(`${APP_URL}/portal/tickets/${ticketId}`, 'View Ticket →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── Ticket reopened to admin ───────────────────────────────────────────────────
export async function sendTicketReopenedToAdmin({
  adminEmail, clientName, businessName, ticketTitle, ticketId, reason,
}: {
  adminEmail: string
  clientName: string
  businessName: string
  ticketTitle: string
  ticketId: string
  reason: string
}) {
  try {
    await sendMail({
      to: adminEmail,
      subject: `Ticket Reopened: ${ticketTitle}`,
      html: wrap(`
        <h2 style="color:#0f1f3d">🔄 Ticket Reopened by Client</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${[
            ['Client', `${clientName} — ${businessName}`],
            ['Ticket', `<strong>${ticketTitle}</strong>`],
          ].map(([l, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:110px">${l}</td><td style="padding:6px 0">${v}</td></tr>`).join('')}
        </table>
        <p style="color:#64748b;margin-bottom:4px">Reason for reopening:</p>
        <blockquote style="border-left:3px solid #f59e0b;padding:8px 16px;color:#92400e;background:#fffbeb;border-radius:4px;margin:8px 0">${reason}</blockquote>
        ${btn(`${APP_URL}/admin/tickets/${ticketId}`, 'View Ticket →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── New comment notification ───────────────────────────────────────────────────
export async function sendNewCommentNotification({
  toEmail, toName, ticketTitle, ticketId, authorName, commentBody,
}: {
  toEmail: string
  toName: string
  ticketTitle: string
  ticketId: string
  authorName: string
  commentBody: string
}) {
  const isAdmin = toName === 'Admin'
  const link = isAdmin
    ? `${APP_URL}/admin/tickets/${ticketId}`
    : `${APP_URL}/portal/tickets/${ticketId}`
  try {
    await sendMail({
      to: toEmail,
      subject: `New Reply on: ${ticketTitle}`,
      html: wrap(`
        <h2 style="color:#0f1f3d">New Reply on Your Ticket</h2>
        <p>Hi ${toName},</p>
        <p><strong>${authorName}</strong> replied on <strong>"${ticketTitle}"</strong>:</p>
        <blockquote style="border-left:3px solid #2563eb;padding:8px 16px;color:#334155;background:#f8fafc;border-radius:4px;margin:16px 0">
          ${commentBody.substring(0, 400)}${commentBody.length > 400 ? '…' : ''}
        </blockquote>
        ${btn(link, 'View Ticket →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── New lead notification ──────────────────────────────────────────────────────
export async function sendNewLeadNotification({
  adminEmail, businessName, fullName, leadEmail, budget, helpType,
}: {
  adminEmail: string
  businessName: string
  fullName: string
  leadEmail: string
  budget: string
  helpType: string
}) {
  try {
    await sendMail({
      to: adminEmail,
      subject: `New Lead: ${businessName}`,
      html: wrap(`
        <h2 style="color:#0f1f3d">New Website Review Request</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${[
            ['Business', businessName],
            ['Contact', `${fullName} (${leadEmail})`],
            ['Budget', budget],
            ['Needs', helpType],
          ].map(([l, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:110px">${l}</td><td style="padding:6px 0">${v}</td></tr>`).join('')}
        </table>
        ${btn(`${APP_URL}/admin/leads`, 'View in CRM →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── Client invite ──────────────────────────────────────────────────────────────
export async function sendClientInvite({
  clientEmail, clientName, tempPassword,
}: {
  clientEmail: string
  clientName: string
  tempPassword: string
}) {
  try {
    await sendMail({
      to: clientEmail,
      subject: 'Your AG Development Client Portal Access',
      html: wrap(`
        <h2 style="color:#0f1f3d">Welcome to Your Client Portal</h2>
        <p>Hi ${clientName},</p>
        <p>Your AG Development client portal has been set up. You can now:</p>
        <ul>
          <li>Submit and track support tickets</li>
          <li>View your plan usage and time logs</li>
          <li>See before/after proof of completed work</li>
          <li>Access monthly reports and invoices</li>
        </ul>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #e2e8f0">
          <p style="margin:0"><strong>Login URL:</strong> ${APP_URL}/login</p>
          <p style="margin:8px 0 0"><strong>Email:</strong> ${clientEmail}</p>
          <p style="margin:8px 0 0"><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
        </div>
        <p style="color:#64748b;font-size:14px">Please change your password after your first login.</p>
        ${btn(`${APP_URL}/login`, 'Access Your Portal →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── New invoice notification to client ─────────────────────────────────────────
export async function sendNewInvoiceToClient({
  clientEmail, clientName, amount, billingMonth, description, dueDate,
}: {
  clientEmail: string
  clientName: string
  amount: number
  billingMonth: string
  description: string
  dueDate?: string | null
}) {
  try {
    await sendMail({
      to: clientEmail,
      subject: `New invoice from AG Development — $${amount} (${billingMonth})`,
      html: wrap(`
        <h2 style="color:#0f1f3d">New Invoice</h2>
        <p>Hi ${clientName},</p>
        <p>A new invoice has been added to your client portal.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${[
            ['Description', description],
            ['Billing month', billingMonth],
            ['Amount', `<strong>$${amount}</strong>`],
            ['Due date', dueDate || '—'],
          ].map(([l, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:130px">${l}</td><td style="padding:6px 0">${v}</td></tr>`).join('')}
        </table>
        <p>You can pay securely online with the <strong>Pay Now</strong> button in your portal.</p>
        ${btn(`${APP_URL}/portal/invoices`, 'View & Pay Invoice →')}
      `),
    })
  } catch (e) { console.error('Email error:', e) }
}

// ── Generic composed email (lead replies, admin broadcasts) ────────────────────
// Turns a plain-text message into the branded HTML template and sends it from
// the admin's OWN mailbox (personal connection). Unlike the fire-and-forget
// notifications above, this THROWS on failure so callers can tell whether the
// email actually went out.
// Rich-text editors (Quill) frequently replace ordinary spaces with
// non-breaking spaces (&nbsp; / U+00A0), especially on paste. A body where every
// word is joined by &nbsp; is a classic spam signal — Outlook/Hotmail treat it
// as content obfuscation and push the message to Junk. Normalize them back to
// real spaces (and collapse the runs that creates) before sending.
function normalizeEmailHtml(html: string): string {
  return html
    .replace(/ /g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&#x0*a0;/gi, ' ')
    .replace(/ {2,}/g, ' ')
}

export async function sendComposedEmail({
  to, subject, message, html, attachments, sender,
}: {
  to: string
  subject: string
  message?: string            // plain text (auto-formatted into paragraphs)
  html?: string               // pre-formatted HTML body (from the rich editor)
  attachments?: EmailAttachment[]
  sender: PersonalSender
}) {
  const bodyHtml = html != null
    ? html
    : (message || '')
        .split(/\n{2,}/)
        .map(p => `<p style="margin:0 0 14px;line-height:1.7">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('')

  // Composed/outreach mail needs an unsubscribe path. Its absence is penalised by
  // spam filters (mail-tester, SpamAssassin) and by Gmail/Yahoo/Outlook bulk-sender
  // rules — pushing mail to Junk. We route opt-outs to the sender's own inbox (so
  // they can honour them) via both a List-Unsubscribe header and a visible footer.
  const unsubTo = sender.replyTo || sender.from
  const unsubMailto = `mailto:${unsubTo}?subject=Unsubscribe`
  const unsubFooter = `<p style="margin:16px 0 0;line-height:1.6;color:#94a3b8;font-size:12px">Don't want to receive these emails? <a href="${unsubMailto}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>.</p>`
  const finalHtml = wrap(normalizeEmailHtml(bodyHtml) + unsubFooter)
  const headers = { 'List-Unsubscribe': `<${unsubMailto}>` }

  const cfg = await getEmailSettings()
  if (cfg.apiKey) {
    await sendViaResend(cfg.apiKey, { from: sender.from, to, replyTo: sender.replyTo || sender.from, subject, html: finalHtml, attachments, headers })
    return
  }
  if (!sender.smtp) {
    throw new Error('No email transport configured. Add a Resend API key in Settings or set up your SMTP connection.')
  }
  await buildTransport(sender.smtp).sendMail({
    from: sender.from, to, replyTo: sender.replyTo || sender.from, subject, html: finalHtml, headers,
    attachments: attachments?.map(a => ({ filename: a.filename, content: Buffer.from(a.content, 'base64'), contentType: a.contentType })),
  })
}

// Backwards-compatible alias used by the leads CRM email route.
export async function sendLeadEmail(args: {
  to: string; subject: string; message?: string; html?: string; attachments?: EmailAttachment[]; sender: PersonalSender
}) {
  return sendComposedEmail(args)
}

// Verify the shared NOTIFICATION mailbox (env SMTP_*) by sending a test message.
// Used by admin Settings → Send test email.
export async function sendNotificationTest(to: string) {
  const cfg = await getEmailSettings()
  await sendMail({
    to,
    subject: 'Test notification email from AG Development',
    html: wrap(`<p style="margin:0 0 14px;line-height:1.7">This is a test of your notification mailbox.</p>
      <p style="margin:0;line-height:1.7">From: ${cfg.notificationFrom}<br/>To: ${to}</p>`),
  })
}

// Verify a personal sender by sending a test message to the admin's own inbox.
// Throws on any failure so the UI can show the reason.
export async function sendConnectionTest(sender: PersonalSender) {
  const to = sender.replyTo || sender.from
  await sendComposedEmail({
    to,
    subject: 'Test email from your AG Development sender',
    message: `This is a test from your personal sending identity.\n\nFrom: ${sender.from}\nReplies go to: ${to}\n\nIf you're reading this, lead replies and composed emails will send correctly.`,
    sender,
  })
}

// ── Legacy alias kept for any leftover imports ─────────────────────────────────
export const sendNewTicketNotification = sendNewTicketAlertToAdmin
export const sendTicketReopenedNotification = sendTicketReopenedToAdmin

'use client'
import { useState, useEffect } from 'react'
import PortalLayout from '@/components/portal/PortalLayout'
import { Spinner } from '@/components/ui'

type Banner = { ok: boolean; text: string } | null

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [emailConfigured, setEmailConfigured] = useState(false)
  const [maskedKey, setMaskedKey] = useState('')

  const [adminEmail, setAdminEmail] = useState('')
  const [emailFrom, setEmailFrom] = useState('')
  const [notificationFrom, setNotificationFrom] = useState('')
  const [apiKey, setApiKey] = useState('')

  // Chatbot
  const [chatbotConfigured, setChatbotConfigured] = useState(false)
  const [anthropicMasked, setAnthropicMasked] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')

  // Stripe
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeSecretMasked, setStripeSecretMasked] = useState('')
  const [stripeWebhookMasked, setStripeWebhookMasked] = useState('')
  const [stripeSecret, setStripeSecret] = useState('')
  const [stripePublishable, setStripePublishable] = useState('')
  const [stripeWebhook, setStripeWebhook] = useState('')

  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setTableMissing(data.tableMissing)
        setEmailConfigured(data.email_configured)
        setMaskedKey(data.resend_api_key_masked)
        setAdminEmail(data.admin_email || '')
        setEmailFrom(data.email_from || '')
        setNotificationFrom(data.notification_from || '')
        setStripeConfigured(data.stripe_configured)
        setStripeSecretMasked(data.stripe_secret_key_masked || '')
        setStripeWebhookMasked(data.stripe_webhook_secret_masked || '')
        setStripePublishable(data.stripe_publishable_key || '')
        setChatbotConfigured(data.chatbot_configured)
        setAnthropicMasked(data.anthropic_api_key_masked || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    setBanner(null)
    try {
      const body: Record<string, string> = {}
      if (adminEmail.trim()) body.admin_email = adminEmail.trim()
      if (emailFrom.trim()) body.email_from = emailFrom.trim()
      if (notificationFrom.trim()) body.notification_from = notificationFrom.trim()
      if (apiKey.trim()) body.resend_api_key = apiKey.trim()
      if (stripeSecret.trim()) body.stripe_secret_key = stripeSecret.trim()
      if (stripePublishable.trim()) body.stripe_publishable_key = stripePublishable.trim()
      if (stripeWebhook.trim()) body.stripe_webhook_secret = stripeWebhook.trim()
      if (anthropicKey.trim()) body.anthropic_api_key = anthropicKey.trim()

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save settings')
      setBanner({ ok: true, text: 'Settings saved.' })
      setApiKey('')
      setStripeSecret('')
      setStripeWebhook('')
      setAnthropicKey('')
      // Refresh masked key / configured state
      const refreshed = await fetch('/api/settings')
      if (refreshed.ok) {
        const d = await refreshed.json()
        setMaskedKey(d.resend_api_key_masked)
        setEmailConfigured(d.email_configured)
        setStripeConfigured(d.stripe_configured)
        setStripeSecretMasked(d.stripe_secret_key_masked || '')
        setStripeWebhookMasked(d.stripe_webhook_secret_masked || '')
        setStripePublishable(d.stripe_publishable_key || '')
      }
    } catch (e) {
      setBanner({ ok: false, text: e instanceof Error ? e.message : 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  async function sendTest() {
    setTesting(true)
    setBanner(null)
    try {
      const res = await fetch('/api/settings/test-email', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Test email failed')
      setBanner({ ok: true, text: `Test email sent to ${data.to}. Check your inbox.` })
    } catch (e) {
      setBanner({ ok: false, text: e instanceof Error ? e.message : 'Test email failed' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <PortalLayout requiredRole="admin"><div className="flex justify-center py-20"><Spinner size="lg" /></div></PortalLayout>

  return (
    <PortalLayout requiredRole="admin">
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure how the admin panel sends and receives email.</p>
        </div>

        {tableMissing && (
          <div className="mb-5 px-4 py-3.5 rounded-xl text-sm leading-relaxed" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
            <strong>One-time setup needed:</strong> the <code>app_settings</code> table doesn&apos;t exist in your database yet.
            Run the &quot;APP SETTINGS&quot; section at the bottom of <code>supabase/schema.sql</code> in your Supabase SQL editor,
            then reload this page. Until then, values from <code>.env.local</code> are used.
          </div>
        )}

        {banner && (
          <div
            className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
            style={banner.ok
              ? { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }
              : { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
          >
            {banner.text}
          </div>
        )}

        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Email / Resend API</h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={emailConfigured
                ? { background: '#dcfce7', color: '#166534' }
                : { background: '#fef2f2', color: '#b91c1c' }}
            >
              {emailConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Resend API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder={maskedKey ? `Current: ${maskedKey} — enter new key to replace` : 're_xxxxxxxxxxxx'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                From <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">resend.com → API Keys</a>.
                Your sending domain (ag-development.dev) must be verified in Resend. Leave blank to keep the current key.
              </p>
            </div>

            <div>
              <label className="form-label">Notification Sender (From)</label>
              <input
                className="form-input"
                placeholder="AG Development <notification@ag-development.dev>"
                value={notificationFrom}
                onChange={e => setNotificationFrom(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Automated notifications — new subscription, new message, new lead, new ticket, invoices, client invites —
                are sent from this address via the shared notification mailbox (SMTP env vars).
              </p>
            </div>

            <div>
              <label className="form-label">Notification Recipient</label>
              <input
                type="email"
                className="form-input"
                placeholder="support@ag-development.dev"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1.5">New leads, orders, messages, and ticket alerts are emailed here.</p>
            </div>

            <div>
              <label className="form-label">Default Sender (legacy)</label>
              <input
                className="form-input"
                placeholder="AG Development <support@ag-development.dev>"
                value={emailFrom}
                onChange={e => setEmailFrom(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Fallback only. Lead replies and composed/bulk emails now send from each admin&apos;s personal
                connection, configured under Account Settings.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={save}
              disabled={saving || tableMissing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-60"
              style={{ background: '#0f1f3d' }}
            >
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
            </button>
            <button
              onClick={sendTest}
              disabled={testing}
              className="btn-ghost px-5"
            >
              {testing ? 'Sending test...' : 'Send Test Email'}
            </button>
          </div>
          {tableMissing && (
            <p className="text-xs text-slate-400 mt-3">Saving is disabled until the <code>app_settings</code> table exists.</p>
          )}
        </div>

        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Stripe / Online Payments</h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={stripeConfigured
                ? { background: '#dcfce7', color: '#166534' }
                : { background: '#fef2f2', color: '#b91c1c' }}
            >
              {stripeConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Secret Key</label>
              <input
                type="password"
                className="form-input"
                placeholder={stripeSecretMasked ? `Current: ${stripeSecretMasked} — enter new key to replace` : 'sk_live_... or sk_test_...'}
                value={stripeSecret}
                onChange={e => setStripeSecret(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                From <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Stripe Dashboard → Developers → API keys</a>. Use test keys (sk_test_) first.
              </p>
            </div>
            <div>
              <label className="form-label">Publishable Key</label>
              <input
                className="form-input"
                placeholder="pk_live_... or pk_test_..."
                value={stripePublishable}
                onChange={e => setStripePublishable(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Webhook Signing Secret</label>
              <input
                type="password"
                className="form-input"
                placeholder={stripeWebhookMasked ? `Current: ${stripeWebhookMasked} — enter new secret to replace` : 'whsec_...'}
                value={stripeWebhook}
                onChange={e => setStripeWebhook(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                In Stripe Dashboard → Developers → Webhooks, add an endpoint pointing to{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">your-domain.com/api/stripe/webhook</code>{' '}
                listening for <code className="bg-slate-100 px-1 py-0.5 rounded">checkout.session.completed</code>, then paste its signing secret here.
                Without it, payments succeed but won&apos;t be recorded in your CRM automatically.
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={save}
              disabled={saving || tableMissing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-60"
              style={{ background: '#0f1f3d' }}
            >
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Chatbot (Website)</h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={chatbotConfigured
                ? { background: '#dcfce7', color: '#166534' }
                : { background: '#fef2f2', color: '#b91c1c' }}
            >
              {chatbotConfigured ? 'Active' : 'Not configured'}
            </span>
          </div>
          <div>
            <label className="form-label">Anthropic API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder={anthropicMasked ? `Current: ${anthropicMasked} — enter new key to replace` : 'sk-ant-...'}
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              From <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">console.anthropic.com → API Keys</a>.
              Powers the chat bubble on your public website — it answers from your live plan prices. Without a key, the widget falls back to a &quot;leave a message&quot; form that goes to your Leads.
            </p>
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={save}
              disabled={saving || tableMissing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-sm text-white rounded-lg transition-all disabled:opacity-60"
              style={{ background: '#0f1f3d' }}
            >
              {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">How it works</h3>
          <ul className="text-sm text-slate-600 space-y-2 leading-relaxed list-disc pl-4">
            <li>Values saved here are stored in your database and take effect within 30 seconds — no redeploy needed.</li>
            <li>If a field is empty here, the app falls back to the value in <code>.env.local</code> / server environment.</li>
            <li>Use <strong>Send Test Email</strong> after saving to confirm your key and domain are working.</li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  )
}

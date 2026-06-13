-- ============================================================
-- AG Development — pending migrations (safe to run repeatedly)
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- 1) Public lead form inserts (fixes "violates row-level security")
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (TRUE);

-- 2) Clients can see admin names/avatars in tickets & activity
DROP POLICY IF EXISTS "Authenticated users can view admin names" ON profiles;
CREATE POLICY "Authenticated users can view admin names" ON profiles FOR SELECT USING (role = 'admin');

-- 3) App settings (email/Stripe config from the admin panel)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (get_user_role() = 'admin');
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4) Sellable plans (editable cards, prices, sales)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  billing_interval TEXT CHECK (billing_interval IN ('month')),
  sale_price INTEGER,
  sale_active BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS good_for TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS delivery TEXT;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plans" ON plans;
CREATE POLICY "Anyone can view plans" ON plans FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Admins manage plans" ON plans;
CREATE POLICY "Admins manage plans" ON plans FOR ALL USING (get_user_role() = 'admin');
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO plans (id, name, description, category, price, billing_interval, sale_price, sale_active, sort) VALUES
  ('starter-site',    'Starter Site',       '1-page professional website',                'Website Build', 200, NULL,    150, TRUE,  1),
  ('business-site',   'Business Site',      'Up to 5 pages — most popular',               'Website Build', 300, NULL,    250, TRUE,  2),
  ('premium-site',    'Premium Site',       'Up to 8 pages with blog & advanced SEO',     'Website Build', 450, NULL,    350, TRUE,  3),
  ('ecommerce-store', 'E-commerce Store',   'Shopify or WooCommerce store setup',         'Website Build', 800, NULL,    600, TRUE,  4),
  ('basic-care',      'Basic Care Plan',    'Hosting, backups & security updates',        'Website Care',  29,  'month', NULL, FALSE, 5),
  ('content-care',    'Content Care Plan',  '+ 30 min/month content updates',             'Website Care',  49,  'month', NULL, FALSE, 6),
  ('growth-care',     'Growth Care Plan',   '+ 1 hour/month website updates',             'Website Care',  100, 'month', NULL, FALSE, 7),
  ('full-care',       'Full Care Plan',     '+ 2 hours/month, priority support',          'Website Care',  150, 'month', NULL, FALSE, 8),
  ('it-basic',        'L1 Basic Support',   '3 tickets/mo, up to 2 users',                'IT Support',    49,  'month', NULL, FALSE, 9),
  ('it-team',         'L1 Team Support',    '8 tickets/mo, up to 5 users',                'IT Support',    99,  'month', NULL, FALSE, 10),
  ('it-office',       'L1 Office Support',  '15 tickets/mo, up to 10 users',              'IT Support',    179, 'month', NULL, FALSE, 11),
  ('social-starter',  'Social Starter',     '2 posts/stories per month',                  'Social Media',  29,  'month', NULL, FALSE, 12),
  ('social-business', 'Social Business',    '6 posts + 1 banner per month',               'Social Media',  59,  'month', NULL, FALSE, 13),
  ('social-growth',   'Social Growth',      '12 posts + 2 banners per month',             'Social Media',  99,  'month', NULL, FALSE, 14)
ON CONFLICT (id) DO NOTHING;

-- 4b) Plan period tracking (plan lasts 1 month from order/assignment)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 4c) Extra credits product (purchasable when plan credits run out)
INSERT INTO plans (id, name, description, category, price, billing_interval, sale_price, sale_active, sort) VALUES
  ('extra-hour', 'Extra Support Hour', '1 additional support hour for your current plan period', 'IT Support', 39, NULL, NULL, FALSE, 99)
ON CONFLICT (id) DO NOTHING;

-- 4d) Client support packages: allow fractional hours (e.g. 0.5h = 30 min)
ALTER TABLE support_packages ALTER COLUMN hours_per_month TYPE NUMERIC;

-- 4e) Make every public subscription plan assignable to clients
--     (skips any name that already exists — safe to re-run)
INSERT INTO support_packages (name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
SELECT v.* FROM (VALUES
  ('Basic Care',        29,  1,  0,   'Within 2 business days',  39, TRUE),
  ('Content Care',      49,  3,  0.5, 'Within 1 business day',   39, TRUE),
  ('Growth Care',       100, 5,  1,   'Within 8 business hours', 10, TRUE),
  ('Full Care',         150, 8,  2,   'Within 4 business hours', 10, TRUE),
  ('L1 Basic Support',  49,  3,  2,   'Within 24 hours',         39, TRUE),
  ('L1 Team Support',   99,  8,  5,   'Within 24 hours',         39, TRUE),
  ('L1 Office Support', 179, 15, 10,  'Within 8 business hours', 10, TRUE)
) AS v(name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
WHERE NOT EXISTS (SELECT 1 FROM support_packages sp WHERE sp.name = v.name);

-- 4f) Align legacy "Basic Care" with the public site price + add Social plans
UPDATE support_packages
SET price = 29, requests_per_month = 1, hours_per_month = 0,
    response_time = 'Within 2 business days', extra_hourly_rate = 10
WHERE name = 'Basic Care';

INSERT INTO support_packages (name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
SELECT v.* FROM (VALUES
  ('Social Starter',  29, 2,  0, 'Within 1 business day', 10, TRUE),
  ('Social Business', 59, 7,  0, 'Within 1 business day', 10, TRUE),
  ('Social Growth',   99, 14, 0, 'Within 1 business day', 10, TRUE)
) AS v(name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
WHERE NOT EXISTS (SELECT 1 FROM support_packages sp WHERE sp.name = v.name);

-- 4g) Website builds as assignable packages (one-time projects, no monthly credits)
INSERT INTO support_packages (name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
SELECT v.* FROM (VALUES
  ('Starter Site (one-time build)',    150, 0, 0, 'Within 1 business day', 10, TRUE),
  ('Business Site (one-time build)',   250, 0, 0, 'Within 1 business day', 10, TRUE),
  ('Premium Site (one-time build)',    350, 0, 0, 'Within 1 business day', 10, TRUE),
  ('E-commerce Store (one-time build)', 600, 0, 0, 'Within 1 business day', 10, TRUE)
) AS v(name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate, is_active)
WHERE NOT EXISTS (SELECT 1 FROM support_packages sp WHERE sp.name = v.name);

-- 4h) Custom plan builder: package descriptions + manageable Extras
ALTER TABLE support_packages ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE plans SET category = 'Extras' WHERE id = 'extra-hour';
INSERT INTO plans (id, name, description, category, price, billing_interval, sale_price, sale_active, sort) VALUES
  ('extra-page',   'Extra Website Page',   'One additional page added to your website', 'Extras', 79, NULL, NULL, FALSE, 100),
  ('extra-ticket', 'Extra Support Ticket', 'One additional support request',            'Extras', 15, NULL, NULL, FALSE, 101)
ON CONFLICT (id) DO NOTHING;

-- 4i) Per-client extras ledger (track usage of purchased extras)
CREATE TABLE IF NOT EXISTS client_extras (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  qty_total INTEGER NOT NULL DEFAULT 1,
  qty_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE client_extras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage client extras" ON client_extras;
CREATE POLICY "Admins manage client extras" ON client_extras FOR ALL USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "Clients view own extras" ON client_extras;
CREATE POLICY "Clients view own extras" ON client_extras FOR SELECT USING (client_id = get_user_client_id());

-- 4j) Default extra-work rate is $10/hr (was $39/hr)
UPDATE support_packages SET extra_hourly_rate = 10 WHERE extra_hourly_rate = 39;
UPDATE plans SET price = 10 WHERE id = 'extra-hour' AND price = 39;

-- 4k) Typed extras: each extra grants hours, tickets, or deliverable items
ALTER TABLE plans ADD COLUMN IF NOT EXISTS grant_type TEXT; -- 'hours' | 'tickets' | 'items'
ALTER TABLE plans ADD COLUMN IF NOT EXISTS grant_qty NUMERIC DEFAULT 1;
UPDATE plans SET grant_type = 'hours',   grant_qty = 1 WHERE id = 'extra-hour'   AND grant_type IS NULL;
UPDATE plans SET grant_type = 'tickets', grant_qty = 1 WHERE id = 'extra-ticket' AND grant_type IS NULL;
UPDATE plans SET grant_type = 'items',   grant_qty = 1 WHERE id = 'extra-page'   AND grant_type IS NULL;

-- Structured extras composition on custom packages
ALTER TABLE support_packages ADD COLUMN IF NOT EXISTS extras JSONB;

-- Unit on the client ledger so the portal can show "hours left" vs "tickets left"
ALTER TABLE client_extras ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'items';

-- 5) Discount coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  percent_off INTEGER CHECK (percent_off BETWEEN 1 AND 100),
  amount_off INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_redemptions INTEGER,
  redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage coupons" ON coupons;
CREATE POLICY "Admins manage coupons" ON coupons FOR ALL USING (get_user_role() = 'admin');

-- 6) Direct messages: allow a "Message" ticket category so clients (even with an
-- expired plan) and admins can message each other. Free, doesn't use credits.
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_category_check CHECK (category IN (
  'Website Issue','WordPress','Shopify','Domain/DNS',
  'Business Email','New Feature Request','General IT Support','Message'
));

-- 7) Notifications (in-app bell + unread message/lead/invoice badges).
-- Idempotent: safe to run whether or not the table already exists.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','urgent')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Live updates so the bell + badges refresh instantly
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8) Per-side message deletion: hiding a message removes it for one party only.
-- When both sides have hidden it, the app deletes the row for real.
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS hidden_for_admin  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS hidden_for_client BOOLEAN NOT NULL DEFAULT FALSE;

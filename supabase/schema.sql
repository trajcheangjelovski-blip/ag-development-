-- ============================================================
-- AG Development Platform — Supabase Database Schema
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with role and client info
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  client_id UUID, -- set after client record is created
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUPPORT PACKAGES ────────────────────────────────────────────────────────
CREATE TABLE support_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- in dollars
  requests_per_month INTEGER NOT NULL,
  hours_per_month INTEGER NOT NULL, -- included support hours
  response_time TEXT NOT NULL,
  extra_hourly_rate INTEGER NOT NULL, -- extra work beyond package
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  package_id UUID REFERENCES support_packages(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADS ───────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  website TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  help_type TEXT NOT NULL,
  budget TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Contacted','Proposal Sent','Won','Lost')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKETS ─────────────────────────────────────────────────────────────────
CREATE TABLE tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Website Issue','WordPress','Shopify','Domain/DNS',
    'Business Email','New Feature Request','General IT Support'
  )),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
  description TEXT NOT NULL,
  affected_site TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN (
    'Open','In Progress','Waiting Client','Completed','Closed'
  )),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TICKET COMMENTS ─────────────────────────────────────────────────────────
CREATE TABLE ticket_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'public' CHECK (comment_type IN ('public','internal')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TIME ENTRIES ─────────────────────────────────────────────────────────────
CREATE TABLE time_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  logged_by UUID REFERENCES profiles(id) NOT NULL,
  work_date DATE NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  work_note TEXT NOT NULL,
  is_billable BOOLEAN DEFAULT FALSE,
  is_included_in_package BOOLEAN DEFAULT TRUE,
  billing_month TEXT NOT NULL, -- format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROOF UPLOADS ───────────────────────────────────────────────────────────
CREATE TABLE proof_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  before_note TEXT,
  after_note TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  video_link TEXT,
  completion_note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL, -- e.g. "Ticket created", "Status changed"
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MONTHLY REPORTS ──────────────────────────────────────────────────────────
CREATE TABLE monthly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  report_month TEXT NOT NULL, -- format: YYYY-MM
  completed_tickets INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  website_updates TEXT,
  recommendations TEXT,
  next_improvements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, report_month)
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  billing_month TEXT NOT NULL, -- format: YYYY-MM
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in dollars
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Paid','Overdue','Cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — Default packages
-- ============================================================
INSERT INTO support_packages (name, price, requests_per_month, hours_per_month, response_time, extra_hourly_rate) VALUES
  ('Basic Care', 99, 2, 1, '48 hours', 40),
  ('Business Care', 199, 5, 3, '24–48 hours', 35),
  ('Priority Care', 399, 10, 6, '24 hours', 30);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_packages ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: get current user client_id
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Authenticated users can view admin names" ON profiles FOR SELECT USING (role = 'admin');
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- SUPPORT PACKAGES (public read)
CREATE POLICY "Anyone can view packages" ON support_packages FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage packages" ON support_packages FOR ALL USING (get_user_role() = 'admin');

-- CLIENTS
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own record" ON clients FOR SELECT USING (id = get_user_client_id());

-- LEADS
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can manage leads" ON leads FOR ALL USING (get_user_role() = 'admin');

-- TICKETS
CREATE POLICY "Admins can manage all tickets" ON tickets FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own tickets" ON tickets FOR SELECT USING (client_id = get_user_client_id());
CREATE POLICY "Clients can create tickets" ON tickets FOR INSERT WITH CHECK (client_id = get_user_client_id());

-- TICKET COMMENTS
CREATE POLICY "Admins can manage all comments" ON ticket_comments FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view public comments on own tickets" ON ticket_comments FOR SELECT
  USING (comment_type = 'public' AND ticket_id IN (
    SELECT id FROM tickets WHERE client_id = get_user_client_id()
  ));
CREATE POLICY "Clients can add comments to own tickets" ON ticket_comments FOR INSERT
  WITH CHECK (ticket_id IN (SELECT id FROM tickets WHERE client_id = get_user_client_id()));

-- TIME ENTRIES
CREATE POLICY "Admins can manage time entries" ON time_entries FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own time entries" ON time_entries FOR SELECT USING (client_id = get_user_client_id());

-- PROOF UPLOADS
CREATE POLICY "Admins can manage proof uploads" ON proof_uploads FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view proof on own tickets" ON proof_uploads FOR SELECT
  USING (ticket_id IN (SELECT id FROM tickets WHERE client_id = get_user_client_id()));

-- ACTIVITY LOGS
CREATE POLICY "Admins can view all activity" ON activity_logs FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own activity" ON activity_logs FOR SELECT USING (client_id = get_user_client_id());

-- MONTHLY REPORTS
CREATE POLICY "Admins can manage reports" ON monthly_reports FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own reports" ON monthly_reports FOR SELECT USING (client_id = get_user_client_id());

-- INVOICES
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Clients can view own invoices" ON invoices FOR SELECT USING (client_id = get_user_client_id());

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- APP SETTINGS (admin-configurable, e.g. email/Resend config)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (get_user_role() = 'admin');
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKET for proof screenshots
-- Run separately in Supabase Dashboard → Storage
-- ============================================================
-- CREATE BUCKET: "proof-uploads" (public: false)
-- CREATE BUCKET: "avatars" (public: true)

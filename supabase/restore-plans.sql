-- ============================================================================
-- RESTORE all plans into the `plans` table so it is COMPLETE.
-- Fixes the "all plans disappeared" issue: once the table has every plan,
-- editing one plan no longer hides the others.
-- Safe to re-run. Run in the Supabase SQL editor.
-- ============================================================================

insert into plans (id, name, description, category, price, billing_interval, is_active, sale_active, sort) values
  ('starter-site',    'Starter Site',       '1-page professional website',                            'Website Build', 150, null,    true, false, 0),
  ('business-site',   'Business Site',      'Up to 5 pages — most popular',                           'Website Build', 250, null,    true, false, 1),
  ('premium-site',    'Premium Site',       'Up to 8 pages with blog & advanced SEO',                 'Website Build', 350, null,    true, false, 2),
  ('ecommerce-store', 'E-commerce Store',   'Shopify or WooCommerce store setup',                     'Website Build', 600, null,    true, false, 3),
  ('basic-care',      'Basic Care Plan',    'Hosting, backups & security updates',                    'Website Care',   29, 'month', true, false, 4),
  ('content-care',    'Content Care Plan',  '+ 30 min/month content updates',                         'Website Care',   49, 'month', true, false, 5),
  ('growth-care',     'Growth Care Plan',   '+ 1 hour/month website updates',                         'Website Care',  100, 'month', true, false, 6),
  ('full-care',       'Full Care Plan',     '+ 2 hours/month, priority support',                      'Website Care',  150, 'month', true, false, 7),
  ('it-basic',        'L1 Basic Support',   '3 tickets/mo, up to 2 users',                            'IT Support',     49, 'month', true, false, 8),
  ('it-team',         'L1 Team Support',    '8 tickets/mo, up to 5 users',                            'IT Support',     99, 'month', true, false, 9),
  ('it-office',       'L1 Office Support',  '15 tickets/mo, up to 10 users',                          'IT Support',    179, 'month', true, false, 10),
  ('extra-hour',      'Extra Support Hour', '1 additional support hour for your current plan period', 'IT Support',     39, null,    true, false, 11),
  ('social-starter',  'Social Starter',     '2 posts/stories per month',                              'Social Media',   29, 'month', true, false, 12),
  ('social-business', 'Social Business',    '6 posts + 1 banner per month',                           'Social Media',   59, 'month', true, false, 13),
  ('social-growth',   'Social Growth',      '12 posts + 2 banners per month',                         'Social Media',   99, 'month', true, false, 14)
on conflict (id) do update set
  name            = excluded.name,
  description     = excluded.description,
  category        = excluded.category,
  price           = excluded.price,
  billing_interval = excluded.billing_interval,
  is_active       = true,
  sale_active     = false,
  sort            = excluded.sort;

-- Remove the Macedonian table for now — we'll add MK pricing properly later.
drop table if exists plans_mk;

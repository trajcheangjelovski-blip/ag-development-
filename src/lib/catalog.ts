// Single source of truth for everything purchasable on the site.
// Prices in USD. interval 'month' = recurring subscription, null = one-time.

export type CatalogItem = {
  id: string
  name: string
  price: number
  interval: 'month' | null
  category: 'Website Build' | 'Website Care' | 'IT Support' | 'Social Media'
  description: string
}

export const CATALOG: CatalogItem[] = [
  // One-time website builds
  { id: 'starter-site', name: 'Starter Site', price: 150, interval: null, category: 'Website Build', description: '1-page professional website' },
  { id: 'business-site', name: 'Business Site', price: 250, interval: null, category: 'Website Build', description: 'Up to 5 pages — most popular' },
  { id: 'premium-site', name: 'Premium Site', price: 350, interval: null, category: 'Website Build', description: 'Up to 8 pages with blog & advanced SEO' },
  { id: 'ecommerce-store', name: 'E-commerce Store', price: 600, interval: null, category: 'Website Build', description: 'Shopify or WooCommerce store setup' },

  // Monthly website care plans (hosting included)
  { id: 'basic-care', name: 'Basic Care Plan', price: 29, interval: 'month', category: 'Website Care', description: 'Hosting, backups & security updates' },
  { id: 'content-care', name: 'Content Care Plan', price: 49, interval: 'month', category: 'Website Care', description: '+ 30 min/month content updates' },
  { id: 'growth-care', name: 'Growth Care Plan', price: 100, interval: 'month', category: 'Website Care', description: '+ 1 hour/month website updates' },
  { id: 'full-care', name: 'Full Care Plan', price: 150, interval: 'month', category: 'Website Care', description: '+ 2 hours/month, priority support' },

  // Monthly L1 IT support
  { id: 'it-basic', name: 'L1 Basic Support', price: 49, interval: 'month', category: 'IT Support', description: '3 tickets/mo, up to 2 users' },
  { id: 'it-team', name: 'L1 Team Support', price: 99, interval: 'month', category: 'IT Support', description: '8 tickets/mo, up to 5 users' },
  { id: 'it-office', name: 'L1 Office Support', price: 179, interval: 'month', category: 'IT Support', description: '15 tickets/mo, up to 10 users' },

  // Extra credits (one-time top-up when plan credits run out)
  { id: 'extra-hour', name: 'Extra Support Hour', price: 39, interval: null, category: 'IT Support', description: '1 additional support hour for your current plan period' },

  // Monthly social media & design
  { id: 'social-starter', name: 'Social Starter', price: 29, interval: 'month', category: 'Social Media', description: '2 posts/stories per month' },
  { id: 'social-business', name: 'Social Business', price: 59, interval: 'month', category: 'Social Media', description: '6 posts + 1 banner per month' },
  { id: 'social-growth', name: 'Social Growth', price: 99, interval: 'month', category: 'Social Media', description: '12 posts + 2 banners per month' },
]

export function getCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find(i => i.id === id)
}

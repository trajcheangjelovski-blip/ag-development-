import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website Care Plans',
  description: 'Monthly website maintenance and hosting plans. Backups, security, updates, and more. Starting at $29/mo. Cancel anytime.',
  keywords: ['website maintenance plan', 'website care plan', 'monthly website support', 'website hosting and maintenance'],
  openGraph: {
    title: 'Website Care Plans — AG Development',
    description: 'Monthly website maintenance, hosting, and support plans from $29/mo.',
    url: 'https://ag-development.dev/order/website-care',
  },
  alternates: { canonical: 'https://ag-development.dev/order/website-care' },
}

export default function WebsiteCareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

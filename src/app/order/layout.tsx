import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order a Service',
  description: 'Order a website, care plan, IT support, or social media design plan from AG Development. Simple checkout, no contracts.',
  openGraph: {
    title: 'Order — AG Development',
    description: 'Choose your plan and get started. Website, IT support, or social media design.',
    url: 'https://ag-development.dev/order',
  },
  alternates: { canonical: 'https://ag-development.dev/order' },
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IT Support Plans',
  description: 'Monthly remote IT support for small business teams. Password resets, software issues, printers, and more. Plans from $49/mo.',
  keywords: ['remote IT support small business', 'monthly IT support plan', 'small business tech support', 'helpdesk for small business'],
  openGraph: {
    title: 'IT Support Plans — AG Development',
    description: 'Remote IT support for small business teams. From $49/mo.',
    url: 'https://ag-development.dev/order/it-support',
  },
  alternates: { canonical: 'https://ag-development.dev/order/it-support' },
}

export default function ITSupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

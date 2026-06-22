import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'See a Demo of Your Website for Your Business',
  description: 'Get a free custom website demo built for your business by AG Development — no cost, no commitment. See what your new site could look like.',
  openGraph: {
    title: 'See a Demo of Your Website for Your Business — AG Development',
    description: 'Request a free custom website demo built for your business. See what your new site could look like before you commit.',
    url: 'https://ag-development.dev/review',
  },
  alternates: { canonical: 'https://ag-development.dev/review' },
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

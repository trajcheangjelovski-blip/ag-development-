import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Website Review',
  description: 'Get a free website review from AG Development. We\'ll identify issues, recommend improvements, and tell you exactly what we can fix.',
  openGraph: {
    title: 'Free Website Review — AG Development',
    description: 'Request a free website audit. We\'ll identify problems and recommend the right plan.',
    url: 'https://ag-development.dev/review',
  },
  alternates: { canonical: 'https://ag-development.dev/review' },
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

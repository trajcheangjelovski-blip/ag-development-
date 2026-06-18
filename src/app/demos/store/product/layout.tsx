import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oversized Cotton Tee — Urban Threads (Demo)',
  description: 'Product detail demo page. Demo store by AG Development.',
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

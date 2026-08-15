import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with AG Development. Remote tech support for small businesses — response within 3 hours.',
  openGraph: {
    title: 'Contact AG Development',
    description: 'Reach out for website help, IT support, or design services. We respond within 3 hours.',
    url: 'https://ag-development.dev/contact',
  },
  alternates: { canonical: 'https://ag-development.dev/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

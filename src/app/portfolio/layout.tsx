import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Social media posts, logos & branding, banners, ads, and print design work by AG Development for small businesses.',
  openGraph: {
    title: 'Portfolio — AG Development',
    description: 'Design work including social media posts, logos, banners, and print materials.',
    url: 'https://ag-development.dev/portfolio',
  },
  alternates: { canonical: 'https://ag-development.dev/portfolio' },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Social Media & Design Plans',
  description: 'Monthly branded social media content and graphic design for small businesses. Custom posts, stories, and banners. Starting at $29/mo.',
  keywords: ['social media design small business', 'monthly graphic design', 'social media content creation', 'branded social posts'],
  openGraph: {
    title: 'Social Media & Design Plans — AG Development',
    description: 'Monthly branded social media content and graphics for small businesses. From $29/mo.',
    url: 'https://ag-development.dev/order/social-media',
  },
  alternates: { canonical: 'https://ag-development.dev/order/social-media' },
}

export default function SocialMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

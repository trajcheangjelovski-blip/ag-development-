import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderSocial.meta' })
  return {
    title: t('title'),
    description: t('description'),
    keywords: ['social media design small business', 'monthly graphic design', 'social media content creation', 'branded social posts'],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/order/social-media',
    },
    alternates: { canonical: 'https://ag-development.dev/order/social-media' },
  }
}

export default function SocialMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

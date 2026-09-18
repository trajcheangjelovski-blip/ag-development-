import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderCare.meta' })
  return {
    title: t('title'),
    description: t('description'),
    keywords: ['website maintenance plan', 'website care plan', 'monthly website support', 'website hosting and maintenance'],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/order/website-care',
    },
    alternates: { canonical: 'https://ag-development.dev/order/website-care' },
  }
}

export default function WebsiteCareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

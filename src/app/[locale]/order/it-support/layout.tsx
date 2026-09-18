import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderIt.meta' })
  return {
    title: t('title'),
    description: t('description'),
    keywords: ['remote IT support small business', 'monthly IT support plan', 'small business tech support', 'helpdesk for small business'],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/order/it-support',
    },
    alternates: { canonical: 'https://ag-development.dev/order/it-support' },
  }
}

export default function ITSupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

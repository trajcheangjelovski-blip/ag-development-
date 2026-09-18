import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderPage.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/order',
    },
    alternates: { canonical: 'https://ag-development.dev/order' },
  }
}

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

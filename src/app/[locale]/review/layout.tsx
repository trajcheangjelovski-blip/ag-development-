import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'reviewPage.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://ag-development.dev/review',
    },
    alternates: { canonical: 'https://ag-development.dev/review' },
  }
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

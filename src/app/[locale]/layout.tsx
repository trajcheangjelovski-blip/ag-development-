import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { CartProvider } from '@/components/public/Cart'
import { ChatWidget } from '@/components/public/ChatWidget'
import { routing } from '@/i18n/routing'
import '../globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ag-development.dev'),
  title: {
    default: 'AG Development — Websites, IT Support & Design for Small Businesses',
    template: '%s | AG Development',
  },
  description: 'Reliable websites, IT support, email setup, social media design, and digital growth for small businesses — remote, transparent, and affordable.',
  keywords: ['website development', 'IT support small business', 'remote IT support', 'WordPress', 'Shopify', 'social media design', 'website maintenance', 'small business tech support', 'AG Development'],
  authors: [{ name: 'AG Development', url: 'https://ag-development.dev' }],
  creator: 'AG Development',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ag-development.dev',
    siteName: 'AG Development',
    title: 'AG Development — Websites, IT Support & Design for Small Businesses',
    description: 'Reliable websites, IT support, email setup, social media design, and digital growth for small businesses — remote, transparent, and affordable.',
    images: [{
      url: '/og.png',
      width: 1200,
      height: 630,
      alt: 'AG Development — Websites & reliable IT support for small businesses',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AG Development — Websites, IT Support & Design for Small Businesses',
    description: 'Reliable websites, IT support, and digital growth for small businesses.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: 'https://ag-development.dev' },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AG Development',
  url: 'https://ag-development.dev',
  logo: 'https://ag-development.dev/logo.svg',
  description: 'Websites, IT support, social media design, and digital growth for small businesses.',
  email: 'support@ag-development.dev',
  sameAs: [],
  serviceArea: { '@type': 'AdministrativeArea', name: 'United States' },
}

// Pre-render both locales at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Enable static rendering for this locale.
  setRequestLocale(locale)

  // Messages for client components.
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Q0Q8676Q4Y" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Q0Q8676Q4Y');
        `}</Script>
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1530035378526716');
          fbq('track', 'PageView');
        `}</Script>
        <noscript><img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1530035378526716&ev=PageView&noscript=1"
          alt="" /></noscript>
        <NextIntlClientProvider messages={messages}>
          <CartProvider>{children}<ChatWidget /></CartProvider>
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import Script from 'next/script'
import { CartProvider } from '@/components/public/Cart'
import { ChatWidget } from '@/components/public/ChatWidget'
import './globals.css'

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AG Development — Websites, IT Support & Design for Small Businesses',
    description: 'Reliable websites, IT support, and digital growth for small businesses.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Q0Q8676Q4Y" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Q0Q8676Q4Y');
        `}</Script>
        <CartProvider>{children}<ChatWidget /></CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </body>
    </html>
  )
}

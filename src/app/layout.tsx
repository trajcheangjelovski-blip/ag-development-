import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { CartProvider } from '@/components/public/Cart'
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
  title: 'AG Development — Websites & Remote IT Support for Small Businesses',
  description: 'Get reliable help with your website, email, domain, Shopify, WordPress, and basic tech issues without hiring full-time IT.',
  keywords: 'website support, IT support, WordPress, Shopify, small business, remote IT',
  openGraph: {
    title: 'AG Development',
    description: 'Websites & Remote IT Support for Small Businesses',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans antialiased"><CartProvider>{children}</CartProvider></body>
    </html>
  )
}

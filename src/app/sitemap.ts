import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://ag-development.dev'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/review`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/order/website-care`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/order/it-support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/order/social-media`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}

import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  const routes = [
    '', // Homepage
    '/about',
    '/contact',
    '/products',
    '/blog',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/confirm-email',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}

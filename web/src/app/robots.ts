import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const allowCrawling = process.env.NEXT_PUBLIC_ALLOW_CRAWLING === 'true';
  const siteUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  return {
    rules: allowCrawling
      ? {
          userAgent: '*',
          allow: '/',
        }
      : {
          userAgent: '*',
          disallow: '/',
        },
    sitemap: allowCrawling ? `${siteUrl}/sitemap.xml` : undefined,
  };
}

/*
  robots.txt generation per Document 4 Section 10.2.

  Allows all crawling, points to the sitemap, blocks /api/.
*/

import type { MetadataRoute } from 'next';

const SITE_URL = 'https://furnish.live';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

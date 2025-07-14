// src/app/sitemap.ts

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://zeinte.com'; // Replace with your final domain

export default function sitemap(): MetadataRoute.Sitemap {
  // Add any other public static routes here
  const staticRoutes = [
    '', // Home page
    '/legal/terms',
    '/legal/privacy',
    '/legal/cookies',
    '/pricing',
    '/login',
    '/signup',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route === '' ? '/' : `/${route}`}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly', // Home page might change more often
    priority: route === '' ? 1.0 : 0.8, // Home page is highest priority
  }));

  return sitemapEntries;
}

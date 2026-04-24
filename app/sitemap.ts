import { MetadataRoute } from 'next';

const BASE_URL = 'https://gevabal.mn';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch Dynamic Data
  // We need to fetch all monks to generate their URLs
  let monks = [];
  try {
    // In build time or runtime, we need absolute URL
    // If building, localhost might not work unless server is running. 
    // Ideally we check if we can fetch.
    // For static generation, this might fail if API isn't up. 
    // We will assume this runs at runtime or revalidates.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production to generate sitemap safely over HTTPS.');
    }
    const res = await fetch(`${baseUrl}/api/monks`, { next: { revalidate: 3600 } });
    if (res.ok) {
      monks = await res.json();
    }
  } catch (e) {
    console.error("Sitemap fetch error", e);
  }

  // 2. Generate Monk URLs for both locales
  const monkUrls = monks.flatMap((monk: any) => [
    {
      url: `${BASE_URL}/mn/monks/${monk._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/en/monks/${monk._id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  ]);

  // 3. Static Routes (Double for locales)
  const routes = ['', '/about', '/services', '/sign-in', '/monks'].flatMap(route => [
    {
      url: `${BASE_URL}/mn${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    },
    {
      url: `${BASE_URL}/en${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8,
    }
  ]);

  return [...routes, ...monkUrls];
}
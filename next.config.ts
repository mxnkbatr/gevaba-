import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  /**
   * Custom `webpack` below (async WebAssembly) matches production (`next build --webpack`).
   * Default `next dev` in Next 16 uses Turbopack; use `npm run dev` (--webpack) so dev matches build
   * and this warning stays off: "webpack config and no turbopack config".
   */
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  // Keep dev tooling away from the floating tab bar (bottom-left overlaps UX)
  devIndicators: {
    position: "top-right",
  },

  // Allow cross-origin requests from 127.0.0.1 during local development
  allowedDevOrigins: [
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://192.168.1.14",
    "http://192.168.1.14:3000",
  ],

  // Performance optimizations
  experimental: {
    // Tree-shake icon libraries and animation libraries
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@clerk/nextjs",
      "react-hot-toast",
    ],
    /** Client router cache (seconds): fewer full RSC refetches after prefetch / revisit */
    staleTimes: {
      dynamic: 90,
      static: 300,
    },
  },
  compiler: {
    // Remove console.log in production for cleaner output
    removeConsole:
      process.env.NODE_ENV === "production" ||
      process.env.CAPACITOR_BUILD === "true",
  },

  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
  skipProxyUrlNormalize: true,
  images: {
    dangerouslyAllowSVG: false,
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
    formats: ["image/avif", "image/webp"],
    // Device sizes optimized for common breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      // Avatar / mock data
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Unsplash — used by seed-shop.ts product images
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudinary — full wildcard under our cloud account
      // Covers /image/upload/**, /video/upload/**, etc.
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/dc127wztz/**" },
      // Clerk user avatars
      { protocol: "https", hostname: "img.clerk.com" },
      // Placeholder fallback images used in dev
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    if (config.output) {
      config.output.environment = {
        ...config.output.environment,
        asyncFunction: true,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              // Keep CSP compatible with Next.js (avoid breaking inline scripts) while still
              // meeting store security requirements around clickjacking / embedding.
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

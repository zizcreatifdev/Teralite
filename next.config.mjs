/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Compression activée par défaut dans Next.js
  compress: true,
  // Pas de /x-powered-by header
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Headers de sécurité sur toutes les pages
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval nécessaire pour recharts/react-pdf, unsafe-inline pour Next.js HMR + Google Analytics
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              // Google Analytics + PayDunya
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://app.paydunya.com https://paydunya.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Cache long pour les assets statiques Next.js (_next/static)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache pour les images optimisées Next.js
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
      {
        // Cache pour les fichiers publics statiques (logos, icons)
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
      {
        // Cache moderé pour les pages catalogue (ISR gère la fraîcheur)
        source: '/produits(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=600' },
        ],
      },
    ]
  },
}

export default nextConfig

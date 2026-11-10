import type { NextConfig } from 'next';

/** Arquivos de `public/` não têm hash no nome: cache de 1 dia + revalidação em segundo plano. */
const PUBLIC_ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';
/** Uploads usam UUID novo por arquivo: nunca mudam, podem ficar em cache por 1 ano. */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

const nextConfig: NextConfig = {
  // 'standalone' output is only needed for the self-hosted Docker build (see Dockerfile).
  // On Vercel it breaks the build's output-file-tracing step, so skip it there.
  output: process.env.VERCEL ? undefined : 'standalone',

  // Gzip no servidor Node (Docker/standalone). Na Vercel a borda já serve Brotli/gzip.
  compress: true,
  poweredByHeader: false,

  // React Compiler: memoização automática de componentes/hooks (menos re-render).
  reactCompiler: true,

  experimental: {
    // Importa só os módulos usados de bibliotecas com muitos re-exports.
    optimizePackageImports: [
      '@mui/material',
      '@mui/x-date-pickers',
      'lucide-react',
      'date-fns',
      'recharts',
    ],
  },

  images: {
    // AVIF primeiro (menor), WebP como alternativa; o navegador escolhe pelo `Accept`.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      // Uploads dos templates de notificação no Vercel Blob.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: IMMUTABLE_CACHE }],
      },
      {
        source: '/:file*.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff2)',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET_CACHE }],
      },
    ];
  },

  // Turbopack's native file watcher doesn't pick up changes through the Windows bind
  // mount used by docker-compose, so file edits never trigger a recompile in dev.
  // WATCHPACK_POLLING (set in docker-compose.yml) was for Webpack and has no effect
  // on Turbopack, which instead needs watchOptions.pollIntervalMs.
  ...(process.env.WATCHPACK_POLLING === 'true' && {
    watchOptions: {
      pollIntervalMs: 1000,
    },
  }),
};

export default nextConfig;

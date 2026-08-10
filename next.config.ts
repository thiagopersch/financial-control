import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // 'standalone' output is only needed for the self-hosted Docker build (see Dockerfile).
  // On Vercel it breaks the build's output-file-tracing step, so skip it there.
  output: process.env.VERCEL ? undefined : 'standalone',
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

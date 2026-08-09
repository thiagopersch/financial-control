import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // 'standalone' output is only needed for the self-hosted Docker build (see Dockerfile).
  // On Vercel it breaks the build's output-file-tracing step, so skip it there.
  output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;

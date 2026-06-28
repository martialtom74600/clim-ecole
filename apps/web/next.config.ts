import type { NextConfig } from 'next';
import path from 'path';
import { loadEnvConfig } from '@next/env';

const webRoot = __dirname;
const repoRoot = path.resolve(webRoot, '..', '..');

loadEnvConfig(repoRoot);
loadEnvConfig(webRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          path.join(repoRoot, 'data/**'),
          path.join(repoRoot, '.cache/**'),
          path.join(repoRoot, 'src/**'),
          path.join(repoRoot, 'scripts/**'),
          path.join(repoRoot, 'supabase/**'),
          path.join(repoRoot, 'output_prospection.csv'),
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

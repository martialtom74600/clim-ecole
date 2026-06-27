import type { NextConfig } from 'next';
import path from 'path';
import { loadEnvConfig } from '@next/env';

const repoRoot = path.join(__dirname, '../..');

/** Un seul `.env` à la racine du monorepo (pipeline + Next.js). */
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Monorepo : évite que Next scanne mal le repo (warning lockfiles + perf dev)
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

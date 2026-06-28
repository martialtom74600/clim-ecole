import type { NextConfig } from 'next';
import path from 'path';
import { loadMonorepoEnvFromDir } from './lib/load-env';
import { validateProductionEnv } from './lib/env';

const webRoot = __dirname;

loadMonorepoEnvFromDir(webRoot);
validateProductionEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(webRoot, '..', '..'),
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      const repoRoot = path.join(webRoot, '..', '..');
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

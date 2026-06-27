import type { NextConfig } from 'next';
import path from 'path';
import { loadEnvConfig } from '@next/env';

/** Un seul `.env` à la racine du monorepo (pipeline + Next.js). */
loadEnvConfig(path.join(__dirname, '../..'));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;

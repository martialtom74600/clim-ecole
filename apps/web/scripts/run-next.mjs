#!/usr/bin/env node
/**
 * Lance Next.js avec --env-file=../../.env en local si le fichier existe.
 * Sur Vercel / CI, les variables viennent de l'environnement — pas de .env requis.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const envPath = path.resolve(appRoot, '../../.env');
const nextBin = path.join(appRoot, 'node_modules/next/dist/bin/next');
const nextArgs = process.argv.slice(2);

const nodeArgs = [];
if (fs.existsSync(envPath)) {
  nodeArgs.push(`--env-file=${envPath}`);
}
nodeArgs.push(nextBin, ...nextArgs);

const result = spawnSync(process.execPath, nodeArgs, {
  stdio: 'inherit',
  cwd: appRoot,
  env: process.env,
});

process.exit(result.status ?? 1);

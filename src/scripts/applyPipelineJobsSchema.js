/**
 * Applique le bloc pipeline_jobs de supabase/schema.sql.
 * Requiert SUPABASE_DB_PASSWORD ou DATABASE_URL dans .env
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SQL = `
create table if not exists public.pipeline_jobs (
  department_code   text primary key,
  department_label  text,
  region_slug       text not null,
  region_label      text not null,
  status            text not null default 'pending',
  row_count         integer,
  csv_sha           text,
  last_sync_at      timestamptz,
  last_error        text,
  git_commit        text,
  updated_at        timestamptz not null default now()
);

create index if not exists idx_pipeline_jobs_region on public.pipeline_jobs(region_slug);
create index if not exists idx_pipeline_jobs_status on public.pipeline_jobs(status);

alter table public.pipeline_jobs enable row level security;

drop policy if exists "pipeline_jobs_auth_all" on public.pipeline_jobs;
create policy "pipeline_jobs_auth_all" on public.pipeline_jobs
  for all to authenticated using (true) with check (true);

grant all on public.pipeline_jobs to service_role;
grant select on public.pipeline_jobs to authenticated, anon;

notify pgrst, 'reload schema';
`;

function getConnectionString() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.SUPABASE_URL?.trim() ?? '';
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!password || !ref) return null;
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function main() {
  const conn = getConnectionString();
  if (!conn) {
    console.error('[schema] SUPABASE_DB_PASSWORD ou DATABASE_URL requis dans .env');
    console.error('[schema] Supabase → Project Settings → Database → Database password');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(SQL);
    console.log('[schema] pipeline_jobs créée / mise à jour');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[schema] Échec:', err.message);
  process.exit(1);
});

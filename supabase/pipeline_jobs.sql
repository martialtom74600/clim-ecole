-- Coller dans Supabase → SQL Editor → Run
-- (ou: npm run db:pipeline-jobs après avoir ajouté SUPABASE_DB_PASSWORD dans .env)

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

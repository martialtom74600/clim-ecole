-- Module CRM Pipeline (pack_unlocks) + Signaux AO (territory_tender_signals)

-- ── Pipeline client sur déblocages ──

alter table public.pack_unlocks
  add column if not exists pipeline_status text not null default 'new'
    check (pipeline_status in ('new', 'contacted', 'meeting_booked', 'won', 'lost'));

alter table public.pack_unlocks
  add column if not exists pipeline_updated_at timestamptz not null default now();

create index if not exists idx_pack_unlocks_pipeline
  on public.pack_unlocks(account_id, pipeline_status);

-- ── Signaux appels d'offres (BOAMP — alimenté par API externe plus tard) ──

create table if not exists public.territory_tender_signals (
  code_epci           text primary key,
  has_active_tender   boolean not null default false,
  tender_title        text,
  tender_source       text default 'BOAMP',
  tender_url          text,
  detected_at         timestamptz,
  updated_at          timestamptz not null default now()
);

alter table public.territory_tender_signals enable row level security;

grant all on public.territory_tender_signals to service_role;
revoke all on public.territory_tender_signals from anon, authenticated;

-- Données de démo (remplacer / compléter via sync BOAMP)
insert into public.territory_tender_signals (code_epci, has_active_tender, tender_title, detected_at)
values
  ('200000172', true, 'Rénovation énergétique des bâtiments scolaires — marché global', now() - interval '3 days'),
  ('200011773', true, 'Travaux de performance énergétique — groupe scolaire', now() - interval '8 days'),
  ('200018166', true, 'Marché de performance énergétique — patrimoine communal', now() - interval '1 day')
on conflict (code_epci) do update set
  has_active_tender = excluded.has_active_tender,
  tender_title = excluded.tender_title,
  detected_at = excluded.detected_at,
  updated_at = now();

notify pgrst, 'reload schema';

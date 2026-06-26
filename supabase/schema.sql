-- Clim École — schéma Supabase (EPCI → communes/mairies → bâtiments ↔ artisans)

create extension if not exists "pgcrypto";

-- ── EPCI (intercommunalité — regroupement commercial) ──

create table if not exists public.epci (
  id          uuid primary key,
  code_epci   text not null unique,
  nom         text not null,
  region      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Communes (= entité mairie / contact élu & DGS) ──

create table if not exists public.communes (
  code_insee    text primary key,
  nom           text not null,
  population    integer,
  departement   text,
  email_mairie  text,
  epci_id       uuid not null references public.epci(id) on update cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_communes_epci on public.communes(epci_id);

-- ── Artisans RGE ──

create table if not exists public.artisans (
  id                uuid primary key,
  nom               text not null,
  email             text,
  siret             text unique,
  tranche_effectif  text,
  effectif_label    text,
  effectif_min      integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (nom, email)
);

-- ── Bâtiments (école, mairie, bibliothèque…) ──

create table if not exists public.batiments (
  id                          uuid primary key,
  code_uai                    text not null unique,
  code_insee                  text not null references public.communes(code_insee) on update cascade,
  nom                         text not null,
  type_usage                  text,
  surface_m2                  numeric,
  dpe_lettre                  text,
  annee_construction          integer,
  latitude                    numeric,
  longitude                   numeric,
  proprietaire_ffo_forme      text,
  proprietaire_ffo_denomination text,
  financement_statut          text,
  package_id                  text,
  statut_projet_epci          text,
  capex_total                 numeric,
  part_fonds_euros            numeric,
  gain_net_mairie_euros       numeric,
  score_eligibilite_closing   integer,
  temperature_lead            text check (temperature_lead in ('chaud', 'tiède', 'froid')),
  blacklisted_at              timestamptz,
  finance_json                jsonb not null default '{}'::jsonb,
  technique_json              jsonb not null default '{}'::jsonb,
  synced_at                   timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_batiments_commune on public.batiments(code_insee);
create index if not exists idx_batiments_financement on public.batiments(financement_statut);
create index if not exists idx_batiments_temperature on public.batiments(temperature_lead);
create index if not exists idx_batiments_score on public.batiments(score_eligibilite_closing desc);
create index if not exists idx_batiments_package on public.batiments(package_id);
create index if not exists idx_batiments_blacklist on public.batiments(blacklisted_at) where blacklisted_at is not null;

-- ── Liaison bâtiment ↔ artisan (match RGE) ──

create table if not exists public.batiment_artisans (
  batiment_id     uuid not null references public.batiments(id) on delete cascade,
  artisan_id      uuid not null references public.artisans(id) on delete cascade,
  distance_km     numeric,
  is_primary      boolean not null default true,
  effectif_label  text,
  effectif_min    integer,
  created_at      timestamptz not null default now(),
  primary key (batiment_id, artisan_id)
);

create index if not exists idx_batiment_artisans_artisan on public.batiment_artisans(artisan_id);

-- ── Blacklist manuelle (sync pipeline + UI) ──

create table if not exists public.blacklist (
  id           uuid primary key default gen_random_uuid(),
  identifiant  text not null unique,
  motif        text,
  created_at   timestamptz not null default now()
);

-- ── Vues agrégées (dashboard / KPIs) ──

create or replace view public.v_commune_stats as
select
  c.code_insee,
  c.nom,
  c.population,
  c.email_mairie,
  e.code_epci,
  e.nom as nom_epci,
  count(b.id) filter (where b.blacklisted_at is null) as nb_batiments,
  coalesce(sum(b.capex_total) filter (where b.blacklisted_at is null), 0) as capex_total,
  coalesce(sum(b.part_fonds_euros) filter (where b.blacklisted_at is null), 0) as part_fonds_total,
  coalesce(sum(b.gain_net_mairie_euros) filter (where b.blacklisted_at is null), 0) as gain_net_mairie_total,
  max(b.score_eligibilite_closing) filter (where b.blacklisted_at is null) as score_closing_max
from public.communes c
join public.epci e on e.id = c.epci_id
left join public.batiments b on b.code_insee = c.code_insee
group by c.code_insee, c.nom, c.population, c.email_mairie, e.code_epci, e.nom;

create or replace view public.v_epci_stats as
select
  e.id,
  e.code_epci,
  e.nom,
  e.region,
  count(distinct c.code_insee) as nb_communes,
  count(b.id) filter (where b.blacklisted_at is null) as nb_batiments,
  coalesce(sum(b.capex_total) filter (where b.blacklisted_at is null), 0) as capex_total,
  coalesce(sum(b.part_fonds_euros) filter (where b.blacklisted_at is null), 0) as part_fonds_total,
  coalesce(sum(b.gain_net_mairie_euros) filter (where b.blacklisted_at is null), 0) as gain_net_mairie_total
from public.epci e
left join public.communes c on c.epci_id = e.id
left join public.batiments b on b.code_insee = c.code_insee
group by e.id, e.code_epci, e.nom, e.region;

-- ── RLS (outil interne — lecture/écriture authentifiée) ──

alter table public.epci enable row level security;
alter table public.communes enable row level security;
alter table public.artisans enable row level security;
alter table public.batiments enable row level security;
alter table public.batiment_artisans enable row level security;
alter table public.blacklist enable row level security;

drop policy if exists "epci_auth_all" on public.epci;
create policy "epci_auth_all" on public.epci for all to authenticated using (true) with check (true);

drop policy if exists "communes_auth_all" on public.communes;
create policy "communes_auth_all" on public.communes for all to authenticated using (true) with check (true);

drop policy if exists "artisans_auth_all" on public.artisans;
create policy "artisans_auth_all" on public.artisans for all to authenticated using (true) with check (true);

drop policy if exists "batiments_auth_all" on public.batiments;
create policy "batiments_auth_all" on public.batiments for all to authenticated using (true) with check (true);

drop policy if exists "batiment_artisans_auth_all" on public.batiment_artisans;
create policy "batiment_artisans_auth_all" on public.batiment_artisans for all to authenticated using (true) with check (true);

drop policy if exists "blacklist_auth_all" on public.blacklist;
create policy "blacklist_auth_all" on public.blacklist for all to authenticated using (true) with check (true);

-- ── Data API (requis si "Automatically expose new tables" est désactivé) ──

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant all on all sequences in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;

notify pgrst, 'reload schema';

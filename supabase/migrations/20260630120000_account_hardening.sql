-- Durcissement comptes : magic-link single-use + rate-limit, sessions révocables,
-- tombstones de préférences (propagation des suppressions cross-device).

-- ── Sessions révocables ──
-- Bumper session_version invalide tous les cookies émis avant (logout all devices).
alter table public.customer_accounts
  add column if not exists session_version integer not null default 1;

-- ── Tombstones watchlist (LWW) ──
-- Filet de sécurité : on garantit l'existence de customer_preferences (créée par
-- la migration client_features) pour que cette migration soit indépendante de
-- l'ordre d'application.
create table if not exists public.customer_preferences (
  account_id      uuid primary key references public.customer_accounts(id) on delete cascade,
  watchlist       text[] not null default '{}',
  compare_ids     text[] not null default '{}',
  blacklist_uais  text[] not null default '{}',
  onboarding      jsonb,
  referral_code   text unique,
  referred_by     text,
  updated_at      timestamptz not null default now()
);

create index if not exists idx_customer_preferences_referral
  on public.customer_preferences(referral_code);

alter table public.customer_preferences enable row level security;
grant all on public.customer_preferences to service_role;

-- Mémorise les territoires explicitement retirés pour empêcher leur "résurrection"
-- lors de la fusion local ↔ serveur (un appareil au localStorage périmé).
alter table public.customer_preferences
  add column if not exists removed_watchlist text[] not null default '{}';

-- ── Magic-link tokens (single-use + rate-limiting) ──
create table if not exists public.magic_link_tokens (
  jti           text primary key,
  account_id    uuid references public.customer_accounts(id) on delete cascade,
  email         text not null,
  requester_ip  text,
  expires_at    timestamptz not null,
  consumed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Index pour le comptage de rate-limit (par email et par IP, fenêtre glissante).
create index if not exists idx_magic_link_email_created
  on public.magic_link_tokens(email, created_at desc);
create index if not exists idx_magic_link_ip_created
  on public.magic_link_tokens(requester_ip, created_at desc);

alter table public.magic_link_tokens enable row level security;
grant all on public.magic_link_tokens to service_role;
revoke select on public.magic_link_tokens from anon, authenticated;

notify pgrst, 'reload schema';

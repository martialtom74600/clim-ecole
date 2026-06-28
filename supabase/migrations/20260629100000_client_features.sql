-- Fonctionnalités client SaaS (CRM, préférences, notes pipeline)

alter table public.pack_unlocks
  add column if not exists note text,
  add column if not exists next_follow_up timestamptz;

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

create index if not exists idx_customer_preferences_referral on public.customer_preferences(referral_code);

create table if not exists public.alert_dispatch_log (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.alert_subscriptions(id) on delete cascade,
  pack_id         text not null,
  dispatch_type   text not null default 'new_territory',
  sent_at         timestamptz not null default now(),
  unique (subscription_id, pack_id, dispatch_type)
);

alter table public.customer_preferences enable row level security;
alter table public.alert_dispatch_log enable row level security;

grant all on public.customer_preferences to service_role;
grant all on public.alert_dispatch_log to service_role;

notify pgrst, 'reload schema';

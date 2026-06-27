-- Entitlements SaaS (Stripe) + durcissement anon

-- ── Comptes clients ──

create table if not exists public.customer_accounts (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null default '',
  stripe_customer_id  text unique,
  pro_until           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_customer_accounts_stripe on public.customer_accounts(stripe_customer_id);

-- ── Déblocages unitaires (quota anti-cannibalisation) ──

create table if not exists public.pack_unlocks (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.customer_accounts(id) on delete cascade,
  pack_id             text not null,
  code_epci           text,
  stripe_session_id   text,
  created_at          timestamptz not null default now(),
  unique (account_id, pack_id)
);

create index if not exists idx_pack_unlocks_pack on public.pack_unlocks(pack_id);
create index if not exists idx_pack_unlocks_account on public.pack_unlocks(account_id);

-- ── Alertes email ──

create table if not exists public.alert_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  account_id  uuid references public.customer_accounts(id) on delete set null,
  min_capex   integer not null default 400000,
  personas    text[] not null default '{}',
  created_at  timestamptz not null default now(),
  unique (email)
);

-- ── Idempotence webhook Stripe ──

create table if not exists public.stripe_events (
  event_id      text primary key,
  event_type    text,
  processed_at  timestamptz not null default now()
);

-- ── RPC : grant atomique avec quota ──

create or replace function public.grant_pack_unlock(
  p_account_id uuid,
  p_pack_id text,
  p_code_epci text default null,
  p_max_unlocks integer default 3,
  p_stripe_session_id text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pro_until timestamptz;
  v_count integer;
  v_already boolean;
begin
  if not exists (select 1 from customer_accounts where id = p_account_id) then
    return jsonb_build_object('ok', false, 'reason', 'account_not_found');
  end if;

  select exists(
    select 1 from pack_unlocks where account_id = p_account_id and pack_id = p_pack_id
  ) into v_already;

  if v_already then
    return jsonb_build_object('ok', true, 'reason', 'already_owned');
  end if;

  select pro_until into v_pro_until from customer_accounts where id = p_account_id;

  if v_pro_until is not null and v_pro_until > now() then
    insert into pack_unlocks (account_id, pack_id, code_epci, stripe_session_id)
    values (p_account_id, p_pack_id, p_code_epci, p_stripe_session_id)
    on conflict (account_id, pack_id) do nothing;
    return jsonb_build_object('ok', true, 'reason', 'pro');
  end if;

  perform pg_advisory_xact_lock(hashtext('pack:' || p_pack_id));

  select count(distinct account_id)::integer into v_count
  from pack_unlocks
  where pack_id = p_pack_id;

  if v_count >= p_max_unlocks then
    return jsonb_build_object('ok', false, 'reason', 'sold_out', 'used', v_count);
  end if;

  insert into pack_unlocks (account_id, pack_id, code_epci, stripe_session_id)
  values (p_account_id, p_pack_id, p_code_epci, p_stripe_session_id);

  return jsonb_build_object('ok', true, 'reason', 'granted', 'used', v_count + 1);
end;
$$;

-- RLS : accès service_role uniquement (Next.js server)
alter table public.customer_accounts enable row level security;
alter table public.pack_unlocks enable row level security;
alter table public.alert_subscriptions enable row level security;
alter table public.stripe_events enable row level security;

grant all on public.customer_accounts to service_role;
grant all on public.pack_unlocks to service_role;
grant all on public.alert_subscriptions to service_role;
grant all on public.stripe_events to service_role;

grant execute on function public.grant_pack_unlock(uuid, text, text, integer, text) to service_role;

-- Révoquer anon sur données premium (batiments, communes, etc.)
revoke select on public.batiments from anon;
revoke select on public.communes from anon;
revoke select on public.artisans from anon;
revoke select on public.epci from anon;
revoke select on public.batiment_artisans from anon;
revoke select on public.blacklist from anon;
revoke select on public.v_commune_stats from anon;
revoke select on public.v_epci_stats from anon;

revoke select on public.customer_accounts from anon, authenticated;
revoke select on public.pack_unlocks from anon, authenticated;
revoke select on public.alert_subscriptions from anon, authenticated;
revoke select on public.stripe_events from anon, authenticated;

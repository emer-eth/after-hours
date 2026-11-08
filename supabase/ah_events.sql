-- After Hours usage events: checks, protected-swap checks, shares. Anonymous: no IPs, no wallets, no user ids.
-- Written only through ah_track(), which validates every field; the table itself is closed to the API.

create table if not exists public.ah_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('check', 'protect', 'protect_blocked', 'protect_passed', 'swap', 'share_x', 'share_copy', 'share_card')),
  symbol text check (symbol ~ '^[A-Z.]{1,10}$'),
  side text check (side in ('buy', 'sell')),
  usd integer check (usd between 1 and 5000000),
  verdict text check (verdict ~ '^[a-z]{1,12}$')
);
create index if not exists ah_events_at on public.ah_events (at desc);
alter table public.ah_events enable row level security; -- no policies: only the functions below touch it

create or replace function public.ah_track(kind text, symbol text default null, side text default null, usd integer default null, verdict text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- A crude flood guard: at most 600 events a minute in total.
  if (select count(*) from public.ah_events where at > now() - interval '1 minute') >= 600 then return; end if;
  insert into public.ah_events (kind, symbol, side, usd, verdict) values (kind, upper(symbol), side, usd, verdict);
exception when check_violation or invalid_text_representation then
  return; -- bad input is dropped quietly
end $$;
revoke all on function public.ah_track(text, text, text, integer, text) from public;
grant execute on function public.ah_track(text, text, text, integer, text) to anon, authenticated;

-- Public totals for the home page.
create or replace function public.ah_stats()
returns table (checks bigint, checks_today bigint, protects bigint, blocked bigint, tokens bigint)
language sql stable security definer set search_path = public as $$
  select count(*) filter (where kind = 'check'),
         count(*) filter (where kind = 'check' and at > now() - interval '24 hours'),
         count(*) filter (where kind like 'protect%'),
         count(*) filter (where kind = 'protect_blocked'),
         count(distinct symbol) filter (where kind = 'check')
  from public.ah_events
$$;
revoke all on function public.ah_stats() from public;
grant execute on function public.ah_stats() to anon, authenticated;

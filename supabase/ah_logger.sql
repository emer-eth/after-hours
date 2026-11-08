-- After Hours cloud logger. Lives in its own ah_* tables; touches nothing else.
-- Every 10 minutes pg_cron asks the app's public /api/sample for a snapshot (pg_net), and a second job stores
-- the answer. No secret ever leaves the database: the endpoint returns public market data, and anyone may read it.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.ah_samples (
  at timestamptz not null,
  symbol text not null,
  session text not null,
  ref double precision not null,      -- Chainlink's last real price
  ref_at timestamptz,
  h24 double precision,               -- Chainlink's 24/7 price, where there is one
  liq double precision,               -- USD liquidity of the pools quoted
  buy1k double precision, sell1k double precision,
  buy10k double precision, sell10k double precision,
  buy50k double precision, sell50k double precision,
  primary key (symbol, at)
);
create index if not exists ah_samples_at on public.ah_samples (at desc);

alter table public.ah_samples enable row level security;
drop policy if exists "ah samples are public market data" on public.ah_samples;
create policy "ah samples are public market data" on public.ah_samples for select to anon, authenticated using (true);
-- No insert/update/delete policy: only the database's own jobs write.

-- Costs of a $10k trade against the last real price: a buy gets fewer shares, a sell gets fewer dollars.
create or replace view public.ah_costs with (security_invoker = true) as
select at, symbol, session, ref, liq,
       case when buy10k > 0 then 1 - ref / buy10k end as buy_cost,
       case when sell10k is not null then (ref - sell10k) / ref end as sell_cost
from public.ah_samples;
grant select on public.ah_costs to anon, authenticated;

-- Average $10k cost per session over the last N days, leaving out pools too thin to trade (20%+).
create or replace function public.ah_session_costs(days int default 7)
returns table (session text, samples bigint, buy_cost double precision, sell_cost double precision)
language sql stable security invoker set search_path = public as $$
  select session, count(*), avg(buy_cost), avg(sell_cost)
  from public.ah_costs
  where at > now() - make_interval(days => days)
    and buy_cost is not null and sell_cost is not null
    and buy_cost < 0.2 and sell_cost < 0.2
  group by session
$$;
grant execute on function public.ah_session_costs(int) to anon, authenticated;

-- The requests this logger made, so it only ever reads its own responses.
create table if not exists public.ah_requests (
  id bigint primary key,
  made_at timestamptz not null default now(),
  stored boolean not null default false
);
alter table public.ah_requests enable row level security; -- no policies: invisible to the API

create or replace function public.ah_ingest()
returns int language plpgsql security definer set search_path = public, net as $$
declare
  r record;
  n int := 0;
  k int;
begin
  for r in
    select q.id, x.content
    from public.ah_requests q
    join net._http_response x on x.id = q.id
    where not q.stored and x.status_code = 200
    order by q.id
  loop
    begin
      insert into public.ah_samples
      select * from jsonb_populate_recordset(null::public.ah_samples, r.content::jsonb)
      on conflict do nothing;
      get diagnostics k = row_count;
      n := n + k;
    exception when others then
      raise warning 'ah_ingest: response % was not usable: %', r.id, sqlerrm;
    end;
    update public.ah_requests set stored = true where id = r.id;
  end loop;
  delete from public.ah_requests where made_at < now() - interval '1 day';
  return n;
end $$;
revoke all on function public.ah_ingest() from public, anon, authenticated;

-- Schedules (re-running this file replaces them).
select cron.unschedule(jobid) from cron.job where jobname in ('ah-sample', 'ah-ingest');
select cron.schedule('ah-sample', '*/10 * * * *',
  $$insert into public.ah_requests (id) select net.http_get(url := 'https://after-hours-rouge.vercel.app/api/sample', timeout_milliseconds := 110000)$$);
select cron.schedule('ah-ingest', '3-59/10 * * * *', $$select public.ah_ingest()$$);

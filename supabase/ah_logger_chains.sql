-- After Hours: log Base as well as Robinhood Chain. Adds a chain column, makes it part of the key, and teaches the
-- ingest job to fill it in (older snapshots from the app have no chain field: those are Robinhood Chain).

alter table public.ah_samples add column if not exists chain text not null default 'robinhood';

alter table public.ah_samples drop constraint if exists ah_samples_pkey;
alter table public.ah_samples add primary key (chain, symbol, at);
create index if not exists ah_samples_chain_at on public.ah_samples (chain, at desc);

-- The cost view, now with the chain.
drop view if exists public.ah_costs;
create view public.ah_costs with (security_invoker = true) as
select at, chain, symbol, session, ref, liq,
       case when buy10k > 0 then 1 - ref / buy10k end as buy_cost,
       case when sell10k is not null then (ref - sell10k) / ref end as sell_cost
from public.ah_samples;
grant select on public.ah_costs to anon, authenticated;

-- Average $10k cost per session for one chain.
drop function if exists public.ah_session_costs(int);
create or replace function public.ah_session_costs(days int default 7, chain_key text default 'robinhood')
returns table (session text, samples bigint, buy_cost double precision, sell_cost double precision)
language sql stable security invoker set search_path = public as $$
  select session, count(*), avg(buy_cost), avg(sell_cost)
  from public.ah_costs
  where at > now() - make_interval(days => days)
    and chain = chain_key
    and buy_cost is not null and sell_cost is not null
    and buy_cost < 0.2 and sell_cost < 0.2
  group by session
$$;
grant execute on function public.ah_session_costs(int, text) to anon, authenticated;

-- Ingest: rows without a chain are Robinhood Chain.
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
      select * from jsonb_populate_recordset(
        null::public.ah_samples,
        (select jsonb_agg(e || jsonb_build_object('chain', coalesce(e->>'chain', 'robinhood'))) from jsonb_array_elements(r.content::jsonb) e)
      )
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

-- Gives the snapshot request up to 280 s (the app paces its aggregator calls, so a snapshot takes a minute or two).
select cron.unschedule(jobid) from cron.job where jobname = 'ah-sample';
select cron.schedule('ah-sample', '*/10 * * * *',
  $$insert into public.ah_requests (id) select net.http_get(url := 'https://after-hours-rouge.vercel.app/api/sample', timeout_milliseconds := 280000)$$);
-- And clear the rows stored while the aggregator was being rate limited (they fell back to a single pool).
delete from public.ah_samples where at < now();

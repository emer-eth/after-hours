-- Run once, right after deploying the best-route logger: removes rows that quoted a single Uniswap v3 pool only.
delete from public.ah_samples where at < now() - interval '2 minutes';

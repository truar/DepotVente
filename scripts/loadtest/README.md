# Load and soak tests

Plain Node and shell — no dependencies, no build step.

## One-time setup

```bash
./scripts/loadtest/setup-user.sh          # throwaway account to sign in with
export LOADTEST_EMAIL=loadtest@local
export LOADTEST_PASSWORD=loadtest
```

## Burst test — does it survive nine PCs booting at once?

```bash
node scripts/loadtest/run.mjs --clients 9 --writers 3 --duration 300
```

Nine clients sign in, all fire `/sync/initial` simultaneously (the morning
stampede, and the heaviest thing the backend does), then settle into a 20-second
`/sync/delta` poll matching `DELTA_SYNC_INTERVAL`. Three of them also POST
`/api/push` every five seconds at human pace.

Polling is aligned by default (`--stagger none`) because that is the worst case
and the realistic one — the PCs are switched on together. `--stagger jitter`
spreads them out for comparison.

Each simulated PC identifies itself like a real one (`X-Device-Id`
`loadtest-pc-N`, cash register `100+N`, writers `200+N`) and sends the dataset
epoch it learned from `/sync/ping`, so `pnpm traces postes` lists them and
`pnpm traces tail --poste 104` follows one of them. `--stale 1` makes the first
PC send an old epoch: every one of its polls is refused with `409
EPOCH_MISMATCH`, which `pnpm traces errors` and `pnpm traces epochs` should
show. Those refusals are reported under a `stale` phase and not counted as
failures.

Behind nginx, use `--base http://localhost:15173/api`; behind Caddy the default
`https://localhost/api`.

## Soak test — does it drift over four hours?

```bash
node scripts/loadtest/run.mjs --duration 14400 --no-stampede --out results/soak
```

Writes `health-*.csv` every 30 seconds from `/api/health`: `heapUsedMb`, `rssMb`
and `eventLoopLagMs`.

**Read `heapUsedMb`, not `rssMb`.** Container RSS drifts upward from heap
fragmentation even when nothing leaks, so a rising `docker stats` line proves
nothing. A flat or sawtooth `heapUsedMb` is healthy; a monotonic climb is not.

## Cleaning up

The writers create real articles, marked with an `LT-` code prefix.

```bash
./scripts/loadtest/cleanup.sh          # count them
./scripts/loadtest/cleanup.sh --yes    # delete them
```

It matches only that prefix, so imported and real data is never touched.

## Reading the output

`requests-*.csv` has one row per request. The summary prints p50/p95/p99/max per
endpoint. Rough targets for nine clients: `/sync/delta` p95 under 200 ms,
`/sync/initial` p95 under 5 s with all nine concurrent, zero errors.

If the server appears frozen while the container looks idle, that is connection
pool exhaustion rather than load — look for `P2024` in `docker logs cmr_backend`.

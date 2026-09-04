#!/usr/bin/env node
//
// Load / soak generator: simulates the 9 client PCs polling the server.
//
//   node scripts/loadtest/run.mjs --clients 9 --writers 3 --duration 300
//   node scripts/loadtest/run.mjs --duration 14400 --out results/soak    # 4h soak
//
// Plain Node, no dependencies - it only speaks HTTP.
//
import { writeFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

// Self-signed CA: this only ever points at our own server.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const args = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt
}
const has = (name) => args.includes(`--${name}`)

const CFG = {
  base:      arg('base', 'https://localhost/api'),
  clients:   +arg('clients', 9),
  writers:   +arg('writers', 3),
  duration:  +arg('duration', 300),          // seconds
  pollMs:    +arg('poll', 20000),            // mirrors DELTA_SYNC_INTERVAL
  writeMs:   +arg('write', 5000),
  email:     arg('email', process.env.LOADTEST_EMAIL || ''),
  password:  arg('password', process.env.LOADTEST_PASSWORD || ''),
  out:       arg('out', 'results'),
  stagger:   arg('stagger', 'none'),         // none = worst case, all aligned
  healthMs:  +arg('health', 30000),
  skipStampede: has('no-stampede'),
}

if (!CFG.email || !CFG.password) {
  console.error(`
Missing credentials. Pass --email and --password, or set LOADTEST_EMAIL /
LOADTEST_PASSWORD. Create a throwaway account first:

  ./scripts/loadtest/setup-user.sh
`)
  process.exit(1)
}

const RUN_ID = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const REQ_CSV = `${CFG.out}/requests-${RUN_ID}.csv`
const HEALTH_CSV = `${CFG.out}/health-${RUN_ID}.csv`
mkdirSync(dirname(REQ_CSV), { recursive: true })
writeFileSync(REQ_CSV, 't_ms,client,phase,endpoint,status,latency_ms,bytes\n')
writeFileSync(HEALTH_CSV, 't_ms,rss_mb,heap_used_mb,heap_total_mb,external_mb,event_loop_lag_ms,uptime_s\n')

const T0 = Date.now()
const el = () => Date.now() - T0
const samples = []          // {phase, endpoint, ms, status, bytes}
let stopping = false

function record(client, phase, endpoint, status, ms, bytes) {
  samples.push({ phase, endpoint, ms, status, bytes })
  appendFileSync(REQ_CSV, `${el()},${client},${phase},${endpoint},${status},${ms.toFixed(1)},${bytes}\n`)
}

async function timed(client, phase, endpoint, fn) {
  const t = performance.now()
  try {
    const res = await fn()
    const body = await res.arrayBuffer()
    const ms = performance.now() - t
    record(client, phase, endpoint, res.status, ms, body.byteLength)
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    const ms = performance.now() - t
    record(client, phase, endpoint, 'ERR', ms, 0)
    return { ok: false, status: 'ERR', error: err }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- sign in
async function signIn(n) {
  const res = await fetch(`${CFG.base}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CFG.email, password: CFG.password }),
  })
  if (!res.ok) throw new Error(`signin failed for client ${n}: HTTP ${res.status}`)
  const { token } = await res.json()
  if (!token) throw new Error(`signin returned no token for client ${n}`)
  return token
}

// -------------------------------------------------------------- the client
async function client(n, token, deposits) {
  let lastSync = Date.now()

  // Stampede: every PC boots at once and pulls the whole dataset. The heaviest
  // thing the backend ever does - 8 unbounded findMany() through single-threaded
  // JSON serialisation.
  if (!CFG.skipStampede) {
    const r = await timed(n, 'stampede', '/sync/initial', () =>
      fetch(`${CFG.base}/sync/initial`, { headers: { Authorization: `Bearer ${token}` } }))
    if (r.ok) lastSync = Date.now()
  }

  if (CFG.stagger === 'jitter') await sleep(Math.random() * CFG.pollMs)

  while (!stopping) {
    const r = await timed(n, 'steady', '/sync/delta', () =>
      fetch(`${CFG.base}/sync/delta?since=${lastSync}`, {
        headers: { Authorization: `Bearer ${token}` },
      }))
    if (r.ok) lastSync = Date.now()
    await sleep(CFG.pollMs)
  }
}

// ------------------------------------------------------------- the writer
// Rows created here are marked with an LT- code prefix so cleanup.sh can remove
// exactly them and nothing else. Never touches existing data.
let written = 0
async function writer(n, deposits) {
  const pick = () => deposits[Math.floor(Math.random() * deposits.length)]
  while (!stopping) {
    const dep = pick()
    if (dep) {
      const seq = ++written
      const body = {
        operationId: `lt-${RUN_ID}-${seq}`,
        collection: 'articles',
        operation: 'create',
        recordId: crypto.randomUUID(),
        timestamp: Date.now(),
        data: {
          id: crypto.randomUUID(),
          code: `LT-${RUN_ID}-${seq}`,
          category: 'SKI', discipline: 'ALPIN', brand: 'LOADTEST',
          color: 'NOIR', size: '170', year: new Date().getFullYear(),
          price: 42, status: 'RECEPTION_PENDING',
          depositIndex: dep.depositIndex ?? 0,
          identificationLetter: 'Z',
          articleIndex: seq,
          depositId: dep.id,
        },
      }
      await timed(n, 'steady', '/push', () =>
        fetch(`${CFG.base}/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }))
    }
    await sleep(CFG.writeMs)
  }
}

// -------------------------------------------------------- health sampling
async function healthSampler() {
  while (!stopping) {
    try {
      const res = await fetch(`${CFG.base}/health`)
      if (res.ok) {
        const h = await res.json()
        const m = h.memory ?? {}
        appendFileSync(HEALTH_CSV,
          `${el()},${m.rssMb ?? ''},${m.heapUsedMb ?? ''},${m.heapTotalMb ?? ''},` +
          `${m.externalMb ?? ''},${h.eventLoopLagMs ?? ''},${h.uptimeSeconds ?? ''}\n`)
      }
    } catch { /* a failed sample must not stop the run */ }
    await sleep(CFG.healthMs)
  }
}

// ------------------------------------------------------------- reporting
function pct(sorted, p) {
  if (!sorted.length) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

function summary() {
  const groups = new Map()
  for (const s of samples) {
    const key = `${s.phase} ${s.endpoint}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  }
  console.log(`\n=== Results (${((Date.now() - T0) / 1000).toFixed(0)}s) ===\n`)
  console.log('  phase / endpoint          n     p50      p95      p99      max    errors   MB')
  console.log('  ' + '-'.repeat(78))
  let failures = 0
  for (const [key, list] of groups) {
    const ms = list.map((s) => s.ms).sort((a, b) => a - b)
    const errs = list.filter((s) => s.status === 'ERR' || +s.status >= 400).length
    failures += errs
    const mb = list.reduce((a, s) => a + s.bytes, 0) / 1048576
    console.log(
      `  ${key.padEnd(24)} ${String(list.length).padStart(4)} ` +
      `${pct(ms, 50).toFixed(0).padStart(7)}ms ${pct(ms, 95).toFixed(0).padStart(6)}ms ` +
      `${pct(ms, 99).toFixed(0).padStart(6)}ms ${ms[ms.length - 1].toFixed(0).padStart(6)}ms ` +
      `${String(errs).padStart(7)} ${mb.toFixed(1).padStart(6)}`)
  }
  console.log(`\n  Articles created: ${written}  (remove with ./scripts/loadtest/cleanup.sh)`)
  console.log(`  Requests : ${REQ_CSV}`)
  console.log(`  Health   : ${HEALTH_CSV}`)
  if (failures > 0) console.log(`\n  ${failures} failed request(s) - see the CSV`)
  console.log()
}

// ------------------------------------------------------------------ main
async function main() {
  console.log(`\n=== Load test: ${CFG.clients} clients, ${CFG.writers} writers, ${CFG.duration}s ===`)
  console.log(`  target ${CFG.base}, polling every ${CFG.pollMs / 1000}s, stagger=${CFG.stagger}\n`)

  process.on('SIGINT', () => { console.log('\nStopping...'); stopping = true })

  const tokens = []
  for (let i = 0; i < CFG.clients; i++) tokens.push(await signIn(i))
  console.log(`  signed in ${tokens.length} clients`)

  // One initial pull to learn real deposit ids for the writers.
  const res = await fetch(`${CFG.base}/sync/initial`, { headers: { Authorization: `Bearer ${tokens[0]}` } })
  if (!res.ok) throw new Error(`initial sync failed: HTTP ${res.status}`)
  const data = await res.json()
  const deposits = (data.deposits ?? []).map((d) => ({ id: d.id, depositIndex: d.depositIndex }))
  console.log(`  dataset: ${deposits.length} deposits, ${(data.articles ?? []).length} articles`)
  if (!deposits.length) console.log('  ! no deposits found - writers will be idle')

  const timer = setTimeout(() => { stopping = true }, CFG.duration * 1000)

  const work = []
  for (let i = 0; i < CFG.clients; i++) work.push(client(i, tokens[i], deposits))
  for (let i = 0; i < CFG.writers; i++) work.push(writer(`w${i}`, deposits))
  work.push(healthSampler())

  console.log('  running - Ctrl-C to stop early\n')
  await Promise.all(work)
  clearTimeout(timer)
  summary()
}

main().catch((err) => { console.error(`\nFailed: ${err.message}\n`); process.exit(1) })

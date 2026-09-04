#!/usr/bin/env node
//
// Analyse a soak run for drift.
//
//   node scripts/loadtest/report.mjs results/soak
//
// Eyeballing a four-hour graph is how a slow leak gets missed. This fits a line
// through each series and reports the slope per hour.
//
import { readFileSync, readdirSync } from 'node:fs'

const dir = process.argv[2] || 'results'
const pick = (prefix) => {
  const f = readdirSync(dir).filter((n) => n.startsWith(prefix)).sort().pop()
  return f ? `${dir}/${f}` : null
}

function readCsv(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split('\n')
  const cols = head.split(',')
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [cols[i], v])))
}

// Least-squares slope of y against x.
function slope(points) {
  const n = points.length
  if (n < 3) return null
  const sx = points.reduce((a, p) => a + p.x, 0)
  const sy = points.reduce((a, p) => a + p.y, 0)
  const sxy = points.reduce((a, p) => a + p.x * p.y, 0)
  const sxx = points.reduce((a, p) => a + p.x * p.x, 0)
  const d = n * sxx - sx * sx
  return d === 0 ? null : (n * sxy - sx * sy) / d
}

function series(rows, xKey, yKey, xScale) {
  const pts = rows
    .map((r) => ({ x: +r[xKey] / xScale, y: +r[yKey] }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  if (pts.length < 3) return null
  const first = pts.slice(0, Math.max(1, Math.floor(pts.length * 0.1)))
  const last = pts.slice(-Math.max(1, Math.floor(pts.length * 0.1)))
  const avg = (a) => a.reduce((s, p) => s + p.y, 0) / a.length
  return {
    n: pts.length,
    hours: (pts[pts.length - 1].x - pts[0].x),
    start: avg(first),
    end: avg(last),
    perHour: slope(pts),
    max: Math.max(...pts.map((p) => p.y)),
  }
}

// Extrapolating a slope measured over minutes to a per-hour figure amplifies
// noise into an apparent leak. Below this, report the observed change only.
const MIN_HOURS_FOR_SLOPE = 0.5

function line(label, s, unit, budget) {
  if (!s) { console.log(`  ${label.padEnd(22)} not enough data`); return }
  const delta = s.end - s.start
  const head =
    `  ${label.padEnd(22)} ${s.start.toFixed(1).padStart(8)} -> ${s.end.toFixed(1).padStart(8)} ${unit}` +
    `  (${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`
  if (s.hours < MIN_HOURS_FOR_SLOPE) { console.log(head); return }
  const drift = s.perHour
  const verdict = budget == null ? '' : (Math.abs(drift) <= budget ? '  OK' : '  <-- DRIFT')
  console.log(`${head}   ${(drift >= 0 ? '+' : '') + drift.toFixed(2)}/h${verdict}`)
}

function shortRunNotice(s) {
  if (s && s.hours < MIN_HOURS_FOR_SLOPE) {
    console.log(`  (run is ${(s.hours * 60).toFixed(0)} min - too short for a drift rate;`)
    console.log('   showing the observed change only. Drift needs 30+ min.)\n')
  }
}

const health = pick('health-')
const monitor = pick('monitor-')

console.log(`\n=== Soak report: ${dir} ===\n`)

if (health) {
  const rows = readCsv(health)
  const h = series(rows, 't_ms', 'heap_used_mb', 3600000)
  console.log(`Process (from /api/health, ${h ? h.hours.toFixed(1) : '?'}h, ${rows.length} samples)\n`)
  shortRunNotice(h)
  console.log('  metric                    start        end          drift')
  console.log('  ' + '-'.repeat(62))
  // heapUsed is the leak signal; rss drifts from fragmentation even when clean.
  line('heap used', h, 'MB', 5)
  line('rss', series(rows, 't_ms', 'rss_mb', 3600000), 'MB', null)
  line('event loop lag', series(rows, 't_ms', 'event_loop_lag_ms', 3600000), 'ms', 1)
} else {
  console.log('No health-*.csv found.')
}

if (monitor) {
  const rows = readCsv(monitor)
  console.log(`\nContainers (from docker, ${rows.length} samples)\n`)
  shortRunNotice(series(rows, 't_s', 'be_mem_mb', 3600))
  console.log('  metric                    start        end          drift')
  console.log('  ' + '-'.repeat(62))
  line('backend mem', series(rows, 't_s', 'be_mem_mb', 3600), 'MB', 10)
  line('postgres mem', series(rows, 't_s', 'pg_mem_mb', 3600), 'MB', 20)
  line('db connections', series(rows, 't_s', 'db_conns', 3600), '  ', 1)
  line('backend sockets', series(rows, 't_s', 'be_sockets', 3600), '  ', 2)
  line('dead tuples', series(rows, 't_s', 'dead_articles', 3600), '  ', null)
  line('host swap', series(rows, 't_s', 'host_swap_mb', 3600), 'MB', null)
}

console.log(`
Reading this:
  heap used     the leak signal. Flat or sawtooth is healthy; a steady climb is not.
  rss           drifts upward from fragmentation even with no leak - not a verdict.
  db conns      the pool of 20 stays open; a climb means connections are leaking.
  sockets       a climb means connections are not being closed.
  dead tuples   should rise and fall as autovacuum runs, not grow without bound.
`)

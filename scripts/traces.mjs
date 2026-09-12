#!/usr/bin/env node
// Supervision over the backend's JSON logs (pino, one object per line).
//
// Every request a client PC sends carries its identity headers; the backend
// tags every log line with them (device, workstation, appVersion). This tool
// reads those lines - by default from `docker compose logs backend` - and
// answers the questions an admin asks on the day without walking to a PC:
// who is connected, what did the server refuse, is anyone on a stale build
// or a stale dataset epoch.
//
// Zero dependencies on purpose: it must run on the server Mac as is.

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const HELP = `Usage: pnpm traces <command> [options]

Commands
  postes    every client PC seen: cash register, build, first/last seen, what it sent
  pushes    what each PC sent: collection, operation, how many, when
  tail      one line per request, live; narrow with --poste or --route
  errors    everything the server refused (4xx) or failed on (5xx), with the code
  epochs    the server's dataset epoch(s) and clients refused for holding another one
  stats     request counts and response times per route

Options
  --poste <id>     device id (or a unique prefix of it) or a cash register number
  --route <part>   only requests whose path contains this, e.g. --route push
  --since <dur>    only the last 30m / 2h / 1d ... (tail: 10m, others: all)
  --file <path>    read this log file instead of docker compose; "-" reads stdin
  -n <N>           tail: how many past lines to show before following (50)
  --no-follow      tail: print the past lines and exit
  --json           print the matching raw log lines instead of a table
  -h, --help

Examples
  pnpm traces postes
  pnpm traces pushes --since 1h
  pnpm traces tail --route push        # only what the PCs send, no polling
  pnpm traces tail --poste 4
  pnpm traces errors --since 1h
  tail -f dev-backend.log | pnpm traces tail --file -
`;

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { command: argv[0], n: 50, follow: true, json: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--poste") args.poste = next();
    else if (a === "--route") args.route = next();
    else if (a === "--since") args.since = next();
    else if (a === "--file") args.file = next();
    else if (a === "-n") args.n = Number(next());
    else if (a === "--no-follow") args.follow = false;
    else if (a === "--json") args.json = true;
    else if (a === "-h" || a === "--help") args.command = "help";
    else {
      console.error(`Unknown option: ${a}\n`);
      process.exit(2);
    }
  }
  return args;
}

const DURATION_MS = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3 };
function sinceMs(spec) {
  if (!spec) return 0;
  const m = /^(\d+)([smhd])$/.exec(spec);
  if (!m) {
    console.error(`--since expects e.g. 30m, 2h, 1d (got ${spec})`);
    process.exit(2);
  }
  return Date.now() - Number(m[1]) * DURATION_MS[m[2]];
}

// ---------------------------------------------------------------------------
// Source: docker compose logs, a file, or stdin
// ---------------------------------------------------------------------------

function openSource({ file, since, follow, n }) {
  if (file === "-") return process.stdin;
  if (file) return createReadStream(file);

  const args = ["compose", "logs", "--no-log-prefix"];
  if (since) args.push("--since", since);
  if (follow) args.push("--follow", "--tail", String(Math.max(n * 5, 200)));
  args.push("backend");
  const child = spawn("docker", args, {
    cwd: REPO_ROOT,
    stdio: ["ignore", "pipe", "inherit"],
  });
  child.on("error", (err) => {
    console.error(`Cannot run docker compose logs: ${err.message}`);
    process.exit(1);
  });
  process.on("SIGINT", () => {
    child.kill();
    process.exit(0);
  });
  return child.stdout;
}

// One log line, normalised. Returns null for lines that are not JSON (Prisma
// output, migration notices...).
function parseLine(raw) {
  if (!raw.startsWith("{")) return null;
  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  const req = d.req ?? {};
  return {
    raw,
    time: d.time,
    level: d.level,
    device: d.device,
    workstation: d.workstation,
    appVersion: d.appVersion,
    context: d.context,
    msg: d.msg,
    reqId: req.id,
    method: req.method,
    url: req.url,
    status: d.res?.statusCode ?? d.status,
    ms: d.responseTime,
    code: d.code,
    route: d.route,
    collection: d.collection,
    operation: d.operation,
    recordId: d.recordId,
    outcome: d.outcome,
    body: d.body,
    clientEpoch: d.clientEpoch,
    datasetEpoch: d.datasetEpoch,
    errMessage: d.err?.message,
  };
}

async function* records(args) {
  const cutoff = args.file ? sinceMs(args.since) : 0;
  const rl = readline.createInterface({
    input: openSource(args),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const rec = parseLine(line);
    if (!rec) continue;
    if (cutoff && rec.time < cutoff) continue;
    if (args.poste && !matchesPoste(rec, args.poste)) continue;
    if (args.route && !matchesRoute(rec, args.route)) continue;
    if (!args.keepProbes && isHealthProbe(rec)) continue;
    yield rec;
  }
}

// Docker probes /api/health every few seconds with no identity: noise in
// every view but the per-route statistics.
function isHealthProbe(rec) {
  return !rec.device && rec.url === "/api/health";
}

function matchesPoste(rec, poste) {
  if (/^\d+$/.test(poste)) return rec.workstation === poste;
  return typeof rec.device === "string" && rec.device.startsWith(poste);
}

function matchesRoute(rec, route) {
  return typeof rec.url === "string" && rec.url.includes(route);
}

// The two lines a view of "what happened" is made of: one per request, and
// one per write a PC sent (ReplicationService, see `pushes`).
const isRequestLine = (rec) => rec.msg === "request completed";
const isPushLine = (rec) => rec.msg === "Push applied";
// Warnings and errors are always shown; the rest of the info chatter is not.
const isNoise = (rec) =>
  rec.level === 30 && !isRequestLine(rec) && !isPushLine(rec);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const tty = process.stdout.isTTY;
const paint = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = (s) => paint(2, s);
const yellow = (s) => paint(33, s);
const red = (s) => paint(31, s);

const hhmmss = (t) =>
  new Date(t).toLocaleTimeString("fr-FR", { hour12: false });
const dateTime = (t) => new Date(t).toLocaleString("fr-FR", { hour12: false });
// Real device ids are UUIDs, distinctive in their first eight characters;
// anything else (test clients, curl) is shown whole, within reason.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const short = (device) =>
  device ? (UUID.test(device) ? device.slice(0, 8) : device.slice(0, 18)) : "--------";
const posteLabel = (rec) =>
  `${(rec.workstation ? `P${rec.workstation}` : "P?").padEnd(6)} ${short(rec.device)}`;

function colourStatus(status) {
  const s = String(status ?? "");
  if (status >= 500) return red(s);
  if (status >= 400) return yellow(s);
  return s;
}

function formatLine(rec) {
  const head = `${dim(hhmmss(rec.time))}  ${posteLabel(rec)}  `;
  // What the PC actually sent, right under its POST /api/push line.
  if (isPushLine(rec)) {
    const outcome =
      rec.outcome && rec.outcome !== "applied" ? yellow(` (${rec.outcome})`) : "";
    return `${head}${dim("push")} ${summary(rec)}${outcome}`;
  }
  if (rec.msg === "request completed") {
    const ms =
      rec.ms === undefined ? "" : `${Math.round(rec.ms)}ms`.padStart(6);
    return `${head}${rec.method.padEnd(4)} ${rec.url.padEnd(38)} ${colourStatus(rec.status)}${ms}`;
  }
  const level =
    rec.level >= 50
      ? red("ERROR")
      : rec.level >= 40
        ? yellow("WARN ")
        : dim("info ");
  const where = rec.context ? dim(`${rec.context}: `) : "";
  const detail = rec.code
    ? ` ${rec.code}${rec.body ? ` ${summary(rec.body)}` : ""}`
    : "";
  return `${head}${level} ${where}${rec.msg}${detail}`;
}

function summary(body) {
  if (!body) return "";
  return [body.collection, body.operation, body.recordId]
    .filter(Boolean)
    .join(" ");
}

// Columns: { label, get(row) -> plain text, paint?(text, row) -> coloured }.
// Widths are measured on the plain text so colours never break alignment.
function table(rows, columns) {
  const cell = (c, r) => String(c.get(r) ?? "");
  const widths = columns.map((c) =>
    Math.max(c.label.length, ...rows.map((r) => cell(c, r).length)),
  );
  const pad = (text, i) => text + " ".repeat(widths[i] - text.length);
  console.log(dim(columns.map((c, i) => pad(c.label, i)).join("  ")));
  for (const r of rows) {
    console.log(
      columns
        .map((c, i) => {
          const text = cell(c, r);
          const padded = pad(text, i);
          return c.paint ? padded.replace(text, c.paint(text, r)) : padded;
        })
        .join("  "),
    );
  }
}

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function postes(args) {
  const byDevice = new Map();
  for await (const rec of records({ ...args, follow: false })) {
    if (isNoise(rec)) continue;
    const key = rec.device ?? "(sans identifiant)";
    const p = byDevice.get(key) ?? {
      device: key,
      workstations: new Set(),
      versions: new Set(),
      first: rec.time,
      last: rec.time,
      requests: 0,
      sent: 0,
      refused: 0,
      failed: 0,
      staleEpoch: null,
    };
    if (rec.workstation) p.workstations.add(rec.workstation);
    if (rec.appVersion) p.versions.add(rec.appVersion);
    p.first = Math.min(p.first, rec.time);
    p.last = Math.max(p.last, rec.time);
    if (isRequestLine(rec)) {
      p.requests++;
      if (rec.status >= 500) p.failed++;
      else if (rec.status >= 400) p.refused++;
    }
    if (isPushLine(rec)) p.sent++;
    if (rec.clientEpoch) p.staleEpoch = rec.clientEpoch;
    byDevice.set(key, p);
  }
  const rows = [...byDevice.values()].sort((a, b) => b.last - a.last);
  if (args.json)
    return console.log(
      JSON.stringify(
        rows.map((r) => ({
          ...r,
          workstations: [...r.workstations],
          versions: [...r.versions],
        })),
        null,
        2,
      ),
    );
  if (rows.length === 0) return console.log("No client seen in this log.");
  table(rows, [
    { label: "Identifiant du poste", get: (r) => r.device },
    { label: "Caisse", get: (r) => [...r.workstations].join(",") || "?" },
    { label: "Version", get: (r) => [...r.versions].join(" | ") || "?" },
    { label: "Vu de", get: (r) => dateTime(r.first) },
    { label: "à", get: (r) => dateTime(r.last) },
    { label: "Requêtes", get: (r) => r.requests },
    // Polling is most of "Requêtes"; this is what the PC actually sent.
    { label: "Envois", get: (r) => r.sent },
    {
      label: "Refusées",
      get: (r) => r.refused,
      paint: (t, r) => (r.refused ? yellow(t) : t),
    },
    {
      label: "Erreurs",
      get: (r) => r.failed,
      paint: (t, r) => (r.failed ? red(t) : t),
    },
    {
      label: "Epoch périmé",
      get: (r) => (r.staleEpoch ? r.staleEpoch.slice(0, 8) : ""),
      paint: yellow,
    },
  ]);
}

// The last N matching lines, oldest first.
async function tail(args) {
  const buffer = [];
  for await (const rec of records({ ...args, follow: false })) {
    if (isNoise(rec)) continue;
    buffer.push(rec);
    if (buffer.length > args.n) buffer.shift();
  }
  for (const rec of buffer) console.log(args.json ? rec.raw : formatLine(rec));
}

// Docker gives no marker for the end of the backlog, so following is done in
// two reads: the last N lines first, then everything from now on.
async function tailFollow(args) {
  await tail({ ...args, since: args.since ?? "10m" });
  console.log(dim("--- live ---"));
  for await (const rec of records({ ...args, since: "1s", follow: true })) {
    if (isNoise(rec)) continue;
    console.log(args.json ? rec.raw : formatLine(rec));
  }
}

// What each PC has sent, as opposed to what it polled: one row per cash
// register, collection and operation. A refused push is not here - it never
// reached the database; `errors` has it with its code.
async function pushes(args) {
  const byKey = new Map();
  let total = 0;
  for await (const rec of records({ ...args, follow: false })) {
    if (!isPushLine(rec)) continue;
    const key = `${rec.device ?? "?"}|${rec.collection}|${rec.operation}`;
    const row = byKey.get(key) ?? {
      device: rec.device,
      workstation: rec.workstation,
      collection: rec.collection ?? "?",
      operation: rec.operation ?? "?",
      applied: 0,
      duplicate: 0,
      missing: 0,
      last: rec.time,
    };
    row[rec.outcome ?? "applied"]++;
    row.last = Math.max(row.last, rec.time);
    row.workstation = rec.workstation ?? row.workstation;
    byKey.set(key, row);
    total++;
  }
  const rows = [...byKey.values()].sort(
    (a, b) =>
      String(a.workstation).localeCompare(String(b.workstation)) ||
      a.collection.localeCompare(b.collection) ||
      a.operation.localeCompare(b.operation),
  );
  if (args.json) return console.log(JSON.stringify(rows, null, 2));
  if (rows.length === 0) {
    console.log("Aucun envoi dans ce log.");
    console.log(
      dim(
        "Un poste qui envoie apparaît aussi comme POST /api/push dans `tail` " +
          "et `stats` ;\nle détail ci-dessus n'existe que pour les envois " +
          "reçus par un serveur à jour.",
      ),
    );
    return;
  }
  table(rows, [
    { label: "Poste", get: (r) => posteLabel(r) },
    { label: "Collection", get: (r) => r.collection },
    { label: "Opération", get: (r) => r.operation },
    { label: "Envois", get: (r) => r.applied },
    {
      label: "Doublons",
      get: (r) => r.duplicate || "",
      paint: (t) => yellow(t),
    },
    {
      label: "Déjà supprimés",
      get: (r) => r.missing || "",
      paint: (t) => yellow(t),
    },
    { label: "Dernier", get: (r) => dateTime(r.last) },
  ]);
  const postes = new Set(rows.map((r) => r.device)).size;
  console.log(dim(`\n${total} envoi(s) de ${postes} poste(s)`));
}

async function errors(args) {
  const rows = [];
  for await (const rec of records({ ...args, follow: false })) {
    // The exception filter writes exactly one line per refused or failed
    // request, with the code and the outbox operation it concerned.
    if (rec.context !== "AllExceptionsFilter") continue;
    rows.push(rec);
  }
  if (args.json) return console.log(rows.map((r) => r.raw).join("\n"));
  if (rows.length === 0)
    return console.log("Nothing refused or failed in this log.");
  table(rows, [
    { label: "Quand", get: (r) => dateTime(r.time) },
    { label: "Poste", get: (r) => posteLabel(r) },
    { label: "Route", get: (r) => r.route ?? "" },
    {
      label: "HTTP",
      get: (r) => r.status ?? "",
      paint: (t, r) => colourStatus(r.status),
    },
    { label: "Code", get: (r) => r.code ?? "" },
    { label: "Opération", get: (r) => summary(r.body) },
    { label: "Message", get: (r) => r.msg },
  ]);
}

async function epochs(args) {
  const boots = [];
  const stale = new Map();
  for await (const rec of records({ ...args, follow: false })) {
    if (rec.msg === "Dataset epoch loaded") boots.push(rec);
    if (rec.clientEpoch) {
      const s = stale.get(rec.clientEpoch) ?? {
        epoch: rec.clientEpoch,
        devices: new Set(),
        count: 0,
        last: 0,
      };
      s.devices.add(
        `${rec.workstation ? `P${rec.workstation} ` : ""}${short(rec.device)}`,
      );
      s.count++;
      s.last = Math.max(s.last, rec.time);
      stale.set(rec.clientEpoch, s);
    }
  }
  if (args.json)
    return console.log(
      JSON.stringify(
        {
          boots: boots.map((b) => ({ time: b.time, epoch: b.datasetEpoch })),
          stale: [...stale.values()].map((s) => ({
            ...s,
            devices: [...s.devices],
          })),
        },
        null,
        2,
      ),
    );
  console.log("Epoch chargé au démarrage du serveur:");
  for (const b of boots)
    console.log(`  ${dateTime(b.time)}  ${b.datasetEpoch}`);
  if (boots.length === 0) console.log("  (aucun démarrage dans ce journal)");
  console.log("\nPostes refusés pour un epoch périmé:");
  if (stale.size === 0) console.log("  aucun");
  else
    table(
      [...stale.values()],
      [
        { label: "Epoch client", get: (s) => s.epoch },
        { label: "Postes", get: (s) => [...s.devices].join(", ") },
        { label: "Refus", get: (s) => s.count },
        { label: "Dernier", get: (s) => dateTime(s.last) },
      ],
    );
}

async function stats(args) {
  const byRoute = new Map();
  for await (const rec of records({
    ...args,
    follow: false,
    keepProbes: true,
  })) {
    if (rec.msg !== "request completed") continue;
    const key = `${rec.method} ${rec.url.split("?")[0]}`;
    const s = byRoute.get(key) ?? {
      route: key,
      count: 0,
      statuses: new Map(),
      times: [],
    };
    s.count++;
    s.statuses.set(rec.status, (s.statuses.get(rec.status) ?? 0) + 1);
    if (rec.ms !== undefined) s.times.push(rec.ms);
    byRoute.set(key, s);
  }
  const rows = [...byRoute.values()].sort((a, b) => b.count - a.count);
  for (const r of rows) r.times.sort((a, b) => a - b);
  if (args.json)
    return console.log(
      JSON.stringify(
        rows.map((r) => ({
          ...r,
          statuses: Object.fromEntries(r.statuses),
          times: undefined,
          p50: percentile(r.times, 0.5),
          p95: percentile(r.times, 0.95),
        })),
        null,
        2,
      ),
    );
  if (rows.length === 0) return console.log("No request in this log.");
  table(rows, [
    { label: "Route", get: (r) => r.route },
    { label: "Requêtes", get: (r) => r.count },
    {
      label: "Statuts",
      get: (r) =>
        [...r.statuses]
          .sort()
          .map(([s, n]) => `${s}×${n}`)
          .join(" "),
    },
    {
      label: "p50",
      get: (r) =>
        r.times.length ? `${Math.round(percentile(r.times, 0.5))}ms` : "",
    },
    {
      label: "p95",
      get: (r) =>
        r.times.length ? `${Math.round(percentile(r.times, 0.95))}ms` : "",
    },
    {
      label: "max",
      get: (r) =>
        r.times.length ? `${Math.round(r.times[r.times.length - 1])}ms` : "",
    },
  ]);
}

// ---------------------------------------------------------------------------

const args = parseArgs(process.argv.slice(2));
const commands = {
  postes,
  pushes,
  tail: (a) => (a.follow && a.file !== "-" ? tailFollow(a) : tail(a)),
  errors,
  epochs,
  stats,
};
if (!args.command || args.command === "help" || !commands[args.command]) {
  console.log(HELP);
  process.exit(args.command && args.command !== "help" ? 2 : 0);
}
await commands[args.command](args);

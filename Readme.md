# Project Readme

## Project Overview

The purpose of this project is to provide an offline-first web application that allows users to manage a "Bourse au ski". 
The users are volunteers of the ski association whom main tasks are :
* Evaluating and adding articles from sellers, which creates a seller profile with a list of articles (price, description, brand, model name, main color, size)
* Selling articles to buyers. Buyers can only buy articles that were dropped by sellers.


Each user is attributed a "Computer" with a dedicated Id.

An admin part of the application is also available for admin to oversee the "Bourse au ski", like :
* A complete list of articles with basic filters capabilities (seller, sold...)
* The global amount for the entire sale (and per Computer)

---

## Technologies overview

To ensure an offline-first web application, the following technologies are used :
* service workers (to cache the application and make it available offline)
* IndexedDB (to store the data in the browser) (wrapped with dexie for a better experience)

The frontend app uses :
* React (for the frontend)
* Vite (for the build process)
* Tailwind CSS (for the styling)
* TanStack Router (for the routing)
* Dexie (for the IndexedDB)

## Getting Started

Follow these steps to set up the project locally on your machine:

### Prerequisites

1. Ensure you have **Node.js** (version 22 or above) installed on your system. You can verify the installation by running:
   ```bash
   node -v
   ```

2. Install pnpm globally using npm:
   ```bash
   npm install -g pnpm
   ```
   Verify the installation with:
   ```bash
   pnpm -v
   ```

---

### Installation

1. Clone the project repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate into the project directory:
   ```bash
   cd <project-directory>
   ```

3. Install dependencies with pnpm:
   ```bash
   pnpm install
   ```

---

### Running the Project

1. Start the development server using Vite:
   ```bash
   pnpm frontend dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   (The exact port may vary; the terminal will display the correct URL.)

---

### Build the Project for Production

1. To create an optimized production build, run:
   ```bash
   pnpm frontend build
   ```
---

## Production deployment (LAN "server" mode)

The app is offline-first: each client PC keeps its own IndexedDB and pushes
writes to a central server, which then propagates them to other clients on
their next poll. In production we run **one Mac as the server** and the other
PCs connect to it over HTTPS on the local network.

This section explains how to set that up end-to-end.

### Architecture in production

```
                        ┌──────────────────────────────┐
                        │  Server Mac                  │
                        │  https://bourseauski.local   │
                        │                              │
                        │  ┌────────────────────────┐  │
                        │  │ Caddy   (:80, :443)    │  │ ← terminates TLS
                        │  │  ├─ /api → backend     │  │
                        │  │  └─ /    → frontend    │  │
                        │  └───┬───────────┬────────┘  │
                        │      │           │           │
                        │  ┌───▼───┐   ┌───▼─────┐     │
                        │  │backend│   │frontend │     │
                        │  │ :3000 │   │ nginx 80│     │
                        │  └───┬───┘   └─────────┘     │
                        │      │                       │
                        │  ┌───▼─────┐                 │
                        │  │postgres │                 │
                        │  └─────────┘                 │
                        └──────────────────────────────┘
                                    ▲
                            HTTPS over LAN
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
        ┌─────▼────┐          ┌─────▼────┐          ┌─────▼────┐
        │ Client 1 │          │ Client 2 │   ...    │ Client N │
        │ browser  │          │ browser  │          │ browser  │
        └──────────┘          └──────────┘          └──────────┘
```

Why HTTPS? Browsers only enable Service Workers (offline mode) on
`https://` origins or `http://localhost`. Plain HTTP on a LAN IP/hostname
would silently break offline support, so we terminate TLS at Caddy.

## Certificates: full runbook

Two stages: **(A)** generate the cert + local CA on the server Mac, then
**(B)** install that local CA on every client PC. The cert itself stays on
the server; only the **rootCA.pem** is distributed to clients.

The cert is bound to the *hostname* `bourseauski.local`, so DHCP can change
the Mac's IP without breaking anything.

---

### A. Server Mac — generate the cert

#### A.1. Make `bourseauski.local` resolve

`bourseauski.local` does **not** resolve by itself — the Mac advertises its own
LocalHostName over mDNS, not this name. Two options:

**Hosts entries (chosen approach).** Add one line per client PC, pointing at the
server's LAN address. `scripts/prepare-server.sh` prints the exact line. This is
IP-based, so the address must be pinned — see the DHCP reservation step in the
day-of runbook below.

**mDNS alternative.** Renaming the Mac makes `.local` resolution automatic and
survives IP changes, at the cost of renaming the machine:
```bash
sudo scutil --set LocalHostName bourseauski
ping -c 2 bourseauski.local   # verify from a *client*, not the server
```

#### A.2. Install mkcert and the `nss` helper

`nss` is required so `mkcert -install` can also register the CA in
Firefox's separate trust store on the server.

```bash
brew install mkcert nss
```

Verify:
```bash
mkcert -version
```

#### A.3. Create and trust the local Certificate Authority

This generates the local CA (one-time per Mac) and installs it into macOS
*System* keychain + Firefox/NSS trust store.

```bash
mkcert -install
```

You'll be asked for your macOS password — that's expected (writing to the
system keychain).

Verify it landed:
```bash
mkcert -CAROOT
# prints e.g. /Users/<you>/Library/Application Support/mkcert
ls "$(mkcert -CAROOT)"
# expect:  rootCA-key.pem   rootCA.pem
```

#### A.4. Issue the server certificate

Use the script — it detects the LAN address, issues the cert for it, restarts
Caddy and prints the hosts line for the clients:

```bash
./scripts/prepare-server.sh
```

Run it **on the venue network**, not at home: the certificate must cover the
address the server actually has there.

> The certificate must include the LAN IP in its SANs. Without it, any client
> reaching the server by address fails TLS.

A restart is required, not a reload. Caddy reads `load_files` certificates into
memory at config-load time; `docker compose up -d` is a no-op when the service
definition is unchanged, and `caddy reload` skips reloading when the adapted
config is byte-identical. Both silently keep serving the old certificate. The
script checks the served certificate's fingerprint against the file on disk and
fails if they differ.

#### A.5. Surface the rootCA.pem for distribution

You need a copy of `rootCA.pem` to hand to each client PC.

```bash
cp "$(mkcert -CAROOT)/rootCA.pem" ~/Desktop/bourseauski-rootCA.pem
```

This file is **not secret in the cryptographic sense** but it grants the
holder the ability to mint trusted certs for any machine where it's
installed — keep it on a USB stick or share it only on a trusted channel,
and don't publish it.

> ⚠️ Never copy `rootCA-key.pem` (the private key of the local CA) off
> the server. Only `rootCA.pem` (the public cert) goes to clients.

#### A.6. Start the stack on the server

```bash
docker compose up -d --build
```

Verify locally on the server (no warning, padlock closed):
```
https://bourseauski.local
```

---

### B. Each client PC — install the local CA

Every client PC needs `rootCA.pem` (the file from step A.5) imported into
its OS trust store **once**. After that, `https://bourseauski.local` works
warning-free and Service Workers register normally.

Get `rootCA.pem` onto the client first (USB stick, AirDrop, `scp`, email
attachment within the org…), then follow the section that matches the OS.

#### B.1. macOS client

UI:
1. Double-click `rootCA.pem` → it opens Keychain Access.
2. In Keychain Access, find the certificate named **mkcert <username>@…**
   under *System* (or *login* if it landed there).
3. Double-click it → expand *Trust* → set *When using this certificate* to
   **Always Trust** → close the window → enter your macOS password to save.

CLI alternative:
```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain rootCA.pem
```

Verify:
```bash
security find-certificate -c "mkcert" -p /Library/Keychains/System.keychain
```

#### B.2. Windows client

UI (Chrome / Edge / IE — they all share the Windows trust store):
1. Double-click `rootCA.pem`.
2. Click **Install Certificate…**.
3. *Store Location* → **Local Machine** → **Next** → confirm UAC prompt.
4. *Place all certificates in the following store* → **Browse** →
   **Trusted Root Certification Authorities** → **OK** → **Next** →
   **Finish**.
5. Confirm the security warning dialog.

CLI alternative (PowerShell as Administrator):
```powershell
Import-Certificate -FilePath rootCA.pem `
  -CertStoreLocation Cert:\LocalMachine\Root
```

Verify:
```powershell
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*mkcert*" }
```

#### B.3. Linux client (Debian / Ubuntu)

```bash
sudo cp rootCA.pem /usr/local/share/ca-certificates/bourseauski-rootCA.crt
sudo update-ca-certificates
```

(Note: the file extension must be `.crt` for `update-ca-certificates`.)

Verify:
```bash
awk -v cmd='openssl x509 -noout -subject' '/BEGIN/{close(cmd)};{print | cmd}' \
  < /etc/ssl/certs/ca-certificates.crt | grep mkcert
```

For Fedora / RHEL:
```bash
sudo cp rootCA.pem /etc/pki/ca-trust/source/anchors/bourseauski-rootCA.pem
sudo update-ca-trust
```

#### B.4. Firefox (any OS)

Firefox does **not** use the OS trust store, so even after B.1–B.3, you
must import the CA into Firefox separately on each client.

UI:
1. Open *Settings → Privacy & Security*.
2. Scroll to **Certificates** → click **View Certificates…**.
3. Go to the **Authorities** tab → **Import…** → select `rootCA.pem`.
4. Tick **Trust this CA to identify websites** → **OK**.

#### B.5. Verify the client

In each browser on the client PC:
```
https://bourseauski.local
```

Expected: padlock icon closed, no warning, the app loads. Open DevTools →
*Application → Service Workers* and confirm one is registered.

### Day-to-day operation

- Start: `docker compose up -d`
- Stop: `docker compose down`
- Logs: `docker compose logs -f caddy backend frontend`
- Rebuild after a code change: `docker compose up -d --build`

### Troubleshooting

- **`bourseauski.local` doesn't resolve from a client** — check the client
  is on the same Wi-Fi/LAN as the server, and that mDNS isn't blocked by a
  firewall (UDP 5353). On Windows older than 10, install Bonjour Print
  Services.
- **Cert warning on a client** — the rootCA wasn't installed in that
  browser's trust store (Firefox needs it imported separately).
- **Service Worker not registering** — must be on `https://`. If you see
  this on the server itself, ensure `mkcert -install` ran successfully.
- **Mac's IP changed** — breaks everything under the hosts-entry approach,
  because those entries map the name to an address. Re-run
  `./scripts/prepare-server.sh` and update the hosts line on all 9 PCs. Pin the
  address with a DHCP reservation to avoid this. (Only harmless if you took the
  mDNS route in A.1.)
- **`ERR_CERT_AUTHORITY_INVALID` on the server itself** — there may be more than
  one mkcert CA in the keychain, from a previous machine hostname, with the wrong
  one trusted. `mkcert -install` fixes it. Confirm which CA signed the live cert:
  `openssl x509 -in certs/cert.pem -noout -issuer`.

---

## Day-of runbook

Nine client PCs, one Mac as the server, one day. Work top to bottom.

### 1. Before leaving

- [ ] `certs/` copied to a USB key. It is gitignored — nothing else backs it up,
      and the certificate cannot be recovered from a running container.
- [ ] `rootCA.pem` sent to whoever sets up the client PCs (see step 3).
- [ ] `docker compose down && docker compose up -d` succeeds from cold. This is
      the single most valuable check: it proves the stack survives a reboot or a
      power blip.

### 2. On site — the server Mac

```bash
sudo pmset -a disksleep 0 sleep 0 powernap 0 standby 0   # once, persists
caffeinate -dimsu &                                       # every boot
./scripts/start-server.sh                                 # on the venue network
```

`start-server.sh` does everything: starts Docker if needed, launches the
services, waits until all four are healthy, issues the certificate for the
address this network gave the Mac, verifies HTTPS, and prints the hosts line for
the client PCs. It stops with a plain-language message if any step fails.

Add `--rebuild` only after a code change.

**Desktop icons.** If whoever runs the server on the day would rather not use a
terminal, put three double-clickable icons on the Desktop once, in advance:

```bash
./scripts/install-desktop-icons.sh
```

This creates *1 - Démarrer le serveur*, *2 - État du serveur* and
*3 - Arrêter le serveur*, numbered in the order they are used. Double-clicking
opens a Terminal window showing the same checks, so it is visible whether things
worked. Test each one before the day: the first launch may need a right-click →
Open.

- [ ] **DHCP reservation** for the address the script prints, on the venue
      router. Without it the lease rotates and every hosts entry goes stale
      mid-event.
- [ ] **Close every other application.** macOS starts the day ~1.2 GB into swap
      and Docker reserves 8 GB of 16 GB. This is the highest-leverage thing you
      can do for performance, and it costs nothing.
- [ ] Lid open, plugged in, automatic updates off.

### 3. Each client PC — order matters

**Install the CA _before_ anyone opens the site.**

1. Install `rootCA.pem` (section B above, per OS).
2. Add the hosts line printed by `prepare-server.sh`:
   - Windows: `C:\Windows\System32\drivers\etc\hosts` (edit as Administrator)
   - macOS/Linux: `sudo nano /etc/hosts`
3. *Then* open `https://bourseauski.local`.

> ⚠️ Get this order wrong and the browser shows a certificate warning. Clicking
> "proceed anyway" stores an exception that leaves a permanent **"Non sécurisé"**
> pill even after the CA is installed — and the obvious fix, clearing the site's
> data, **wipes that PC's IndexedDB**, destroying every deposit or sale it has
> not yet pushed. If it happens, quit the browser fully (⌘Q / close all windows)
> first; that clears it without touching site data.

Verify on each PC: padlock closed, app loads, and DevTools → Application →
Service Workers shows one registered.

### 4. During the event

```bash
./scripts/status.sh
```

Run it whenever something feels wrong. It checks the four services, whether the
app answers, the certificate (including whether it still covers the Mac's
current address — the most likely day-of failure), the row counts, database
connection usage, recent errors, memory and swap, and how long ago the last
backup was taken. It ends with either *Everything is working* or a list of
problems with the fix for each.

Raw tools if you need them: `docker stats`, `sysctl vm.swapusage`,
`docker compose logs -f backend`.

What normal looks like: backend and postgres idle at well under 100 MB each,
CPU near zero between polls, `responseTime` in the logs in single-digit
milliseconds.

Worth knowing: a **frozen server with an idle container** is connection-pool
exhaustion, not load — `status.sh` reports it as database timeouts.

### 5. If something breaks

**The server is down.** Cashiers keep working — the app is local-first and reads
from IndexedDB. Do not let anyone reload or clear their browser. Fix the server;
clients resync on their next poll.

**Postgres data is lost.** Restore from the most recent dump — that is the only
practical recovery path, so take dumps regularly (below).

Do **not** count on the clients to rebuild the server. Each one holds a full copy
in IndexedDB, but there is no re-push: `processOutbox` only sends operations
still marked `pending` or `failed`, and anything already acknowledged is never
sent again. Recovering from a client means manually exporting its IndexedDB via
DevTools and importing it by hand — slow, and not something to attempt for the
first time during an event.

**A client PC is broken.** Its unsynced work lives only in its own browser
profile. Do not clear site data or reset the profile until the server has
confirmed the data arrived.

### End of day

```bash
./scripts/stop-server.sh
```

Takes a final backup, then stops. It refuses to stop if the backup fails. The
database is kept in a Docker volume, so starting again restores everything.

### Backups — do this every 30 minutes

The dumps are the recovery plan. Run this in a spare terminal and leave it:

```bash
mkdir -p backups
while true; do
  docker exec cmr_postgres pg_dump -U cmr_user -d cmr_db \
    > "backups/cmr_db-$(date +%H%M).sql"
  sleep 1800
done
```

Copy the folder to a USB key at the end of the day. `backups/` is gitignored —
the dumps contain sellers' and buyers' names and phone numbers.

---

## DYMO label printing on Windows 7 clients

Some deposit PCs run Windows 7 with **DYMO Label Software v8.7.4** for
printing seller/article labels. The DYMO Label Web Service (port
`41951`) only speaks legacy TLS (1.0/1.1) and ships with an old
self-signed cert. Modern Chrome/Edge (≥ v91) refuse the connection
outright — there is no flag, policy, or click-through to re-enable it.

**Use Firefox ESR 115** on these PCs. It is the last Firefox branch that
runs on Windows 7 and still exposes the prefs needed to allow legacy
TLS.

### Setup steps (per Win7 client)

1. **Install Firefox ESR 115 for Windows 7.**
   Download from
   [mozilla.org/firefox/all/#product-desktop-esr](https://www.mozilla.org/firefox/all/#product-desktop-esr)
   (pick a 115.x build — later ESR branches dropped Win7 support).

2. **Allow deprecated TLS versions.**
   In the address bar go to `about:config` → accept the warning →
   set:
   - `security.tls.version.enable-deprecated` → **true**
   - `security.tls.version.min` → **1**  *(1 = TLS 1.0)*

3. **Verify.** With DYMO Label running, open
   `https://localhost:41951/DYMO/DLS/Printing/Check` in Firefox. You
   should get a JSON-ish "DYMO Label Framework is up and running"
   response (a one-time cert warning is expected; click through to
   trust it).

After that the deposit app's print buttons will reach the local DYMO
service from the browser.

---

## Project Structure

```plaintext
├── src/
│   ├── components/       // React components
│   ├── routes/           // Router configurations
│   └── main.tsx          // Entry point of the application
├── public/               // Static assets
├── package.json          // Project metadata and scripts
├── tailwind.config.js    // Tailwind CSS configuration
├── pnpm-lock.yaml        // pnpm lockfile
└── vite.config.ts        // Vite configuration
```

---

## Available Scripts

- **`pnpm frontenv dev`**: Start the development server.
- **`pnpm frontenv build`**: Build the app for production.
- **`./scripts/start-server.sh`**: Start everything for the sale. Use this one.
- **`./scripts/status.sh`**: Is the server healthy right now? Safe at any time.
- **`./scripts/stop-server.sh`**: Take a final backup and stop cleanly.
- **`./scripts/prepare-server.sh`**: Certificate step only — called by
  `start-server.sh`. Run it alone if the Mac's address changes mid-event.
- **`./scripts/install-desktop-icons.sh`**: Put double-clickable icons for the
  three scripts above on the Desktop. Run once, in advance.

---

## Conclusion

This project setup provides a seamless workflow for building modern web applications. If you encounter any issues, feel free to reach out to the project maintainers.

Happy coding! 🎉

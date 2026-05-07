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

#### A.1. Set the Mac's local hostname to `bourseauski`

mDNS / Bonjour will then publish the Mac as `bourseauski.local` on the LAN
(no DNS server needed; clients on Windows 10+, macOS, iOS, Android, and
most Linux desktops resolve `.local` automatically).

UI:
1. *System Settings → General → Sharing*.
2. Click the **(i)** button next to *Local hostname*.
3. Set the value to `bourseauski` and confirm.

CLI alternative (equivalent):
```bash
sudo scutil --set LocalHostName bourseauski
```

Verify (from the server itself, then from any other LAN device):
```bash
dns-sd -B _services._dns-sd._udp local.   # optional: see what's advertised
ping -c 2 bourseauski.local
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

From the project root (`/Users/truaro/workspace/DepotVente`):

```bash
# Replace any existing cert files
rm -f certs/cert.pem certs/cert-key.pem

mkcert -cert-file certs/cert.pem -key-file certs/cert-key.pem \
  bourseauski.local localhost 127.0.0.1
```

Verify the SAN matches what we expect:
```bash
openssl x509 -in certs/cert.pem -noout -subject -ext subjectAltName
# expected SAN: DNS:bourseauski.local, DNS:localhost, IP Address:127.0.0.1
```

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
- **Mac's IP changed** — irrelevant. The cert is bound to the hostname,
  not the IP. As long as `bourseauski.local` still resolves via mDNS,
  everything keeps working.

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

---

## Conclusion

This project setup provides a seamless workflow for building modern web applications. If you encounter any issues, feel free to reach out to the project maintainers.

Happy coding! 🎉

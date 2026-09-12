# Rehearsal runbook (fake sale)

A dress rehearsal on real 2025 data: the pro reception desk, the deposit desk,
the till, and the evening close. One Mac as the server, the client PCs as they
will be on the day.

For the real event, follow the _Day-of runbook_ in [Readme.md](Readme.md)
instead — certificates, USB kit, DHCP reservation, backups. This page picks up
once the stack runs on the local network, and covers preparing the data, what
to do at each desk, what to watch, and how to replay.

The server can be any machine on the venue network, not necessarily the one the
data was prepared on: section 2 says what to carry over and how to load it.

---

## 1. What is loaded

|                             |                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Deposits                    | 211 — 203 private sellers, 8 professionals                                                         |
| Articles                    | 3202                                                                                               |
| Pro articles to receive     | 260 — fiches 2 PERRILLAT, 3 ALLOSKI, 4 SPORT; skis, boots and poles, 30 each (20 poles on fiche 4) |
| Articles ready for the till | 1132 received and unsold, from 203 sellers                                                         |
| Predeposits still free      | 6 (the other 55 already became deposits in 2025)                                                   |
| Accounts                    | `admin@cmr.com` / `admin` · `benevole@cmr.com` / `benevole`                                        |

Check it before starting:

```bash
./scripts/status.sh
```

---

## 2. Setting up the server machine

Skip this if the server already holds the data and you only want to run the
day again — see _Replaying_ at the end.

**If the server is not the machine the data was prepared on**, two things it
needs are deliberately kept out of git and must be carried over on a USB key:

| From the prepared machine                         | To the server, same path |
| ------------------------------------------------- | ------------------------ |
| `packages/database/.env`                          | `packages/database/.env` |
| `apps/backend/src/scripts/import/*.tsv` (8 files) | the same folder          |

The `.env` is one line, so it can also just be typed:

```
DATABASE_URL="postgresql://cmr_user:cmr_password@localhost:15432/cmr_db?schema=public"
```

Without the `.tsv` files the import has nothing to load; without the `.env`
every `db:*` command and every script fails on a missing `DATABASE_URL`.

**Erase the database and load the rehearsal data**, from the repository root:

```bash
docker compose down -v                  # erase: drops the Postgres volume
docker compose up -d --build            # rebuild and start; the backend migrates
pnpm install                            # first time on this machine
pnpm --filter database db:generate      # first time on this machine

pnpm --filter database db:reset         # empty schema + the two accounts
pnpm --filter backend script:import     # the 2025 deposits, articles, predeposits
pnpm --filter backend script:reserve-pro --fiches 2,3,4   # 260 articles to scan
pnpm --filter backend script:pro-barcodes                 # tmp/pro-barcodes.html
```

`docker compose down -v` is the real erase: it removes the volume, so nothing
of the previous run survives. `db:reset` then gives a clean schema and recreates
`admin@cmr.com` / `admin` and `benevole@cmr.com` / `benevole`.

> If you only bring the stack up on a fresh volume without `db:reset`, the
> backend applies the migrations at boot but **no account exists** and nobody
> can log in. `pnpm --filter database db:seed` creates them without erasing
> anything.

Check the result against the table above:

```bash
./scripts/status.sh
```

Everything the client PCs hold from a previous run is now stale: they will each
raise the reset dialog on their next poll and must reload from the server. That
is expected after an erase.

## 3. Before the volunteers arrive — on the server

**Print the barcode sheet.** This is what the desks scan.

```bash
pnpm --filter backend script:pro-barcodes            # tmp/pro-barcodes.html
pnpm --filter backend script:pro-barcodes --particuliers 60   # more till codes
```

290 codes by default: one section per pro fiche and category (nine sections,
30 each but 20 poles on fiche 4), then 30 private-seller articles, one per
seller, for the till. Open the
file in a browser and print it, or paste it into a document. The barcodes are
Code 128, the same as the DYMO labels, so a scanner reads them off paper.

**Hand out the pages.** The reception desk needs the nine pro sections, three
per professional; the till needs the last page.

---

## 4. Each client PC — five minutes, do not skip

- [ ] Open `https://bourseauski.local`, log in.
- [ ] **Set the cash register number**: _Paramètres → Numéro de caisse_. Give
      each PC a different one (1000, 2000, 3000…). Deposit and sale numbers are
      built from it, and the evening cash counts are per register, so two PCs
      sharing a number produce colliding numbers and a wrong count.
- [ ] On the same page, check _Identité du poste_: a device id, the build, and
      an _Epoch de la base serveur_. The epoch must match the other PCs.
- [ ] Leave _Opérations en attente d'envoi_ at 0 before starting.

---

## 5. The four exercises

### a. Pro reception — _Réceptionner les articles des pros_

Pick a professional, then scan its sheet one category at a time, as on the day.

Watch:

- _Nombre d'articles scannés_ moves with each scan, _Nombre d'articles total_
  does not.
- The received list groups by category. A scan lands at the top of **its own
  category**, not at the top of the list.
- Deliberate mistakes are worth rehearsing: scan a code from another pro's page
  (refused, _n'appartient pas à ce professionnel_), and scan the same article
  twice (refused, _déjà effectué_). Each refusal is a dialog to acknowledge, and
  nothing is counted.

### b. Deposit desk — _Enregistrer des articles_

Two paths, both worth doing:

- **From a predeposit**: pick a seller in the combobox, _Valider_, the form
  fills in. Only 6 are left, so share them out.
- **Walk-in**: type the seller and the articles by hand.

Watch: the deposit number follows the register, the contribution is 2 € per
started block of ten articles, and **the sheet must be printed before saving** —
the screen refuses otherwise.

### c. Till — _Faire une vente_

Scan the till page, type the buyer, split the payment across cash, card, cheque
and deferred.

Watch: the payment must cover the total to the euro, or saving is refused. The
invoice is optional here, unlike the deposit sheet. Rehearse the refusals: a
code already sold, and an article that was never received.

### d. Evening close

- _Gérer les fiches retours_: select everything, _Lancer le calcul des retours_.
  The club keeps 10 % for a private seller, 15 % for a professional, and an
  unpaid contribution comes out of the seller's share. Running it twice changes
  nothing.
- Then the return desk: cheques to sellers.
- Both cash counts: _Contrôler les espèces_ on a deposit register, _Contrôler la
  caisse_ on a till. Both need a comment and a printed report before they save.
- The admin reports under _Bilan_.

---

## 6. Supervision — from the server, while it runs

```bash
pnpm traces postes             # every PC seen: register, build, last seen, sent, refusals
pnpm traces pushes             # what each register sent: collection, operation, when
pnpm traces tail --route push  # live, only the writes the registers send
pnpm traces tail --poste 2000  # live, one line per request for that register
pnpm traces errors --since 1h  # everything the server refused, with the reason
pnpm traces epochs             # PCs holding an old database epoch
pnpm traces stats              # volume and response times per route
./scripts/status.sh --watch    # services, certificate, memory, backups
```

What normal looks like: every PC appears in `postes` with 0 refused, a delta
poll every 20 seconds each, response times in single-digit milliseconds, and
`errors` empty. A desk that is registering or selling also shows up in
`pushes`, one row per collection it writes; a PC whose *Envois* column stays
at 0 while the volunteers are typing is not reaching the server.

What to react to:

- **A PC missing from `postes`** — it never reached the server. Check its
  address and that it is logged in.
- **Refusals climbing** on one PC — read `pnpm traces errors --since 10m`. The
  code says whether it is data the server refuses (`INVALID_DATA`), a missing
  parent (`MISSING_REFERENCE`) or a stale database (`EPOCH_MISMATCH`).
- **`epochs` listing a PC** — that PC synced against an older database. It must
  rebuild its local base from the dialog the app shows it.

---

## 7. What to watch on a client PC

There is no sync indicator in the app yet. The check is _Paramètres_, which an
admin account can open on any PC:

- _Opérations en attente d'envoi_ should return to 0 within seconds of a write.
  A number that keeps growing means the PC is not reaching the server.
- _Outbox — opérations refusées_ should stay empty. Anything there was refused
  for good by the server and will not retry on its own; note the code and the
  record, and tell whoever is at the Mac.
- If a PC shows a **blocking dialog saying the server database was reset**, its
  local copy is from an older database. _Recharger depuis le serveur_ fixes it
  and discards whatever that PC had not yet sent.

---

## 8. Replaying

**The pro reception, as many times as you like** — this re-arms the same 260
articles without touching anything else:

```bash
pnpm --filter backend script:reserve-pro --fiches 2,3,4
pnpm --filter backend script:reserve-pro --fiches 2,3,4 --dry-run   # see first
```

The client PCs pick it up on their next poll, within 20 seconds.

**Sales cannot be un-sold**, and deposits registered during the rehearsal stay.
To start the whole day again from the 2025 data, run the erase and reload of
_Setting up the server machine_ above.

> ⚠️ An erase gives the server a **new database epoch**. Every client PC will
> raise the reset dialog on its next poll and must reload from the server. That
> is the intended behaviour, and it is worth rehearsing once on purpose.

---

## 9. Known quirks — not bugs to report

- The **deferred amount does not appear on the invoice**, so an invoice paid
  partly on credit shows payment lines adding up to less than its total.
- A professional's return can carry a **half cent** (15 % of 85,50 € is
  12,825 €). The cheque prints rounded; the stored figure is not.
- In the pro reception, the scanned counter counts **everything no longer
  pending**, so an article already sold or deleted counts as received.
- A scanned article appears at the top of **its category group**, not at the top
  of the list.
- The deposit sheet's information block still carries **2025 dates**.

---

## 10. Worth writing down during the day

Anything a volunteer hesitates over, any screen where the next step was not
obvious, and every refusal nobody could explain. Those are worth more than the
numbers, and they are what the next change should fix.

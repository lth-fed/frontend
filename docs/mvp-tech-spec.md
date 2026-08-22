# Teknologappen Frontend — MVP Tech Spec

Status: draft for review · 2026-07-23 (rev 3: 10-min entry window, no keep-alives/re-PUTs, verified
against #62 source) Grounded in: `docs/krav.typ` (MVP items), `docs/beslut/*` (settled decisions),
and the backend as of 2026-07-23: **merged to main** — error handling (#56), OIDC (#60, contract
verified identical to the mapped branch), seeder (#61); **still open, assumed to land as-is** —
tickets/transactions (`erik/transactions`, PR #62). Frontend on `main`. The auth contract (§2) is
live on backend main today; the ticket/queue contract (§4) exists only on the #62 branch.

The goal of this document: after it is agreed on, **no technical design decisions remain** for
building the MVP. Anything not specified here follows the existing conventions in the codebase (see
§11).

---

## 0. MVP scope & traceability

| krav.typ requirement                                   | Spec section                 |
| ------------------------------------------------------ | ---------------------------- |
| §2 Skapa konto med LU-inlogg                           | §2 Auth                      |
| §3 Logga in med LU-inlogg                              | §2 Auth                      |
| §4 Lista aktiviteter jag kan se                        | §5 Screens (Home), §6 Cache  |
| §5 Visa detaljerna för en aktivitet (mellan sektioner) | §5 Screens (Activity detail) |
| §6 Köpa biljett                                        | §4 Purchase state machine    |
| §7 Om appen                                            | §5 Screens (About)           |
| §8 Utseende baserat på sektion                         | §6 Theming                   |

Non-goals for MVP (explicitly out): ticket transfer, receipts, filters, notifications, admin
surfaces, offline validation, matpref/addons UI (backend `addons` on ticket kinds is itself `todo`),
news feed. `QrCode` stays a placeholder (validation is post-MVP).

---

## 1. Backend contract summary (what we build against)

Two services, both talked to directly (CORS), all requests via CapacitorHttp
(`auth-lib.authenticatedFetch`):

- **fed-auth** `:8001` / `auth.teknologappen.se` — OIDC provider. Frontend only uses
  `/oidc/v1/authorize`, `/oidc/v1/token` (both already wrapped by `auth-lib`).
- **minilith** `:8000/v0` / `api.teknologappen.se/v0` — everything else.

Wire conventions (already handled in `src/lib/api/` wrappers, keep the pattern):

- i18n strings are `{ en, sv }` maps → resolved at the API boundary via `pickI18n`.
- Money is **integer öre** (`i64`) → formatted only via `formatPrice` (0 → "Gratis"/"Free").
- Timestamps are RFC3339 → `Date` at the boundary via `parseDate`.
- Group identity is an ltree path string (`"tlth.e"`) → `guildFromPath`.
- Errors: `{ message: string, field: string | null }` with **no machine-readable code**. Switch on
  HTTP status; only 400-messages are user-facing (§8).

Endpoints used by MVP:

| Endpoint                              | Used by                                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v0/activities/`                 | Home list (LIMIT 100, sorted by `time_start`, no pagination — accepted for MVP)                                                                                                        |
| `GET /v0/activities/:id`              | Activity detail                                                                                                                                                                        |
| `GET /v0/activities/:id/ticket-kinds` | Purchase screen                                                                                                                                                                        |
| `GET /v0/tickets/`                    | My-tickets carousel, purchase confirmation                                                                                                                                             |
| `POST /v0/tickets/`                   | Free-ticket purchase (`{ticket_kind, addons: []}`)                                                                                                                                     |
| `PUT /v0/tickets/queue`               | Enter queue (`{ticket_kind}`) → `PurchaseStatus`. **Called exactly once per purchase attempt** — a repeat PUT after release resets your reservation-queue placement to the back (§4.2) |
| `GET /v0/tickets/queue`               | Poll queue/reservation state → `{ticket_kind, placement, timeout, latest_transaction}`                                                                                                 |
| `DELETE /v0/tickets/queue`            | Leave release queue                                                                                                                                                                    |
| `DELETE /v0/tickets/reservation`      | Drop reservation → `{status: Dropped \| TransactionCancelling}`                                                                                                                        |
| `GET /v0/user/`                       | Session identity + guild derivation                                                                                                                                                    |
| `GET /v0/healthcheck`                 | Distinguish "server down" from network error on 5xx                                                                                                                                    |

Type generation: `pnpm api:generate` against locally running branch builds regenerates
`src/lib/api/generated/{api,auth}.d.ts`. Regenerate once when the PRs merge; components never import
generated types directly — only `src/lib/api/*` wrappers do.

---

## 2. Auth (krav §2–3)

The OIDC plumbing in `auth-lib` already matches the fed-auth contract (PKCE S256,
`client_id=teknologappen`, lowercase `bearer`, 900 s access tokens, single-use rotating refresh
tokens with single-flight refresh). Changes needed:

### 2.1 Provider switch

`bootstrap.ts` hardcodes `beginLogin('test', …)`. Replace with a single constant:

```ts
const AUTH_PROVIDER: Provider = dev ? 'test' : 'lu';
```

No UI change: we always pass an explicit `providers` value, so fed-auth's provider-selection page is
never shown for the app (omitting it would default to `"lu mail"` and force the selection screen).

### 2.2 Callback error handling (the krav "error lands back in the app" path)

fed-auth reports authorize-stage failures as a **302 back to our redirect URI with
`?error=…&error_description=…`**. Handle in both callback paths:

- Web (`/auth/callback/+page.ts`): before calling `finishWebLogin`, check
  `url.searchParams.get('error')`. If present → render an error state on the callback page
  (localized generic message + the raw `error_description` in a collapsible detail) with a "Try
  again" button that calls `startLogin()` and a "Back" that goes to Landing.
- Native (`startNativeLogin`): `finishLogin` already returns `null` on `error` params. Today the
  null case is silently ignored — instead set a new
  `session.loginError: 'cancelled' | 'failed' | null` and have `Landing` render the message with
  retry. `InAppBrowser.openSecureWindow` rejection (user closed the browser) →
  `loginError = 'cancelled'`.

New messages: `auth_error_title`, `auth_error_cancelled`, `auth_error_failed`, `auth_error_retry`
(en+sv).

### 2.3 The stranded-SAML case

If SAML fails at LU, fed-auth returns a bare 500 on `/saml2/acs` — the user never gets redirected
back. Consequences:

- Native: the in-app browser shows the 500; the user closes it → `openSecureWindow` rejects →
  handled as `cancelled` above. Nothing more needed.
- Web: the user lands on a dead page and uses browser-back. Our app must not be stuck in
  `authenticating`: `getAuthState()` returning `authenticating` on app boot is treated as **stale**
  — reset to `unauthenticated` (pending fed-auth sessions expire in 30 min anyway). One-line change
  in `bootstrapAuth`.

### 2.4 Session activation & logout

Unchanged: `activateSession` (token → `getMe` → `session.guild` via `majorityGuild`). Logout stays
local token deletion — fed-auth has no revocation endpoint; refresh tokens are single-use so the
discarded copy is unusable. Datasharing consent does not apply to `client_id=teknologappen` (only
guild clients) — no screen needed.

### 2.5 Account creation == login

krav §2's "create account" is the same flow: minilith upserts the user when fed-auth POSTs the
signed JWT to `/v0/user/auth-callback/v1` during token exchange (`BACKEND_CALLBACK_V1` already
wired). Personnummer/medcheck validation is **not** exposed by any backend endpoint yet → out of MVP
frontend scope; the krav's "annars får jag inte automatiskt tillhörighet" fallback (no guild →
default theme) is what we implement (§7).

---

## 3. Data layer & cache policy (minimize refetching)

### 3.1 Structure (three layers, two exist)

1. **Generated wire types** (`generated/*.d.ts`) — regenerated, never imported by UI.
2. **Resource wrappers** (`api/activities.ts` etc.) — snake→camel, `pickI18n`, `parseDate`, öre
   passthrough. Components receive only these domain types. Keep `DEMO_MODE` fixtures in sync when
   shapes change.
3. **NEW: SWR cache** `src/lib/api/cache.svelte.ts` between load functions and wrappers.

### 3.2 Cache design

```ts
type CacheEntry<T> = { value: T | undefined; fetchedAt: number; inflight: Promise<T> | null };
const store = new SvelteMap<string, CacheEntry<unknown>>(); // module-level, reactive

export function cached<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T>;
export function invalidate(...keys: string[]): void; // exact keys
export function invalidatePrefix(prefix: string): void; // e.g. 'kinds:'
```

Semantics of `cached` (stale-while-revalidate):

- No entry → fetch, store, return promise.
- Entry fresh (`now - fetchedAt < ttl`) → return cached value (as resolved promise).
- Entry stale → return cached value **immediately**, kick off one background refetch (dedupe via
  `inflight`); the `SvelteMap` write re-renders consumers when it lands.
- Errors during background revalidation are swallowed (stale data stays); errors on a cold fetch
  propagate to the load function → `+error.svelte` as today.

Load functions change from `getMe({fetch})` to `cachedMe()` style helpers exported next to each
wrapper (`cachedActivities()`, `cachedActivity(id)`, …). The dead `{fetch}` / `ApiCallOpts`
threading is removed in the same pass (transport is CapacitorHttp; SvelteKit's fetch was never
used).

### 3.3 Policy table

| Resource        | Key                                                     | TTL         | Extra revalidation                          | Invalidated by                                    |
| --------------- | ------------------------------------------------------- | ----------- | ------------------------------------------- | ------------------------------------------------- |
| Activities list | `activities`                                            | 60 s        | app resume (Capacitor `App` `resume` event) | —                                                 |
| Activity detail | `activity:{id}`                                         | 5 min       | —                                           | —                                                 |
| Ticket kinds    | `kinds:{activityId}`                                    | 15 s        | —                                           | any purchase / queue transition for that activity |
| My tickets      | `tickets`                                               | 60 s        | app resume                                  | purchase success                                  |
| Me              | `me`                                                    | session (∞) | —                                           | login, logout                                     |
| Queue status    | **never cached** — owned by the reservation poller (§4) |             |                                             |                                                   |

Seeding: `BriefActivity` (list) lacks `hosts`/`responsible`/`tickets_exist`, so the detail screen
renders header fields instantly from `activity:{id}`-**brief** data when navigating from the list
(pass via nav state is _not_ used — instead `cachedActivity(id)` first consults the list cache for a
brief record and returns it as a placeholder while the full fetch runs). Concretely: `getActivity`
result type gains `full: boolean`; the detail page renders skeletons for organiser/ticket sections
while `!full`.

App resume hook: one `App.addListener('resume', …)` in root layout calling
`invalidate('activities', 'tickets')` — SWR then refetches on next render pass.

---

## 4. Purchase state machine (krav §6)

### 4.1 States (mirror the backend exactly)

```
Idle → (free kind)  FreeBuying → Done
Idle → (paid kind)  ReleaseQueued → ReservationQueued → Reserved → Paying → Done
                                            ↘ Expired / Dropped / Failed ↙
```

Client-side type:

```ts
type PurchaseFlow =
	| { state: 'idle' }
	| { state: 'release-queued'; ticketKindId: string }
	| { state: 'reservation-queued'; ticketKindId: string; placement: number }
	| { state: 'reserved'; ticketKindId: string; timeout: Date; latestTransaction: Date }
	| { state: 'paying'; ticketKindId: string; timeout: Date }
	| { state: 'purchased'; ticketId: string }
	| { state: 'expired' | 'dropped' | 'failed'; ticketKindId: string; message?: string };
```

Lives in a new global store `src/lib/state/purchase.svelte.ts` (global, not page-local: the user may
navigate away and must be able to return — §4.5).

### 4.2 Timers & network activity (10-minute entry window, no keep-alives, no re-PUTs)

**Design rule: queue entry is allowed only in the final 10 minutes before release, and after the
single entry `PUT` the client never automatically issues another `PUT`.**

Why this is safe (verified in `minilith/src/ticket.rs` + `runtime.rs` on the #62 branch):

- The release is a server-side **lottery**: at the first minute-tick after
  `purchasing_available_start`, `release()` takes _all_ release-queuers, **shuffles** them, grants
  the first `max_tickets` a reservation and queues the rest. Join order is irrelevant — entering at
  T−10 min and T−1 s have identical odds. The 10-min window therefore costs users nothing (and the
  UI copy must say so, satisfying krav §6's randomness intent).
- Release-queue spots purge 20 min after the (last) `PUT`. Entry ≤10 min before release
  - release firing ≤60 s after the release time ⇒ a spot is at most ~11 min old when converted.
    **Keep-alive re-PUTs are structurally unnecessary.**
- Re-PUTs after release are **harmful**, not just wasteful: the reservation-queue insert is
  `on conflict (user_id) do update … placement = last+1` — a repeat `PUT` moves you to the back. The
  no-auto-re-PUT rule is a correctness requirement.
- The reservation queue has **no purge** — rows leave only by promotion or the sold-out sweep — so
  post-release waiting needs no keep-alive either.

**Server-clock offset**: all gate/countdown math uses `serverNow() = Date.now() + offset` where
`offset` is estimated from the `Date` response header of the most recent minilith response (stored
in the purchase store, refreshed on each response/resume). This immunizes the entry gate, release
wake, and countdowns against device clock skew — a skewed early `PUT` could otherwise purge before
release.

Phase behavior (all timers recomputed from absolute timestamps; nothing runs while backgrounded; one
resync `GET` on every resume/screen-entry):

| Phase                                          | Network                                                                                                                                                                                                           | UI                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Before window (`serverNow() < start − 10 min`) | none                                                                                                                                                                                                              | button disabled, shows release time   |
| Entry window                                   | one `PUT` on tap → `release-queued`                                                                                                                                                                               | "join the release" CTA + lottery copy |
| `release-queued` pre-release                   | **none**                                                                                                                                                                                                          | local countdown to release            |
| Release resolution                             | `GET` every 15 s from the release instant (first call jittered 0–10 s against the herd) until resolved; give up after 3 min → "release delayed" state (B9) with manual refresh                                    | spinner/"drawing lots…"               |
| `reservation-queued`                           | `GET` every 15 s **only while the purchase screen is foregrounded** (promotions happen at the server's minute sweep _and_ instantly when someone drops — each undiscovered minute burns granted reservation time) | placement display                     |
| `reserved`                                     | **none** — local 1 s countdown from `timeout`; displayed deadline and buy cutoff are both `latest_transaction` (= `timeout − 1 min`; backend does not enforce the 1-min rule — we own it, krav §6)                | countdown + pay button                |
| `paying`                                       | `GET` every 5 s (payment result arrives server-to-server; the status flip is our only signal)                                                                                                                     | payment progress                      |

Poll-result → state transitions: `timeout != null` → `reserved`; `placement > 0` →
`reservation-queued(placement)`; `404` → if we were `reserved` and `serverNow() > timeout` →
`expired`; otherwise check `GET /v0/tickets/` — new ticket → `purchased`, none → `failed` with a
"try again" CTA (a _manual_ re-PUT joins the reservation queue at the back; also the recovery path
for B8's dropped-queuer case).

### 4.3 Free path

`price === 0` → `POST /v0/tickets/` directly (no queue), on 200 → `purchased`, invalidate
`tickets` + `kinds:{activityId}`, navigate to Home with the new ticket centered in the carousel. On
400 (duplicate/not-allowed: `field: "ticket_kind"`) → inline error on that `TicketKindCard` showing
the server `message`.

> ⚠ Blocked on backend bug B2 (§9): the free-path insert currently violates the
> `transaction_id NOT NULL` constraint. UI is built now; works when fixed.

### 4.4 Paid path & the payment gateway seam

**BUILT** (the #62 tip shipped the real endpoint — `POST /v0/tickets/reservation` with a
`provider`). krav §6's "test view asking whether you want to complete the transaction" is the
confirm dialog. `src/lib/payment/gateway.ts`:

```ts
export type PaymentOutcome =
	| { kind: 'completed'; ticketId?: string } // settled inline (free)
	| { kind: 'submitted' } // initiated; machine polls for the callback
	| { kind: 'failed'; message?: string }; // reservation stands, retry allowed
export interface PaymentGateway {
	readonly provider: PurchaseProvider;
	pay(ticketKindId: string): Promise<PaymentOutcome>;
}
```

- **`freeGateway`** (`provider: 'free'`): 0 kr kinds settle server-side inline → `completed`. The
  machine auto-invokes it on entering `reserved` with `price === 0`, so free tickets need no tap.
- **`swishGateway`** (`provider: 'swish'`): the confirm dialog's "Pay" hands off here; it initiates
  the payment request and, on native, opens the Swish app (`swish://paymentrequest?token=…`); the
  purchase completes via the transactions→minilith callback, observed by §4.2 polling in `paying`.
  On web dev there's no Swish app, so it sits in `paying` (honest — no fake success).
- `gatewayFor(priceOre)` picks free vs Swish; Stripe/others slot in here with zero caller changes.
- The machine's `pay(gateway)` owns the `reserved → paying → completed/submitted/failed`
  transitions. Failure returns to `reserved` with the countdown intact and surfaces the message
  inline — krav §6's "show the error, retry within the window". The Pay button is hidden once
  `now ≥ latestTransaction` (too late to start safely, §4.2).

Buy button behavior in `reserved`: enabled while `now < latestTransaction`, label shows countdown
(`m.purchase_pay_within({time})`), disabled + explanation after.

### 4.5 Cross-app reservation surface

While `purchaseFlow.state` is one of queued/reserved/paying, the shell renders a **persistent
countdown pill** above the bottom nav (same slot styling as `BottomActionButton`,
`bg-guild-primary`): pre-release → "Släpps om {mm:ss}", reservation-queued → "I kö: plats {n}",
reserved → "{mm:ss} kvar att betala". The pill itself never triggers network activity — it renders
store state (§4.2's phase table governs all polling; notably the pill does **not** poll while the
user is elsewhere in the app pre-release). Tapping it navigates (`pushNavigation`) back to
`Routes.ActivityTickets(activityId)`. Leaving the flow explicitly (cancel button on the purchase
screen) calls `DELETE /v0/tickets/queue` or `DELETE /v0/tickets/reservation` per state;
`TransactionCancelling` response → treat as `paying` and keep polling. One reservation at a time is
a backend invariant (user-scoped queue row) — starting a purchase for another kind while the pill is
active prompts to drop the current one first.

### 4.6 Ticket kind gating UI (data is already fetched, currently unrendered)

`TicketKindCard` gains states, all derived from existing `TicketKind` fields:

| Condition                                         | Rendering                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `serverNow() < purchasingAvailableStart − 10 min` | disabled, "Släpps {formatCardDate+time}"                                                                 |
| within the 10-min entry window                    | enabled, "Ställ dig i släppet" (lottery copy, §4.2)                                                      |
| `now > purchasingAvailableStop`                   | disabled, "Försäljningen har stängt"                                                                     |
| `!membershipPassing`                              | disabled, "Endast för {…}" generic ("kräver medlemskap")                                                 |
| `ticketsLeft === 0`                               | disabled, "Slutsåld" — but PUT queue still allowed (reservation queue) → button becomes "Ställ dig i kö" |
| `ticketsLeft != null && > 0`                      | badge "Få kvar: {n}" (backend only sends when < 10)                                                      |
| else                                              | enabled, price                                                                                           |

---

## 5. Screens & routes

Routes move **out of `/demo/`** to the root `(shell)` group; `Routes` entries updated; the stale
pkpass demo `+page.svelte` is deleted; `/demo/components/` gallery is kept as-is (dev tool). Final
map:

| Route                                | Status         | Notes                                                                                                                                                                                                                                |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/` + Landing gate                   | exists         | Landing gains login-error rendering (§2.2)                                                                                                                                                                                           |
| `/auth/callback/`                    | exists         | gains error-param handling (§2.2)                                                                                                                                                                                                    |
| `/home/`                             | move           | activity list + tickets carousel (krav §4: 1 click ✓ — it's the default tab)                                                                                                                                                         |
| `/activity/[slug]/`                  | move + extend  | add responsible-person row (name from `Activity.responsible`; contact info is backend gap B4); hosts with logos already satisfy the cross-section requirement (krav §5); "Buy tickets" bottom action shown only when `tickets_exist` |
| `/activity/[slug]/tickets/`          | move + rebuild | §4 flow replaces the current buy-on-tap                                                                                                                                                                                              |
| `/links/`, `/profile/`, `/settings/` | move           | unchanged                                                                                                                                                                                                                            |
| `/settings/about/`                   | **new**        | krav §7: 2 clicks (settings tab → About). Static page: app description, most-involved contributors list (hardcoded array `{name, role}` — from the maintainers agreement doc), link to repo. i18n'd.                                 |

Navigation stays exclusively via `pushNavigation`/`replaceNavigation` (ESLint enforces). Screens
keep the load-function pattern, now calling `cached*` helpers.

---

## 6. Theming (krav §8)

The existing token system (`guild-theme.css`, 9 semantic `--guild-*` tokens, `data-guild` attribute,
Tailwind `guild-*` utilities) is the mechanism. MVP deltas only:

1. Add missing `--guild-accent` to the `w` and `e` blocks (currently fall through to root navy).
2. Add a neutral default logo asset (`static/guild-logos/default.avif`, the Teknologappen mark) and
   make `guilds.ts` expose a `defaultGuildMeta` for `session.guild === null` — covers krav §8's "0
   or several sections → standard theme". The `:root` default color theme already exists.
3. Rule for all new MVP components: only `guild-*` semantic utilities, no raw palette; cross-guild
   content (activity cards, organiser rows, purchase screen) scopes with `data-guild={creatorGuild}`
   — pattern already established in `ActivityCard`.

`majorityGuild` already implements the "majority vote, else null" derivation.

## 7. Error handling policy

Per the felhantering decision + implemented backend shape (`{message, field?}`, no codes):

| Status         | Handling                                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400            | Inline at the offending control: match `field` to the input (e.g. `ticket_kind` → the tapped kind card), show server `message` verbatim (it is the only user-facing message class). No error page. |
| 401            | auth-lib refresh already retries; a post-refresh 401 → `logout()` + Landing with `auth_error_failed`.                                                                                              |
| 403            | Error page: "contact app developers" + error kind (it _is_ a frontend bug by contract).                                                                                                            |
| 404            | Error page with reload CTA (backend message: "try reloading app") — except purchase-poller 404s, which are state transitions (§4.2).                                                               |
| ≥500 / network | Error page with Retry; fire `GET /v0/healthcheck` to distinguish "server down" (show contact info) from "no connection".                                                                           |

`+error.svelte` and `apiError`/`unwrap` already implement the skeleton; adds: healthcheck probe on
`server` kind, inline-400 support in `unwrap` (400 must **not** throw a route error — return a typed
`{badRequest: {message, field}}` variant instead; call sites that can't render inline treat it as
`unknown`).

## 8. i18n

All new strings in `messages/en.json` + `sv.json`; server i18n maps via `pickI18n`. New key groups:
`auth_error_*`, `purchase_*` (queue/reservation/countdown/gating/test gateway), `about_*`. Cleanups
in the same PR: drop `hello_world`, fix the `sv` "sketejdade" typo.

## 9. Backend asks (to file as issues on lth-fed/backend, MVP-blocking marked ⚠)

| #     | Ask                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Why                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| B1 ⚠  | CORS: allow `PUT`/`DELETE` methods (minilith `lib.rs` Cors)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | queue/reservation endpoints are PUT/DELETE; browser preflight fails today (native unaffected)                                           |
| B2 ⚠  | Free-ticket insert violates `purchased_tickets.transaction_id NOT NULL`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | free path is MVP-critical                                                                                                               |
| B3 ⚠  | Payment-initiation endpoint on minilith (sets `transaction_id`, proxies `POST /v0/swish`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | the missing "transaktionssystem" leg; gateway seam ready (§4.4)                                                                         |
| B4    | Contact info on `Activity.responsible` (only `{id, name}` today)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | krav §5 requires "ansvariga med kontaktinformation"                                                                                     |
| B5    | ~~audience mismatch~~ **resolved on main** (verifier takes `aud` as param; minilith passes `teknologappen` = auth-lib's `client_id`). Residual: #62's branch still carries an old verifier hardcoding `teknologappen.se` — verify the #62 rebase adopts main's version                                                                                                                                                                                                                                                                                                                                                                                                                         | regression via #62 rebase would break all API auth                                                                                      |
| B6    | transactions service lacks the `/v0/jwks` endpoint its own verifier expects                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | blocks the transactions→minilith callback in prod                                                                                       |
| B7    | LU IdP still points at mocksaml.com; SAML ACS failures return bare 500 (no error redirect)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | pre-launch config + UX (frontend copes, §2.3)                                                                                           |
| B8 ⚠⚠ | `release()` bug (`ticket.rs`): the reservation-queue insert passes the **winners** array (`reservations`) as the user_id list, zipped against `placements` built from the **overflow queuers**. Since `placement` is `NOT NULL`, any release where winner-count ≠ overflow-count NULL-pads the `unnest` and aborts the transaction — `has_been_released` never sets, the runtime retries each minute until the kind falls out of its 5-min lookback, then the kind is **permanently unreleased** (all future PUTs pile into a release queue that purges every 20 min; nobody can ever buy). Fix: pass `reservation_queuers`, and delete converted `ticket_release_queuers` rows in `release()` | any release with ≥1 pre-release queuer bricks that ticket kind                                                                          |
| B9    | Release job only considers kinds with `purchasing_available_start > now() − 5 min`: >5 min of downtime spanning a release ⇒ the kind is never auto-released (same permanent-unreleased end state as B8). Frontend shows a "release delayed" state (§4.2), but recovery is ops-only                                                                                                                                                                                                                                                                                                                                                                                                             | liveness hole; consider removing the lookback bound in favor of `has_been_released = false` alone                                       |
| B10   | ~~`POST /oidc/v1/token` with `grant_type=refresh_token` → 400 "missing field `code`"~~ **fixed locally** (uncommitted patch in `fed-auth/src/oidc.rs`): the `TokenBody` ApiRequest enum's two Form variants share a content type, so poem always parsed the authorization-code shape. Every web login logged itself out instantly (bootstrap refreshes post-login)                                                                                                                                                                                                                                                                                                                             | commit/PR the patch                                                                                                                     |
| B11   | `POST /v0/tickets/` (free path, on main) validates membership + duplicates but **neither `price == 0` nor the purchasing window** — a paid kind can be acquired through the free endpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | frontend gates client-side (§4.6), but this must be server-enforced before launch                                                       |
| B13   | No endpoint to leave the reservation queue — `DELETE /queue` only clears the release queue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | frontend abandons the spot locally; add an unqueue-reservation endpoint                                                                 |
| B14   | `seed-dev` doesn't set `has_been_released` (NOT NULL, no default on the branch schema) — the seeder crashes against its own migrations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | one-line seeder or migration default                                                                                                    |
| B15 ⚠ | ~~`new_timeout_interval` panics~~ **fixed locally**: `PgInterval::try_from` rejects fractional-microsecond durations, which `* random::<f64>()` almost always produces — **every reservation grant panicked** (connection dropped mid-request)                                                                                                                                                                                                                                                                                                                                                                                                                                                 | round to whole seconds                                                                                                                  |
| B16 ⚠ | ~~`PUT /queue` capacity increment has no `WHERE`~~ **fixed locally**: it incremented `reserved_or_purchased_tickets` on **every ticket kind in the system**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | add `where id = $1`                                                                                                                     |
| B17 ⚠ | ~~reservation-queue placement insert~~ **fixed locally**: subselect takes the **global** max placement (cross-kind pollution) and yields NULL on an empty queue → NOT NULL violation, 500                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | per-kind filter + `coalesce`                                                                                                            |
| B18   | ~~server panics at boot~~ **fixed locally**: `activities::TicketKind` and `ticket::TicketKind` share an OpenAPI name — the tip as committed never starts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | rename one (`#[oai(rename)]`)                                                                                                           |
| B19   | `JwkContext::new` ignores its `Url` generic and always fetches from `AUTH_KEY_BASE` — transactions-service callbacks are verified against **fed-auth's** JWKS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | wire `Url::url()` through (or make it deliberate)                                                                                       |
| B20 ⚠ | ~~`POST /v0/free` unusable~~ **worked around locally** (column defaults): the insert omits `provider` and `timeout` (both NOT NULL) and the `provider` enum has no `free` value — free purchases are impossible as committed                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | extend the enum + insert                                                                                                                |
| B21 ⚠ | ~~every buy 400s~~ **fixed locally**: minilith's copied `CreatePaymentRequest` serializes `timeout` with `time`'s default serde (component array); the transactions service expects RFC3339                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `#[serde(with = "time::serde::rfc3339")]` + `serde-well-known` feature                                                                  |
| B22 ⚠ | ~~paid completion callback rejected 401~~ **fixed locally** (`fed-auth-verifier/callbacks.rs`): the transactions service signs the paid callback as `StandardClaims { exp, aud, iat, nbf, events: [...] }` (an object), but minilith's `TransactionsCallbackDataV1` is `#[serde(transparent)]` over the array → expects a bare top-level array → "invalid type: map, expected a sequence". **Every paid-purchase completion fails on the branch**, independent of Swish                                                                                                                                                                                                                        | drop `#[serde(transparent)]` so the verifier reads `{events}` and ignores the standard claims (matches the working auth-callback shape) |
| B23   | No local way to complete a Swish payment: `POST /v0/swish` calls the live Swish MSS API, which needs Swish-issued merchant certs. For dev, stub the MSS call behind `cfg(debug_assertions)` (fabricate a token) so the paid flow is testable end-to-end via the callback — frontend ships `pnpm dev:swish-pay` to fire it                                                                                                                                                                                                                                                                                                                                                                      | add a debug Swish stub / sandbox mode                                                                                                   |
| B12   | ~~fed-auth's `callback_url_v1` JWT carries only `{sub, full_name, email}` — no `exp`/`aud` — while minilith's verifier requires both~~ **fixed locally** (uncommitted, `fed-auth/src/oidc.rs`): every user-upsert callback was silently rejected (`MissingRequiredClaim("exp")`), so only pre-seeded users could log in; fed-auth also ignores the callback's HTTP response status, so the failure never surfaced                                                                                                                                                                                                                                                                              | commit/PR the patch; consider failing the exchange on non-2xx callback responses                                                        |

## 10. Conventions new code follows (unchanged, for completeness)

Route folder under `(shell)` + `Routes` entry + nav helpers only · data via `+page.ts` load →
`cached*` helpers · chrome via `useAppBars` · theming via `guild-*` utilities + `data-guild` scoping
· strings via `m.*` (en+sv) · iOS 26 native overlays via `useNativeOverlay` with web fallback ·
Prettier/ESLint config as-is · Svelte MCP autofixer per AGENTS.md.

## 11. Build order

1. **Foundation** — route relocation out of `/demo/`, About page, theming deltas (§6), auth error
   handling + provider constant (§2). No backend dependency.
2. **Data layer** — `cache.svelte.ts`, `cached*` helpers, resume revalidation, inline-400 support,
   healthcheck probe. Regenerate auth types now (OIDC is on backend main); regenerate api types once
   #62 merges.
3. **Ticket-kind gating UI** (§4.6) + hardened free path (§4.3). Needs B2 fixed to test end-to-end;
   UI testable against `DEMO_MODE` fixtures meanwhile.
4. **Queue/reservation machine** (§4.1–4.2, 4.5): store, server-clock offset, release-window
   resolver, countdown, pill, cancel flows. Needs B1 fixed for browser dev (native/CapacitorHttp
   unaffected); release path end-to-end testable only after B8.
5. **Payment seam** (§4.4): ✅ built — `PaymentGateway` + free/Swish gateways, confirm dialog,
   machine `pay()`. Free settles inline; Swish initiates + polls (completes on native / real Swish).
6. **LU login** verification against real fed-auth once B5/B7 settle (dev keeps `test` provider
   throughout).

Steps 1–2 are parallelizable with 3; 4 depends on 2; 5 depends on 4.

## 12. Verification

The how-to lives in **`docs/agentic-testing.md`** (browser matrix, device smoke, probe patterns, the
pre-done checklist). Summary of what this project requires:

**Browser matrix** — `pnpm render-pass` (`scripts/render-pass.mjs`, Playwright): drives the real app
— test-provider login (full OIDC code+PKCE round trip), every screen, full-page screenshots at a
390×844 mobile viewport — across three engines:

| Engine                 | How                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Brave (Chromium)       | Playwright chromium API launching `/Applications/Brave Browser.app`                                                                       |
| Firefox                | Playwright's Firefox                                                                                                                      |
| WebKit (Safari engine) | Playwright's WebKit; belt-and-braces real-Safari pass via `safaridriver` (enabled on the dev machine) when WebKit results look suspicious |

The script fails non-zero on any page error, console error, failed request, or ≥400 response, and
writes `report.json` — CI-gateable later. Prereqs: seeded backend (`cargo run --bin seed-dev`), both
services up, `pnpm dev`.

**Device smoke** — iOS: `xcodebuild` → `simctl install/launch` + `simctl io screenshot` on an iPhone
17 Pro simulator; Capacitor dev-server mode for live-reload work. Android: Pixel AVD +
`gradlew assembleDebug` + `adb install` + `adb shell input`/`screencap` (fully scriptable driving).

**Flows to cover as MVP features land**: test-provider login incl. error/cancel paths · list →
detail → free purchase · queue machine against a seeded near-release kind (needs B8 fixed) ·
per-guild theming sweep (`data-guild` × 10 guilds on the components page) · sv/en toggle ·
401-refresh path (expire the access token).

**CORS caveat**: until B1 lands, the PUT/DELETE queue endpoints fail preflight in _all_ browsers.
Dev workaround: the existing vite `/_proxy/api` same-origin proxy (rewrites to `:8000`) — a dev-only
base-URL flag in `clients.ts` routes queue calls through it. Native (CapacitorHttp) is unaffected
either way.

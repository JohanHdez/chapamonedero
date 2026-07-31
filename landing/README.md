# Chapa Monedero — Landing + Payments

Multi-country marketing landing for **Chapa Monedero**, a 100% mechanical,
coin-operated lock that mounts on a business's bathroom door so the owner can
charge for its use. The landing **sells the physical device** (fixed unit price ×
quantity) with a checkout integrated into **Mercado Pago**.

It serves **Mexico 🇲🇽 (MXN)** and **Colombia 🇨🇴 (COP)**, each on its own domain
and its own Mercado Pago account, with local payment methods (card, OXXO, SPEI,
PSE, Nequi, Bancolombia).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Mercado Pago
SDK (`mercadopago` v2).

---

## 1. Requirements

- Node.js ≥ 18
- One Mercado Pago account **per country** you want to enable (each has its own
  app credentials): <https://www.mercadopago.com.co/developers/panel> /
  <https://www.mercadopago.com.mx/developers/panel>

## 2. Environment configuration

```bash
cp .env.example .env.local
```

Each country has its **own** Mercado Pago account, so its credentials live in
**separate** environment variables. The server resolves them from the country in
the route segment (`/mx`, `/co`) via `lib/countries.ts` (`COUNTRY_CONFIG`).

| Variable | Scope | Description |
|---|---|---|
| `MP_ACCESS_TOKEN_CO` | server | Colombia **private** access token. `APP_USR-…` (prod) or `TEST-…` (sandbox). |
| `MP_WEBHOOK_SECRET_CO` | server | Colombia webhook signing secret (MP panel → Webhooks → "clave secreta"). |
| `MP_ACCESS_TOKEN_MX` | server | Mexico **private** access token. *(Placeholder until the MX account exists.)* |
| `MP_WEBHOOK_SECRET_MX` | server | Mexico webhook signing secret. *(Placeholder until the MX account exists.)* |
| `NEXT_PUBLIC_SITE_URL` | local/fallback | Public origin used **only in local/dev** (e.g. an ngrok tunnel). In production the origin is derived from the request `Host`, not from this variable. |

> ⚠️ Secrets come **only** from env vars — never hardcoded, never defaulted. If a
> country's variable is missing, that country's route fails on purpose (500). See
> [Security](#7-security) and the repo rule `payment-security.md`.
>
> Never commit `.env.local`; it is already in `.gitignore`.

## 3. Development

```bash
npm install
npm run dev          # http://localhost:3000
```

- `/` shows the **country selector** (links to `/co` and `/mx`; default is CO).
- `/mx` and `/co` render the per-country landing.

The dev server writes its build cache to `.next`. To test the webhook locally you
need a public HTTPS URL:

```bash
npx ngrok http 3000
# Put the https URL in NEXT_PUBLIC_SITE_URL and in each country's
# Mercado Pago webhook panel, pointing at:
#   https://<tunnel>/api/webhooks/mercadopago/co   (and /mx)
```

## 4. Build & production

```bash
npm run build   # type-checks every route; output goes to .next-build
npm start        # serves the .next-build output
```

`npm run build` and `npm start` use a separate `NEXT_DIST_DIR=.next-build` so the
verification/production build does not clobber the dev server's `.next` cache
while it runs. **There is no test runner** — `npm run build` is the way to verify
a change compiles and type-checks; also run `npm run lint`.

## 5. Deployment (Vercel — canonical)

1. Import the repo into Vercel and set the project **Root Directory to `landing`**.
2. `landing/vercel.json` forces `buildCommand: next build` so Vercel builds into
   the default `.next` directory (overriding the repo's `.next-build` script,
   which exists only for local verification).
3. Add the **per-country** environment variables (`MP_ACCESS_TOKEN_*`,
   `MP_WEBHOOK_SECRET_*`) in the Vercel project. `NEXT_PUBLIC_SITE_URL` is not
   required in production — the origin is derived from the request `Host`.
4. Attach both domains: `chapamonedero.mx` → MX, `chapamonedero.com` → CO.
   `middleware.ts` rewrites each domain's root `/` to its country segment without
   exposing `/mx` or `/co` in the URL.
5. In each country's Mercado Pago panel, set the webhook (signed Webhooks scheme,
   `payment` events) to `https://<that-domain>/api/webhooks/mercadopago/<country>`
   and copy the signing secret into that country's `MP_WEBHOOK_SECRET_*`.

## 6. Architecture

```
app/
├── layout.tsx                            Root layout: <html lang="es">, Montserrat + Font Awesome, base metadata
├── page.tsx                              Country selector at "/" (links to /mx, /co; default CO)
├── [country]/
│   ├── layout.tsx                        Per-country layout: hreflang/canonical metadata + floating WhatsApp button
│   └── page.tsx                          Per-country landing (hero, features, how-it-works, methods, purchase)
├── components/
│   ├── CompraForm.tsx                    Purchase form ("use client") — quantity + email → POST checkout
│   ├── WhatsAppButton.tsx                Static <a> (Server Component); number from COUNTRY_CONFIG
│   └── pricing-display.ts                UI-only price map (UI_BY_COUNTRY, fmt). NOT authoritative
├── compra/{exito,pendiente,error}/       Static return pages MP redirects to (live at root, outside [country])
└── api/
    ├── checkout/[country]/route.ts       POST → server price + quantity → creates MP Preference → init_point
    └── webhooks/mercadopago/[country]/route.ts
                                          POST → verifies x-signature HMAC → re-fetches payment → confirms on approved
lib/
├── countries.ts                          COUNTRY_CONFIG (currency, WhatsApp, env-var names, domain), whitelist + host helpers
└── mercadopago.ts                        getMpClient(country), PRODUCT, PRODUCT_PRICES, QUANTITY_LIMITS, siteUrl()
middleware.ts                             Domain-per-country: rewrites "/" → "/${country}" for known hosts (never for /api)
```

### Country model (`lib/countries.ts`)

`COUNTRY_CONFIG` is the source of truth for currency, gateway credentials
(env-var **names** only) and WhatsApp number:

| Country | Currency | Domain | Access token env | Webhook secret env |
|---|---|---|---|---|
| `mx` | MXN | `chapamonedero.mx` | `MP_ACCESS_TOKEN_MX` | `MP_WEBHOOK_SECRET_MX` |
| `co` | COP | `chapamonedero.com` | `MP_ACCESS_TOKEN_CO` | `MP_WEBHOOK_SECRET_CO` |

`DEFAULT_COUNTRY` is `co`. The **country is always taken from the validated route
segment** (`isSupportedCountry`), never from the request body or the `Host`
header. `countryForHost()` only maps a known production domain to its country to
choose the **return-URL origin** — it never decides the charging country.

### Payment flow

1. **`CompraForm.tsx`** (client, on `/mx` or `/co`) — the user picks quantity and
   email and posts to `POST /api/checkout/${country}`. Prices shown here come from
   `pricing-display.ts` and are **UI-only**.
2. **`api/checkout/[country]/route.ts`** — validates the country by whitelist,
   then derives the **currency and unit price on the server** from the country
   (`currencyForCountry` + `PRODUCT_PRICES`). Any price/currency in the client body
   is ignored. Quantity is validated against `QUANTITY_LIMITS` (1–50). Creates a
   Mercado Pago **Preference** (with `external_reference`, `back_urls`,
   `auto_return`, and the per-country `notification_url`) and returns `init_point`.
3. The browser redirects to Mercado Pago's hosted checkout.
4. MP redirects back to `/compra/{exito,pendiente,error}` (return pages live at
   root, outside `[country]`, so the middleware does not rewrite them).
5. **`api/webhooks/mercadopago/[country]/route.ts`** — MP notifies this endpoint.
   It reads the **raw body**, verifies the `x-signature` HMAC with that country's
   secret (constant-time compare, with anti-replay timestamp tolerance), then
   **re-fetches the real payment** via the MP API for that country and confirms the
   order only when `status === "approved"`.

**Unit prices (`PRODUCT_PRICES`, server-authoritative):** MXN `2580`, COP `480000`.

### Webhook notification formats

Mercado Pago delivers two formats to the same URL:

- **Signed Webhooks (modern):** `?type=payment&data.id=…` with `x-signature`
  (`ts` + `v1` HMAC) and `x-request-id`. This is the **only** format that confirms
  an order, and it must always pass HMAC verification.
- **Legacy IPN:** `?topic=payment&id=…`. Answered with an inert `200` and ignored
  (it may even carry an `x-signature` that does not apply to this scheme). The real
  confirmation always arrives via the signed webhook. This does not weaken
  verification of the signed format.

## 7. Security

Invariants mirrored from PagoKit's hook rules (see the repo rule
`payment-security.md`); they hold whether or not the plugin is loaded:

- ✅ **Verify signature before doing anything.** The webhook reads the raw body
  (`req.text()`) and verifies the `x-signature` HMAC-SHA256 with a constant-time
  compare **before** parsing or processing.
- ✅ **Don't trust the notification body.** After the signature check, the real
  payment is re-fetched from the MP API; the order is confirmed only on `approved`.
- ✅ **Server-authoritative price.** Checkout uses `PRODUCT_PRICES` and derives the
  currency from the country; the client's price/currency are never used. The
  client only chooses quantity and email; quantity is validated against
  `QUANTITY_LIMITS`.
- ✅ **Secrets from env only.** `MP_ACCESS_TOKEN_*` / `MP_WEBHOOK_SECRET_*` are
  never hardcoded or defaulted; a missing value makes that country's route fail
  (500) on purpose.
- ✅ **Idempotency.** A payment can be notified multiple times; the webhook is
  idempotent, keyed by the **composite** `${country}:${payment_id}` (payment IDs
  are unique per account, not globally).
- ✅ **No PII in logs.** Payer email and payment details are never logged. Country
  is not PII.
- ✅ **Host never sets the charging country.** The `Host` header only selects the
  return-URL origin; the charging country always comes from the validated route
  segment.

## 8. Production gaps / TODO

Tracked in detail in [`PAGOKIT_PRODUCTION_CHECKLIST.md`](PAGOKIT_PRODUCTION_CHECKLIST.md):

- [ ] **Idempotency is in-memory** (a `Set` keyed by `${country}:${payment_id}`).
      Move it to a DB table with `UNIQUE(country, payment_id)` so it survives
      restarts and multiple instances.
- [ ] **Orders are not persisted.** There is no DB write of `external_reference`
      before checkout, nor a transactional order confirmation on `approved`.
- [ ] **No shipping address is captured**, and no fulfillment flow is triggered.
- [ ] **Mexico is placeholder-only:** MX Mercado Pago credentials and the MX
      WhatsApp number (`52XXXXXXXXXX`) are not yet real.
- [ ] **Footer legal links** (Términos / Privacidad / Soporte) point to `#`.
- [ ] Review `npm audit` and update vulnerable dependencies.

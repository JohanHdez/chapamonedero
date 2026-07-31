# PagoKit — Production Checklist

Gaps that must be closed before taking `landing/` to real production traffic.
The payment code (`app/api/webhooks/mercadopago/[country]/route.ts`) references
this file by name at the point where each gap is intentionally left open.

The security invariants in `.claude/rules/payment-security.md` are **already
enforced** in the code (raw body + HMAC verification, server-authoritative price,
secrets from env only, no PII in logs). This checklist tracks the operational
gaps that remain **on top of** those invariants — not a relaxation of them.

---

## 1. Webhook idempotency → move to the database

**Status:** in-memory only. **Blocker for multi-instance / restarts.**

- Today: `const processedPayments = new Set<string>()`, keyed by the composite
  `${country}:${payment_id}` (payment IDs are unique per Mercado Pago account,
  not globally).
- Problem: the `Set` does not survive a process restart and is not shared across
  Vercel instances, so a duplicate notification can be processed more than once.
- Fix: persist processed payments in a DB table with
  `UNIQUE(country, payment_id)`; treat a unique-constraint violation as
  "already processed" and return the duplicate response.

## 2. Persist orders (before checkout and on approval)

**Status:** no persistence at all.

- Before checkout: write the order (including its `external_reference`, country,
  quantity, currency, unit price) to the DB **before** creating the Mercado Pago
  Preference, so every payment can be reconciled back to an order.
- On `approved`: mark the order paid **transactionally and idempotently** inside
  the webhook (use `info.external_reference`, which already encodes the country),
  then trigger fulfillment.
- Reconciliation key: the checkout builds
  `external_reference = pedido_${country}_${quantity}u_${Date.now()}` — replace
  the timestamp suffix with the persisted order ID once orders exist.

## 3. Capture shipping and trigger fulfillment

**Status:** not captured.

- The purchase form (`app/components/CompraForm.tsx`) collects only quantity and
  email. A physical product ships, so a shipping address (and contact/phone) must
  be captured and stored with the order.
- On `approved`, kick off the shipping/fulfillment flow.

## 4. Mexico (MX) is placeholder-only

**Status:** MX cannot take real payments yet.

- `MP_ACCESS_TOKEN_MX` / `MP_WEBHOOK_SECRET_MX` are empty placeholders in
  `.env.example`; create the Mexico Mercado Pago account and fill real values in
  the deployment environment.
- WhatsApp number for MX is a placeholder: `COUNTRY_CONFIG.mx.whatsapp =
  "52XXXXXXXXXX"` in `lib/countries.ts`. Replace with the real number.
- Register the MX webhook in the Mexico MP panel pointing at
  `https://chapamonedero.mx/api/webhooks/mercadopago/mx`.

## 5. Legal / support links

**Status:** placeholders.

- The footer in `app/[country]/page.tsx` links Términos / Privacidad / Soporte to
  `href="#"`. Publish the real pages and wire the links before launch.

## 6. Dependency hygiene

- Run `npm audit` and update vulnerable dependencies.
- `npm run build` (type-check every route) and `npm run lint` must pass — there is
  no test runner, so the build is the verification gate.

---

### Not gaps (already correct — do not "fix" by regressing)

- Raw body is read before parsing; `x-signature` HMAC is verified with a
  constant-time compare and an anti-replay timestamp window **before** any work.
- The charging country comes from the validated route segment; the `Host` header
  only selects the return-URL origin.
- Unit price and currency are derived on the server from the country
  (`PRODUCT_PRICES` / `currencyForCountry`); the client body's price/currency are
  ignored.
- Credentials are read per country from env vars with no defaults.
- Legacy IPN notifications are answered with an inert `200`; only the signed
  webhook confirms an order.

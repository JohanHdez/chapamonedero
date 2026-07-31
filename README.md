# Chapa Monedero

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Mercado Pago](https://img.shields.io/badge/Payments-Mercado%20Pago-00b1ea) ![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

Monorepo for **Chapa Monedero** — a 100% mechanical, coin-operated lock that
mounts on the bathroom door of a commercial establishment so the owner can
charge for its use. No batteries, no electricity, no internet.

This repository holds the **marketing landing that sells the physical device**
(fixed unit price × quantity) with a checkout integrated into **Mercado Pago**.
It is **multi-country**: Mexico 🇲🇽 (MXN) and Colombia 🇨🇴 (COP), each with its own
domain, currency, Mercado Pago account and local payment methods (card, OXXO,
SPEI, PSE, Nequi, Bancolombia).

> This is **not** a balance top-up / wallet app. The software layer only sells
> the hardware; the charging happens mechanically at the door.

---

## Repository layout

Three independent top-level folders:

| Folder | What it is | Deployed? |
|---|---|---|
| [`landing/`](landing/) | **The app.** Next.js 14 (App Router, TypeScript) landing + Mercado Pago checkout. All feature work happens here. | ✅ Yes (Vercel) |
| `agente-pagokit/` | Cloned third-party Claude Code plugin (**PagoKit**, MIT) — tooling that advises on / generates payment integrations and enforces payment-security rules via hooks. **Gitignored**, never imported, never bundled. | ❌ No |
| `.claude/` | Claude Code configuration for this repo: coding rules, subagents, slash commands and skills (see below). | ❌ No |

The `landing/` integration was produced by manually following PagoKit's `start`
flow; its webhook/checkout security invariants intentionally mirror the plugin's
hook rules and must hold whether or not the plugin is loaded.

## Quick start

```bash
cd landing
cp .env.example .env.local   # fill in the per-country Mercado Pago credentials
npm install
npm run dev                  # http://localhost:3000
```

There is **no test runner**. To verify a change, run `npm run build` (it
type-checks every route). See [`landing/README.md`](landing/README.md) for the
full setup, environment table, payment flow and production notes.

## Deployment

The canonical target is **Vercel**, with the project **Root Directory set to
`landing`**. `landing/vercel.json` forces a plain `next build` so Vercel's output
detection finds the default `.next` directory. Per-country domains
(`chapamonedero.mx`, `chapamonedero.com`) and the per-country Mercado Pago
environment variables are configured in the Vercel project. Details in
[`landing/README.md`](landing/README.md).

## Claude Code configuration

The `.claude/` directory drives how Claude Code assists in this repo:

- **`rules/`** — enforced coding standards: `payment-security.md` (money-flow
  invariants — always wins), `architecture.md`, `code-quality.md`,
  `frontend-style.md`, `accessibility.md`, `testing.md`.
- **`agents/`** — subagents: `payment-reviewer`, `build-verifier`, `ui-engineer`,
  `director`.
- **`commands/`** — slash commands: `/review-payments`, `/verify-build`,
  `/director`.
- **`skills/`** — `brand-ui`, `mercadopago-integration`, `skill-creator`.

Repo-wide guidance for Claude also lives in [`CLAUDE.md`](CLAUDE.md).

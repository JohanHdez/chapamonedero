---
name: mercadopago-integration
description: Conocimiento del flujo de pagos de Chapa Monedero con Mercado Pago (Preference checkout + webhook con verificación HMAC). Úsalo al añadir o modificar checkout, webhooks, precios, monedas o el manejo de pagos en landing/.
---

# Integración Mercado Pago — Chapa Monedero

El "camino del dinero" abarca varios archivos; trátalos como un solo flujo.

## Mapa del flujo

1. **`app/components/CompraForm.tsx`** (client) — el usuario elige moneda
   (MXN/COP), cantidad y email; hace POST al API de checkout. Los precios que se
   muestran son solo UI: el servidor es la autoridad.
2. **`app/api/checkout/route.ts`** — toma el **precio unitario del servidor**
   (`PRODUCT_PRICES`), valida la cantidad contra `QUANTITY_LIMITS`, crea una
   *Preference* de Mercado Pago y devuelve su `init_point`. El navegador redirige
   al checkout hospedado de MP.
3. **`app/compra/{exito,pendiente,error}/`** — páginas estáticas de retorno
   (`back_urls` / `auto_return`).
4. **`app/api/webhooks/mercadopago/route.ts`** — recibe notificaciones. **No
   confía en el body**: verifica el HMAC de `x-signature` con el cuerpo crudo
   (`req.text()`), luego re-consulta el pago real vía la API de MP. Confirma la
   orden solo con `approved`.
5. **`lib/mercadopago.ts`** — fuente única del cliente MP (`getMpClient`), el
   producto (`PRODUCT`), `PRODUCT_PRICES` / `QUANTITY_LIMITS` y `siteUrl()`.

## Reglas que debes respetar

Ver `.claude/rules/payment-security.md`. En resumen: firma HMAC antes de
procesar, cuerpo crudo, precio autoritativo en servidor, secretos solo de env,
idempotencia, nunca loguear PII.

## Variables de entorno (`landing/.env.local`)

- `MP_ACCESS_TOKEN` — token privado de servidor (`TEST-…` / `APP_USR-…`).
- `MP_WEBHOOK_SECRET` — secreto de firma del panel MP.
- `NEXT_PUBLIC_SITE_URL` — origen público para `back_urls` y `notification_url`.

## Verificar

No hay test runner. Verifica con `cd landing && npm run build` (type-checkea
todas las rutas). El webhook necesita URL pública incluso en dev:
`npx ngrok http 3000`.

## Gaps conocidos (pre-producción)

- Idempotencia es un `Set` en memoria → mover a DB con `UNIQUE(payment_id)`.
- Las órdenes no se persisten aún; no se captura dirección de envío.

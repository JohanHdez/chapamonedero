# Reglas de seguridad de pagos — Chapa Monedero

Invariantes que **no** se pueden romper en `landing/`. Reflejan las reglas de los
hooks de PagoKit y deben cumplirse aunque el plugin no esté cargado.

1. **Verificar la firma antes de hacer nada.** El webhook
   (`app/api/webhooks/mercadopago/route.ts`) lee el **cuerpo crudo** con
   `req.text()` y verifica el HMAC de `x-signature` con comparación de tiempo
   constante **antes** de parsear o procesar.
2. **No confiar en el cuerpo de la notificación.** Tras validar la firma, se
   vuelve a consultar el pago real vía la API de MP para leer su estado. La orden
   se confirma solo con `approved`.
3. **El precio es autoritativo en el servidor.** El checkout usa
   `PRODUCT_PRICES` (`lib/mercadopago.ts`); el precio del cliente nunca se usa.
   El cliente solo elige moneda y cantidad, y la cantidad se valida contra
   `QUANTITY_LIMITS`.
4. **Secretos solo desde env vars.** `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`
   nunca se hardcodean ni se les pone valor por defecto. Si faltan, la ruta
   falla a propósito (500).
5. **Idempotencia.** Un pago puede notificarse varias veces; el webhook debe ser
   idempotente (hoy es un `Set` en memoria — pendiente mover a DB con
   `UNIQUE(payment_id)` antes de producción).
6. **Nunca loguear PII** (email del pagador, detalles del pago).

Antes de aprobar cualquier cambio en `app/api/checkout/` o
`app/api/webhooks/`, revisa esta lista punto por punto.

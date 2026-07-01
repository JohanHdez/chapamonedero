---
description: Lanza el agente payment-reviewer sobre los cambios del flujo de pagos (checkout + webhook de Mercado Pago).
argument-hint: "[archivos o ruta opcional]"
---

Revisa la seguridad del flujo de pagos de Chapa Monedero.

Usa el subagente **payment-reviewer** para auditar los cambios en
`app/api/checkout/`, `app/api/webhooks/mercadopago/` y `lib/mercadopago.ts`
contra las invariantes de `.claude/rules/payment-security.md`.

Si el usuario pasó argumentos, enfoca la revisión en: $ARGUMENTS

Devuelve el informe priorizado (bloqueante / advertencia / nota) del agente.

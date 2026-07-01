---
description: Orquesta una tarea con el agente director — la descompone y delega en los especialistas (ui-engineer, payment-reviewer, build-verifier).
argument-hint: "[objetivo de la tarea]"
---

Lanza el subagente **director** para orquestar el siguiente trabajo en Chapa Monedero:

$ARGUMENTS

El director debe:

1. **ANTES de orquestar — publicar un "Plan de orquestación" completo.** Antes de
   lanzar ningún subagente, lee el contexto necesario y deja escrito TODO lo que
   hace falta para ejecutar:
   - Objetivo entendido (reformulado en una frase).
   - Diagnóstico/alcance: qué archivos se tocan y qué queda fuera.
   - Qué especialistas tocan (`ui-engineer`, `payment-reviewer`, `build-verifier`)
     y por qué (o por qué alguno no aplica).
   - **Las instrucciones concretas que dará a cada especialista** (el encargo
     exacto: qué cambiar, qué reglas respetar, qué entregar).
   - Criterios de verificación.
2. **Ejecutar narrando un PASO A PASO.** A medida que actúa, describe cada paso con
   el formato `▶ Paso N — qué hace / por qué / resultado`: leer contexto, delegar a
   cada subagente, recibir resultados, verificar, y síntesis. El usuario quiere ver
   qué ocurre en cada paso.
3. Respetar las invariantes de `.claude/rules/payment-security.md` y las reglas
   de `.claude/rules/frontend-style.md`.
4. **Verificar el resultado** con `build-verifier` (y `payment-reviewer` si el
   cambio toca `app/api/checkout/`, `app/api/webhooks/` o `lib/mercadopago.ts`)
   antes de dar la tarea por hecha.

Cierra con un resumen de qué se delegó, a quién, y el estado final de la verificación.

Si no se pasaron argumentos, o si falta algún dato imprescindible para armar el
plan, pídelo **antes** de orquestar.

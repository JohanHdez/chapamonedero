# Reglas de testing — landing/

> **Estado actual: NO hay test runner en `landing/`.** `package.json` solo tiene
> `dev`, `build`, `start`, `lint`. Este documento es el **estándar objetivo a
> adoptar**, no algo que hoy ya se cumpla. Se introduce de forma gradual:
> empezando por la lógica crítica y exigiendo tests en código nuevo.

## 1. Runner recomendado

- **Vitest + React Testing Library** (alineado con Next 14 + TS; arranque más
  simple que Jest). Jest + RTL es alternativa válida si se prefiere.
- Tests de **route handlers** (`app/api/checkout`, `app/api/webhooks/mercadopago`)
  con llamadas directas al handler simulando `Request`.

## 2. Integración

- Script: `"test": "vitest"` (y `"test:watch"` / `"test:coverage"` según haga
  falta) en `landing/package.json`.
- Ubicación: tests co-locados (`Componente.test.tsx` junto al componente) o en
  `__tests__/` dentro del módulo. Sé consistente.
- `npm run build` y `npm run lint` siguen siendo obligatorios; los tests se
  suman, no los sustituyen.

## 3. Qué probar (prioridad)

1. **Lógica crítica de dinero primero:**
   - `app/api/checkout`: usa el precio del servidor (`PRODUCT_PRICES`), **ignora**
     cualquier precio del cliente, valida cantidad contra `QUANTITY_LIMITS`.
   - `app/api/webhooks/mercadopago`: firma inválida → rechazo; idempotencia
     (mismo `payment_id` notificado dos veces no duplica); confirmación solo en
     `approved`.
   - `lib/mercadopago.ts`: `isSupportedCurrency`, helpers de precio/límites.
2. **Componentes:** validaciones de `CompraForm.tsx` (cantidad fuera de rango,
   email inválido, estados de error/loading).
3. Casos borde y errores antes que el camino feliz.

## 4. Cobertura

- Objetivo: **90%** de líneas y ramas, concentrado en la lógica crítica
  (checkout/webhook/validaciones). No persigas el 90% pintando cobertura sobre
  JSX trivial.

## 5. No relajar seguridad al testear

- Probar el webhook **no** justifica desactivar ni mockear hacia "siempre válida"
  la verificación de firma en producción. Los tests usan secretos de prueba y
  firman el payload de prueba; la verificación HMAC real (cuerpo crudo + compare
  de tiempo constante) **se mantiene**. Ver `payment-security.md` §1.
- Nunca metas tokens reales ni PII en fixtures de test.

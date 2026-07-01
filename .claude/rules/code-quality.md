# Reglas de calidad de código — landing/

Estándares para mantener el código de `landing/` legible y mantenible.
Complementa `architecture.md` (estructura/capas) y manda siempre
`payment-security.md` sobre cualquier abstracción del flujo de dinero.

## 1. DRY — sin sobre-abstraer

- **Haz** extraer un helper/utilidad cuando la **misma** lógica aparece por
  tercera vez (regla de tres).
- **No hagas** una abstracción "por si acaso" con un solo uso, ni unifiques dos
  cosas que solo se parecen hoy por casualidad.
- **No** centralices de forma que se pierda una invariante de seguridad: el
  cuerpo crudo + verificación HMAC del webhook y el precio autoritativo del
  servidor no se "factorizan" a un sitio compartido con el cliente
  (ver `payment-security.md`).

## 2. Complejidad ciclomática

- Objetivo: **≤ 10** ramas por función. Si lo superas, extrae helpers.
- Usa **early returns / guard clauses** en vez de `if/else` anidados.
- Evita anidación profunda (> 2-3 niveles).

```ts
// Evita
function precio(currency: string) {
  if (isSupportedCurrency(currency)) {
    if (PRODUCT_PRICES[currency]) {
      return PRODUCT_PRICES[currency];
    }
  }
  throw new Error("Moneda no soportada");
}

// Prefiere (guard clauses)
function precio(currency: string) {
  if (!isSupportedCurrency(currency)) throw new Error("Moneda no soportada");
  return PRODUCT_PRICES[currency];
}
```

## 3. Funciones y módulos

- Una función hace **una** cosa; el nombre describe esa cosa.
- Prefiere funciones puras donde se pueda (sin efectos ocultos); aísla I/O
  (fetch, env, MP) en la capa de infraestructura (ver `architecture.md`).
- Evita parámetros booleanos que cambian el comportamiento; mejor dos funciones.
- SOLID a nivel función/módulo aplica aquí; la organización en capas vive en
  `architecture.md`.

## 4. TypeScript

- Tipa lo público; **no uses `any`**. Para entrada externa (body de la API,
  query) usa `unknown` + validación (como `isSupportedCurrency`).
- Usa `as const` para constantes que también definen tipos
  (ej. `PRODUCT_PRICES`).

## 5. Higiene

- Sin código muerto ni `console.log` olvidados. Recuerda: **nunca** loguear PII
  (ver `payment-security.md` §6).
- `npm run build` debe pasar sin errores de tipos antes de dar por hecho un
  cambio; corre también `npm run lint`.

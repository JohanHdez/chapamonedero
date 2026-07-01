# Reglas de arquitectura — landing/

Cómo estructurar componentes, módulos, constantes y capas en `landing/`
(Next.js 14 App Router, TypeScript). Complementa `frontend-style.md` (idioma,
tipografía, paleta) y `payment-security.md` (flujo de dinero).

> **Manda payment-security.md.** Ninguna abstracción, capa o refactor de los de
> aquí puede romper sus invariantes: leer cuerpo crudo + verificar HMAC antes de
> parsear, no confiar en el body, precio autoritativo en servidor, secretos solo
> de env, idempotencia y nunca loguear PII. Si una "mejora arquitectónica"
> choca con esa regla, gana la regla.

## 1. Componentes (App Router)

- **Server Components por defecto.** No pongas `"use client"` salvo que el
  componente tenga estado, efectos o handlers de eventos.
  - Cliente justificado: `app/components/CompraForm.tsx` (form con `useState` y
    `onSubmit`).
  - Server correcto: `app/components/WhatsAppButton.tsx` (solo un `<a>`
    estático, menos JS al cliente).
- **No subas `"use client"` hacia arriba.** Marca cliente la hoja interactiva
  más pequeña, no el contenedor ni la página entera.
- **Datos server → client por props serializables.** Pasa valores planos; no
  pases funciones del servidor ni objetos no serializables a un componente
  cliente.

### Dónde viven

- **Reutilizables / globales:** `app/components/` (ej. `CompraForm`,
  `WhatsAppButton`).
- **Específicos de una ruta:** co-locados junto al segmento que los usa
  (`app/<segmento>/...`).

### Naming

- Componentes en **PascalCase**; el archivo se llama igual que el componente
  (`CompraForm.tsx` → `export default function CompraForm`).
- Un componente por archivo para los componentes con nombre/export default.

### Composición

- Componentes pequeños y con una sola responsabilidad.
- Separa **presentacional** (recibe props, pinta UI) de **contenedor** (estado,
  fetch, lógica).
- Antes de añadir interactividad, pregúntate si puede quedarse como Server
  Component.

## 2. Barrels (`index.ts` con re-exports)

> Dirección a adoptar — hoy **no hay barrels** en `landing/`. Aplícalo en
> carpetas nuevas; no es obligatorio refactorizar lo existente.

- **Haz** un barrel solo para exponer la **API pública** de una carpeta cerrada
  (p. ej. `app/components/ui/index.ts`).
- **No hagas** barrels "globales" que reexporten medio proyecto: inflan el
  bundle y crean ciclos de import.
- **Anti-ciclos:** un módulo no importa desde el barrel de su propio módulo;
  importa el archivo concreto. Las dependencias van en un solo sentido.

## 3. Constantes y tipos

> Dirección a adoptar en **código nuevo** — hoy conviven inline y eso está
> permitido. No exige refactor inmediato.

- Para módulos nuevos, extrae constantes a `constants.ts` y tipos a `types.ts`
  dedicados, en vez de mezclarlos con la lógica/JSX.
  - Ejemplos actuales que vivirían ahí: `PRICES` / `MAX_QTY` de `CompraForm.tsx`;
    `PRODUCT` / `PRODUCT_PRICES` / `QUANTITY_LIMITS` / tipo `Currency` de
    `lib/mercadopago.ts`.
- **El precio autoritativo no se mueve al cliente.** `PRODUCT_PRICES` y
  `QUANTITY_LIMITS` viven del lado servidor (`lib/`); lo de `CompraForm.tsx` es
  solo UI (ver `payment-security.md` §3). Separar constantes ≠ centralizarlas en
  el cliente.

## 4. Capas (Clean Architecture / SOLID)

Dependencias hacia adentro: **UI → dominio ← infraestructura**.

- **Dominio:** producto, precios, límites, monedas soportadas (reglas de
  negocio puras).
- **Infraestructura:** cliente de Mercado Pago, `fetch`, lectura de env
  (`getMpClient`, `siteUrl`).
- **UI:** componentes (`app/components/`, rutas).

Reglas:

- SRP: cada módulo/función con una responsabilidad clara.
- La UI no instancia clientes de pago ni habla con MP directamente; pasa por la
  capa server (`app/api/**` + `lib/mercadopago.ts`).
- El dominio no depende de React ni de Next.

> Recordatorio final: el flujo de dinero y las invariantes de
> `payment-security.md` prevalecen sobre cualquier reorganización en capas.

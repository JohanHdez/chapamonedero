---
name: brand-ui
description: Estilo de marca de la landing de Chapa Monedero (Next.js 14 + Tailwind 3). Úsala SIEMPRE que vayas a maquetar, crear o ajustar UI, componentes, secciones, botones, formularios o estilos en landing/ — incluso si el usuario no menciona "marca" o "Tailwind". Enseña a usar los tokens cm-* de Tailwind, las variables --cm-* de globals.css, la tipografía Montserrat, el tema claro y el vocabulario de clases ya existente, para que lo nuevo se vea consistente con lo que ya hay.
---

# Brand UI — Chapa Monedero

La landing tiene una identidad visual ya definida: **tema claro, fondo blanco,
azul de marca, tipografía Montserrat, esquinas redondeadas y botones tipo
píldora**. Tu trabajo al maquetar es que cualquier cosa nueva se vea como si
siempre hubiera estado ahí. La fuente de verdad es
[app/globals.css](../../../landing/app/globals.css); las reglas viven en
[.claude/rules/frontend-style.md](../../rules/frontend-style.md).

## Principio rector

**Nunca metas hex sueltos.** Toda la paleta vive en variables `--cm-*` y está
expuesta a Tailwind como tokens `cm-*`. Si usas un color/borde/sombra/radio,
sale de un token. Así, si la marca cambia un día, se cambia en un solo sitio y
todo se actualiza.

## Dos formas de aplicar estilo (conviven)

La landing mezcla CSS clásico (clases semánticas en `globals.css`) con utilidades
Tailwind. Ambas leen las mismas variables, así que combinan sin pelearse.

1. **Clases existentes de `globals.css`** — para los patrones ya resueltos
   (`.btn`, `.card`, `.feature`, `.hero-*`, `.field`, `.input`, etc.). Si vas a
   construir algo que ya existe, **reutiliza la clase**; no la reimplementes en
   Tailwind.
2. **Utilidades Tailwind con tokens `cm-*`** — para layout, spacing, responsive
   y componentes nuevos que no tienen clase propia.

Regla práctica: ¿ya hay una clase para esto? Úsala. ¿Es algo nuevo o un ajuste
puntual de layout? Tailwind con tokens.

## Tokens de marca

Definidos en `:root` de `globals.css` y mapeados en
[tailwind.config.ts](../../../landing/tailwind.config.ts). Cada variable tiene su
clase Tailwind equivalente:

| Propósito | Variable CSS | Valor | Clase Tailwind |
|---|---|---|---|
| Azul primario | `--cm-primary` | `#2563eb` | `cm-primary` |
| Primario oscuro (hover) | `--cm-primary-shade` | `#1d4ed8` | `cm-primary-shade` |
| Azul claro (gradiente) | `--cm-secondary` | `#4c8dff` | `cm-secondary` |
| Acento | `--cm-accent` | `#2563eb` | `cm-accent` |
| Acento oscuro | `--cm-accent-shade` | `#1d4ed8` | `cm-accent-shade` |
| Error | `--cm-danger` | `#dc2626` | `cm-danger` |
| Éxito | `--cm-success` | `#16a34a` | `cm-success` |
| Fondo página | `--cm-bg` | `#ffffff` | `cm-bg` |
| Fondo input | `--cm-bg-2` | `#f1f5fb` | `cm-bg-2` |
| Superficie (cards) | `--cm-surface` | `#f6f9ff` | `cm-surface` |
| Superficie 2 (chips/iconos) | `--cm-surface-2` | `#eaf1ff` | `cm-surface-2` |
| Texto | `--cm-text` | `#0f1c33` | `cm-text` |
| Texto atenuado | `--cm-text-muted` | `#5b6b85` | `cm-muted` |
| Borde | `--cm-border` | `#dce5f3` | `cm-border` |
| Radio | `--cm-radius` | `16px` | `rounded-cm` |
| Sombra | `--cm-shadow` | sombra azul difusa | `shadow-cm` |

Las clases Tailwind funcionan con cualquier utilidad de color: `bg-cm-primary`,
`text-cm-muted`, `border-cm-border`, `ring-cm-primary`, `fill-cm-accent`, etc.
`font-sans` ya apunta a **Montserrat** (no hace falta declararla).

Nota: `cm-muted` es el token de `--cm-text-muted` (el prefijo `text-` ya lo pone
Tailwind). Es decir, texto atenuado = `text-cm-muted`.

## Convenciones visuales (respétalas)

- **Botones**: píldora (`rounded-full`), peso 700. El primario es un gradiente
  `from-cm-primary to-cm-secondary` con texto blanco; existe `.btn .btn-primary`
  para esto — úsalo. El secundario es `.btn-ghost` (borde + texto, fondo
  transparente).
- **Tarjetas/superficies**: fondo `cm-surface`, borde `cm-border`,
  `rounded-cm`. Las destacadas llevan `shadow-cm`.
- **Gradiente de marca**: `linear-gradient(135deg, primary, secondary)`. Se usa
  en logo, botón primario y texto resaltado del hero (`.hl`). En Tailwind:
  `bg-gradient-to-br from-cm-primary to-cm-secondary`.
- **Chips/píldoras** (métodos de pago, tags): fondo `cm-surface`/`cm-surface-2`,
  borde `cm-border`, `rounded-full`, texto pequeño y semibold.
- **Inputs**: fondo `cm-bg-2`, borde `cm-border`, `rounded-xl`; en foco el borde
  pasa a `cm-primary` (sin outline).
- **Jerarquía de texto**: títulos con `tracking` negativo
  (`letter-spacing: -0.02/-0.03em`) y `clamp()` para tamaños fluidos; cuerpo
  secundario en `text-cm-muted` con `leading` ~1.6.
- **Layout**: ancho de contenido `max-w-[1120px]` centrado (clase `.container`);
  secciones con `padding: 56px 0` (clase `.section`).
- **Responsive**: breakpoint principal en `860px` (en CSS). Con Tailwind, móvil
  primero y `md:`/`lg:` hacia arriba; grids de 3 columnas colapsan a 1.

## Copy

Todo el texto visible va **en español**, tono cercano y directo orientado al
dueño del negocio (“tu baño”, “convierte… en un ingreso”). Evita anglicismos
innecesarios.

## Ejemplos

**Ejemplo 1 — botón primario (reutiliza la clase existente):**
Input: un CTA "Comprar ahora" como el del hero
Output: `<button className="btn btn-primary">Comprar ahora</button>`
(No reimplementes el gradiente a mano si ya existe `.btn-primary`.)

**Ejemplo 2 — tarjeta nueva con Tailwind y tokens:**
Input: una tarjeta de beneficio con icono, título y texto
Output:
```tsx
<div className="bg-cm-surface border border-cm-border rounded-cm p-6">
  <div className="w-12 h-12 grid place-items-center rounded-xl bg-cm-surface-2 text-cm-primary mb-4">
    <i className="fa fa-lock" />
  </div>
  <h3 className="text-lg font-bold mb-2">Cobro 100% mecánico</h3>
  <p className="text-cm-muted leading-relaxed text-sm">
    Sin baterías ni conexión: la cerradura cobra sola.
  </p>
</div>
```

**Ejemplo 3 — color directo (qué NO hacer):**
Input: "ponle fondo azul al banner"
Mal: `<div className="bg-[#2563eb]">` o `style={{ background: '#2563eb' }}`
Bien: `<div className="bg-cm-primary">`

## Verificar

Tras cualquier cambio de UI: `cd landing && npm run build` (type-checkea las
rutas). Para revisar el aspecto visual, `npm run dev` y abre
`http://localhost:3000`. Recuerda que el *Preflight* de Tailwind resetea estilos
base; si algo se descuadra, compáralo con `globals.css` antes de parchear.

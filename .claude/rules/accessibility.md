# Reglas de accesibilidad (a11y) — landing/

Mínimos de accesibilidad para la landing. El idioma (español), la tipografía y
la **paleta de marca** ya están en `frontend-style.md`: no los repitas aquí,
referéncialos. Estas reglas son sobre semántica, foco e interacción.

## 1. HTML semántico

- **Haz** usar el elemento correcto: `<button>` para acciones, `<a>` para
  navegación, `<label htmlFor>` para campos (como ya hace `CompraForm.tsx`).
- **No hagas** botones con `<div onClick>`: pierdes foco y teclado gratis.
- Inputs siempre asociados a su `<label>` (`htmlFor` + `id`).

## 2. ARIA

- Botones de solo icono llevan `aria-label` descriptivo
  (`CompraForm.tsx`: "Quitar una unidad" / "Agregar una unidad";
  `WhatsAppButton.tsx`: "Escríbenos por WhatsApp").
- Iconos decorativos llevan `aria-hidden="true"` (los `<i className="fa ...">`
  ya lo hacen).
- No añadas ARIA que duplique la semántica nativa (no `role="button"` en un
  `<button>`).

## 3. Foco y teclado

- Todo lo interactivo debe alcanzarse y activarse con teclado (Tab / Enter /
  Espacio). Usar elementos nativos lo da hecho.
- **No elimines** el indicador de foco (`:focus`) sin sustituirlo por uno
  visible.
- Respeta el orden de tabulación natural del DOM; evita `tabindex` positivos.
- Estados `disabled` reales (como los `+/-` del contador) en vez de solo
  ocultar visualmente.

## 4. Color y contraste

- Usa solo los tokens de marca `--cm-*` / clases `cm-*` (ver
  `frontend-style.md`). Al combinar texto/fondo busca contraste suficiente
  (WCAG AA: 4.5:1 texto normal, 3:1 texto grande).
- **No dependas solo del color** para comunicar estado: errores y validaciones
  llevan texto (como el `<p className="error">` del form), no solo color.

## 5. Imágenes y enlaces

- Toda `<img>` / `<Image>` con `alt` significativo (decorativas → `alt=""`).
  Revisa que el `alt` describa el contenido real.
- Enlaces externos con `target="_blank"` llevan `rel="noopener noreferrer"`
  (como `WhatsAppButton.tsx`).

## 6. Responsive

- Cuida que objetivos táctiles y texto sigan usables en móvil; no rompas el zoom
  del navegador.

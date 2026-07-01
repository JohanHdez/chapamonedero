# Reglas de estilo de frontend — landing/

- **Idioma:** todo el copy/UI en **español**.
- **Tipografía:** Montserrat (`font-sans` ya apunta a Montserrat en Tailwind).
- **Paleta:** usa los tokens de marca, nunca hex sueltos.
  - CSS plano: variables `--cm-*` de `app/globals.css`.
  - Tailwind: clases `cm-*` (`bg-cm-primary`, `text-cm-muted`,
    `border-cm-border`, `rounded-cm`, `shadow-cm`, etc.), mapeadas en
    `tailwind.config.ts` a esas mismas variables.
- **Tema:** claro, fondo blanco con azul de marca (`--cm-primary` #2563eb).
- Tailwind y el CSS de `globals.css` conviven: Tailwind para utilidades nuevas,
  las clases/variables existentes se mantienen. No reescribas el CSS de marca
  por reescribirlo.

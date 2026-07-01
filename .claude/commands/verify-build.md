---
description: Type-check y build de producción de la landing (única forma de verificar cambios; no hay test runner).
allowed-tools: Bash
---

Verifica la app de `landing/` corriendo el build de producción, que type-checkea
todas las rutas.

```bash
cd landing && npm run build
```

Si el build falla, reporta el error con el archivo y la línea, propón el arreglo
y vuelve a correrlo hasta que pase. Si pasa, confírmalo con un resumen de una
línea.

import { NextResponse, type NextRequest } from "next/server";
import { countryForHost } from "@/lib/countries";

/**
 * Middleware de "dominio por país".
 *
 * Cada país sirve su landing en su propio dominio (chapamonedero.mx → MX,
 * chapamonedero.com → CO). Este middleware hace que la RAÍZ de ese dominio
 * muestre el contenido del país correspondiente SIN exponer `/mx` ni `/co` en la
 * URL, usando REWRITE (nunca redirect).
 *
 * En LOCAL (localhost/127.0.0.1) o en cualquier host no reconocido, no toca
 * nada: el selector de país en `/` y las rutas explícitas `/mx`, `/co` siguen
 * funcionando igual.
 *
 * SEGURIDAD (payment-security.md §3): el host SOLO se usa para elegir el país al
 * que apunta la reescritura de la UI. El país de COBRO se sigue derivando del
 * segmento de ruta validado por whitelist en las rutas API — este middleware no
 * lo toca (además `/api/**` está excluido del matcher).
 *
 * QUÉ SE REESCRIBE Y QUÉ NO:
 *  - Se reescribe SOLO la raíz `/` → `/${country}` (la home del país).
 *  - NO se reescribe `/compra/**`: esas páginas de retorno viven a nivel raíz
 *    (`app/compra/{exito,pendiente,error}`), FUERA de `[country]`; reescribirlas
 *    daría 404.
 *  - NO se reescribe si el pathname ya empieza por `/mx` o `/co` (anti-loop).
 *  - `/api/**`, `/_next/**` y assets estáticos quedan fuera vía `config.matcher`.
 */
export function middleware(req: NextRequest) {
  const country = countryForHost(req.headers.get("host"));

  // Host local/desconocido: no reescribir (selector raíz + /mx, /co siguen).
  if (!country) return NextResponse.next();

  const { pathname, search } = req.nextUrl;

  // Anti-loop: si ya apunta a un segmento de país explícito, no reescribir.
  if (pathname.startsWith("/mx") || pathname.startsWith("/co")) {
    return NextResponse.next();
  }

  // Conservador: solo la raíz `/` se mapea a la home del país. El resto de
  // rutas de nivel raíz (p. ej. `/compra/...`) se sirven tal cual.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${country}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Excluye API, internals de Next y cualquier archivo con extensión (assets).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

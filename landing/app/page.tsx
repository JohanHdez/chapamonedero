import Image from "next/image";
import { COUNTRY_CONFIG, DEFAULT_COUNTRY } from "../lib/countries";

/**
 * Selector de país en la raíz (`/`). No es un redirect ciego: ofrece dos
 * enlaces nativos (<a>) a `/mx` y `/co`, bueno para SEO y accesibilidad. El
 * país por defecto (DEFAULT_COUNTRY) queda destacado y recibe el foco inicial.
 */
export default function CountrySelector() {
  const mx = COUNTRY_CONFIG.mx;
  const co = COUNTRY_CONFIG.co;

  return (
    <main className="container min-h-screen flex flex-col items-center justify-center py-16 text-center font-sans text-cm-text">
      <Image
        src="/logo-chapamonedero.png"
        alt="Chapa Monedero"
        width={245}
        height={34}
        priority
        className="mb-10"
      />

      <h1 className="text-3xl font-extrabold mb-3">Elige tu país</h1>
      <p className="text-cm-muted max-w-md mb-10">
        Selecciona el país donde quieres comprar tu Chapa Monedero para ver los
        precios y métodos de pago locales.
      </p>

      <nav aria-label="Selección de país" className="w-full max-w-md">
        <ul className="grid gap-4 list-none p-0 m-0">
          <li>
            <a
              href="/co"
              aria-label={`Comprar en ${co.label} — opción destacada`}
              className="flex items-center justify-between gap-4 rounded-cm border-2 border-cm-primary bg-cm-surface-2 px-6 py-5 text-left shadow-cm hover:bg-cm-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-primary"
            >
              <span className="flex items-center gap-4">
                <span className="text-3xl" aria-hidden="true">
                  🇨🇴
                </span>
                <span>
                  <span className="block text-lg font-bold text-cm-primary">
                    {co.label}
                  </span>
                  <span className="block text-sm text-cm-muted">
                    Precios en pesos colombianos (COP)
                  </span>
                </span>
              </span>
              <span
                className="rounded-full bg-cm-primary px-3 py-1 text-xs font-semibold text-white"
                aria-hidden="true"
              >
                Recomendado
              </span>
            </a>
          </li>
          <li>
            <a
              href="/mx"
              aria-label={`Comprar en ${mx.label}`}
              className="flex items-center gap-4 rounded-cm border border-cm-border bg-cm-bg-2 px-6 py-5 text-left hover:border-cm-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-primary"
            >
              <span className="text-3xl" aria-hidden="true">
                🇲🇽
              </span>
              <span>
                <span className="block text-lg font-bold text-cm-text">
                  {mx.label}
                </span>
                <span className="block text-sm text-cm-muted">
                  Precios en pesos mexicanos (MXN)
                </span>
              </span>
            </a>
          </li>
        </ul>
      </nav>

      <p className="text-sm text-cm-muted mt-10">
        Por defecto te recomendamos {COUNTRY_CONFIG[DEFAULT_COUNTRY].label}.
      </p>
    </main>
  );
}

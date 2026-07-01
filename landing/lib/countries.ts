import type { Currency } from "./mercadopago";

/**
 * Países soportados por la landing multipaís. El país es la fuente de verdad
 * para moneda, pasarela (credenciales) y WhatsApp — viene del segmento de ruta
 * (`/mx`, `/co`) o del segmento de las rutas API, NUNCA del body del cliente.
 */
export type Country = "mx" | "co";

/** País por defecto cuando no hay segmento (raíz `/`). */
export const DEFAULT_COUNTRY: Country = "co";

interface CountryConfig {
  /** Moneda autoritativa del país (debe existir en PRODUCT_PRICES). */
  readonly currency: Currency;
  /** Número de WhatsApp en formato internacional sin `+` (para wa.me). */
  readonly whatsapp: string;
  /** Nombre del env var con el Access Token PRIVADO de MP de ese país. */
  readonly accessTokenEnv: string;
  /** Nombre del env var con el secreto del webhook de MP de ese país. */
  readonly webhookSecretEnv: string;
  /** Etiqueta para UI/copy. */
  readonly label: string;
  /**
   * Dominio de producción de este país (sin protocolo). Cada país sirve su
   * landing en su propio dominio; el middleware reescribe la raíz de ese
   * dominio al segmento `/${country}` sin exponerlo en la URL.
   */
  readonly domain: string;
}

/**
 * Configuración por país. Los valores SENSIBLES no viven aquí: solo guardamos
 * el NOMBRE del env var; el valor se lee en runtime desde process.env, sin
 * defaults (ver lib/mercadopago.ts y payment-security.md §4).
 */
export const COUNTRY_CONFIG: Record<Country, CountryConfig> = {
  mx: {
    currency: "MXN",
    // TODO: número de WhatsApp de México
    whatsapp: "52XXXXXXXXXX",
    accessTokenEnv: "MP_ACCESS_TOKEN_MX",
    webhookSecretEnv: "MP_WEBHOOK_SECRET_MX",
    label: "México",
    domain: "chapamonedero.mx",
  },
  co: {
    currency: "COP",
    whatsapp: "573008036395",
    accessTokenEnv: "MP_ACCESS_TOKEN_CO",
    webhookSecretEnv: "MP_WEBHOOK_SECRET_CO",
    label: "Colombia",
    domain: "chapamonedero.com",
  },
} as const;

/** Whitelist: valida que un valor externo (segmento de ruta) sea un país. */
export function isSupportedCountry(value: unknown): value is Country {
  return value === "mx" || value === "co";
}

/** Moneda autoritativa de un país (la fija el servidor, no el cliente). */
export function currencyForCountry(country: Country): Currency {
  return COUNTRY_CONFIG[country].currency;
}

/**
 * Verifica que una combinación país↔moneda sea coherente. Rechaza, p. ej.,
 * país `mx` con moneda `COP`. Útil como defensa extra si alguna vez una moneda
 * llegara desde fuera (no debería: la moneda la deriva el servidor del país).
 */
export function isCountryCurrencyMatch(
  country: Country,
  currency: Currency
): boolean {
  return COUNTRY_CONFIG[country].currency === currency;
}

/**
 * Resuelve el país cuyo `domain` esté CONTENIDO en el host de la request
 * (case-insensitive). Devuelve `null` para hosts locales o desconocidos
 * (localhost, 127.0.0.1, previews, etc.), donde no se debe reescribir nada.
 *
 * SEGURIDAD: el host SOLO sirve para elegir el ORIGEN de las URLs de retorno;
 * NUNCA es la fuente del país de cobro. El país autoritativo viene siempre del
 * segmento de ruta validado por whitelist (ver payment-security.md §3).
 */
export function countryForHost(
  host: string | null | undefined
): Country | null {
  if (!host) return null;

  // Quita el puerto y normaliza. Coincidencia por sufijo EXACTO (dominio o
  // subdominio) para evitar falsos positivos tipo `chapamonedero.com.atacante.net`.
  const normalized = host.toLowerCase().split(":")[0];
  for (const country of Object.keys(COUNTRY_CONFIG) as Country[]) {
    const domain = COUNTRY_CONFIG[country].domain;
    if (normalized === domain || normalized.endsWith(`.${domain}`)) return country;
  }
  return null;
}

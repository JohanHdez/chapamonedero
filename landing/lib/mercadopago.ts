import { MercadoPagoConfig } from "mercadopago";
import {
  type Country,
  COUNTRY_CONFIG,
  isSupportedCountry,
  countryForHost,
} from "./countries";

/**
 * Cliente de Mercado Pago POR PAÍS. Cada país tiene su propia cuenta de MP, así
 * que su Access Token vive en un env var distinto (ver COUNTRY_CONFIG).
 *
 * Seguridad (payment-security.md §4):
 *  - El país se valida por whitelist ANTES de resolver cualquier env var.
 *  - El access token SIEMPRE viene de una variable de entorno del servidor —
 *    nunca se hardcodea, nunca tiene default. Si falta, lanza (→ 500 a propósito).
 */
export function getMpClient(country: Country): MercadoPagoConfig {
  // Whitelist antes de tocar el entorno.
  if (!isSupportedCountry(country)) {
    throw new Error("País no soportado.");
  }

  const envName = COUNTRY_CONFIG[country].accessTokenEnv;
  const accessToken = process.env[envName];
  if (!accessToken) {
    throw new Error(`${envName} no está configurado en el entorno.`);
  }

  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 8000 },
  });
}

/**
 * Producto único en venta: la chapa mecánica de cobro para baños.
 * El precio por unidad es AUTORITATIVO en el servidor — el cliente nunca
 * define el precio; solo elige cantidad. La moneda la fija el país (la ruta).
 */
export const PRODUCT = {
  id: "chapa-monedero",
  title: "Chapa Monedero · Cerradura de cobro para baños",
} as const;

/** Precio por unidad por moneda (definido por el negocio, no por el cliente). */
export const PRODUCT_PRICES = {
  MXN: 2580,
  COP: 480000,
} as const;

/** Cantidad mínima y máxima de unidades por pedido. */
export const QUANTITY_LIMITS = { min: 1, max: 50 } as const;

export type Currency = keyof typeof PRODUCT_PRICES;

export function isSupportedCurrency(value: unknown): value is Currency {
  return typeof value === "string" && value in PRODUCT_PRICES;
}

/**
 * Origen (protocolo + host) para construir `back_urls` y `notification_url`.
 *
 * En PRODUCCIÓN el origen se deriva del Host de la request, de modo que cada
 * dominio (chapamonedero.mx / chapamonedero.com) devuelve al usuario y recibe
 * el webhook en SU propio dominio. En LOCAL (o host vacío) cae al fallback
 * `NEXT_PUBLIC_SITE_URL` (útil con un túnel tipo ngrok en dev).
 *
 * SEGURIDAD: el host SOLO elige el ORIGEN de las URLs de retorno; NUNCA deriva
 * el país de cobro (eso viene del segmento de ruta validado por whitelist).
 */
export function siteUrl(host?: string | null, _proto?: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!host) return fallback;

  // Solo se acepta el Host si es un dominio CONOCIDO (whitelist por sufijo en
  // countryForHost). Un Host falsificado o no reconocido (incl. localhost/preview)
  // cae al fallback, evitando que un origen del atacante llegue a back_urls.
  if (!countryForHost(host)) return fallback;

  // Dominio conocido → siempre https (no confiamos en el proto del cliente).
  const hostname = host.toLowerCase().split(":")[0];
  return `https://${hostname}`;
}

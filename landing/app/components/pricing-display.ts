import type { Country } from "../../lib/countries";

/**
 * Datos de PRESENTACIÓN por país para mostrar precios/totales en la UI.
 *
 * ⚠️ SOLO UI. El precio REAL y autoritativo lo aplica el servidor
 * (lib/mercadopago.ts → PRODUCT_PRICES) a partir del país del segmento de ruta.
 * Estos valores NUNCA se envían al checkout ni se usan como fuente de verdad:
 * son únicamente para pintar la tarjeta de precio y el total estimado.
 *
 * Compartido por page.tsx (Server Component, tarjeta de precio del hero) y
 * CompraForm.tsx (cliente) para no duplicar el literal.
 */
export interface CountryPricingDisplay {
  readonly label: string;
  readonly currency: string;
  readonly symbol: string;
  /** Precio unitario mostrado (SOLO UI). */
  readonly unit: number;
  readonly flag: string;
}

export const UI_BY_COUNTRY: Record<Country, CountryPricingDisplay> = {
  mx: { label: "México", currency: "MXN", symbol: "$", unit: 2580, flag: "🇲🇽" },
  co: { label: "Colombia", currency: "COP", symbol: "$", unit: 480000, flag: "🇨🇴" },
} as const;

/**
 * Formatea un valor con el símbolo del país (SOLO presentación).
 * Ej.: fmt("co", 480000) → "$480,000".
 */
export function fmt(country: Country, value: number): string {
  return `${UI_BY_COUNTRY[country].symbol}${value.toLocaleString()}`;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WhatsAppButton from "../components/WhatsAppButton";
import { COUNTRY_CONFIG, isSupportedCountry } from "../../lib/countries";

const domainUrl = (country: keyof typeof COUNTRY_CONFIG) =>
  `https://${COUNTRY_CONFIG[country].domain}`;

/**
 * Metadata de dominio-por-país: canonical al dominio del país actual y hreflang
 * (es-MX / es-CO / x-default) derivados de COUNTRY_CONFIG. Así cada dominio
 * declara su idioma/región y evita contenido duplicado entre .mx y .com.
 */
export function generateMetadata({
  params,
}: {
  params: { country: string };
}): Metadata {
  const { country } = params;
  if (!isSupportedCountry(country)) return {};

  return {
    alternates: {
      canonical: domainUrl(country),
      languages: {
        "es-MX": domainUrl("mx"),
        "es-CO": domainUrl("co"),
        "x-default": domainUrl("co"),
      },
    },
  };
}

/**
 * Layout de las rutas de país (`/mx`, `/co`). Aquí vive el botón flotante de
 * WhatsApp, con el número del país correspondiente: por eso se sacó del root
 * layout, que no conoce el país.
 */
export default function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { country: string };
}) {
  const { country } = params;
  if (!isSupportedCountry(country)) notFound();

  return (
    <>
      {children}
      <WhatsAppButton phone={COUNTRY_CONFIG[country].whatsapp} />
    </>
  );
}

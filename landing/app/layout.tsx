import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chapa Monedero — Cobra por el uso de tu baño",
  description:
    "Cerradura mecánica de cobro a moneda para baños de negocios. Convierte tu baño en un ingreso. Compra segura con tarjeta, OXXO, SPEI, PSE y Nequi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

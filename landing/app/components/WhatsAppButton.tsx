// Botón flotante de WhatsApp para las rutas de país.
//
// Es un enlace <a> estático: sin estado ni handlers de cliente, así que NO
// lleva "use client" y se renderiza como Server Component (menos JS al cliente).
// El número llega por prop desde el layout de país (COUNTRY_CONFIG[country].
// whatsapp); el mensaje es fijo. El estilo vive en globals.css (.wa-fab),
// reutilizando los tokens de marca y la variable dedicada --cm-whatsapp.

const WHATSAPP_MESSAGE = "Hola, quiero información sobre Chapa Monedero";

export default function WhatsAppButton({ phone }: { phone: string }) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <a
      className="wa-fab"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
    >
      <i className="fa fa-whatsapp" aria-hidden="true" />
    </a>
  );
}

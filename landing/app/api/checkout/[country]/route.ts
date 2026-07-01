import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import {
  getMpClient,
  PRODUCT,
  PRODUCT_PRICES,
  QUANTITY_LIMITS,
  siteUrl,
} from "@/lib/mercadopago";
import { currencyForCountry, isSupportedCountry } from "@/lib/countries";

export const runtime = "nodejs";

/**
 * Crea una preferencia de pago de Mercado Pago para la compra del producto
 * (la chapa de cobro) y devuelve el `init_point` (URL del checkout) al frontend.
 *
 * Seguridad (payment-security.md):
 *  - El PAÍS viene del SEGMENTO DE RUTA, no del body, y se valida por whitelist.
 *  - La MONEDA y el PRECIO se derivan del país en el servidor; el cliente NUNCA
 *    define precio ni moneda — solo elige cantidad y email.
 *  - Las credenciales viven solo en variables de entorno (getMpClient(country)).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { country: string } }
) {
  // 1) País desde la ruta, validado por whitelist ANTES de cualquier otra cosa.
  const { country } = params;
  if (!isSupportedCountry(country)) {
    return NextResponse.json({ error: "País no soportado." }, { status: 404 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
    }

    // El cliente solo aporta cantidad y email. Cualquier currency/precio del
    // body se ignora deliberadamente.
    const { quantity, email } = body as {
      quantity?: unknown;
      email?: unknown;
    };

    const numericQuantity = Number(quantity);
    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < QUANTITY_LIMITS.min ||
      numericQuantity > QUANTITY_LIMITS.max
    ) {
      return NextResponse.json(
        { error: "Cantidad fuera de los límites permitidos." },
        { status: 400 }
      );
    }

    if (
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Correo electrónico inválido." },
        { status: 400 }
      );
    }

    // 2) Moneda y precio AUTORITATIVOS, derivados del país en el servidor.
    const currency = currencyForCountry(country);
    const unitPrice = PRODUCT_PRICES[currency];

    // Referencia interna del pedido: incluye el país para conciliar el webhook
    // (payment_id es único por cuenta/país). En producción, persiste esto en tu
    // BD antes de cobrar.
    const externalReference = `pedido_${country}_${numericQuantity}u_${Date.now()}`;

    const preference = new Preference(getMpClient(country));
    // Origen derivado del Host de la request: cada dominio devuelve/recibe en el
    // suyo. El host SOLO elige el origen; el país ya está fijado por la ruta.
    const host = req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto");
    const base = siteUrl(host, proto);

    const result = await preference.create({
      body: {
        items: [
          {
            id: PRODUCT.id,
            title: PRODUCT.title,
            quantity: numericQuantity,
            unit_price: unitPrice,
            currency_id: currency,
          },
        ],
        payer: { email },
        external_reference: externalReference,
        statement_descriptor: "CHAPA MONEDERO",
        back_urls: {
          success: `${base}/compra/exito`,
          pending: `${base}/compra/pendiente`,
          failure: `${base}/compra/error`,
        },
        auto_return: "approved",
        // Webhook por país: el secreto y la cuenta dependen del país.
        notification_url: `${base}/api/webhooks/mercadopago/${country}`,
      },
    });

    const initPoint = result.init_point ?? result.sandbox_init_point;
    if (!initPoint) {
      return NextResponse.json(
        { error: "No se pudo generar el checkout." },
        { status: 502 }
      );
    }

    return NextResponse.json({ init_point: initPoint });
  } catch (err) {
    // No registramos datos del comprador (sin PII en logs). El país no es PII.
    console.error(
      `checkout error (${country}):`,
      err instanceof Error ? err.message : "unknown"
    );
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}

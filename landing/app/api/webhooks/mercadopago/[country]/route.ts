import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Payment } from "mercadopago";
import { getMpClient } from "@/lib/mercadopago";
import { COUNTRY_CONFIG, isSupportedCountry, type Country } from "@/lib/countries";

export const runtime = "nodejs";

/**
 * Webhook de Mercado Pago POR PAÍS (`/api/webhooks/mercadopago/mx|co`).
 *
 * Cada país tiene su propia cuenta de MP → su propio secreto de webhook y su
 * propio cliente para re-consultar el pago. El país viene del SEGMENTO DE RUTA
 * y se valida por whitelist ANTES de leer el secreto del entorno.
 *
 * Mercado Pago entrega DOS formatos distintos a la misma URL:
 *
 *  A) Webhooks (moderno, FIRMADO): `?type=payment&data.id=<id>` con headers
 *     `x-signature` (ts + v1 HMAC) y `x-request-id`. Lo configura el panel
 *     de MP (Webhooks) y firma con el secreto del país. ESTE es el único que
 *     confirma la orden y SIEMPRE debe pasar la verificación HMAC.
 *
 *  B) IPN (legacy): `?topic=payment&id=<id>` o `?topic=merchant_order&id=<id>`.
 *     Lo genera el `notification_url` de la Preference. No corresponde al
 *     esquema firmado de webhooks (a veces llega CON un header `x-signature`
 *     que no aplica). No lo procesamos: respondemos 200 inerte para que MP no
 *     reintente. La confirmación real llega SIEMPRE por el formato firmado (A).
 *
 * Seguridad (reglas PagoKit / payment-security.md):
 *  - Lee el cuerpo CRUDO (raw body) antes de parsear.
 *  - Verifica la firma HMAC del header `x-signature` antes de procesar un pago.
 *  - No confía en el body: re-consulta el pago real vía la API de MP del país.
 *  - Idempotente con clave COMPUESTA `${country}:${payment_id}` (los payment_id
 *    son únicos por cuenta, no globales).
 *  - No registra PII (correo, datos del pagador). El país NO es PII.
 *  - El secreto vive solo en el env var del país (sin default).
 */

// ⚠️ Idempotencia en memoria SOLO para desarrollo. En producción reemplázalo
// por una tabla en tu BD con UNIQUE(country, payment_id) para sobrevivir
// reinicios y múltiples instancias. Ver PAGOKIT_PRODUCTION_CHECKLIST.
const processedPayments = new Set<string>();

// Tolerancia de antigüedad del timestamp firmado (segundos) — anti-replay.
const TS_TOLERANCE_SECONDS = 300;

function parseSignatureHeader(signatureHeader: string): {
  ts?: string;
  v1?: string;
} {
  // x-signature: "ts=1704908010,v1=hexdigest"
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  return { ts: parts["ts"], v1: parts["v1"] };
}

function verifySignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !dataId) return false;

  const { ts, v1 } = parseSignatureHeader(signatureHeader);
  if (!ts || !v1) return false;

  // Anti-replay: rechaza firmas con timestamp fuera de la ventana.
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(Number(ts)) || Math.abs(now - Number(ts)) > TS_TOLERANCE_SECONDS) {
    return false;
  }

  // Manifest canónico exigido por Mercado Pago. El `data.id` va tal cual lo
  // envía MP en el query param `data.id` (alfanumérico => minúsculas).
  const normalizedId = /^[a-zA-Z0-9]+$/.test(dataId)
    ? dataId.toLowerCase()
    : dataId;
  const manifest = `id:${normalizedId};request-id:${requestId ?? ""};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // Comparación en tiempo constante.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { country: string } }
) {
  // 0) País desde la ruta, validado por whitelist ANTES de leer el entorno.
  const countryParam = params.country;
  if (!isSupportedCountry(countryParam)) {
    return NextResponse.json({ error: "País no soportado." }, { status: 404 });
  }
  const country: Country = countryParam;

  const secretEnv = COUNTRY_CONFIG[country].webhookSecretEnv;
  const secret = process.env[secretEnv];
  if (!secret) {
    console.error(`webhook (${country}): ${secretEnv} no configurado`);
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  // 1) Cuerpo crudo (no usar req.json() antes de verificar la firma).
  const rawBody = await req.text();

  const url = new URL(req.url);
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");

  // 2) Determinar el formato de la notificación.
  //    Webhook firmado (A): query `type=` + `data.id=` y header `x-signature`.
  //    IPN legacy (B):       query `topic=` + `id=` (puede traer x-signature
  //                          que no aplica a este esquema).
  const queryType = url.searchParams.get("type");
  const queryTopic = url.searchParams.get("topic");
  const dataIdSigned = url.searchParams.get("data.id");

  let payload: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    payload = {};
  }

  // 3) IPN legacy → inerte. Cualquier notificación con formato `topic=` y sin
  //    `type=` se ignora con 200, INDEPENDIENTEMENTE de si trae `x-signature`
  //    (MP a veces adjunta uno que no corresponde a este esquema). No se
  //    consulta el pago ni se confirma la orden: la confirmación real llega por
  //    el webhook firmado (A), que MP emite para el mismo pago. Responder 200
  //    evita reintentos/ruido. Esto NO debilita la verificación de (A).
  if (queryTopic && !queryType) {
    return NextResponse.json({ received: true, ignored: "ipn" });
  }

  // 4) A partir de aquí es (o pretende ser) el webhook FIRMADO.
  //    El `data.id` del manifest es el del query `data.id`; fallback al body.
  const dataId = dataIdSigned || (payload.data?.id ? String(payload.data.id) : null);

  // 5) Verificación de firma — rechaza si no es válida. (No se debilita.)
  if (!verifySignature(signature, requestId, dataId, secret)) {
    console.warn(`webhook (${country}): firma inválida`);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // 6) Solo procesamos notificaciones de pago.
  const type = queryType || payload.type;
  if (type !== "payment" || !dataId) {
    // 200 para que MP no reintente notificaciones que no nos interesan.
    return NextResponse.json({ received: true });
  }

  // 7) Idempotencia con clave COMPUESTA país:payment_id (payment_id es único
  //    por cuenta, no global). En prod → DB con UNIQUE(country, payment_id).
  const idempotencyKey = `${country}:${dataId}`;
  if (processedPayments.has(idempotencyKey)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    // 8) NO confiamos en el cuerpo: consultamos el pago real a la API del país.
    const payment = new Payment(getMpClient(country));
    const info = await payment.get({ id: dataId });

    processedPayments.add(idempotencyKey);

    if (info.status === "approved") {
      // ✅ Pago aprobado: confirma el pedido del cliente.
      // Usa info.external_reference (incluye el país) para identificar el pedido.
      // TODO: marcar el pedido como pagado de forma transaccional e idempotente
      // en la BD y disparar el flujo de envío.
      console.info(`webhook (${country}): pago ${dataId} aprobado`);
    } else {
      console.info(`webhook (${country}): pago ${dataId} estado=${info.status}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(
      `webhook (${country}): error al consultar el pago:`,
      err instanceof Error ? err.message : "unknown"
    );
    // 500 → Mercado Pago reintentará la notificación.
    return NextResponse.json({ error: "processing" }, { status: 500 });
  }
}

#!/usr/bin/env node
/**
 * payment-security-check.js — Hook PostToolUse (Write|Edit) para Chapa Monedero.
 *
 * Vigila las invariantes de `.claude/rules/payment-security.md` en una sesión
 * NORMAL de Claude Code, sin depender del plugin PagoKit (`agente-pagokit/`,
 * que está gitignored). Es 100% self-contained: solo usa módulos nativos de
 * Node (`node:fs`, `node:path`) y stdin.
 *
 * Protocolo (Claude Code PostToolUse):
 *  - Recibe por STDIN un JSON con `tool_name`, `tool_input` (`file_path` +
 *    contenido nuevo: `content` en Write, `new_string` en Edit) y `cwd`.
 *  - El hook corre DESPUÉS de aplicar la edición, así que analizamos el
 *    archivo YA ESCRITO en disco (contenido final completo). Si no se puede
 *    leer, caemos al contenido de `tool_input` como respaldo.
 *  - Actúa SOLO sobre `landing/app/api/**` y `landing/lib/mercadopago.ts`.
 *    Para cualquier otro archivo: exit 0 sin imprimir nada (silencioso).
 *
 * Filosofía: AVISAR, no bloquear. Las heurísticas son conservadoras y
 * best-effort; ante una posible violación emitimos un aviso (systemMessage +
 * additionalContext) y salimos 0 — NO rompemos el flujo con exit 2. Todo va
 * envuelto en try/catch: si algo falla, exit 0.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SEC = "payment-security.md";

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function resolveFilePath(rawPath, cwd) {
  if (!rawPath) return null;
  if (path.isAbsolute(rawPath)) return rawPath;
  const base = cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.resolve(base, rawPath);
}

/** Contenido a analizar: preferimos el archivo final en disco. */
function getContent(filePath, toolInput) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch {
    /* cae al respaldo */
  }
  // Respaldo: fragmento de la herramienta (Write.content / Edit.new_string).
  if (toolInput && typeof toolInput.content === "string") return toolInput.content;
  if (toolInput && typeof toolInput.new_string === "string") return toolInput.new_string;
  return "";
}

// ---------------------------------------------------------------------------
// Clasificación del archivo
// ---------------------------------------------------------------------------

function classify(filePath) {
  const norm = filePath.replace(/\\/g, "/");
  const isApi = /(^|\/)landing\/app\/api\//.test(norm);
  const isMpLib = /(^|\/)landing\/lib\/mercadopago\.ts$/.test(norm);
  return {
    relevant: isApi || isMpLib,
    isWebhook: /(^|\/)landing\/app\/api\/webhooks\//.test(norm),
    isCheckout: /(^|\/)landing\/app\/api\/checkout\//.test(norm),
  };
}

// ---------------------------------------------------------------------------
// Utilidades de detección
// ---------------------------------------------------------------------------

/**
 * Blanquea COMENTARIOS (`// …` y `/* … *\/`) preservando strings y offsets.
 * Evita falsos positivos por tokens citados en comentarios/documentación
 * (p. ej. `// no usar req.json()`). Las cadenas se conservan intactas porque
 * varias detecciones dependen de literales string (header `"x-signature"`,
 * tokens `APP_USR-…`/`TEST-…`). Cada carácter de comentario se sustituye por
 * un espacio/tab/nueva línea equivalente, así los índices no se desplazan y
 * las comprobaciones de orden siguen siendo válidas.
 *
 * Best-effort: no rastrea literales de expresión regular; una regex que
 * contenga `//` podría sobre-blanquearse (solo produce falsos negativos, nunca
 * un crash). Ninguno de los archivos de pago actuales tiene ese caso.
 */
function stripComments(src) {
  let out = "";
  let state = "code"; // code | line | block | squote | dquote | tquote
  const n = src.length;
  for (let i = 0; i < n; ) {
    const ch = src[i];
    const next = i + 1 < n ? src[i + 1] : "";
    if (state === "code") {
      if (ch === "/" && next === "/") { state = "line"; out += "  "; i += 2; continue; }
      if (ch === "/" && next === "*") { state = "block"; out += "  "; i += 2; continue; }
      if (ch === "'") { state = "squote"; out += ch; i++; continue; }
      if (ch === '"') { state = "dquote"; out += ch; i++; continue; }
      if (ch === "`") { state = "tquote"; out += ch; i++; continue; }
      out += ch; i++; continue;
    }
    if (state === "line") {
      if (ch === "\n") { state = "code"; out += ch; i++; continue; }
      out += ch === "\t" ? "\t" : " "; i++; continue;
    }
    if (state === "block") {
      if (ch === "*" && next === "/") { state = "code"; out += "  "; i += 2; continue; }
      out += ch === "\n" ? "\n" : ch === "\t" ? "\t" : " "; i++; continue;
    }
    // Estados de string: se conservan los caracteres; se respetan los escapes.
    if (ch === "\\") { out += ch + next; i += 2; continue; }
    out += ch;
    if (state === "squote" && ch === "'") state = "code";
    else if (state === "dquote" && ch === '"') state = "code";
    else if (state === "tquote" && ch === "`") state = "code";
    i++;
  }
  return out;
}

function firstIndex(content, patterns) {
  let min = -1;
  for (const re of patterns) {
    const m = re.exec(content);
    if (m && (min === -1 || m.index < min)) min = m.index;
  }
  return min;
}

// ---------------------------------------------------------------------------
// Validaciones (cada una empuja avisos a `warnings`)
// ---------------------------------------------------------------------------

// (a) Webhook: cuerpo crudo + HMAC de x-signature con comparación de tiempo
//     constante ANTES de consultar/procesar el pago. (SEC §1, §2)
function checkWebhook(c, warnings) {
  const readsRawBody = /\.text\s*\(\s*\)/.test(c);
  const readsBodyAsJson = /\breq(?:uest)?\.json\s*\(/.test(c);
  if (!readsRawBody || readsBodyAsJson) {
    warnings.push(
      `[${SEC} §1] El webhook debe leer el CUERPO CRUDO con \`req.text()\` ` +
        `antes de parsear/verificar (no uses \`req.json()\` como lectura del cuerpo).`
    );
  }

  const hasHmac = /createHmac|\bHmac\b/.test(c);
  const hasConstTime = /timingSafeEqual/.test(c);
  const refsSignature = /x-signature/i.test(c);
  if (!hasHmac || !refsSignature) {
    warnings.push(
      `[${SEC} §1] No se detecta verificación del HMAC del header ` +
        `\`x-signature\` (esperado \`crypto.createHmac('sha256', secret)\`).`
    );
  }
  if (!hasConstTime) {
    warnings.push(
      `[${SEC} §1] La firma debe compararse en TIEMPO CONSTANTE con ` +
        `\`crypto.timingSafeEqual\` (evita comparación con \`===\`).`
    );
  }

  // Orden: la verificación de firma debe ocurrir antes de re-consultar el pago.
  const verifyIdx = firstIndex(c, [/timingSafeEqual/, /verifySignature\s*\(/, /createHmac/]);
  const fetchIdx = firstIndex(c, [/new\s+Payment\s*\(/, /payment\.get\s*\(/, /\.get\s*\(\s*\{\s*id/]);
  if (fetchIdx !== -1 && (verifyIdx === -1 || verifyIdx > fetchIdx)) {
    warnings.push(
      `[${SEC} §1-§2] La firma debe verificarse ANTES de consultar el pago ` +
        `(\`Payment.get\`). Verifica el HMAC antes de re-consultar la API de MP.`
    );
  }

  // §2: no confiar en el body → re-consultar el pago real vía la API de MP.
  if (fetchIdx === -1 && /status\s*===?\s*["']approved["']/.test(c)) {
    warnings.push(
      `[${SEC} §2] No confíes en el cuerpo: re-consulta el pago real a la API ` +
        `de MP (\`Payment.get\`) y confirma solo con \`status === "approved"\`.`
    );
  }
}

// (d) Checkout: precio autoritativo del servidor (PRODUCT_PRICES), nunca del
//     cliente; la moneda tampoco viene del body. (SEC §3)
function checkCheckout(c, warnings) {
  if (!/PRODUCT_PRICES/.test(c)) {
    warnings.push(
      `[${SEC} §3] El checkout debe tomar el precio autoritativo del servidor ` +
        `(\`PRODUCT_PRICES\`); no se detecta su uso.`
    );
  }

  // Precio o moneda derivados del cuerpo del cliente.
  const clientPriceFromBody =
    /\bbody\.(price|unit_price|unitPrice|amount|currency|currency_id|currencyId)\b/.test(c) ||
    /const\s*\{[^}]*\b(price|unit_price|unitPrice|amount|currency|currency_id|currencyId)\b[^}]*\}\s*=\s*body/.test(c);
  if (clientPriceFromBody) {
    warnings.push(
      `[${SEC} §3] El precio/moneda NO puede venir del cliente. El cliente solo ` +
        `elige cantidad y correo; precio = \`PRODUCT_PRICES\`, moneda derivada del país.`
    );
  }

  // unit_price asignado desde algo del cliente (body/req/payload).
  if (/unit_price\s*:\s*[^,\n}]*\b(body|req|request|payload)\b/.test(c)) {
    warnings.push(
      `[${SEC} §3] \`unit_price\` parece derivarse del cliente. Debe ser ` +
        `\`PRODUCT_PRICES[currency]\` (servidor).`
    );
  }
}

// (b) Secretos: solo desde env vars; nunca literales ni tokens hardcodeados.
//     (SEC §4). Aplica a todos los archivos de pago.
function checkSecrets(c, warnings) {
  // Token real de Mercado Pago incrustado (APP_USR-… / TEST-…).
  if (/\b(?:APP_USR|TEST)-[A-Za-z0-9_-]{6,}/.test(c)) {
    warnings.push(
      `[${SEC} §4] Posible TOKEN de Mercado Pago hardcodeado (\`APP_USR-…\`/` +
        `\`TEST-…\`). Los secretos vienen SOLO de \`process.env\`, nunca literales.`
    );
  }

  // Variable con nombre de secreto asignada a un literal string (no process.env).
  const secretAssign =
    /\b(?:accessToken|access_token|webhookSecret|webhook_secret|mp_access_token|mp_webhook_secret|MP_ACCESS_TOKEN|MP_WEBHOOK_SECRET|apiKey|api_key|clientSecret|client_secret)\b\s*[:=]\s*(["'`])(?:(?!\1)[^\\]){8,}?\1/;
  if (secretAssign.test(c)) {
    warnings.push(
      `[${SEC} §4] Un secreto (access token / webhook secret / api key) parece ` +
        `asignado a un LITERAL. Debe leerse de \`process.env\` sin valor por defecto.`
    );
  }
}

// (c) PII en logs: nunca loguear email del pagador ni detalles de pago.
//     (SEC §6). Aplica a todos los archivos de pago.
function checkPiiLogs(c, warnings) {
  const piiWord =
    /\b(email|payer|cardholder|card_?number|card_?holder|cvv|first_?name|last_?name|nombre|apellido|tel[eé]fono|phone|address|direcci[oó]n|document|dni)\b/i;
  const callRe = /console\.(?:log|warn|error|info|debug|trace)\s*\(([\s\S]{0,300}?)\)/g;
  let m;
  let flagged = false;
  while ((m = callRe.exec(c)) !== null) {
    if (piiWord.test(m[1])) {
      flagged = true;
      break;
    }
  }
  if (flagged) {
    warnings.push(
      `[${SEC} §6] Un \`console.*\` parece incluir PII (email del pagador o ` +
        `datos del pago). Nunca loguees PII; usa referencias no sensibles.`
    );
  }
}

// ---------------------------------------------------------------------------
// Salida (no bloqueante)
// ---------------------------------------------------------------------------

function emitWarnings(filePath, warnings) {
  const rel = filePath.replace(/\\/g, "/");
  const header =
    `[payment-security] ${warnings.length} posible(s) problema(s) de ` +
    `seguridad de pagos en ${rel}. Revisa ${SEC} punto por punto.`;
  const detail = header + "\n\n" + warnings.map((w) => "- " + w).join("\n");

  const out = {
    // Aviso visible para la persona usuaria.
    systemMessage: header,
    // Contexto para que Claude lo tenga en cuenta y corrija (sin bloquear).
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: detail,
    },
  };
  process.stdout.write(JSON.stringify(out));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const raw = readStdin();
  if (!raw.trim()) process.exit(0);

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = input && input.tool_input ? input.tool_input : {};
  const filePath = resolveFilePath(toolInput.file_path, input && input.cwd);
  if (!filePath) process.exit(0);

  const cls = classify(filePath);
  if (!cls.relevant) process.exit(0); // Silencioso en archivos no-pago.

  const rawContent = getContent(filePath, toolInput);
  if (!rawContent) process.exit(0);

  // Analizamos el código sin comentarios (evita falsos positivos por tokens
  // citados en documentación); las cadenas string se conservan.
  const content = stripComments(rawContent);

  const warnings = [];
  if (cls.isWebhook) checkWebhook(content, warnings);
  if (cls.isCheckout) checkCheckout(content, warnings);
  checkSecrets(content, warnings);
  checkPiiLogs(content, warnings);

  if (warnings.length > 0) emitWarnings(filePath, warnings);
  process.exit(0);
}

try {
  main();
} catch {
  // Nunca crashear: un fallo del hook no debe romper la sesión.
  process.exit(0);
}

# Chapa Monedero — Landing + Pasarela de pagos

Landing page de marketing para **Chapa Monedero** — una cerradura mecánica de
cobro a moneda que se instala en la puerta del baño de un negocio para recaudar
por su uso. La landing vende el **producto físico** (precio fijo por unidad +
cantidad) con checkout integrado en **Mercado Pago** (cubre México 🇲🇽 y
Colombia 🇨🇴 con métodos locales: tarjeta, OXXO, SPEI, PSE, Nequi).

Stack: **Next.js 14 (App Router) + TypeScript**.

---

## 1. Requisitos

- Node.js ≥ 18
- Una cuenta de Mercado Pago (MX o CO) con credenciales de la app:
  https://www.mercadopago.com.mx/developers/panel

## 2. Configuración

```bash
cp .env.example .env.local
```

Rellena en `.env.local`:

| Variable | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Access token **privado** (servidor). `TEST-...` para sandbox, `APP_USR-...` para producción. |
| `MP_WEBHOOK_SECRET` | Clave secreta del webhook (Panel → Webhooks → "clave secreta"). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio. En local, usa un túnel (ngrok) para que el webhook llegue. |

> ⚠️ Nunca subas `.env.local` al repositorio. Ya está en `.gitignore`.

## 3. Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
```

Para probar el webhook en local necesitas exponer tu puerto:

```bash
npx ngrok http 3000
# pon la URL https de ngrok en NEXT_PUBLIC_SITE_URL y en el panel de webhooks de MP
```

## 4. Producción

```bash
npm run build
npm start
```

Recomendado: desplegar en **Vercel** (define las 3 variables de entorno en el
panel del proyecto). Configura la `notification_url` del webhook en el panel de
Mercado Pago apuntando a `https://TU-DOMINIO/api/webhooks/mercadopago`.

---

## Arquitectura

```
app/
├── page.tsx                          Landing (hero, beneficios, cómo funciona, compra)
├── components/CompraForm.tsx         Formulario de compra (cliente)
├── compra/{exito,pendiente,error}/   Páginas de retorno tras el pago
└── api/
    ├── checkout/route.ts             Crea la preferencia de pago → init_point
    └── webhooks/mercadopago/route.ts Recibe notificaciones (firma verificada)
lib/mercadopago.ts                    Cliente MP + producto, precios y límites
```

### Flujo de pago

1. El usuario elige país, cantidad y correo en `CompraForm`.
2. `POST /api/checkout` **toma el precio del servidor** (`PRODUCT_PRICES`, el
   cliente nunca define el precio), valida la cantidad, crea una *preference* de
   Mercado Pago y devuelve el `init_point`.
3. El navegador redirige al checkout de Mercado Pago.
4. Tras pagar, MP redirige a `/compra/exito|pendiente|error`.
5. MP llama a `POST /api/webhooks/mercadopago` → se **verifica la firma HMAC**,
   se consulta el pago real a la API y, si está `approved`, se confirma el pedido.

## Seguridad (reglas PagoKit aplicadas)

- ✅ **Webhook con firma verificada** (HMAC-SHA256 del header `x-signature`, comparación en tiempo constante).
- ✅ **Raw body**: el webhook lee el cuerpo crudo antes de parsear.
- ✅ **Sin claves hardcodeadas**: todo vive en variables de entorno.
- ✅ **Idempotencia**: guarda contra notificaciones duplicadas.
- ✅ **Sin PII en logs**: no se registran correos ni datos del pagador.
- ✅ **Precio de confianza en servidor**: el precio unitario lo fija el backend.

## Pendientes antes de producción (TODO)

- [ ] Reemplazar la idempotencia **en memoria** (`Set`) del webhook por una tabla
      en BD con `UNIQUE(payment_id)` — sobrevive reinicios y multi-instancia.
- [ ] Persistir cada pedido (con `external_reference`) **antes** de redirigir, y
      marcarlo como pagado de forma transaccional cuando el pago sea `approved`.
- [ ] Capturar la dirección de envío del comprador y disparar el flujo de envío.
- [ ] Revisar `npm audit` y actualizar dependencias con vulnerabilidades.

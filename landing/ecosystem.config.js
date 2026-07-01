// Configuración de PM2 para servir la landing de Chapa Monedero en el VPS.
//
// Arranque:      pm2 start ecosystem.config.js && pm2 save
// Recarga:       pm2 reload ecosystem.config.js --update-env
// Ver logs:      pm2 logs chapamonedero
// Al reiniciar el VPS:  pm2 startup   (ejecuta la línea que imprime, una vez)
//
// Notas:
// - `npm start` corre `next start`, que sirve el build de producción desde
//   `.next-build` (ver "start" en package.json → NEXT_DIST_DIR=.next-build).
// - Las variables MP (MP_ACCESS_TOKEN_*, MP_WEBHOOK_SECRET_*) y NEXT_PUBLIC_SITE_URL
//   NO van aquí: Next.js las lee de `landing/.env.local` en runtime. Mantén ese
//   archivo en el VPS (fuera de git) con las credenciales de PRODUCCIÓN.
// - ⚠️ instances:1 + fork a propósito: la idempotencia del webhook es un Set en
//   memoria; en modo cluster (varias instancias) se romperían los duplicados.
//   No subas a cluster hasta mover la idempotencia a una BD (UNIQUE(country,payment_id)).

module.exports = {
  apps: [
    {
      name: "chapamonedero",
      cwd: "/var/www/chapamonedero/landing", // ajusta si tu ruta es otra
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000", // debe coincidir con el proxy_pass de Nginx
      },
    },
  ],
};

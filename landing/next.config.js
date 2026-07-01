/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El dev server usa `.next` (por defecto). El build de verificación/producción
  // usa `.next-build` (vía NEXT_DIST_DIR en package.json) para NO pisar el cache
  // del dev server mientras corre — evita "Cannot find module './<chunk>.js'".
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

module.exports = nextConfig;

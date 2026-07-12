/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — 100% compatible con Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;

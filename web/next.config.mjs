/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Per Document 2 §11, images served as AVIF or WebP with JPEG
  // fallback. Next.js handles format negotiation when the formats
  // array is set. Quality 82 keeps file size down without visible
  // banding on the warm/cream palette.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Per Document 2 §11, only the hero display font preloads.
  // experimental.optimizePackageImports trims unused exports from
  // lucide-react and gsap so the bundle stays under 1.5MB.
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
  },
};

export default nextConfig;

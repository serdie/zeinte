import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'biblioteca.ucm.es' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'e7.pngegg.com' },
      { protocol: 'https', hostname: 'cppm.es' },
      { protocol: 'https', hostname: 'larioja.org' },
      { protocol: 'https', hostname: 'www.universidata.es' },
      { protocol: 'https', hostname: 'justicia.fsc.ccoo.es' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'www.diemy.es', pathname: '/wp-content/uploads/**' },
    ],
  },
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
};

export default nextConfig;
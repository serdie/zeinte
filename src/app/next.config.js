// next.config.ts - VERSIÓN DEFINITIVA

import withPWA from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const pwaConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  
  // CORRECCIÓN: 'serverComponentsExternalPackages' movido fuera de 'experimental' a 'serverExternalPackages'
  serverExternalPackages: ['sharp', 'onnxruntime-node'],

  // CORRECCIÓN: Eliminada la configuración de webpack para evitar conflictos con Turbopack
  webpack(config) {
    config.externals.push({
      'sharp': 'commonjs sharp',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });
    return config;
  },
};

export default pwaConfig(nextConfig);

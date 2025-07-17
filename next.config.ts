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
  // CORRECCIÓN 1: Opción de seguridad para el entorno de desarrollo de Firebase Studio
  allowedDevOrigins: ["9000-firebase-studio-1747770902634.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev", "6000-firebase-studio-1747770902634.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev"],

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
      // CORRECCIÓN 2: Typo de 'httpshttps' corregido a 'https'
      { protocol: 'https', hostname: 'larioja.org' },
      { protocol: 'https', hostname: 'www.universidata.es' },
      { protocol: 'https', hostname: 'justicia.fsc.ccoo.es' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'www.diemy.es', pathname: '/wp-content/uploads/**' },
    ],
  },
  
  // CORRECCIÓN 3: 'serverComponentsExternalPackages' se ha movido fuera de 'experimental' y renombrado
  serverExternalPackages: ['sharp', 'onnxruntime-node'],

  webpack(config) {
    config.externals.push({
      'sharp': 'commonjs sharp',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });
    return config;
  },
};

// CORRECCIÓN 4: Usamos la sintaxis correcta para envolver la configuración
export default pwaConfig(nextConfig);
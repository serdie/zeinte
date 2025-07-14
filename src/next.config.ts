
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'biblioteca.ucm.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'e7.pngegg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cppm.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'larioja.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.universidata.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'justicia.fsc.ccoo.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
          protocol: 'https',
          hostname: 'www.diemy.es',
          port: '',
          pathname: '/wp-content/uploads/**',
      },
    ],
  },
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  webpack(config) {
    config.externals.push({
      'sharp': 'commonjs sharp',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    })
    return config
  },
};

export default nextConfig;


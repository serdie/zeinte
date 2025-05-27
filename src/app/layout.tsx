
// "use client"; // Eliminado para permitir la exportación de metadata

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script'; // Import Next.js Script component
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// La exportación de metadata es válida porque este es un Server Component.
export const metadata: Metadata = {
  title: 'Zeinte - Tu Aliado Inteligente para Exámenes',
  description: 'Con Zeinte (antes AdivinaExamen), analiza documentos y predice preguntas de examen con IA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Consider making lang dynamic with i18n if using i18n routing in the future */}
      <head>
        {/*
          IMPORTANTE: Reemplaza "ca-pub-YOUR_ADSENSE_PUBLISHER_ID" con tu ID de editor de AdSense real.
          Este script inicializa AdSense. Debes tener una cuenta de AdSense aprobada.
        */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_PUBLISHER_ID`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          <AuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}

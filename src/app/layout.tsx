
import React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zeinte.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AdivinaExamen - Prepara Exámenes con Inteligencia Artificial',
    template: '%s - AdivinaExamen',
  },
  description: 'Con AdivinaExamen, analiza temarios, apuntes y exámenes anteriores para predecir preguntas clave con IA. Optimiza tu estudio y aprueba tus oposiciones y exámenes universitarios.',
  keywords: ['preparar exámenes', 'oposiciones', 'IA para estudiar', 'inteligencia artificial', 'predecir preguntas examen', 'aprobar exámenes', 'selectividad', 'MIR', 'universidad', 'herramienta de estudio'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'AdivinaExamen - Tu Aliado Inteligente para Exámenes',
    description: 'Transforma tus apuntes en una ventaja competitiva. Sube tus documentos y deja que nuestra IA te ayude a enfocar tu estudio en lo que de verdad importa.',
    url: APP_URL,
    siteName: 'AdivinaExamen',
    images: [
      {
        url: `${APP_URL}/og-image.png`, // IMPORTANT: Create this image and place it in the /public folder
        width: 1200,
        height: 630,
        alt: 'Estudia de forma inteligente con AdivinaExamen',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdivinaExamen - Prepara Exámenes con IA',
    description: 'Optimiza tu estudio para oposiciones y exámenes universitarios. Sube tus apuntes y deja que la IA prediga las preguntas.',
    // images: [`${APP_URL}/twitter-image.png`], // Optional: a specific image for Twitter
  },
};


const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PAYPAL_CLIENT_ID = "BAAASJSFHovFUl_DSeEP5Nzj6wZc-PyTvey8e7JrWbmrQ-L0yuE1YNQC4EQ7ObltYWufkQUkLmvE_gJX_0";
const ADSENSE_CLIENT_ID = "ca-pub-6929403056848474";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* Google AdSense Meta Tag and Script */}
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID}></meta>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&disable-funding=venmo,paylater&components=hosted-buttons&currency=EUR`}
          strategy="afterInteractive"
        />
        <Script 
          async
          src="https://js.stripe.com/v3/buy-button.js"
          strategy="afterInteractive"
        />
        {/* Mouseflow Tracking Script */}
        <Script
          id="mouseflow"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window._mfq = window._mfq || [];
              (function() {
                var mf = document.createElement("script");
                mf.type = "text/javascript"; mf.defer = true;
                mf.src = "//cdn.mouseflow.com/projects/82d58860-7d51-488e-a4ed-b405840563e4.js";
                document.getElementsByTagName("head")[0].appendChild(mf);
              })();
            `,
          }}
        />
        {/* Crisp Chatbot Script */}
        <Script
          id="crisp-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.$crisp=[];
              window.CRISP_WEBSITE_ID="dcf62e8e-cd57-4a37-b4ec-fafc29ab856f";
              (function(){
                var d=document;
                var s=d.createElement("script");
                s.src="https://client.crisp.chat/l.js";
                s.async=1;
                d.getElementsByTagName("head")[0].appendChild(s);
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

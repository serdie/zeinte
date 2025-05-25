
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext'; // Import I18nProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// La exportación de metadata sigue siendo válida aunque el componente sea "use client"
// Next.js maneja la extracción de metadata de forma separada.
export const metadata: Metadata = {
  title: 'AdivinaExamen', // Este título puede ser genérico, o podrías internacionalizarlo si usas i18n routing
  description: 'Analiza documentos y predice preguntas de examen con IA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Consider making lang dynamic with i18n if using i18n routing */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider> {/* Wrap AuthProvider (and thus everything else) with I18nProvider */}
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

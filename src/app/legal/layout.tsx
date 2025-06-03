
// src/app/legal/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  // El título específico será establecido por cada página legal individualmente
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="py-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold text-primary hover:text-primary/80">
            Zeinte
          </Link>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Volver al Panel
          </Link>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 flex-grow">
        {children}
      </main>
      <footer className="text-center py-6 mt-auto border-t border-border">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Search and Make S.L. (CIF: B45786787) - Zeinte. Todos los derechos reservados.
        </p>
        <div className="mt-2 space-x-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-primary">Aviso Legal y Condiciones de Uso</Link>
          <span>|</span>
          <Link href="/legal/privacy" className="hover:text-primary">Política de Privacidad</Link>
          <span>|</span>
          <Link href="/legal/cookies" className="hover:text-primary">Política de Cookies</Link>
        </div>
      </footer>
    </div>
  );
}

    
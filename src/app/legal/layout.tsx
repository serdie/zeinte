
// src/app/legal/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // El título específico será establecido por cada página legal individualmente
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-8 px-4 flex-grow">
        {children}
      </main>
    </div>
  );
}

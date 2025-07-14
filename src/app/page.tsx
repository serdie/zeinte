
import type { Metadata } from 'next';
import HomePageClient from '@/components/home/HomePageClient';

// SEO Metadata for the Home Page (Server Component)
export const metadata: Metadata = {
  title: 'AdivinaExamen - Prepara Exámenes con Inteligencia Artificial',
  description: 'Con AdivinaExamen, analiza temarios, apuntes y exámenes anteriores para predecir preguntas clave con IA. Optimiza tu estudio y aprueba tus oposiciones y exámenes universitarios.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}

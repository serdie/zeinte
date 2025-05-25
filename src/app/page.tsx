
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { UploadCloud, BrainCircuit, Lightbulb, Sparkles, BookOpenText, Settings, Users, CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: UploadCloud,
    title: "Sube tus Documentos Fácilmente",
    shortText: "Carga exámenes, temarios y apuntes (PDF, DOCX, TXT).",
    longText: "Arrastra y suelta o selecciona archivos desde tu dispositivo. AdivinaExamen procesará múltiples formatos para extraer la información relevante y prepararla para el análisis inteligente."
  },
  {
    icon: BrainCircuit,
    title: "Análisis Profundo con IA",
    shortText: "IA identifica temas clave y patrones de exámenes pasados.",
    longText: "Nuestra inteligencia artificial examina el contenido de tus documentos, identificando temas recurrentes, preguntas frecuentes y la estructura general del curso. Si detecta exámenes anteriores, analiza su metodología y la importancia relativa de los temas."
  },
  {
    icon: Lightbulb,
    title: "Predicción Inteligente de Preguntas",
    shortText: "Genera preguntas tipo test que podrían aparecer en tu examen.",
    longText: "Basándose en el análisis exhaustivo, AdivinaExamen predice posibles preguntas de examen. Estas preguntas están diseñadas para imitar el estilo, la dificultad y el formato de las pruebas reales, dándote una ventaja única."
  },
  {
    icon: Sparkles,
    title: "Explicaciones Claras y Detalladas",
    shortText: "Entiende cada respuesta con explicaciones tipo profesor.",
    longText: "Para cada pregunta predicha, la IA genera una explicación detallada. No solo te dice cuál es la respuesta correcta, sino que razona por qué lo es y por qué las otras opciones son incorrectas, como si tuvieras un tutor personal."
  },
  {
    icon: BookOpenText,
    title: "Interfaz de Estudio Interactiva",
    shortText: "Visualiza preguntas, responde y recibe feedback al instante.",
    longText: "Estudia de manera eficiente con una interfaz diseñada para el aprendizaje. Responde a las preguntas, comprueba tus aciertos y errores, y accede a las explicaciones detalladas para reforzar tu conocimiento."
  },
  {
    icon: Settings,
    title: "Configuración Personalizada",
    shortText: "Adapta la generación de exámenes a tus necesidades.",
    longText: "Ajusta el número de preguntas por defecto que quieres que se generen. Próximamente, podrás configurar otros aspectos como el tipo de examen (test, desarrollo, oral) para una preparación aún más a medida."
  },
  {
    icon: Users,
    title: "Comunidad de Estudio (Simulada)",
    shortText: "Explora foros y aprende de otros (simulación actual).",
    longText: "Accede a nuestra sección de comunidad donde encontrarás foros de discusión simulados con temas relevantes para diversas oposiciones y estudios. En el futuro, podrás interactuar y compartir tus propias experiencias."
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 text-foreground">
      {/* Hero Section */}
      <section className="py-16 md:py-24 text-center bg-card shadow-lg rounded-b-xl mb-12">
        <div className="container mx-auto px-4">
          <BrainCircuit className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
            AdivinaExamen: Tu Aliado Inteligente para Aprobar
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transforma tus apuntes y exámenes pasados en una poderosa herramienta de estudio. Sube tus documentos, y nuestra IA analizará el contenido, predecirá preguntas clave y te ayudará a prepararte como nunca antes.
          </p>
          <Link href="/upload" passHref>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 rounded-lg shadow-md transition-transform duration-150 ease-in-out active:scale-95">
              <UploadCloud className="mr-3 h-6 w-6" />
              Empezar Ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">¿Cómo te ayuda AdivinaExamen?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className="h-10 w-10 text-primary" />
                  <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground h-12">{feature.shortText}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`item-${index}`} className="border-t pt-2">
                    <AccordionTrigger className="text-sm text-accent hover:text-accent/80 py-2">
                      Saber más...
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-foreground/80 pt-2">
                      {feature.longText}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-muted/50 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">Simple, Rápido y Efectivo</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Sube tus Archivos</h3>
              <p className="text-muted-foreground text-sm">PDFs, DOCXs, TXTs... todo tu material de estudio es bienvenido.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Análisis IA</h3>
              <p className="text-muted-foreground text-sm">Dejamos que nuestra IA identifique lo crucial y prediga preguntas.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="p-4 bg-primary text-primary-foreground rounded-full inline-block mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Estudia y Aprueba</h3>
              <p className="text-muted-foreground text-sm">Practica con preguntas tipo test y explicaciones detalladas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 text-center container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-foreground">¿Listo para Revolucionar tu Estudio?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Deja de adivinar y empieza a prepararte con la inteligencia artificial de AdivinaExamen.
        </p>
        <Link href="/upload" passHref>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-7 rounded-lg shadow-lg transition-transform duration-150 ease-in-out active:scale-95">
            <Sparkles className="mr-3 h-7 w-7" />
            ¡Probar Ahora!
          </Button>
        </Link>
      </section>

       {/* Placeholder for Testimonials or Use Cases - future enhancement */}
      <section className="py-12 container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8 text-foreground opacity-50">Próximamente: Casos de Éxito y Testimonios</h2>
        <div className="flex justify-center items-center">
            <Image 
                src="https://placehold.co/600x300.png" 
                alt="Próximamente testimonios" 
                width={600} 
                height={300} 
                className="rounded-lg opacity-60 shadow-md"
                data-ai-hint="students celebrating graduation"
            />
        </div>
      </section>
    </div>
  );
}

<div align="center">

# 🎓 Zeinte

### Plataforma de Estudio Inteligente con IA para Oposiciones y Exámenes

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Genkit AI](https://img.shields.io/badge/Genkit-1.8-orange?style=for-the-badge&logo=google)](https://genkit.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.12-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

<p>
  <strong>Sube tus documentos y la IA predice las preguntas del examen</strong>
</p>

<p>
  <a href="#-características">Características</a> ·
  <a href="#-stack-tecnológico">Stack</a> ·
  <a href="#-arquitectura">Arquitectura</a> ·
  <a href="#-instalación">Instalación</a> ·
  <a href="#-licencia">Licencia</a>
</p>

</div>

---

## 📖 Sobre Zeinte

**Zeinte** es una aplicación web construida con Next.js e IA generativa (Google Gemini 3.5 Flash) que revoluciona la forma de prepararse para oposiciones y exámenes. Los usuarios suben sus documentos (temarios, exámenes anteriores, apuntes) y la IA:

1. **Analiza** el contenido para identificar temas recurrentes y patrones de examen
2. **Predice** las preguntas más probables con opciones múltiples
3. **Explica** cada respuesta con el razonamiento de un profesor experto
4. **Sugiere** documentos adicionales relevantes al tema de estudio

> 💡 **Ideado y desarrollado por [Diego Gómez Marín](https://github.com/serdie)**

---

## ✨ Características

### 🧠 IA Aplicada al Estudio

| Función | Descripción |
|---------|-------------|
| **Análisis de Documentos** | La IA procesa PDFs, DOCX, imágenes y texto para extraer temas clave, preguntas frecuentes y patrones de examen |
| **Predicción de Preguntas** | Genera preguntas de opción múltiple basadas en la frecuencia e importancia de los temas detectados |
| **Explicaciones IA** | Cada pregunta incluye una explicación detallada generada por IA, como un profesor particular |
| **Sugerencias de Documentos** | La IA recomienda documentos y temarios relevantes según el tema de estudio del usuario |
| **Generación de Resúmenes** | Crea resúmenes estructurados con introducción, puntos clave, secciones detalladas y conclusión |
| **Cursos Personalizados** | Genera temarios completos y contenido modular para cursos a medida con IA |

### 🎨 Interfaz y Experiencia

- **Diseño responsive** — Optimizado para móvil, tablet y escritorio
- **Modo claro/oscuro** — Tema adaptativo con `next-themes`
- **Bilingüe** — Soporte completo para Español e Inglés con sistema i18n
- **Cámara integrada** — Escanea documentos físicos desde el móvil
- **Biblioteca de exámenes** — Plantillas de oposiciones comunes (Agente Forestal, Bibliotecas, Administración del Estado, etc.)
- **Historial completo** — Guarda exámenes, cursos y resúmenes generados

### 🔧 Funcionalidades Técnicas

- **Autenticación Firebase** — Login con email/contraseña y Google
- **Tiers de usuario** — Plan Free (con límites) y Pro (con beneficios)
- **Panel de administración** — Gestión de usuarios, configuración IA, moderación de comunidad
- **Pasarela de pago** — Integración con PayPal y Stripe
- **Comunidad** — Foro de usuarios con temas y mensajes
- **Analytics** — Google Analytics y Google AdSense integrados
- **Soporte** — Chat con Crisp integrado

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Next.js** | 15.1 | Framework React con App Router |
| **React** | 19.0 | Librería UI |
| **TypeScript** | 5.7 | Tipado estático |
| **Tailwind CSS** | 3.4 | Estilos utility-first |
| **Radix UI / shadcn** | - | Componentes accesibles |
| **Recharts** | 2.15 | Gráficos y visualizaciones |
| **Lucide Icons** | 0.475 | Iconografía |

### IA y Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Genkit** | 1.8 | Framework de IA de Google |
| **Google Gemini** | 3.5 Flash | Modelo de lenguaje generativo |
| **Firebase Auth** | 10.12 | Autenticación de usuarios |
| **Firestore** | 10.12 | Base de datos NoSQL |
| **Zod** | 3.25 | Validación de esquemas |

### Herramientas

| Herramienta | Uso |
|------------|-----|
| **pnpm** | Gestor de paquetes |
| **ESLint** | Linter de código |
| **PostCSS** | Procesamiento CSS |
| **Vercel** | Despliegue (recomendado) |

---

## 🏗️ Arquitectura

```
zeinte/
├── src/
│   ├── ai/                    # Flujos de IA con Genkit
│   │   ├── genkit.ts          # Configuración del cliente IA
│   │   └── flows/             # 7 flujos de IA
│   │       ├── analyze-documents.ts          # Análisis de documentos
│   │       ├── predict-exam-questions.ts     # Predicción de preguntas
│   │       ├── find-external-documents.ts    # Sugerencias de documentos
│   │       ├── extract-text-from-file-flow.ts # Extracción de texto (OCR)
│   │       ├── generate-ai-explanations.ts   # Explicaciones IA
│   │       ├── generate-summary.ts           # Generación de resúmenes
│   │       └── generate-custom-course-syllabus.ts # Cursos personalizados
│   │
│   ├── app/                   # Páginas Next.js (App Router)
│   │   ├── page.tsx           # Landing page
│   │   ├── upload/            # Subir documentos y generar examen
│   │   ├── exam/result/       # Sesión de estudio con preguntas
│   │   ├── summarize/         # Generar resúmenes
│   │   ├── custom-courses/    # Crear cursos con IA
│   │   ├── dashboard/         # Panel de estudio
│   │   ├── history/           # Historial de exámenes/cursos/resúmenes
│   │   ├── community/         # Foro de la comunidad
│   │   ├── admin/             # Panel de administración
│   │   ├── pricing/           # Planes de suscripción
│   │   ├── profile/           # Perfil de usuario
│   │   └── legal/             # Términos, privacidad, cookies
│   │
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Componentes del dashboard
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── ads/               # Unidades de AdSense
│   │   └── layout/            # Layout y navegación
│   │
│   ├── contexts/              # Contextos React
│   │   ├── AuthContext.tsx    # Autenticación y tiers
│   │   └── I18nContext.tsx    # Internacionalización
│   │
│   ├── firebase/              # Configuración Firebase
│   ├── locales/               # Traducciones (es.json, en.json)
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilidades
│   └── types/                 # Tipos TypeScript
│
├── docs/                      # Documentación de diseño
├── public/                    # Assets estáticos
└── next.config.ts             # Configuración Next.js
```

### Flujos de IA

```
Usuario sube documento
        │
        ▼
┌─────────────────────┐
│  extractTextFromFile │  ← OCR + extracción de PDF/DOCX/imagen
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   analyzeDocuments   │  ← Identifica temas, patrones, preguntas frecuentes
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ predictExamQuestions │  ← Genera preguntas de opción múltiple
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ generateAIExplanation│  ← Explica cada respuesta detalladamente
└─────────────────────┘
```

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 18+
- **pnpm** (`npm install -g pnpm`)
- **API Key de Google Gemini** ([Obtener aquí](https://aistudio.google.com/apikeys))
- **Proyecto de Firebase** ([Crear aquí](https://console.firebase.google.com))

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/serdie/zeinte.git
cd zeinte

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves:
#   - GOOGLE_GENAI_API_KEY  (Google Gemini API)
#   - NEXT_PUBLIC_FIREBASE_* (Firebase config)
#   - NEXT_PUBLIC_GEMINI_API_KEY (Google Gemini API - pública)

# 4. Ejecutar en desarrollo
pnpm dev

# 5. Abrir http://localhost:3000
```

### Variables de Entorno

```env
# IA - Google Gemini
GOOGLE_GENAI_API_KEY="tu-api-key"
GEMINI_API_KEY="tu-api-key"
NEXT_PUBLIC_GEMINI_API_KEY="tu-api-key"

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."

# Opcional
NEXT_PUBLIC_APP_URL="https://zeinte.com"
NEXT_PUBLIC_GA_MEASUREMENT_ID="..."
NEXT_PUBLIC_ADSENSE_CLIENT_ID="..."
```

### Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # ESLint
pnpm typecheck    # Verificación de tipos
pnpm genkit:dev   # Servidor de Genkit
pnpm genkit:watch # Genkit con watch mode
```

---

## 📦 Despliegue

### Vercel (Recomendado)

1. Conectar el repositorio en [Vercel](https://vercel.com)
2. Configurar las variables de entorno
3. Deploy automático en cada push

### Manual

```bash
pnpm build
pnpm start
```

---

## 📄 Licencia

Este proyecto es propiedad de **Diego Gómez Marín**. Todos los derechos reservados.

---

<div align="center">

### 👨‍💻 Desarrollador

**Diego Gómez Marín**

[![GitHub](https://img.shields.io/badge/GitHub-serdie-181717?style=for-the-badge&logo=github)](https://github.com/serdie)
[![Web](https://img.shields.io/badge/Web-draiton.es-0066CC?style=for-the-badge&logo=google-chrome)](https://draiton.es)

<p>Hecho con ❤️ y mucha ☕ en España</p>

</div>

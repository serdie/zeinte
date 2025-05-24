
// src/lib/mockCommunityData.ts

export interface MockUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface MockPost {
  id: string;
  userId: string;
  timestamp: string;
  content: string;
  likes: number;
}

export interface MockForumTopic {
  id: string;
  title: string;
  description: string;
  postCount: number;
  views: number;
  lastActivity: string;
  posts: MockPost[];
  authorId: string; // ID del creador del tema
}

const users: MockUser[] = [
  { id: "user1", name: "Estudiante_Opositor", avatarUrl: "https://placehold.co/40x40.png?text=EO" },
  { id: "user2", name: "Profe_Ayuda", avatarUrl: "https://placehold.co/40x40.png?text=PA" },
  { id: "user3", name: "Ana_Selectividad", avatarUrl: "https://placehold.co/40x40.png?text=AS" },
  { id: "user4", name: "Carlos_Forestal", avatarUrl: "https://placehold.co/40x40.png?text=CF" },
  { id: "user5", name: "Laura_TestMaster", avatarUrl: "https://placehold.co/40x40.png?text=LT" },
  { id: "user6", name: "David_Quimica", avatarUrl: "https://placehold.co/40x40.png?text=DQ" },
  { id: "user7", name: "Sofia_Medicina", avatarUrl: "https://placehold.co/40x40.png?text=SM" },
  { id: "user8", name: "Marcos_Programador", avatarUrl: "https://placehold.co/40x40.png?text=MP" },
];

export const mockForumTopics: MockForumTopic[] = [
  {
    id: "topic1",
    title: "Oposiciones Agente Forestal - Dudas Temario Específico",
    description: "Discusión sobre los temas más complejos de la oposición para Agente Forestal. Compartamos apuntes y estrategias.",
    postCount: 5,
    views: 125,
    lastActivity: "Hace 2 horas",
    authorId: "user4",
    posts: [
      { id: "post1-1", userId: "user4", timestamp: "Hace 5 horas", content: "¿Alguien tiene buenos resúmenes sobre la Ley de Montes actualizada? Me está costando mucho.", likes: 15 },
      { id: "post1-2", userId: "user2", timestamp: "Hace 4 horas", content: "¡Hola Carlos! Te recomiendo mirar el BOE directamente y hacer esquemas. También hay academias online que ofrecen temarios actualizados. Si quieres, puedo pasarte un esquema general que tengo.", likes: 22 },
      { id: "post1-3", userId: "user1", timestamp: "Hace 3 horas", content: "Yo estoy igual con la parte de fauna y flora, ¡es interminable! ¿Algún truco para memorizar nombres científicos?", likes: 8 },
      { id: "post1-4", userId: "user4", timestamp: "Hace 2 horas", content: "Gracias Profe_Ayuda, ¡ese esquema me vendría genial! Para los nombres científicos, estoy usando tarjetas de memoria (flashcards) y apps tipo Anki.", likes: 12 },
      { id: "post1-5", userId: "user2", timestamp: "Hace 1 hora", content: "De nada Carlos. Para los nombres científicos, Anki es una excelente herramienta. La repetición espaciada funciona muy bien. ¡Ánimo a todos!", likes: 10 },
    ],
  },
  {
    id: "topic2",
    title: "Mejores Técnicas para Exámenes Tipo Test (Selectividad/Oposiciones)",
    description: "Compartamos estrategias para maximizar la puntuación en exámenes tipo test. ¿Cómo gestionáis el tiempo? ¿Descartáis opciones?",
    postCount: 4,
    views: 250,
    lastActivity: "Hace 1 día",
    authorId: "user5",
    posts: [
      { id: "post2-1", userId: "user5", timestamp: "Hace 1 día", content: "Hola a todos, estoy preparando unas oposiciones con mucho tipo test y me gustaría saber qué técnicas usáis. Yo suelo leer todas las preguntas primero y luego empiezo por las que sé seguro.", likes: 30 },
      { id: "post2-2", userId: "user3", timestamp: "Hace 20 horas", content: "¡Buena idea Laura! Yo intento descartar primero las opciones que son claramente incorrectas. Y si dudo entre dos, a veces me la juego si no restan mucho los errores.", likes: 18 },
      { id: "post2-3", userId: "user1", timestamp: "Hace 15 horas", content: "Importante controlar el tiempo por pregunta. Si una se atasca, mejor pasar a la siguiente y volver después si sobra tiempo.", likes: 25 },
      { id: "post2-4", userId: "user2", timestamp: "Hace 10 horas", content: "Exacto. Y si los errores penalizan, hay que ser más conservador. Siempre es bueno hacer simulacros con las mismas condiciones de tiempo del examen real.", likes: 20 },
    ],
  },
  {
    id: "topic3",
    title: "Recursos y Consejos para el Examen de Historia de España (Selectividad EVAU/EBAU)",
    description: "Todo sobre el examen de Historia de España: temas importantes, cómo estructurar respuestas, comentarios de texto, etc.",
    postCount: 3,
    views: 98,
    lastActivity: "Hace 3 días",
    authorId: "user3",
    posts: [
      { id: "post3-1", userId: "user3", timestamp: "Hace 3 días", content: "¡Hola! Estoy un poco perdida con Historia para la Selectividad. ¿Qué temas creéis que son imprescindibles este año? ¿Y cómo enfocar los comentarios de texto históricos?", likes: 12 },
      { id: "post3-2", userId: "user2", timestamp: "Hace 2 días", content: "Ana, te sugiero centrarte en los bloques del siglo XIX y XX, suelen ser los más preguntados. Para los comentarios, sigue una estructura clara: clasificación, análisis, contexto y conclusiones. Hay muchas guías online.", likes: 20 },
      { id: "post3-3", userId: "user1", timestamp: "Hace 1 día", content: "Yo estoy haciendo muchos ejes cronológicos para tener una visión global. Y practicar con exámenes de años anteriores me está ayudando a ver qué tipo de preguntas ponen.", likes: 15 },
    ],
  },
  {
    id: "topic4",
    title: "Química Nivel Bachillerato - ¿Cómo resolver problemas de estequiometría?",
    description: "Foro para ayudarnos con los problemas de química, especialmente los de estequiometría que suelen ser un hueso duro.",
    postCount: 4,
    views: 75,
    lastActivity: "Hace 5 horas",
    authorId: "user6",
    posts: [
      { id: "post4-1", userId: "user6", timestamp: "Hace 1 día", content: "Buenas, la estequiometría se me atraviesa. ¿Algún consejo para plantear bien los problemas y no liarme con los moles y las masas?", likes: 9 },
      { id: "post4-2", userId: "user2", timestamp: "Hace 20 horas", content: "Hola David. Lo fundamental es tener muy claros los conceptos de mol, masa molar y ajustar bien las reacciones. Siempre escribe la reacción ajustada primero y luego trabaja con factores de conversión. ¡La práctica es clave!", likes: 14 },
      { id: "post4-3", userId: "user7", timestamp: "Hace 10 horas", content: "A mí me ayuda mucho hacer una tabla con las cantidades iniciales, lo que reacciona y lo final. Visualizarlo así me aclara las ideas.", likes: 7 },
      { id: "post4-4", userId: "user6", timestamp: "Hace 5 horas", content: "¡Gracias por los consejos! Voy a probar lo de la tabla y a practicar más con factores de conversión. Ajustar reacciones es mi primer paso siempre.", likes: 5 },
    ],
  },
   {
    id: "topic5",
    title: "Preparación Examen MIR - Organización del estudio y recursos",
    description: "Un espacio para futuros médicos que estén preparando el MIR. ¿Cómo os organizáis? ¿Qué manuales o plataformas recomendáis?",
    postCount: 3,
    views: 150,
    lastActivity: "Hace 8 horas",
    authorId: "user7",
    posts: [
      { id: "post5-1", userId: "user7", timestamp: "Hace 2 días", content: "¡Hola compis! Empezando la preparación para el MIR y un poco abrumada. ¿Algún consejo sobre cómo planificar el estudio a largo plazo? ¿Usáis alguna app de seguimiento?", likes: 25 },
      { id: "post5-2", userId: "user2", timestamp: "Hace 1 día", content: "¡Mucho ánimo Sofía! El MIR es una maratón. Es crucial un buen calendario, dividir el temario por bloques y hacer muchas preguntas test desde el principio. Hay academias con plataformas muy completas.", likes: 18 },
      { id: "post5-3", userId: "user1", timestamp: "Hace 8 horas", content: "Yo estoy usando los manuales de una academia conocida y su banco de preguntas. Y para la organización, Google Calendar y mucho café. ¡Importante también reservar tiempo para descansar!", likes: 22 },
    ],
  },
  {
    id: "topic6",
    title: "Desarrollo de Aplicaciones Web - Dudas sobre React y Next.js",
    description: "Foro para programadores que estén aprendiendo o trabajando con React y Next.js. Compartamos problemas y soluciones.",
    postCount: 4,
    views: 110,
    lastActivity: "Hace 6 horas",
    authorId: "user8",
    posts: [
      { id: "post6-1", userId: "user8", timestamp: "Hace 1 día", content: "Hola! Estoy teniendo problemas con el manejo del estado global en una aplicación Next.js con componentes de servidor y cliente. ¿Alguna recomendación sobre Context API vs Zustand/Redux para estos casos?", likes: 17 },
      { id: "post6-2", userId: "user2", timestamp: "Hace 18 horas", content: "Buena pregunta, Marcos. Para Next.js App Router, Zustand suele ser una opción ligera y eficiente. Context API es bueno para estados más simples y localizados. Redux puede ser un poco overkill si no es una app muy grande.", likes: 24 },
      { id: "post6-3", userId: "user5", timestamp: "Hace 12 horas", content: "Yo he usado Zustand en varios proyectos Next.js y me ha ido muy bien. La sintaxis es sencilla y se integra bien con el flujo de React.", likes: 15 },
      { id: "post6-4", userId: "user8", timestamp: "Hace 6 horas", content: "Gracias por las respuestas! Voy a investigar más sobre Zustand. Parece una buena alternativa.", likes: 10 },
    ],
  }
];

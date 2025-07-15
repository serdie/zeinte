
// src/lib/firestoreSeedData.ts
import type { Firestore } from 'firebase/firestore';
import { collection, doc, writeBatch, Timestamp, getDocs, query, limit } from 'firebase/firestore';

// --- IMPORTANT: REPLACE THESE PLACEHOLDERS WITH ACTUAL UIDs ---
// You can get these UIDs after your test users have logged in at least once,
// or by looking them up in the Firebase Console (Authentication -> Users tab).
const ADMIN_UID_PLACEHOLDER = 'NidzDymkvMS1OGJIvLVnCkCUAPA3'; // For serdiegm@gmail.com
const FREE_USER_UID_PLACEHOLDER = 'nBLucmABJ3RpUsdROuiASLowkXF2'; // For dginteligenciaartificial@gmail.com
const PRO_USER_UID_PLACEHOLDER = 'vNZkFqc4TqU7bqhz7q57RMtNLcx1'; // For prueba@prueba.com
// --- END OF UID PLACEHOLDERS ---

interface SeedUserUids {
  admin: string;
  free: string;
  pro: string;
}

const initialTopics = [
  {
    id: 'topic_oposiciones_forestal',
    title: 'Oposiciones Agente Forestal - Dudas Temario Específico (Seed)',
    description: 'Discusión sobre los temas más complejos de la oposición para Agente Forestal. Compartamos apuntes y estrategias. (Datos de prueba)',
    authorIdKey: 'admin', // Key to look up in userUids
    postCount: 3,
    views: 125,
  },
  {
    id: 'topic_tecnicas_test',
    title: 'Mejores Técnicas para Exámenes Tipo Test (Seed)',
    description: 'Compartamos estrategias para maximizar la puntuación en exámenes tipo test. ¿Cómo gestionáis el tiempo? (Datos de prueba)',
    authorIdKey: 'pro',
    postCount: 2,
    views: 250,
  },
  {
    id: 'topic_historia_selectividad',
    title: 'Recursos Historia de España Selectividad (Seed)',
    description: 'Todo sobre el examen de Historia de España: temas importantes, cómo estructurar respuestas. (Datos de prueba)',
    authorIdKey: 'free',
    postCount: 1,
    views: 98,
  },
];

const initialPosts = [
  // Posts for topic_oposiciones_forestal
  {
    topicId: 'topic_oposiciones_forestal',
    userIdKey: 'admin',
    content: '¿Alguien tiene buenos resúmenes sobre la Ley de Montes actualizada? Me está costando mucho. (Seed Post)',
    likes: 15,
  },
  {
    topicId: 'topic_oposiciones_forestal',
    userIdKey: 'pro',
    content: '¡Hola! Te recomiendo mirar el BOE directamente y hacer esquemas. También hay academias online que ofrecen temarios actualizados. (Seed Post)',
    likes: 22,
  },
  {
    topicId: 'topic_oposiciones_forestal',
    userIdKey: 'free',
    content: 'Yo estoy igual con la parte de fauna y flora, ¡es interminable! ¿Algún truco para memorizar nombres científicos? (Seed Post)',
    likes: 8,
  },
  // Posts for topic_tecnicas_test
  {
    topicId: 'topic_tecnicas_test',
    userIdKey: 'pro',
    content: 'Hola a todos, estoy preparando unas oposiciones con mucho tipo test y me gustaría saber qué técnicas usáis. (Seed Post)',
    likes: 30,
  },
  {
    topicId: 'topic_tecnicas_test',
    userIdKey: 'admin',
    content: 'Importante controlar el tiempo por pregunta. Si una se atasca, mejor pasar a la siguiente y volver después si sobra tiempo. (Seed Post)',
    likes: 25,
  },
  // Posts for topic_historia_selectividad
  {
    topicId: 'topic_historia_selectividad',
    userIdKey: 'free',
    content: '¡Hola! Estoy un poco perdida con Historia para la Selectividad. ¿Qué temas creéis que son imprescindibles este año? (Seed Post)',
    likes: 12,
  },
];

export async function seedInitialForumData(db: Firestore, userUids: SeedUserUids): Promise<string> {
  if (
    userUids.admin === ADMIN_UID_PLACEHOLDER ||
    userUids.free === FREE_USER_UID_PLACEHOLDER ||
    userUids.pro === PRO_USER_UID_PLACEHOLDER
  ) {
    return 'Error: Debes reemplazar los UIDs placeholder en firestoreSeedData.ts y en el componente que lo llama antes de sembrar los datos.';
  }

  const topicsCollectionRef = collection(db, 'forumTopics');
  // Check if data might have been seeded by checking for the first topic
  const checkQuery = query(topicsCollectionRef, limit(1));
  try {
    const querySnapshot = await getDocs(checkQuery);
    if (!querySnapshot.empty) {
        // Check if one of our specific seed topics exists
        const firstSeedTopicId = initialTopics[0].id;
        const firstTopicDocRef = doc(db, "forumTopics", firstSeedTopicId);
        const firstTopicSnap = await getDoc(firstTopicDocRef);

        if (firstTopicSnap.exists()) {
             return 'Los datos del foro parecen haber sido sembrados ya. Omitiendo.';
        }
    }
  } catch (error) {
    console.error('Error checking if data is seeded:', error);
    return 'Error comprobando datos existentes. Siembra abortada.';
  }

  const batch = writeBatch(db);
  const now = Timestamp.now();

  initialTopics.forEach((topicData) => {
    const topicRef = doc(db, 'forumTopics', topicData.id);
    const authorUid = userUids[topicData.authorIdKey as keyof SeedUserUids];
    batch.set(topicRef, {
      title: topicData.title,
      description: topicData.description,
      authorId: authorUid, // Use actual UID
      createdAt: now,
      lastActivity: now, // Initialize lastActivity to createdAt
      postCount: topicData.postCount,
      views: topicData.views,
    });
  });

  initialPosts.forEach((postData, index) => {
    // We use collection().doc() to generate a new unique ID for each post
    const postRef = doc(collection(db, "forumPosts"));
    const userUid = userUids[postData.userIdKey as keyof SeedUserUids];
    batch.set(postRef, {
      topicId: postData.topicId,
      userId: userUid, // Use actual UID
      content: postData.content,
      timestamp: now,
      likes: postData.likes,
    });
  });

  try {
    await batch.commit();
    return 'Datos iniciales del foro sembrados exitosamente en Firestore.';
  } catch (error) {
    console.error('Error seeding data to Firestore:', error);
    return `Error sembrando datos: ${(error as Error).message}`;
  }
}

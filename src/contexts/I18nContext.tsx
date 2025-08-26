
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Define tus idiomas soportados
export type Language = 'es' | 'en';
const SUPPORTED_LANGUAGES: Language[] = ['es', 'en'];
const DEFAULT_LANGUAGE: Language = 'es';

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper para obtener traducciones anidadas
const getNestedTranslation = (obj: Translations, path: string): string | undefined => {
  const keys = path.split('.');
  let current: string | Translations | undefined = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !current.hasOwnProperty(key)) {
      return undefined;
    }
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
};


export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial del idioma desde localStorage
  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    const initialLang = storedLang && SUPPORTED_LANGUAGES.includes(storedLang) ? storedLang : DEFAULT_LANGUAGE;
    setLanguageState(initialLang);
  }, []);

  // Efecto para cargar el archivo de traducciones cuando el idioma cambia
  useEffect(() => {
    let isMounted = true;
    
    const loadTranslations = async () => {
        setIsLoading(true);
        try {
            const module = await import(`@/locales/${language}.json`);
            if (isMounted) {
                setTranslations(module.default);
            }
        } catch (error) {
            console.error(`Failed to load translations for ${language}:`, error);
            // Si falla la carga del idioma seleccionado, intenta cargar el idioma por defecto
            if (language !== DEFAULT_LANGUAGE) {
                try {
                    const fallbackModule = await import(`@/locales/${DEFAULT_LANGUAGE}.json`);
                    if (isMounted) {
                        setTranslations(fallbackModule.default);
                    }
                } catch (fallbackError) {
                    console.error(`Failed to load default translations:`, fallbackError);
                    if (isMounted) {
                        setTranslations({}); // Dejar vacío si ni el por defecto carga
                    }
                }
            } else if (isMounted) {
                 setTranslations({});
            }
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };
    
    loadTranslations();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('appLanguage', lang);
    } else {
      console.warn(`Unsupported language: ${lang}`);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // No intentes traducir si las traducciones no están cargadas
    if (isLoading || !Object.keys(translations).length) {
      return ''; // Devuelve una cadena vacía o un placeholder de carga
    }
    
    let translation = getNestedTranslation(translations, key);

    if (translation === undefined) {
      console.warn(`Missing translation for key: "${key}" in language: "${language}"`);
      return key; // Fallback a la clave si no se encuentra
    }

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        translation = translation!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
      });
    }
    return translation!;
  }, [translations, language, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

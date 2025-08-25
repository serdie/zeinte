
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
  translations: Translations;
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

  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    const initialLang = storedLang && SUPPORTED_LANGUAGES.includes(storedLang) ? storedLang : DEFAULT_LANGUAGE;
    setLanguageState(initialLang);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    import(`@/locales/${language}.json`)
      .then((module) => {
        if (isMounted) {
          setTranslations(module.default);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error(`Failed to load translations for ${language}:`, error);
        if (isMounted) {
          if (language !== DEFAULT_LANGUAGE) {
            import(`@/locales/${DEFAULT_LANGUAGE}.json`).then(module => {
              if (isMounted) setTranslations(module.default);
            });
          }
          setIsLoading(false);
        }
      });
    
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
    let translation = getNestedTranslation(translations, key);

    if (translation === undefined) {
      if (!isLoading) {
        console.warn(`Missing translation for key: "${key}" in language: "${language}"`);
      }
      return key; // Fallback to key if not found or while loading
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
    <I18nContext.Provider value={{ language, setLanguage, t, translations }}>
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

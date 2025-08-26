
"use client";

import { useI18n, type Language } from '@/contexts/I18nContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const isMobile = useIsMobile();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

  if (isMobile) {
    return (
       <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-auto h-9 text-xs p-2 gap-1 border-none bg-transparent shadow-none focus:ring-0" aria-label={t('languageSwitcher.selectLanguage')}>
            <Globe className="h-4 w-4 text-muted-foreground" />
            <SelectValue>{language.toUpperCase()}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="es">Español (ES)</SelectItem>
          <SelectItem value="en">English (EN)</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-muted-foreground" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[150px] h-9 text-xs" aria-label={t('languageSwitcher.selectLanguage')}>
          <SelectValue placeholder={t('languageSwitcher.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

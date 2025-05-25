
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

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
  };

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

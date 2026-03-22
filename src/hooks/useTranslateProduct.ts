import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// In-memory cache for translated product names to avoid re-translating
const translationCache = new Map<string, string>();

export function useTranslateProduct() {
  const { lang } = useLanguage();

  const translateText = useCallback(async (text: string): Promise<string> => {
    if (lang === 'en' || !text) return text;
    
    const cacheKey = `${lang}:${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, targetLang: lang },
      });
      if (error) throw error;
      const translated = data?.translated || text;
      translationCache.set(cacheKey, translated);
      return translated;
    } catch {
      return text;
    }
  }, [lang]);

  const useProductName = (name: string) => {
    const [translated, setTranslated] = useState(name);

    useEffect(() => {
      if (lang === 'en') {
        setTranslated(name);
        return;
      }
      const cacheKey = `${lang}:${name}`;
      if (translationCache.has(cacheKey)) {
        setTranslated(translationCache.get(cacheKey)!);
        return;
      }
      let cancelled = false;
      translateText(name).then(t => { if (!cancelled) setTranslated(t); });
      return () => { cancelled = true; };
    }, [name, lang, translateText]);

    return translated;
  };

  return { translateText, useProductName };
}

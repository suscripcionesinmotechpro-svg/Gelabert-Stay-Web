"use client";

import { useTranslation } from 'react-i18next';

export function LanguageInitializer({ lang }: { lang: 'es' | 'en' }) {
  const { i18n } = useTranslation();

  // Switch language immediately during render to prevent hydration mismatch
  if (typeof window === 'undefined') {
    // On the server, configure language instance
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  } else {
    // On the client
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }

  return null;
}

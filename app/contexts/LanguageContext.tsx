// contexts/LanguageContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "mn" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T>(translations: { mn: T; en: T }) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export const LanguageProvider = ({ children, initialLocale }: { children: ReactNode; initialLocale?: Language }) => {
  const [language, setLanguage] = useState<Language>(initialLocale || "mn");

  useEffect(() => {
    const checkNativeLocale = async () => {
      // Only auto-detect if initialLocale wasn't explicitly set via route
      // or if we want to ensure the app matches device language on first load.
      // For now, let's prioritize the route locale (initialLocale).
      if (initialLocale) return;

      if (Capacitor.getPlatform() !== 'web') {
        try {
          const { value } = await Device.getLanguageCode();
          if (value) {
            const isEn = value.toLowerCase().startsWith('en');
            setLanguage(isEn ? 'en' : 'mn');
          }
        } catch (e) {
          console.warn("Could not get native device locale", e);
        }
      }
    };
    checkNativeLocale();
  }, [initialLocale]);

  const t = <T,>(translations: { mn: T; en: T; }): T => {
    return translations[language] || translations.mn || translations.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
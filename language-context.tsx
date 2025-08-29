"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type Language, translations, getTranslation, type TranslationKey } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
  speechLang: string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Speech recognition language codes
  const speechLangMap = {
    en: "en-US",
    hi: "hi-IN",
    ta: "ta-IN",
  }

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("bob-language") as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("bob-language", newLanguage)
  }

  const t = (key: TranslationKey) => getTranslation(language, key)

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
    speechLang: speechLangMap[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

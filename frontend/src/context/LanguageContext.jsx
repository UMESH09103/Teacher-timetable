import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('school_portal_language');
    if (saved === 'en' || saved === 'mr') return saved;
    return 'mr'; // Marathi by default for Maharashtra State Board school
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'mr') {
      setLanguageState(lang);
      localStorage.setItem('school_portal_language', lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'mr' ? 'en' : 'mr');
  };

  /**
   * Bilingual translation helper
   * Usage: t('मराठी मजकूर', 'English Text') or t({ mr: '...', en: '...' })
   */
  const t = (mrText, enText) => {
    if (typeof mrText === 'object' && mrText !== null) {
      return language === 'mr' ? mrText.mr || mrText.en : mrText.en || mrText.mr;
    }
    return language === 'mr' ? mrText : enText ?? mrText;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isMarathi: language === 'mr',
        isEnglish: language === 'en',
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

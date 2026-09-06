import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineLanguage, HiChevronDown } from 'react-icons/hi2';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', locale: 'en-IN' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', locale: 'mr-IN' }
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setIsOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('topbar.selectLanguage', 'Select Language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-2 rounded-xl
          bg-slate-100 dark:bg-slate-800
          hover:bg-slate-200 dark:hover:bg-slate-700
          text-slate-700 dark:text-slate-300
          border border-slate-200/60 dark:border-slate-700/60
          transition-all duration-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <span className="text-base" role="img" aria-label={currentLang.name}>
          {currentLang.flag}
        </span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <HiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Language options"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 py-1.5 z-50
              bg-white dark:bg-slate-800
              border border-slate-200/80 dark:border-slate-700/80
              rounded-xl shadow-xl shadow-slate-200/30 dark:shadow-slate-900/40
              overflow-hidden"
          >
            {languages.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <li key={lang.code}>
                  <button
                    role="option"
                    aria-selected={isActive}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left
                      ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="text-base" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <span>{lang.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;

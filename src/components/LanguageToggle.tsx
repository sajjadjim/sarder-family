import React from 'react';
import { useLanguage } from '../contexts/AppContext';

const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="flex items-center rounded-full bg-stone-100 border border-stone-200 p-0.5"
      role="group"
      aria-label="Language / ভাষা"
    >
      <button
        onClick={() => setLang('bn')}
        className={`
          px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
          ${lang === 'bn'
            ? 'bg-forest-600 text-white shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
          }
        `}
        aria-pressed={lang === 'bn'}
        lang="bn"
      >
        বাংলা
      </button>
      <button
        onClick={() => setLang('en')}
        className={`
          px-3 py-1 rounded-full text-sm font-medium transition-all duration-200
          ${lang === 'en'
            ? 'bg-forest-600 text-white shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
          }
        `}
        aria-pressed={lang === 'en'}
        lang="en"
      >
        English
      </button>
    </div>
  );
};

export default LanguageToggle;

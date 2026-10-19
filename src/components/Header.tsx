import React from 'react';
import { useFamilyData, useLanguage, useTreeState } from '../contexts/AppContext';
import SearchBar from './SearchBar';
import LanguageToggle from './LanguageToggle';

const Header: React.FC = () => {
  const { data } = useFamilyData();
  const { lang, t, text } = useLanguage();
  const { resetTree, breadcrumb, openProfile } = useTreeState();

  const familyName = data ? text(data.raw.family.name) : (lang === 'bn' ? 'সরদার গোষ্ঠী' : 'Sardar Family');
  const totalMembers = data?.people.size ?? 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main header row */}
        <div className="flex items-center gap-3 py-3 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-sm font-bold">স</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 leading-none font-bengali">
                {familyName}
              </h1>
              {totalMembers > 0 && (
                <p className="text-[10px] text-stone-400">
                  {t(`${totalMembers} জন সদস্য`, `${totalMembers} members`)}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="order-3 sm:order-2 w-full sm:w-auto">
            <SearchBar />
          </div>

          {/* Controls */}
          <div className="order-2 sm:order-3 flex items-center gap-2 ml-auto sm:ml-0">
            <button
              onClick={resetTree}
              className="
                px-3 py-1.5 rounded-full text-xs font-medium
                bg-ivory-100 text-stone-600 border border-stone-200
                hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200
                transition-colors flex items-center gap-1
              "
              aria-label={t('শুরুতে ফিরুন', 'Back to roots')}
            >
              <span aria-hidden="true">↑</span>
              <span className="hidden sm:inline">{t('শুরুতে ফিরুন', 'Back to roots')}</span>
              <span className="sm:hidden">{t('শুরুতে', 'Roots')}</span>
            </button>
            <LanguageToggle />
          </div>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <nav
            className="pb-2 overflow-x-auto whitespace-nowrap"
            aria-label={t('পারিবারিক পথ', 'Family path')}
          >
            <ol className="flex items-center gap-1 text-xs">
              {breadcrumb.map((item, i) => {
                const isLast = i === breadcrumb.length - 1;
                return (
                  <li key={item.personId} className="flex items-center gap-1">
                    {i > 0 && <span className="text-stone-300" aria-hidden="true">›</span>}
                    {isLast ? (
                      <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-semibold">
                        {lang === 'bn' ? item.name.bn || item.name.en : item.name.en || item.name.bn}
                      </span>
                    ) : (
                      <button
                        onClick={() => openProfile(item.personId)}
                        className="px-2 py-0.5 rounded-full text-stone-500 hover:text-forest-600 hover:bg-forest-50 transition-colors"
                      >
                        {lang === 'bn' ? item.name.bn || item.name.en : item.name.en || item.name.bn}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

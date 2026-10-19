import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFamilyData, useLanguage, useTreeState } from '../contexts/AppContext';
import { searchPeople, getAncestorPath } from '../services/familyDataService';
import type { ResolvedPerson } from '../types/family';
import { Avatar } from './PersonCard';

const SearchBar: React.FC = () => {
  const { people } = useFamilyData();
  const { lang, t, text } = useLanguage();
  const { revealPerson } = useTreeState();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResolvedPerson[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const found = searchPeople(query, people, lang);
    setResults(found.slice(0, 8));
    setIsOpen(found.length > 0);
    setActiveIndex(-1);
  }, [query, people, lang]);

  const selectResult = useCallback((person: ResolvedPerson) => {
    setQuery('');
    setIsOpen(false);
    revealPerson(person.id);
    // Scroll to the person after a short delay for the tree to render
    setTimeout(() => {
      const el = document.getElementById(`person-card-${person.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [revealPerson]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getAncestorLabel = (person: ResolvedPerson): string => {
    const path = getAncestorPath(person.id, people);
    if (path.length === 0) return '';
    const parentId = path[path.length - 1];
    const parent = people.get(parentId);
    if (!parent) return '';
    return text(parent.name);
  };

  return (
    <div className="relative w-full max-w-sm" role="search">
      <label htmlFor="family-search" className="sr-only">
        {t('পরিবারের সদস্য খুঁজুন', 'Search family members')}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          id="family-search"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={t('নাম দিয়ে খুঁজুন...', 'Search by name...')}
          className="
            w-full pl-9 pr-4 py-2 rounded-full
            bg-white border border-stone-200 text-stone-700
            placeholder:text-stone-400 text-sm
            focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-400
            shadow-sm transition-shadow
          "
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="search-results"
          role="listbox"
          className="
            absolute top-full mt-1 left-0 right-0 z-50
            bg-white rounded-xl shadow-xl border border-stone-100
            overflow-y-auto max-h-72
          "
          aria-label={t('খোঁজার ফলাফল', 'Search results')}
        >
          {results.map((person, i) => {
            const ancestorLabel = getAncestorLabel(person);
            return (
              <li
                key={person.id}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`
                  flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
                  ${i === activeIndex ? 'bg-forest-50' : 'hover:bg-stone-50'}
                  ${i > 0 ? 'border-t border-stone-50' : ''}
                `}
                onMouseDown={() => selectResult(person)}
              >
                <Avatar person={person} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{text(person.name)}</p>
                  {ancestorLabel && (
                    <p className="text-xs text-stone-400 truncate">
                      {t('পিতা/মাতা:', 'Parent:')} {ancestorLabel}
                    </p>
                  )}
                  {person.isDeceased && (
                    <span className="text-[10px] text-stone-400">{t('প্রয়াত', 'deceased')}</span>
                  )}
                </div>
                {person.childIds.length > 0 && (
                  <span className="text-[10px] text-forest-600 shrink-0">
                    {person.childIds.length} {t('সন্তান', 'ch.')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;

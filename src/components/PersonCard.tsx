import React, { useState } from 'react';
import type { ResolvedPerson } from '../types/family';
import { useLanguage, useTreeState } from '../contexts/AppContext';

interface PersonCardProps {
  person: ResolvedPerson;
  isRoot?: boolean;
  depth?: number;
}

function formatDate(
  birth: ResolvedPerson['birth'],
  lang: 'bn' | 'en'
): string {
  if (birth.date) {
    try {
      const d = new Date(birth.date);
      if (lang === 'bn') {
        return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      }
      return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { /* fall through */ }
  }
  if (birth.year) return String(birth.year);
  return '';
}

function calcAge(birth: ResolvedPerson['birth'], death: ResolvedPerson['death'] | null): number | null {
  const birthYear = birth.year ?? (birth.date ? new Date(birth.date).getFullYear() : null);
  if (!birthYear) return null;
  const endYear = death?.year ?? (death?.date ? new Date(death.date!).getFullYear() : null) ?? new Date().getFullYear();
  return endYear - birthYear;
}

export const Avatar: React.FC<{ person: ResolvedPerson; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ person, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl',
  };
  const initial = person.name.bn.charAt(0) || person.name.en.charAt(0) || '?';
  const isMale = person.gender === 'male';
  const bgClass = isMale
    ? 'bg-gradient-to-br from-forest-100 to-forest-200'
    : 'bg-gradient-to-br from-gold-100 to-gold-200';
  const textClass = isMale ? 'text-forest-700' : 'text-gold-700';

  if (person.photoUrl && !imgError) {
    return (
      <img
        src={person.photoUrl}
        alt={person.name.bn || person.name.en}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-md`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${bgClass} rounded-full flex items-center justify-center ring-2 ring-white shadow-md flex-shrink-0`}
      aria-label={person.name.bn || person.name.en}
    >
      <span className={`font-bold ${textClass} select-none`}>{initial}</span>
    </div>
  );
};

const PersonCard: React.FC<PersonCardProps> = ({ person, isRoot = false }) => {
  const { lang, t, text } = useLanguage();
  const { expandedIds, selectedId, highlightedId, toggleExpanded, selectPerson, openProfile } = useTreeState();

  const isExpanded = expandedIds.has(person.id);
  const isSelected = selectedId === person.id;
  const isHighlighted = highlightedId === person.id;
  const hasChildren = person.childIds.length > 0;

  const birthStr = formatDate(person.birth, lang);
  const deathStr = person.death ? formatDate(person.death, lang) : '';
  const age = calcAge(person.birth, person.death);

  const handleCardClick = () => {
    if (hasChildren) {
      selectPerson(person.id);
      if (!isExpanded) toggleExpanded(person.id);
    } else {
      selectPerson(person.id);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(person.id);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openProfile(person.id);
  };

  return (
    <div
      className={`
        relative group rounded-2xl transition-all duration-300 ease-out
        ${isRoot ? 'bg-white ring-2 ring-gold-300 shadow-lg' : 'bg-white shadow-sm hover:shadow-md ring-1 ring-ivory-200'}
        ${isHighlighted ? 'ring-2 ring-forest-500 shadow-forest-100 shadow-lg' : ''}
        ${isSelected && !isHighlighted ? 'ring-2 ring-forest-300' : ''}
        cursor-pointer select-none
      `}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-label={`${text(person.name)}${hasChildren ? (isExpanded ? ` — ${t('সংকুচিত করুন', 'collapse')}` : ` — ${t('বিস্তার করুন', 'expand')}`) : ''}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
    >
      {/* Deceased overlay */}
      {person.isDeceased && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-stone-400" title={t('প্রয়াত', 'Deceased')} />
      )}

      <div className="p-3 flex flex-col items-center gap-2 min-w-[120px] max-w-[152px]">
        {/* Avatar */}
        <div className="relative">
          <Avatar person={person} size={isRoot ? 'lg' : 'md'} />
          {person.isDeceased && (
            <div
              className="absolute inset-0 rounded-full ring-2 ring-stone-300 opacity-40 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <p className={`font-semibold leading-tight text-stone-800 ${isRoot ? 'text-sm' : 'text-xs'} line-clamp-2`}>
            {text(person.name)}
          </p>
          {person.isDeceased && (
            <span className="text-[10px] text-stone-400 font-medium">{t('(প্রয়াত)', '(deceased)')}</span>
          )}
        </div>

        {/* Dates */}
        <div className="text-center space-y-0.5">
          {birthStr && (
            <p className="text-[10px] text-stone-500">
              <span className="text-stone-400 font-medium">{t('জন্ম', 'Born')}: </span>{birthStr}
            </p>
          )}
          {deathStr && person.isDeceased && (
            <p className="text-[10px] text-stone-500">
              <span className="text-stone-400 font-medium">{t('মৃত্যু', 'Died')}: </span>{deathStr}
            </p>
          )}
          {age !== null && (
            <p className="text-[10px] text-stone-400">
              {person.isDeceased
                ? t(`মৃত্যুকালীন বয়স: ${age}`, `Age at death: ${age}`)
                : t(`বয়স: ${age}`, `Age: ${age}`)}
            </p>
          )}
        </div>

        {/* Children count */}
        {person.childIds.length > 0 && (
          <p className="text-[10px] text-forest-600 font-medium">
            {t(`${person.childIds.length} সন্তান`, `${person.childIds.length} children`)}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={handleProfileClick}
            className="text-[10px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 hover:bg-forest-100 transition-colors border border-forest-200 font-medium"
            aria-label={t('বিস্তারিত দেখুন', 'View profile')}
          >
            {t('বিস্তারিত', 'Profile')}
          </button>
          {hasChildren && (
            <button
              onClick={handleExpandToggle}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors border font-medium ${
                isExpanded
                  ? 'bg-forest-100 text-forest-700 border-forest-300'
                  : 'bg-ivory-50 text-stone-600 border-stone-200 hover:bg-forest-50'
              }`}
              aria-label={isExpanded ? t('সংকুচিত করুন', 'Collapse') : t('বিস্তার করুন', 'Expand')}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonCard;

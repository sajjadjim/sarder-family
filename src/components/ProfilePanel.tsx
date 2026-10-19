import React, { useEffect, useRef } from 'react';
import { useFamilyData, useLanguage, useTreeState } from '../contexts/AppContext';
import { Avatar } from './PersonCard';
import { getAncestorPath } from '../services/familyDataService';
import type { ResolvedPerson } from '../types/family';

function formatDateFull(d: ResolvedPerson['birth'] | null | undefined, lang: 'bn' | 'en'): string {
  if (!d) return '';
  if (d.date) {
    try {
      const date = new Date(d.date);
      return lang === 'bn'
        ? date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
        : date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { /* fall through */ }
  }
  return d.year ? String(d.year) : '';
}

function calcAge(birth: ResolvedPerson['birth'], death: ResolvedPerson['death'] | null): number | null {
  const by = birth.year ?? (birth.date ? new Date(birth.date).getFullYear() : null);
  if (!by) return null;
  const ey = death?.year ?? (death?.date ? new Date(death.date!).getFullYear() : null) ?? new Date().getFullYear();
  return ey - by;
}

const ProfilePanel: React.FC = () => {
  const { profileId, closeProfile, openProfile, revealPerson } = useTreeState();
  const { people } = useFamilyData();
  const { lang, t, text } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  const person = profileId ? people.get(profileId) : null;

  // Trap focus and close on Escape
  useEffect(() => {
    if (!profileId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProfile();
    };
    document.addEventListener('keydown', handleKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [profileId, closeProfile]);

  if (!person) return null;

  const birthStr = formatDateFull(person.birth, lang);
  const deathStr = person.death ? formatDateFull(person.death, lang) : '';
  const age = calcAge(person.birth, person.death);
  const ancestorPath = getAncestorPath(person.id, people);
  const parents = person.parentIds.map(pid => people.get(pid)).filter(Boolean) as ResolvedPerson[];
  const partners = person.partnerIds.map(pid => people.get(pid)).filter(Boolean) as ResolvedPerson[];
  const children = person.childIds.map(cid => people.get(cid)).filter(Boolean) as ResolvedPerson[];

  const navigateTo = (id: string) => {
    openProfile(id);
    revealPerson(id);
  };

  const RelLink: React.FC<{ person: ResolvedPerson }> = ({ person: p }) => (
    <button
      onClick={() => navigateTo(p.id)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 hover:bg-forest-100 text-xs font-medium border border-forest-200 transition-colors"
    >
      {text(p.name)}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={closeProfile}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={text(person.name)}
        tabIndex={-1}
        className="
          fixed right-0 top-0 h-full w-full sm:w-[440px] max-w-full
          bg-white shadow-2xl z-50 overflow-y-auto
          outline-none motion-safe:animate-[slideIn_0.25s_ease-out]
        "
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-stone-100 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold text-stone-800 line-clamp-1">{text(person.name)}</h2>
          <button
            onClick={closeProfile}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
            aria-label={t('বন্ধ করুন', 'Close')}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Portrait + headline */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar person={person} size="xl" />
            <div>
              <h3 className="text-xl font-bold text-stone-900">{person.name.bn}</h3>
              {person.name.en && person.name.en !== person.name.bn && (
                <p className="text-sm text-stone-500">{person.name.en}</p>
              )}
              {person.isDeceased && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs">
                  {t('প্রয়াত', 'Deceased')}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {(text(person.bio)) && (
            <div className="bg-ivory-50 rounded-xl p-4 border border-ivory-200">
              <p className="text-sm text-stone-600 leading-relaxed">{text(person.bio)}</p>
            </div>
          )}

          {/* Facts table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t('তথ্য', 'Details')}</h4>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-stone-50">
                {birthStr && (
                  <tr>
                    <td className="py-2 text-stone-400 w-24 font-medium">{t('জন্ম', 'Born')}</td>
                    <td className="py-2 text-stone-700">{birthStr}</td>
                  </tr>
                )}
                {deathStr && person.isDeceased && (
                  <tr>
                    <td className="py-2 text-stone-400 font-medium">{t('মৃত্যু', 'Died')}</td>
                    <td className="py-2 text-stone-700">{deathStr}</td>
                  </tr>
                )}
                {age !== null && (
                  <tr>
                    <td className="py-2 text-stone-400 font-medium">
                      {person.isDeceased ? t('বয়স (মৃত্যুকালে)', 'Age at death') : t('বর্তমান বয়স', 'Current age')}
                    </td>
                    <td className="py-2 text-stone-700">{age}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-stone-400 font-medium">{t('লিঙ্গ', 'Gender')}</td>
                  <td className="py-2 text-stone-700">
                    {person.gender === 'male' ? t('পুরুষ', 'Male')
                      : person.gender === 'female' ? t('মহিলা', 'Female')
                      : t('অজানা', 'Unknown')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ancestor path */}
          {ancestorPath.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t('পারিবারিক পথ', 'Family path')}</h4>
              <div className="flex flex-wrap gap-1 items-center">
                {ancestorPath.map((aid, i) => {
                  const anc = people.get(aid);
                  if (!anc) return null;
                  return (
                    <React.Fragment key={aid}>
                      {i > 0 && <span className="text-stone-300 text-xs">›</span>}
                      <RelLink person={anc} />
                    </React.Fragment>
                  );
                })}
                <span className="text-stone-300 text-xs">›</span>
                <span className="text-xs font-semibold text-forest-700 px-2 py-0.5 rounded-full bg-forest-50 border border-forest-200">
                  {text(person.name)}
                </span>
              </div>
            </div>
          )}

          {/* Parents */}
          {parents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t('পিতামাতা', 'Parents')}</h4>
              <div className="flex flex-wrap gap-2">
                {parents.map(p => (
                  <RelLink key={p.id} person={p} />
                ))}
              </div>
            </div>
          )}

          {/* Partners */}
          {partners.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{t('স্বামী/স্ত্রী', 'Spouse(s)')}</h4>
              <div className="flex flex-wrap gap-2">
                {partners.map(p => (
                  <RelLink key={p.id} person={p} />
                ))}
              </div>
            </div>
          )}

          {/* Children */}
          {children.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                {t('সন্তান', 'Children')} ({children.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {children.map(c => (
                  <RelLink key={c.id} person={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePanel;

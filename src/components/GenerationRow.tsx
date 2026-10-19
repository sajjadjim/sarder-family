import React from 'react';
import type { ResolvedPerson } from '../types/family';
import PersonCard from './PersonCard';
import { useLanguage, useTreeState } from '../contexts/AppContext';

interface FoundingCoupleProps {
  partners: ResolvedPerson[];
}

const FoundingCouple: React.FC<FoundingCoupleProps> = ({ partners }) => {
  const { t } = useLanguage();
  const { expandedIds } = useTreeState();

  const anyExpanded = partners.some(p => expandedIds.has(p.id));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Heading label */}
      <div className="text-center">
        <span className="inline-block px-4 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold tracking-wide border border-gold-200">
          {t('প্রতিষ্ঠাতা দম্পতি', 'Founding Couple')}
        </span>
      </div>

      {/* Couple row */}
      <div className="flex items-center gap-6 flex-wrap justify-center">
        {partners.map((partner, i) => (
          <React.Fragment key={partner.id}>
            <PersonCard person={partner} isRoot />
            {i < partners.length - 1 && (
              <div className="flex flex-col items-center gap-1" aria-hidden="true">
                <div className="w-8 h-px bg-gold-300" />
                <span className="text-gold-500 text-lg">♥</span>
                <div className="w-8 h-px bg-gold-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Connector line down to children */}
      {anyExpanded && (
        <div className="w-px h-8 bg-forest-200" aria-hidden="true" />
      )}
    </div>
  );
};

/** A row of siblings (children of a couple), laid out horizontally with scroll on mobile */
interface GenerationRowProps {
  children: ResolvedPerson[];
  parentId: string;
  depth: number;
}

export const GenerationRow: React.FC<GenerationRowProps> = ({ children: siblings, depth }) => {
  const { t } = useLanguage();

  if (siblings.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full gap-2">
      {/* Horizontal bar connecting siblings */}
      {siblings.length > 1 && (
        <div className="relative w-full flex justify-center" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-0">
            {/* connector bar spans siblings */}
          </div>
        </div>
      )}

      {/* Scroll container for many siblings on mobile */}
      <div
        className="flex flex-row flex-wrap justify-center gap-4 w-full overflow-x-auto pb-2 px-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
        role="list"
        aria-label={t(`প্রজন্ম ${depth + 1}`, `Generation ${depth + 1}`)}
      >
        {siblings.map(person => (
          <div key={person.id} className="flex flex-col items-center gap-0" role="listitem">
            {/* Vertical connector from parent */}
            <div className="w-px h-6 bg-forest-200" aria-hidden="true" />
            <PersonCard person={person} depth={depth} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoundingCouple;

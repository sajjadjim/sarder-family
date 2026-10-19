import React from 'react';
import type { ResolvedPerson } from '../types/family';
import PersonCard from './PersonCard';
import { GenerationRow } from './GenerationRow';
import { useLanguage, useFamilyData, useTreeState } from '../contexts/AppContext';

interface FamilyBranchProps {
  personId: string;
  depth?: number;
}

/**
 * Renders a person card plus, if expanded, their children recursively.
 * Couples are rendered side-by-side before showing their shared children.
 */
const FamilyBranch: React.FC<FamilyBranchProps> = ({ personId, depth = 0 }) => {
  const { people } = useFamilyData();
  const { expandedIds } = useTreeState();
  const { t } = useLanguage();

  const person = people.get(personId);
  if (!person) return null;

  const isExpanded = expandedIds.has(personId);
  const hasChildren = person.childIds.length > 0;

  // Build "couple view": person + their partners, then their shared children
  const partners = person.partnerIds
    .map(pid => people.get(pid))
    .filter((p): p is ResolvedPerson => Boolean(p));

  // Collect all children (deduplication handled by data service)
  const children = person.childIds
    .map(cid => people.get(cid))
    .filter((p): p is ResolvedPerson => Boolean(p));

  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {/* Person + their partner(s) side by side */}
      <div className="flex items-start gap-4 flex-wrap justify-center">
        <PersonCard person={person} depth={depth} />

        {partners.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {partners.map(partner => (
              <React.Fragment key={partner.id}>
                <div className="flex flex-col items-center gap-1 mt-3" aria-hidden="true">
                  <div className="w-5 h-px bg-gold-300" />
                  <span className="text-gold-400 text-sm">♥</span>
                  <div className="w-5 h-px bg-gold-300" />
                </div>
                <PersonCard key={partner.id} person={partner} depth={depth} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Expanded children */}
      {isExpanded && hasChildren && (
        <div
          className="flex flex-col items-center w-full mt-0 motion-safe:animate-[fadeIn_0.25s_ease-out]"
          style={{ paddingTop: 0 }}
        >
          {/* Children row */}
          <GenerationRow children={children} parentId={personId} depth={depth + 1} />

          {/* Recurse into each child's own branch */}
          <div className="flex flex-row flex-wrap justify-center gap-8 w-full mt-2 px-2">
            {children.map(child => {
              const childExpanded = expandedIds.has(child.id);
              if (!childExpanded) return null;
              return (
                <div key={child.id} className="flex flex-col items-center gap-0">
                  <FamilyBranch personId={child.id} depth={depth + 1} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for leaf nodes */}
      {isExpanded && !hasChildren && (
        <div className="mt-3 text-xs text-stone-400 italic text-center">
          {t('এই সদস্যের কোনো সন্তানের তথ্য নেই', 'No children recorded for this member')}
        </div>
      )}
    </div>
  );
};

export default FamilyBranch;

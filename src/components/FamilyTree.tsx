import { useMemo, Fragment, type FC } from 'react';
import { useFamilyData, useLanguage, useTreeState } from '../contexts/AppContext';
import type { ResolvedPerson } from '../types/family';
import FoundingCouple from './GenerationRow';
import PersonCard from './PersonCard';

/**
 * Main family tree view.
 *
 * Architecture:
 * 1. Renders the founding couple (rootPersonIds) at the top.
 * 2. On expansion, renders their children as a GenerationRow.
 * 3. Expanded children recursively show their own couple + children.
 * 4. The tree is driven entirely by expandedIds in TreeContext.
 */
const FamilyTree: FC = () => {
  const { people, data } = useFamilyData();


  const rootIds = useMemo(() => data?.raw.family.rootPersonIds ?? [], [data]);
  const roots = useMemo(
    () => rootIds.map(id => people.get(id)).filter((p): p is ResolvedPerson => Boolean(p)),
    [rootIds, people]
  );

  if (roots.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full gap-2 pb-12 px-2">
      {/* Founding couple */}
      <FoundingCouple partners={roots} />

      {/* Children of roots */}
      <TreeChildren parentIds={rootIds} depth={1} />
    </div>
  );
};

/** Renders the children of given parents if any parent is expanded */
interface TreeChildrenProps {
  parentIds: string[];
  depth: number;
}

const TreeChildren: FC<TreeChildrenProps> = ({ parentIds, depth }) => {
  const { people } = useFamilyData();
  const { expandedIds } = useTreeState();
  const { t } = useLanguage();
  // t is used for aria-labels below

  // Find all children of any expanded parent in parentIds, deduplicated
  const expandedParentIds = parentIds.filter(id => expandedIds.has(id));
  if (expandedParentIds.length === 0) return null;

  // Collect children from all expanded parents, dedup
  const seenChildren = new Set<string>();
  const allChildren: ResolvedPerson[] = [];
  for (const pid of expandedParentIds) {
    const parent = people.get(pid);
    if (!parent) continue;
    for (const cid of parent.childIds) {
      if (!seenChildren.has(cid)) {
        seenChildren.add(cid);
        const child = people.get(cid);
        if (child) allChildren.push(child);
      }
    }
  }

  if (allChildren.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full gap-2 motion-safe:animate-[fadeIn_0.3s_ease-out]">
      {/* Generation label */}
      <div className="text-xs text-stone-400 font-medium tracking-wide mt-2">
        {t(`প্রজন্ম ${depth + 1}`, `Generation ${depth + 1}`)}
      </div>

      {/* Children row */}
      <div className="relative w-full flex flex-col items-center">
        {/* Horizontal connector for children */}
        {allChildren.length > 1 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[calc(100%-8rem)] max-w-2xl h-px bg-forest-100 z-0" aria-hidden="true" />
        )}

        <div
          className="flex flex-row flex-wrap justify-center gap-4 w-full overflow-x-auto pb-2 px-4 z-10"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="list"
          aria-label={t(`প্রজন্ম ${depth + 1}`, `Generation ${depth + 1}`)}
        >
          {allChildren.map(child => (
            <div key={child.id} className="flex flex-col items-center gap-0" role="listitem">
              <div className="w-px h-6 bg-forest-100" aria-hidden="true" />

              {/* Child + their partner(s) */}
              <ChildWithPartners person={child} depth={depth} />
            </div>
          ))}
        </div>
      </div>

      {/* Recurse: next generation */}
      <TreeChildren
        parentIds={allChildren.map(c => c.id)}
        depth={depth + 1}
      />
    </div>
  );
};

/** Renders a person card next to their partner(s) */
const ChildWithPartners: FC<{ person: ResolvedPerson; depth: number }> = ({ person, depth }) => {
  const { people } = useFamilyData();
  // NOTE: _expandedIds kept for future use (e.g. visual indicator)

  const partners = person.partnerIds
    .map(pid => people.get(pid))
    .filter((p): p is ResolvedPerson => Boolean(p))
    // Don't show partners who are already shown as siblings (they are in rootIds or child lists)
    .filter(p => !p.childIds.every(cid => person.childIds.includes(cid)));

  // (isExpanded kept for future visual use)

  return (
    <div id={`person-card-${person.id}`} className="flex flex-col items-center gap-0">
      <div className="flex items-start gap-2 flex-wrap justify-center">
        <PersonCard person={person} depth={depth} />
        {partners.map(partner => (
          <Fragment key={partner.id}>
            <div className="flex flex-col items-center justify-center mt-5 gap-0.5" aria-hidden="true">
              <div className="w-4 h-px bg-gold-300" />
              <span className="text-gold-400 text-xs">♥</span>
              <div className="w-4 h-px bg-gold-300" />
            </div>
            <div id={`person-card-${partner.id}`}>
              <PersonCard person={partner} depth={depth} />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default FamilyTree;

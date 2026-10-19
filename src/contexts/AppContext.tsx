import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { loadFamilyData, getAncestorPath, type LoadedFamilyData } from '../services/familyDataService';
import type { ResolvedPerson, Language, BreadcrumbItem } from '../types/family';

// ─── Language context ─────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (bn: string, en: string) => string;
  text: (bilingual: { bn: string; en: string } | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('sardar-lang');
      if (stored === 'bn' || stored === 'en') return stored;
    } catch { /* ignore */ }
    return 'bn';
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try { localStorage.setItem('sardar-lang', l); } catch { /* ignore */ }
    document.documentElement.lang = l === 'bn' ? 'bn' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  }, [lang]);

  const t = useCallback((bn: string, en: string) => lang === 'bn' ? bn : en, [lang]);
  const text = useCallback((bilingual?: { bn: string; en: string } | null) => {
    if (!bilingual) return '';
    return lang === 'bn' ? (bilingual.bn || bilingual.en) : (bilingual.en || bilingual.bn);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, text }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

// ─── Family data context ──────────────────────────────────────────────────────

interface FamilyContextValue {
  data: LoadedFamilyData | null;
  loading: boolean;
  error: string | null;
  people: Map<string, ResolvedPerson>;
  getPerson: (id: string) => ResolvedPerson | undefined;
  getAncestors: (id: string) => string[];
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LoadedFamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyData()
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const people = useMemo(() => data?.people ?? new Map(), [data]);
  const getPerson = useCallback((id: string) => people.get(id), [people]);
  const getAncestors = useCallback((id: string) => getAncestorPath(id, people), [people]);

  return (
    <FamilyContext.Provider value={{ data, loading, error, people, getPerson, getAncestors }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamilyData() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamilyData must be used within FamilyDataProvider');
  return ctx;
}

// ─── Tree state context ───────────────────────────────────────────────────────

interface TreeContextValue {
  expandedIds: Set<string>;
  selectedId: string | null;
  highlightedId: string | null;
  breadcrumb: BreadcrumbItem[];
  profileId: string | null;
  toggleExpanded: (id: string) => void;
  selectPerson: (id: string) => void;
  openProfile: (id: string) => void;
  closeProfile: () => void;
  resetTree: () => void;
  revealPerson: (id: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

export function TreeStateProvider({ children }: { children: ReactNode }) {
  const { people, data } = useFamilyData();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);

  const rootIds = useMemo(() => data?.raw.family.rootPersonIds ?? [], [data]);

  const buildBreadcrumb = useCallback((id: string): BreadcrumbItem[] => {
    const ancestors = getAncestorPath(id, people);
    return [...ancestors, id]
      .map(pid => people.get(pid))
      .filter(Boolean)
      .map(p => ({ personId: p!.id, name: p!.name }));
  }, [people]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectPerson = useCallback((id: string) => {
    setSelectedId(id);
    setHighlightedId(id);
    setBreadcrumb(buildBreadcrumb(id));
    // Auto-expand
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [buildBreadcrumb]);

  const openProfile = useCallback((id: string) => {
    setProfileId(id);
  }, []);

  const closeProfile = useCallback(() => {
    setProfileId(null);
  }, []);

  const resetTree = useCallback(() => {
    setExpandedIds(new Set());
    setSelectedId(null);
    setHighlightedId(null);
    setBreadcrumb([]);
    setProfileId(null);
  }, []);

  /** Reveal a person by expanding all ancestor nodes */
  const revealPerson = useCallback((id: string) => {
    const ancestors = getAncestorPath(id, people);
    // Expand roots first
    const toExpand = [...rootIds, ...ancestors, id];
    setExpandedIds(prev => {
      const next = new Set(prev);
      toExpand.forEach(aid => next.add(aid));
      return next;
    });
    setSelectedId(id);
    setHighlightedId(id);
    setBreadcrumb(buildBreadcrumb(id));
  }, [people, rootIds, buildBreadcrumb]);

  return (
    <TreeContext.Provider value={{
      expandedIds, selectedId, highlightedId, breadcrumb, profileId,
      toggleExpanded, selectPerson, openProfile, closeProfile, resetTree, revealPerson,
    }}>
      {children}
    </TreeContext.Provider>
  );
}

export function useTreeState() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('useTreeState must be used within TreeStateProvider');
  return ctx;
}

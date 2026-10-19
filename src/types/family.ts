// ─── Family Data Types ────────────────────────────────────────────────────────
// These types mirror the JSON schema documented in data/familyData.json.
// Extend this file when the schema evolves; update familyData.json accordingly.

export type Language = 'bn' | 'en';

export interface BilingualText {
  bn: string;
  en: string;
}

// A date may be fully known, year-only, or completely unknown.
export interface FamilyDate {
  date: string | null;   // ISO 8601 full date, e.g. "1945-03-15"
  year: number | null;   // Year only when full date is unknown
}

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface Person {
  id: string;
  name: BilingualText;
  gender: Gender;
  photoUrl: string | null;
  birth: FamilyDate;
  death: FamilyDate | null;  // null means living (do NOT show a death field)
  isDeceased: boolean;
  bio: BilingualText;
  // Spouse IDs are resolved from partnerships
  // Child/parent IDs are resolved from parentChildRelationships
}

/** One parent→child edge. birthOrder is 1-based; null if unknown. */
export interface ParentChildRelationship {
  id: string;
  parentId: string;
  childId: string;
  type: 'biological' | 'adoptive' | 'step';
  birthOrder: number | null;
}

/** Two or more people in a partnership (marriage, etc.) */
export interface Partnership {
  id: string;
  partnerIds: string[];   // exactly two in typical cases; supports others
  marriageDate?: FamilyDate;
}

export interface FamilyMeta {
  id: string;
  name: BilingualText;
  rootPersonIds: string[];  // IDs of the founding generation (usually two)
}

/** Top-level shape of the JSON data file */
export interface FamilyData {
  family: FamilyMeta;
  people: Person[];
  parentChildRelationships: ParentChildRelationship[];
  partnerships: Partnership[];
}

// ─── Derived / computed types used by the UI ─────────────────────────────────

/** A person enriched with resolved relationships for display */
export interface ResolvedPerson extends Person {
  parentIds: string[];
  childIds: string[];      // ordered by birthOrder
  partnerIds: string[];
}

/** A node in the interactive tree */
export interface TreeNode {
  personId: string;
  isExpanded: boolean;
  isHighlighted: boolean;
  depth: number;
}

export interface BreadcrumbItem {
  personId: string;
  name: BilingualText;
}

/**
 * Data Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Loads family data from a local JSON file or a configurable API endpoint.
 *
 * HOW TO SWITCH TO AN API:
 *   Set the env variable VITE_FAMILY_API_URL in your .env file:
 *     VITE_FAMILY_API_URL=https://your-api.example.com/family
 *   The service will then fetch from that URL instead of the bundled JSON.
 *
 * HOW TO USE A DIFFERENT LOCAL FILE:
 *   Set VITE_FAMILY_DATA_PATH to the path relative to /public/:
 *     VITE_FAMILY_DATA_PATH=/data/myFamily.json
 */

import type { FamilyData, ResolvedPerson, ParentChildRelationship } from '../types/family';

const API_URL = import.meta.env.VITE_FAMILY_API_URL as string | undefined;
const DATA_PATH = (import.meta.env.VITE_FAMILY_DATA_PATH as string | undefined) ?? '/data/familyData.json';

// ── Validation helpers ────────────────────────────────────────────────────────

function validateData(data: FamilyData): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  // Check duplicate IDs
  for (const person of data.people) {
    if (ids.has(person.id)) errors.push(`Duplicate person ID: ${person.id}`);
    ids.add(person.id);
  }

  // Check referential integrity for relationships
  for (const rel of data.parentChildRelationships) {
    if (!ids.has(rel.parentId)) errors.push(`Rel ${rel.id}: unknown parentId ${rel.parentId}`);
    if (!ids.has(rel.childId)) errors.push(`Rel ${rel.id}: unknown childId ${rel.childId}`);
    if (rel.parentId === rel.childId) errors.push(`Rel ${rel.id}: self-referential (same person is own parent)`);
  }

  for (const p of data.partnerships) {
    for (const pid of p.partnerIds) {
      if (!ids.has(pid)) errors.push(`Partnership ${p.id}: unknown partnerId ${pid}`);
    }
  }

  // Detect ancestry cycles using DFS
  const childToParents = new Map<string, string[]>();
  for (const rel of data.parentChildRelationships) {
    if (!childToParents.has(rel.childId)) childToParents.set(rel.childId, []);
    childToParents.get(rel.childId)!.push(rel.parentId);
  }

  function hasCycle(id: string, visited: Set<string>, stack: Set<string>): boolean {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    stack.add(id);
    for (const parent of (childToParents.get(id) ?? [])) {
      if (hasCycle(parent, visited, stack)) return true;
    }
    stack.delete(id);
    return false;
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  for (const person of data.people) {
    if (hasCycle(person.id, visited, stack)) {
      errors.push(`Ancestry cycle detected involving person ${person.id}`);
    }
  }

  return errors;
}

// ── Resolution ────────────────────────────────────────────────────────────────

function buildChildMap(rels: ParentChildRelationship[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  // Group by parent, then sort siblings by birthOrder
  const grouped = new Map<string, ParentChildRelationship[]>();
  for (const rel of rels) {
    if (!grouped.has(rel.parentId)) grouped.set(rel.parentId, []);
    grouped.get(rel.parentId)!.push(rel);
  }
  for (const [parentId, children] of grouped) {
    // Remove duplicate child entries (same child can appear once per parent)
    const seen = new Set<string>();
    const unique = children.filter(r => {
      if (seen.has(r.childId)) return false;
      seen.add(r.childId);
      return true;
    });
    unique.sort((a, b) => {
      if (a.birthOrder == null && b.birthOrder == null) return 0;
      if (a.birthOrder == null) return 1;
      if (b.birthOrder == null) return -1;
      return a.birthOrder - b.birthOrder;
    });
    map.set(parentId, unique.map(r => r.childId));
  }
  return map;
}

/**
 * Resolve child IDs for a person by finding children who have BOTH parents
 * matching a partnership, or simply any child with that person as a parent.
 * Children are deduplicated and ordered by birth order.
 */
function resolveChildIds(
  personId: string,
  rels: ParentChildRelationship[]
): string[] {
  const childMap = buildChildMap(rels);
  return childMap.get(personId) ?? [];
}

function resolveParentIds(personId: string, rels: ParentChildRelationship[]): string[] {
  return rels
    .filter(r => r.childId === personId)
    .map(r => r.parentId)
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
}

function resolvePartnerIds(personId: string, data: FamilyData): string[] {
  const partnerIds: string[] = [];
  for (const p of data.partnerships) {
    if (p.partnerIds.includes(personId)) {
      partnerIds.push(...p.partnerIds.filter(id => id !== personId));
    }
  }
  return [...new Set(partnerIds)];
}

export function resolvePeople(data: FamilyData): Map<string, ResolvedPerson> {
  const map = new Map<string, ResolvedPerson>();
  for (const person of data.people) {
    map.set(person.id, {
      ...person,
      parentIds: resolveParentIds(person.id, data.parentChildRelationships),
      childIds: resolveChildIds(person.id, data.parentChildRelationships),
      partnerIds: resolvePartnerIds(person.id, data),
    });
  }
  return map;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface LoadedFamilyData {
  raw: FamilyData;
  people: Map<string, ResolvedPerson>;
  validationErrors: string[];
}

export async function loadFamilyData(): Promise<LoadedFamilyData> {
  const url = API_URL ?? DATA_PATH;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load family data from ${url}: ${response.status} ${response.statusText}`);
  }

  const raw: FamilyData = await response.json();
  const validationErrors = validateData(raw);

  if (validationErrors.length > 0) {
    console.warn('[FamilyDataService] Validation issues found:', validationErrors);
  }

  const people = resolvePeople(raw);

  return { raw, people, validationErrors };
}

// ── Utility helpers used across the app ──────────────────────────────────────

/** Get all ancestors of a person in order (parent, grandparent, …) */
export function getAncestorPath(
  personId: string,
  people: Map<string, ResolvedPerson>
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const person = people.get(id);
    if (!person) return;
    // Follow the first parent (father by convention) to keep path linear
    const father = person.parentIds.find(pid => people.get(pid)?.gender === 'male');
    const firstParent = father ?? person.parentIds[0];
    if (firstParent) {
      walk(firstParent);
    }
    path.push(id);
  }

  walk(personId);
  return path.slice(0, -1); // exclude self
}

/** Get generation depth of a person (0 = root) */
export function getGenerationDepth(
  personId: string,
  people: Map<string, ResolvedPerson>,
  rootIds: string[]
): number {
  if (rootIds.includes(personId)) return 0;
  const person = people.get(personId);
  if (!person || person.parentIds.length === 0) return 0;
  const parentDepths = person.parentIds
    .filter(pid => people.has(pid))
    .map(pid => getGenerationDepth(pid, people, rootIds));
  return Math.max(...parentDepths, -1) + 1;
}

/** Search people by name (Bengali or English), returning matches with ancestor context */
export function searchPeople(
  query: string,
  people: Map<string, ResolvedPerson>,
  lang: 'bn' | 'en'
): ResolvedPerson[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return [...people.values()].filter(p => {
    const name = lang === 'bn' ? p.name.bn : p.name.en;
    const otherName = lang === 'bn' ? p.name.en : p.name.bn;
    return name.toLowerCase().includes(q) || otherName.toLowerCase().includes(q);
  });
}

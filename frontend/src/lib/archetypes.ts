import type { Archetype } from '@/types';
import archetypesRaw from '@/data/archetypes.json';

/**
 * Single source of truth for body archetypes.
 * Shared with the Python backend via the filesystem.
 */
export const ARCHETYPES: Archetype[] = archetypesRaw as Archetype[];

export function getArchetypeById(id: string): Archetype | undefined {
  return ARCHETYPES.find(a => a.id === id);
}

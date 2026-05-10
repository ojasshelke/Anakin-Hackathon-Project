import type { Archetype, MorphBlend } from '@/types';

/**
 * Compute squared Euclidean (L2²) distance between two beta vectors.
 * Using squared distance avoids sqrt — ordering is identical.
 */
export function l2SquaredDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Beta vector length mismatch: ${a.length} vs ${b.length}`);
  }
  return a.reduce((sum, ai, i) => sum + (ai - (b[i] ?? 0)) ** 2, 0);
}

/**
 * Select the top-k archetypes nearest to the query betas.
 * Returns archetypes sorted ascending by L2² distance.
 */
export function selectNearestArchetypes(
  queryBetas: number[],
  archetypes: Archetype[],
  k: number = 3
): Array<{ archetype: Archetype; distance: number }> {
  if (archetypes.length === 0) throw new Error('No archetypes provided');
  if (k < 1) throw new Error('k must be >= 1');

  const scored = archetypes.map((arch) => ({
    archetype: arch,
    distance: l2SquaredDistance(queryBetas, arch.betas),
  }));

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, Math.min(k, scored.length));
}

/**
 * Softmax over negative distances (closer = higher weight).
 * Temperature τ controls sharpness; lower → winner-takes-all.
 */
export function softmaxWeights(distances: number[], temperature: number = 1.0): number[] {
  if (distances.length === 0) return [];

  // Negate so closer archetypes get larger exponential value
  const logits = distances.map((d) => -d / temperature);

  // Numerical stability: subtract max
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);

  return exps.map((e) => e / sumExps);
}

/**
 * Full pipeline: query betas → nearest archetypes → softmax blend weights.
 * This runs in Three.js / browser — no SMPL-X inference here.
 */
export function computeMorphBlend(
  queryBetas: number[],
  archetypes: Archetype[],
  k: number = 3,
  temperature: number = 0.5
): MorphBlend {
  const nearest = selectNearestArchetypes(queryBetas, archetypes, k);
  const distances = nearest.map((n) => n.distance);
  const weights = softmaxWeights(distances, temperature);

  return {
    archetypeIds: nearest.map((n) => n.archetype.id),
    weights,
  };
}

/**
 * Apply blend weights to morph target influences in a Three.js mesh.
 * Call this after loading archetype GLBs as morph targets.
 *
 * @param morphTargetInfluences - Float32Array-like from THREE.Mesh
 * @param blend - result from computeMorphBlend
 * @param indexMap - maps archetypeId → morph target index in the mesh
 */
export function applyMorphBlend(
  morphTargetInfluences: number[],
  blend: MorphBlend,
  indexMap: Record<string, number>
): void {
  // Reset all
  for (let i = 0; i < morphTargetInfluences.length; i++) {
    morphTargetInfluences[i] = 0;
  }

  // Apply weighted influences
  blend.archetypeIds.forEach((id, i) => {
    const idx = indexMap[id];
    if (idx !== undefined) {
      morphTargetInfluences[idx] = blend.weights[i] ?? 0;
    }
  });
}

import { describe, it, expect } from 'vitest';
import { l2SquaredDistance, softmaxWeights, computeMorphBlend } from '../morphEngine';

describe('l2SquaredDistance', () => {
  it('returns 0 for identical vectors', () => {
    expect(l2SquaredDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });
  it('throws for mismatched lengths', () => {
    expect(() => l2SquaredDistance([1, 2], [1, 2, 3])).toThrow();
  });
  it('computes correct value for known inputs', () => {
    // [3,4] vs [0,0] => 9+16 = 25
    expect(l2SquaredDistance([3, 4], [0, 0])).toBe(25);
  });
});

describe('softmaxWeights', () => {
  it('weights sum to 1', () => {
    const weights = softmaxWeights([1, 2, 3]);
    const sum = weights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
  it('closer distance gets higher weight', () => {
    const weights = softmaxWeights([0.1, 10]);
    expect(weights[0]).toBeGreaterThan(weights[1]);
  });
});

describe('computeMorphBlend', () => {
  it('returns k archetypes', () => {
    const archetypes = [
      { id: 'a', glbUrl: '', betas: [0, 0] },
      { id: 'b', glbUrl: '', betas: [1, 0] },
      { id: 'c', glbUrl: '', betas: [2, 0] },
    ];
    const blend = computeMorphBlend([0.5, 0], archetypes, 2);
    expect(blend.archetypeIds.length).toBe(2);
    expect(blend.weights.length).toBe(2);
  });

  it('is deterministic — same input always yields same output', () => {
    const archetypes = [
      { id: 'a', glbUrl: '', betas: [0, 0] },
      { id: 'b', glbUrl: '', betas: [1, 0] },
      { id: 'c', glbUrl: '', betas: [2, 0] },
    ];
    const blend1 = computeMorphBlend([0.5, 0], archetypes, 2);
    const blend2 = computeMorphBlend([0.5, 0], archetypes, 2);
    expect(blend1.archetypeIds).toEqual(blend2.archetypeIds);
    blend1.weights.forEach((w, i) => expect(w).toBeCloseTo(blend2.weights[i]));
  });

  it('closest archetype gets highest weight', () => {
    const archetypes = [
      { id: 'near', glbUrl: '', betas: [0.1, 0] },
      { id: 'far', glbUrl: '', betas: [5.0, 0] },
      { id: 'mid', glbUrl: '', betas: [2.0, 0] },
    ];
    const blend = computeMorphBlend([0, 0], archetypes, 3);
    const nearIdx = blend.archetypeIds.indexOf('near');
    const farIdx = blend.archetypeIds.indexOf('far');
    expect(blend.weights[nearIdx]).toBeGreaterThan(blend.weights[farIdx]);
  });

  it('clamps k to available archetypes without throwing', () => {
    const archetypes = [
      { id: 'only', glbUrl: '', betas: [0, 0] },
    ];
    const blend = computeMorphBlend([0, 0], archetypes, 10); // k > length
    expect(blend.archetypeIds.length).toBe(1);
    expect(blend.weights[0]).toBeCloseTo(1.0);
  });
});

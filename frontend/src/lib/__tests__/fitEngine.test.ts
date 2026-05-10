import { describe, it, expect } from 'vitest';
import { getFitRecommendation, getFitScore } from '../fitEngine';

describe('getFitScore', () => {
  it('returns 95 for True to size', () => {
    expect(getFitScore('True to size')).toBe(95);
  });
  it('returns 80 for Oversized', () => {
    expect(getFitScore('Oversized')).toBe(80);
  });
  it('returns 70 for Too tight', () => {
    expect(getFitScore('Too tight')).toBe(70);
  });
  it('returns 80 for unknown labels', () => {
    expect(getFitScore('Unknown')).toBe(80);
  });
});

describe('getFitRecommendation', () => {
  const sizeChart = [
    { size: 'S', chest: 86, waist: 70, hips: 90 },
    { size: 'M', chest: 92, waist: 76, hips: 96 },
    { size: 'L', chest: 98, waist: 82, hips: 102 },
  ];

  it('recommends M for average measurements', () => {
    const result = getFitRecommendation({ chest: 92, waist: 76, hips: 96 }, sizeChart as any);
    expect(result.recommendedSize).toBe('M');
    expect(result.fitLabel).toBe('True to size');
  });

  it('recommends S and flags oversized for small user', () => {
    const result = getFitRecommendation({ chest: 80, waist: 64, hips: 84 }, sizeChart as any);
    expect(result.recommendedSize).toBe('S');
  });

  it('returns default when size chart is empty', () => {
    const result = getFitRecommendation({ chest: 92 }, []);
    expect(result.recommendedSize).toBe('M');
    expect(result.fitLabel).toBe('True to size');
  });

  it('recommends L for user larger than M', () => {
    const result = getFitRecommendation({ chest: 97, waist: 81, hips: 101 }, sizeChart as any);
    expect(result.recommendedSize).toBe('L');
  });

  it('handles missing optional measurements gracefully', () => {
    // Only chest provided — should not throw
    expect(() => getFitRecommendation({ chest: 92 }, sizeChart as any)).not.toThrow();
  });

  it('fitScore is a number between 0 and 100', () => {
    const result = getFitRecommendation({ chest: 92, waist: 76, hips: 96 }, sizeChart as any);
    const score = getFitScore(result.fitLabel);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

import type { UserRow, SizeChartRow } from '@/types/database';
import type { ProductCategory } from '@/types';

/** Product categories for sizing + try-on logic */

export interface FitRecommendation {
  fitLabel: "Oversized" | "True to size" | "Too tight";
  recommendedSize: string;
}

export function getFitRecommendation(userMeasurements: Partial<UserRow>, sizeChart: SizeChartRow[]): FitRecommendation {
  if (!sizeChart || sizeChart.length === 0) {
    return { fitLabel: "True to size", recommendedSize: "M" }; // Default fallback
  }

  let bestSize = sizeChart[0].size;
  let minAvgDiff = Infinity;
  let bestFitLabel: FitRecommendation['fitLabel'] = "True to size";

  for (const size of sizeChart) {
    const diffs: number[] = [];
    if (size.chest !== null && userMeasurements.chest != null) diffs.push(size.chest - userMeasurements.chest);
    if (size.waist !== null && userMeasurements.waist != null) diffs.push(size.waist - userMeasurements.waist);
    if (size.hips !== null && userMeasurements.hips != null) diffs.push(size.hips - userMeasurements.hips);

    if (diffs.length === 0) continue;

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const absDiff = Math.abs(avgDiff);

    // Find the size whose measurements are closest to the user's
    if (absDiff < minAvgDiff) {
      minAvgDiff = absDiff;
      bestSize = size.size;
      
      const maxDiff = Math.max(...diffs);
      const minVal = Math.min(...diffs);
      
      // Logic: if difference > 4cm → Oversized, if < -2cm → Too tight, else → True to size
      if (maxDiff > 4) {
        bestFitLabel = "Oversized";
      } else if (minVal < -2) {
        bestFitLabel = "Too tight";
      } else {
        bestFitLabel = "True to size";
      }
    }
  }

  return { fitLabel: bestFitLabel, recommendedSize: bestSize };
}

/**
 * Deterministic fit score from a fit label.
 * No randomness — score is fully reproducible.
 */
export function getFitScore(fitLabel: string): number {
  switch (fitLabel) {
    case 'True to size':
      return 95;
    case 'Oversized':
      return 80;
    case 'Too tight':
      return 70;
    default:
      return 80;
  }
}

/** Normalized fields from POST /api/size for UI display. */
export interface ParsedSizePayload {
  fitLabel: string;
  recommendedSize: string;
  category: string;
  detailLine: string | null;
}

export function parseSizeApiResponse(raw: unknown): ParsedSizePayload | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const fitLabel = typeof o.fitLabel === 'string' ? o.fitLabel : '';
  const recommendedSize =
    typeof o.recommendedSize === 'string' ? o.recommendedSize : '';
  const category = typeof o.category === 'string' ? o.category : 'clothing';

  let detailLine: string | null = null;
  if (category === 'shoes') {
    const uk = typeof o.sizeUK === 'string' ? o.sizeUK : '';
    const eu = typeof o.sizeEU === 'string' ? o.sizeEU : '';
    const us = typeof o.sizeUS === 'string' ? o.sizeUS : '';
    if (uk || eu || us) {
      detailLine = `UK ${uk} · EU ${eu} · US ${us}`;
    }
  } else if (category === 'jewelry' && typeof o.diameterMm === 'number') {
    detailLine = `Reference Ø ${o.diameterMm.toFixed(1)} mm`;
  }

  return { fitLabel, recommendedSize, category, detailLine };
}

import type { ProductCategory } from '@/types';

/** Map storefront / outfit labels to sizing + try-on product category. */
export function outfitLabelToProductCategory(label: string): ProductCategory {
  const u = label.trim().toUpperCase();
  if (u.includes('SHOE')) return 'shoes';
  if (u.includes('HAT') || u.includes('CAP')) return 'hats';
  if (u.includes('JEWEL') || u.includes('RING') || u.includes('BRACELET'))
    return 'jewelry';
  if (u.includes('BAG') || u.includes('TOTE') || u.includes('BACKPACK'))
    return 'bags';
  return 'clothing';
}

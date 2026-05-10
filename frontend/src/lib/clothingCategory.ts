import type { ProductCategory } from '@/types';

/** Map mock / UI outfit labels to Supabase `clothing_assets.category` values. */
export function outfitLabelToClothingCategory(label: string): ProductCategory {
  const key = label.trim().toUpperCase();
  const map: Record<string, ProductCategory> = {
    TOPS: 'tops',
    TOP: 'tops',
    BOTTOMS: 'bottoms',
    BOTTOM: 'bottoms',
    PANTS: 'bottoms',
    DRESS: 'dresses',
    DRESSES: 'dresses',
    OUTERWEAR: 'outerwear',
    JACKET: 'outerwear',
    SHOES: 'shoes',
    SHOE: 'shoes',
    ACCESSORIES: 'accessories',
    ACCESSORY: 'accessories',
  };
  return map[key] ?? 'tops';
}

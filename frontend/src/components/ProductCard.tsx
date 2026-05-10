'use client';

import React, { useState, useEffect } from 'react';
import { Outfit, TryOnResult, ReviewInsights } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Loader2, Zap, Sparkles, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Outfit;
  tryOnResult?: TryOnResult;
  isLoading: boolean;
  /** When provided, the card shows a "Try On" button that triggers the per-card try-on. */
  onTryOn?: () => void;
  /** Optional error message from the last try-on attempt. */
  errorMessage?: string | null;
}

export default function ProductCard({
  product,
  tryOnResult,
  isLoading,
  onTryOn,
  errorMessage,
}: ProductCardProps) {
  const router = useRouter();
  const { setSelectedOutfit, setTryOnResult } = useStore();
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = async () => {
    if (!product.sourceUrl || insights || loadingInsights) return;
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/products/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: product.sourceUrl,
          productName: product.name,
        }),
      });
      const data = await res.json() as ReviewInsights;
      setInsights(data);
    } catch {
      // silently fail — reviews are bonus, not critical
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (tryOnResult) fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryOnResult]);

  const handleOpen = () => {
    setSelectedOutfit(product);
    setTryOnResult(tryOnResult ?? null);
    router.push(`/products/${product.id}`);
  };

  const handleTryOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTryOn || isLoading) return;
    onTryOn();
  };

  const currentImage = tryOnResult?.resultImage || product.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={handleOpen}
      className="glass-panel overflow-hidden rounded-2xl cursor-pointer group border border-white/10 hover:border-[#bef264]/40 transition-colors relative"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white/5">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={product.name}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </AnimatePresence>

        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-100 transition-opacity z-10">
            <Loader2 className="w-8 h-8 text-[#bef264] animate-spin mb-2" />
            <span className="text-[10px] font-bold text-[#bef264] uppercase tracking-widest px-2 py-1 bg-black/40 rounded-lg">Generating</span>
          </div>
        )}

        {tryOnResult && !isLoading && (
          <div className="absolute top-3 left-3 bg-[#bef264] text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg z-20">
            <Zap className="w-3 h-3 fill-black" />
            TRY ON
          </div>
        )}

        {onTryOn && !isLoading && !tryOnResult && (
          <button
            type="button"
            onClick={handleTryOnClick}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#bef264] text-black text-[11px] font-bold uppercase tracking-wider shadow-lg z-20 hover:bg-[#a3e635] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try On
          </button>
        )}

        {errorMessage && !isLoading && (
          <div className="absolute bottom-3 left-3 right-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-100 text-[10px] z-20 backdrop-blur-sm">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2 leading-tight">{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="p-4 relative z-20 bg-black/40">
        <div className="text-[10px] uppercase tracking-wider text-[#d9f99d] block font-medium mb-1.5 border border-[#d9f99d]/30 bg-[#bef264]/10 w-fit px-1.5 py-0.5 rounded">
          {product.category}
        </div>
        <h3 className="text-white font-medium text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-white/80 text-sm font-semibold">${product.price.toFixed(2)}</p>

        {insights && (
          <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
            <p className="text-[9px] uppercase tracking-wider text-white/30">
              ✦ AI Fit Intelligence · Gemini
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${
                insights.fitVerdict === 'True to Size'
                  ? 'text-[#bef264]'
                  : 'text-orange-400'
              }`}>
                {insights.fitVerdict}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                insights.returnRisk === 'Low'
                  ? 'bg-[#bef264]/10 text-[#bef264]'
                  : insights.returnRisk === 'Medium'
                  ? 'bg-orange-400/10 text-orange-400'
                  : 'bg-rose-400/10 text-rose-400'
              }`}>
                {insights.returnRisk} Return Risk
              </span>
            </div>
            <p className="text-[10px] text-white/50">{insights.sizeAdvice}</p>
            {insights.topPraise && (
              <p className="text-[10px] text-white/40 line-clamp-1">
                ✓ {insights.topPraise}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

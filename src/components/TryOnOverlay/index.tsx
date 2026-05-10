"use client";

/**
 * TryOnOverlay — drop-in component for marketplace product pages.
 * Embeds VEXA's 3D avatar try-on viewer inside an iframe-friendly container.
 * Shows fit metadata, size recommendation, and heatmap toggle.
 *
 * RULE: "use client"
 * RULE: No raw GLB paths — all URLs come from signed API responses
 */

import React, { useState } from 'react';
import { AvatarViewer } from '@/components/AvatarViewer';
import { useTryOn } from '@/hooks/useTryOn';
import {
  Shirt,
  Ruler,
  Activity,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

interface TryOnOverlayProps {
  /** Authenticated user ID */
  userId: string;
  /** Marketplace product ID */
  productId: string;
  /** Presigned avatar GLB URL (from useAvatar hook) */
  avatarGlbUrl: string;
  /** Presigned clothing GLB URL (from marketplace product catalog) */
  clothingGlbUrl: string;
  /** VEXA API key for the integrating marketplace */
  apiKey: string;
  /** Product metadata for display */
  product?: {
    name: string;
    brand: string;
    price: number;
    currency: string;
    sizes: string[];
  };
}

export function TryOnOverlay({
  userId,
  productId,
  avatarGlbUrl,
  clothingGlbUrl,
  apiKey,
  product,
}: TryOnOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { status, result, error, triggerTryOn, reset } = useTryOn({ userId, apiKey });

  const handleTryOn = () => {
    triggerTryOn(productId, avatarGlbUrl, clothingGlbUrl);
  };

  return (
    <div
      id="vexa-tryon-overlay"
      className="w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#bef264]/10 flex items-center justify-center">
            <Shirt className="w-4 h-4 text-[#bef264]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Try on your avatar</p>
            {product && (
              <p className="text-white/40 text-xs">{product.brand} · {product.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'ready' && (
            <span className="px-2 py-0.5 rounded-full bg-[#bef264]/20 text-[#bef264] text-xs font-medium">
              Fitted
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* 3D Viewer */}
          <AvatarViewer
            glbUrl={status === 'ready' ? (result?.result_url ?? result?.resultImage ?? avatarGlbUrl) : avatarGlbUrl}
            className="h-72"
            showControls
          />

          {/* Try-On Controls */}
          {status === 'idle' && (
            <button
              id="vexa-tryon-trigger"
              onClick={handleTryOn}
              className="w-full py-3 rounded-xl bg-[#bef264] text-black font-semibold text-sm hover:bg-[#a3e635] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(190,242,100,0.3)]"
            >
              <Shirt className="w-4 h-4" />
              Try This On My Avatar
            </button>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-3 text-white/60 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#bef264]" />
              Draping clothing on your avatar…
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm flex-1">{error}</p>
              <button
                onClick={reset}
                className="text-white/60 hover:text-white text-xs underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Fit Metadata */}
          {status === 'ready' && result && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-[#bef264]" />
                  <span className="text-white/50 text-xs">Fit Score</span>
                </div>
                <p className="text-white font-bold text-lg">{result.fitScore ?? '—'}%</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Ruler className="w-3 h-3 text-[#bef264]" />
                  <span className="text-white/50 text-xs">Your Size</span>
                </div>
                <p className="text-white font-bold text-lg">{result.sizeRecommendation ?? '—'}</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-[#bef264]" />
                  <span className="text-white/50 text-xs">Status</span>
                </div>
                <p className="text-[#bef264] font-bold text-sm">Ready</p>
              </div>
            </div>
          )}

          {/* Retake */}
          {status === 'ready' && (
            <button
              onClick={reset}
              className="w-full py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm transition-colors"
            >
              Reset view
            </button>
          )}
        </div>
      )}
    </div>
  );
}

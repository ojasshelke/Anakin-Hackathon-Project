"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Ruler, Box, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarViewer } from '@/components/AvatarViewer';
import { AvatarCarousel } from '@/components/AvatarCarousel';
import { useClothingGlb } from '@/hooks/useClothingGlb';

/** Public fallback GLB — full URL, not a local path */
const FALLBACK_AVATAR_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb';

interface AvatarApiResponse {
  status: string;
  glbUrl?: string;
  error?: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { selectedOutfit, currentUser, tryOnResult } = useStore();

  const [fitLabel, setFitLabel] = useState<string | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  const [isSizeLoading, setIsSizeLoading] = useState(false);

  // Avatar URL state — fetched from /api/avatar/[userId]
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  // Clothing GLB — call useClothingGlb with the selected outfit
  const {
    glbUrl: clothingGlbUrl,
    isLoading: isClothingLoading,
  } = useClothingGlb(
    selectedOutfit?.id,
    selectedOutfit?.imageUrl,
    'tops'
  );

  // Redirect if no outfit selected
  useEffect(() => {
    if (!selectedOutfit) {
      router.push('/products');
    }
  }, [selectedOutfit, router]);

  // Fetch signed avatar URL from /api/avatar/[userId] on mount
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchAvatarUrl = async () => {
      setIsAvatarLoading(true);
      try {
        const res = await fetch(`/api/avatar/${currentUser.id}`);
        if (res.ok) {
          const data: AvatarApiResponse = await res.json();
          if (data.status === 'ready' && data.glbUrl) {
            setAvatarUrl(data.glbUrl);
          } else {
            setAvatarUrl(FALLBACK_AVATAR_URL);
          }
        } else {
          setAvatarUrl(FALLBACK_AVATAR_URL);
        }
      } catch {
        setAvatarUrl(FALLBACK_AVATAR_URL);
      } finally {
        setIsAvatarLoading(false);
      }
    };

    void fetchAvatarUrl();
  }, [currentUser?.id]);

  // Fetch size recommendation
  useEffect(() => {
    const fetchSize = async () => {
      if (!currentUser?.id || !selectedOutfit?.id) return;
      setIsSizeLoading(true);
      try {
        const res = await fetch("/api/size", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, productId: selectedOutfit.id })
        });
        if (res.ok) {
          const data = await res.json() as { fitLabel?: string; recommendedSize?: string };
          setFitLabel(data.fitLabel ?? null);
          setRecommendedSize(data.recommendedSize ?? null);
        }
      } catch (e) {
        console.error("Size fetch failed:", e);
      } finally {
        setIsSizeLoading(false);
      }
    };

    void fetchSize();
  }, [currentUser, selectedOutfit]);

  if (!selectedOutfit) return null;

  const displayImage = tryOnResult?.resultImage || selectedOutfit.imageUrl;
  const is3DLoading = isAvatarLoading || isClothingLoading;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 relative min-h-screen pb-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[#bef264]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Left: Premium Avatar Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <AvatarCarousel 
            avatarUrl={avatarUrl}
            outfits={selectedOutfit ? [
                {
                    id: selectedOutfit.id,
                    name: selectedOutfit.name,
                    brand: selectedOutfit.brand || 'VEXA Selection',
                    glbUrl: clothingGlbUrl || '',
                    imageUrl: selectedOutfit.imageUrl
                }
            ].filter(o => o.glbUrl) : []}
            className="w-full"
          />
        </motion.div>

        {/* Right: Details & Features */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-[#bef264] mb-2">
              {selectedOutfit.category}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              {selectedOutfit.name}
            </h1>
            <div className="text-2xl font-medium text-white/90">
              ${selectedOutfit.price.toFixed(2)}
            </div>
          </div>

          <div className="h-px w-full bg-white/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Size Recommendation Panel */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-[#bef264]/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#bef264]/10 blur-xl rounded-full" />
              <div className="flex items-center gap-2 text-white/60 font-semibold uppercase tracking-wider text-xs">
                <Ruler className="w-4 h-4" />
                VEXA Fit Engine
              </div>

              {isSizeLoading ? (
                <div className="h-10 flex items-center">
                  <div className="w-5 h-5 border-2 border-[#bef264]/30 border-t-[#bef264] rounded-full animate-spin" />
                </div>
              ) : fitLabel && recommendedSize ? (
                <div>
                  <p className="text-white text-sm mb-1">
                    This fits you <span className="font-bold text-[#bef264]">{fitLabel}</span>
                  </p>
                  <p className="text-2xl font-black text-white">
                    Try Size {recommendedSize}
                  </p>
                </div>
              ) : (
                <p className="text-white/50 text-sm">Please upload photos to get personalized sizing.</p>
              )}
            </div>

            {/* Fit Confidence Panel */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <div className="flex items-center gap-2 text-white/60 font-semibold uppercase tracking-wider text-xs">
                <Box className="w-4 h-4 text-[#bef264]" />
                Physics Accuracy
              </div>
              <p className="text-white text-sm">
                Real-time fabric draping enabled. Toggle 3D view in the carousel to inspect the fit from any angle.
              </p>
            </div>
          </div>

          <button className="w-full py-4 rounded-2xl bg-[#bef264] text-black font-bold text-lg hover:bg-[#a3e635] hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] transition-all flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Download, Heart, RefreshCw, Zap, CheckCircle2, AlertCircle, Ruler } from "lucide-react";

export default function ResultUI() {
  const { currentUser, userPhotoUrl, selectedOutfit, tryOnResult, setTryOnResult, addFavorite, favorites } = useStore();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [fitLabel, setFitLabel] = useState<string | null>(null);
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
  const [isSizeLoading, setIsSizeLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTryOn = useCallback(async () => {
    if (!currentUser?.id || !userPhotoUrl || !selectedOutfit) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userPhotoUrl,
          productImageUrl: selectedOutfit.imageUrl,
          productId: selectedOutfit.id
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to process try-on");
      }
      
      setTryOnResult({
        id: `${Date.now()}`,
        userId: currentUser.id,
        productId: selectedOutfit.id,
        originalImage: userPhotoUrl,
        resultImage: data.resultUrl,
        outfit: selectedOutfit,
        status: 'ready'
      });
      
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userPhotoUrl, selectedOutfit, setTryOnResult]);

  const fetchSize = useCallback(async () => {
    if (!currentUser?.id || !selectedOutfit?.id) return;
    setIsSizeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const res = await fetch("/api/size", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userId: currentUser.id, productId: selectedOutfit.id })
      });
      if (res.ok) {
        const data = await res.json();
        setFitLabel(data.fitLabel);
        setRecommendedSize(data.recommendedSize);
      }
    } catch (e) {
      console.error("Size fetch failed:", e);
    } finally {
      setIsSizeLoading(false);
    }
  }, [currentUser, selectedOutfit]);

  useEffect(() => {
    if (selectedOutfit && currentUser?.id) {
      fetchSize();
    }
  }, [selectedOutfit, currentUser, fetchSize]);

  const isFavorited = favorites.some(f => f.id === tryOnResult?.id);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isDragging]);

  if (!tryOnResult) return null;

  const outfit = tryOnResult.outfit;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-5xl mx-auto flex-col gap-6 relative"
    >
      <div className="flex items-center justify-between mb-6 block w-full">
        <div>
          <h2 className="text-3xl font-medium text-white tracking-wide flex items-center gap-3">
            Your Final Look
          </h2>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Generation successful
          </p>
        </div>
        <button 
          onClick={() => {
            setTryOnResult(null);
          }}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/70 hover:text-white"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Comparison Slider */}
          <div 
            ref={containerRef}
            className="relative w-full aspect-[3/4] sm:aspect-square md:aspect-[4/3] glass-panel overflow-hidden cursor-ew-resize select-none border border-white/10 hover:border-[#bef264]/50 transition-colors duration-500 shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            <div className="absolute inset-0 bg-[#bef264]/20 blur-3xl opacity-50" />
            
            <motion.div 
              initial={{ filter: "blur(20px)", scale: 1.05 }}
              animate={{ filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {tryOnResult.resultImage && (
                <img 
                  src={tryOnResult.resultImage} 
                  className="w-full h-full object-cover relative z-10" 
                  alt="AI Generated Result"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] z-20 pointer-events-none" />
            </motion.div>
            
            <div 
              className="absolute inset-0 h-full overflow-hidden border-r-2 border-[#bef264] z-30 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.5)]"
              style={{ width: `${sliderPosition}%` }}
            >
              {tryOnResult.originalImage && (
                <img 
                  src={tryOnResult.originalImage} 
                  className="w-full h-full object-cover max-w-none" 
                  style={{ width: containerRef.current?.offsetWidth || '100%' }}
                  alt="Original Upload"
                  draggable={false}
                />
              )}
            </div>

            <div 
              className="absolute top-0 bottom-0 w-1 bg-transparent flex items-center justify-center pointer-events-none z-40"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-[0_0_20px_rgba(139,92,246,0.6)] flex items-center justify-center text-black/50 border border-black/10 transition-transform active:scale-110">
                <ChevronLeft className="w-4 h-4 -mr-1 text-zinc-800" />
                <ChevronRight className="w-4 h-4 text-zinc-800" />
              </div>
            </div>

            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-xs font-semibold tracking-wide text-white/90 shadow-lg pointer-events-none border border-white/5 z-40">
              Original
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#bef264] to-[#a3e635] text-xs font-semibold tracking-wide text-white shadow-lg pointer-events-none border border-white/10 z-40 flex items-center gap-1.5 box-glow">
              <Zap className="w-3 h-3 fill-white" />
              AI Result
            </div>
          </div>

          {/* Size Recommendation Badge */}
          {fitLabel && recommendedSize && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-[#bef264]/10 border border-[#bef264]/20 rounded-xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(190,242,100,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#bef264]/20 rounded-lg">
                  <Ruler className="w-5 h-5 text-[#bef264]" />
                </div>
                <p className="text-white font-medium text-sm sm:text-base">
                  This fits you <span className="font-bold text-[#bef264]">{fitLabel}</span> — try size <span className="font-bold text-[#bef264]">{recommendedSize}</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="glass-panel p-5">
            <h3 className="text-sm font-semibold tracking-wide text-white/60 uppercase mb-4">Garment Used</h3>
            
            <div className="flex gap-4">
              {outfit?.imageUrl && (
                <img 
                  src={outfit.imageUrl} 
                  className="w-16 h-20 object-cover rounded-lg bg-white/5 border border-white/10 my-auto shadow-md" 
                  alt={outfit.name || 'Outfit'} 
                />
              )}
              <div className="flex-1 min-w-0 py-1">
                {outfit?.category && (
                  <span className="text-[10px] uppercase tracking-wider text-[#d9f99d] block font-medium mb-1 border border-[#d9f99d]/30 bg-[#bef264]/10 w-fit px-1.5 py-0.5 rounded">
                    {outfit.category}
                  </span>
                )}
                <h4 className="text-white font-medium text-sm mb-1 truncate">
                  {outfit?.name || 'Vexa Selection'}
                </h4>
                <div className="text-white/80 text-sm font-medium">
                  ${(outfit?.price || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                if (!isFavorited) addFavorite(tryOnResult);
              }}
              className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-medium tracking-wide transition-all duration-300 ${
                isFavorited 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 active:bg-white/5'
              }`}
            >
              <Heart className={`w-5 h-5 transition-transform duration-300 ${isFavorited ? 'fill-rose-400 scale-110' : ''}`} />
              {isFavorited ? 'Saved to Favorites' : 'Save to Favorites'}
            </button>
            
            <a 
              href={tryOnResult.resultImage!}
              download={`tryon_${tryOnResult.productId}.png`}
              target="_blank"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#bef264] to-[#a3e635] text-white hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 font-medium tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/10 text-sm"
            >
              <Download className="w-5 h-5" />
              Download High-Res
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

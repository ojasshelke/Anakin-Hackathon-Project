"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarViewer } from '@/components/AvatarViewer';
import { ChevronLeft, ChevronRight, Box, Camera, Sparkles, User } from 'lucide-react';

interface AvatarCarouselProps {
  avatarUrl: string | null;
  outfits?: Array<{
    id: string;
    name: string;
    glbUrl: string;
    imageUrl: string;
    brand: string;
  }>;
  className?: string;
}

export function AvatarCarousel({ avatarUrl, outfits = [], className = '' }: AvatarCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'3d' | 'image'>('3d');

  const items = [
    { type: 'base', glbUrl: avatarUrl, name: 'Natural Body', description: 'Your precise 3D topology', imageUrl: undefined },
    ...outfits.map(o => ({ type: 'outfit', glbUrl: o.glbUrl, name: o.name, description: o.brand, imageUrl: o.imageUrl }))
  ].filter(item => item.glbUrl);

  const next = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  const currentItem = items[currentIndex];

  if (items.length === 0) {
    return (
      <div className={`w-full aspect-[3/4] rounded-3xl bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <User className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/30 text-sm font-medium">No 3D data available</p>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Main Display Area */}
      <div className="relative aspect-[3/4] w-full rounded-[32px] overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-2xl">
        <AnimatePresence mode="wait">
          {viewMode === '3d' ? (
            <motion.div
              key={`3d-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <AvatarViewer 
                avatarUrl={currentItem.glbUrl} 
                className="w-full h-full border-none bg-transparent"
                showControls={false}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`img-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <img 
                src={currentItem.imageUrl || '/placeholder-outfit.jpg'} 
                alt={currentItem.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Metadata */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={currentItem.name}
              className="text-[#bef264] text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#bef264]/20 w-fit"
            >
              {currentItem.type === 'base' ? 'Core Profile' : 'Digital Fit'}
            </motion.span>
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={currentItem.name + 'h3'}
              className="text-white text-xl font-bold tracking-tight"
            >
              {currentItem.name}
            </motion.h3>
          </div>

          <div className="flex gap-2 pointer-events-auto">
             <button 
               onClick={() => setViewMode(viewMode === '3d' ? 'image' : '3d')}
               className="p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white/70 hover:text-white hover:border-[#bef264]/40 transition-all shadow-xl"
             >
               {viewMode === '3d' ? <Camera className="w-4 h-4" /> : <Box className="w-4 h-4" />}
             </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {items.length > 1 && (
            <>
                <button 
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 text-white/40 hover:text-white hover:bg-black/60 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 text-white/40 hover:text-white hover:bg-black/60 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                >
                <ChevronRight className="w-6 h-6" />
                </button>
            </>
        )}

        {/* Bottom Progress/Thumbnails */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-[#bef264]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails Strip (Optional Premium Touch) */}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
              idx === currentIndex ? 'border-[#bef264] scale-105 shadow-[0_0_15px_rgba(190,242,100,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'
            }`}
          >
            {item.imageUrl ? (
                <img src={item.imageUrl} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-white/20" />
                </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

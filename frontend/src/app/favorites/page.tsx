"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Download, Trash2, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useStore();

  return (
    <div className="w-full py-8 max-w-6xl mx-auto min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#d9f99d] hover:text-white transition-colors text-sm font-medium tracking-wide">
            <ArrowLeft className="w-4 h-4" />
            Back to Studio
          </Link>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white flex items-center gap-4">
            Favorites
            <Heart className="w-8 h-8 md:w-10 md:h-10 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
          </h1>
          <p className="text-white/60 font-medium tracking-wide">
            Your personal collection of premium AI generated looks.
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md">
          <span className="text-white/80 font-medium">
            <strong className="text-white">{favorites.length}</strong> {favorites.length === 1 ? 'item' : 'items'} saved
          </span>
        </div>
      </div>

      <AnimatePresence>
        {favorites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center justify-center py-24 glass-panel border-dashed border-white/10"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-white/20" />
            </div>
            <h2 className="text-2xl font-medium text-white mb-2">No favorites yet</h2>
            <p className="text-white/50 mb-8 max-w-sm text-center">
              Try on some garments and save exploring looks to build your personal collection.
            </p>
            <Link 
              href="/"
              className="px-8 py-3 rounded-full bg-[#bef264] text-white hover:bg-[#a3e635] transition-colors font-medium tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            >
              Start Exploring
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id ?? fav.productId}
                initial={{ opacity: 1, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 1, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                className="group relative glass-panel overflow-hidden flex flex-col border border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] transition-all duration-500"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img 
                    src={fav.resultImage!} 
                    alt="AI Gen"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Actions overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 hover:scale-110 shadow-xl transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeFavorite(fav.id ?? '')}
                      className="p-3 rounded-full bg-rose-500/20 hover:bg-rose-500/40 backdrop-blur-md text-rose-300 border border-rose-500/30 hover:scale-110 shadow-xl transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex items-center justify-between bg-black/40 backdrop-blur-xl border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <img 
                      src={fav.outfit?.imageUrl!} 
                      className="w-10 h-10 rounded-md object-cover border border-white/10" 
                      alt="" 
                    />
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[150px]">{fav.outfit?.name!}</p>
                      <p className="text-xs text-[#d9f99d] font-medium tracking-wide uppercase">{fav.outfit?.category!}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Outfit } from "@/types";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const OUTFITS: Outfit[] = [
  {
    id: "outfit-1",
    name: "Urban Explorer Jacket",
    price: 129.99,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=800&fit=crop",
    category: "outerwear"
  },
  {
    id: "outfit-2",
    name: "Summer Silk Dress",
    price: 89.50,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop",
    category: "dresses"
  },
  {
    id: "outfit-3",
    name: "Classic Denim Look",
    price: 154.00,
    imageUrl: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=800&fit=crop",
    category: "tops"
  },
  {
    id: "outfit-4",
    name: "Midnight Evening Gown",
    price: 299.99,
    imageUrl: "https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600&h=800&fit=crop",
    category: "dresses"
  },
  {
    id: "outfit-5",
    name: "Minimalist T-Shirt",
    price: 35.00,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop",
    category: "tops"
  },
  {
    id: "outfit-6",
    name: "Tailored Power Suit",
    price: 499.00,
    imageUrl: "https://images.unsplash.com/photo-1578587018452-892bace94f12?w=600&h=800&fit=crop",
    category: "outerwear"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function OutfitSelection() {
  const { selectedOutfit, setSelectedOutfit, currentUser, userPhotoUrl, userImage } = useStore();
  const [batchResults, setBatchResults] = useState<Record<string, string>>({});
  const [isBatchPending, setIsBatchPending] = useState(false);

  // The photo is available if either a Supabase URL or a local preview base64 exists
  const hasPhoto = !!userPhotoUrl || !!userImage;

  useEffect(() => {
    if (currentUser?.id && userPhotoUrl) {
      setIsBatchPending(true);
      
      const payload = {
        userId: currentUser.id,
        userPhotoUrl,
        products: OUTFITS.map(o => ({
          productId: o.id,
          productImageUrl: o.imageUrl
        }))
      };

      // Get session for auth
      supabase.auth.getSession().then(({ data: { session } }) => {
        fetch('/api/tryon/batch', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
          const resultsMap: Record<string, string> = {};
          if (Array.isArray(data)) {
            data.forEach((item: { productId: string, resultUrl: string }) => {
              if (item.resultUrl) {
                resultsMap[item.productId] = item.resultUrl;
              }
            });
          }
          setBatchResults(resultsMap);
        })
        .catch(console.error)
        .finally(() => {
          setIsBatchPending(false);
        });
      });
    }
  }, [currentUser, userPhotoUrl]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${hasPhoto ? 'bg-[#bef264] text-white' : 'bg-[#bef264]/20 text-[#d9f99d]'}`}>
          <span className="font-semibold">2</span>
        </div>
        <h2 className={`text-xl font-medium tracking-wide transition-colors duration-500 ${hasPhoto ? 'text-white' : 'text-white/50'}`}>
          Select Garment
        </h2>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6"
      >
        {OUTFITS.map((outfit) => {
          const isSelected = selectedOutfit?.id === outfit.id;
          const hasResult = !!batchResults[outfit.id];
          const displayImage = hasResult ? batchResults[outfit.id] : outfit.imageUrl;
          const isItemLoading = isBatchPending && !hasResult && !!userPhotoUrl;
          
          return (
            <motion.div
              key={outfit.id}
              variants={itemVariants}
              onClick={() => hasPhoto && setSelectedOutfit(outfit)}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden glass-panel transition-all duration-300 ${
                !hasPhoto ? 'opacity-40 grayscale-[0.8] cursor-not-allowed hover:transform-none' : 'hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)]'
              } ${isSelected ? 'ring-2 ring-[#bef264] shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'ring-1 ring-white/5'}`}
            >
              <div className="aspect-[3/4] overflow-hidden relative">
                <img 
                  src={displayImage} 
                  alt={outfit.name} 
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${hasPhoto ? 'group-hover:scale-110' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                
                {/* Loading State for Item */}
                {isItemLoading && (
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md rounded-full p-1.5 shadow-lg z-10 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-[#bef264] animate-spin" />
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-8 h-8 bg-[#bef264] rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 transition-transform">
                  <span className="text-xs uppercase tracking-wider text-[#d9f99d] mb-1 block font-medium">{outfit.category}</span>
                  <h3 className="text-white font-medium truncate mb-1">{outfit.name}</h3>
                  <div className="text-white/70 text-sm">${outfit.price.toFixed(2)}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

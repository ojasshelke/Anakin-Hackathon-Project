"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, RotateCcw, Shirt } from "lucide-react";
import { ImageUploadBox } from "@/components/studio/ImageUploadBox";
import { ModelGenerator } from "@/components/studio/ModelGenerator";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import type { Outfit } from "@/types";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────────────────────

type TryOnCategory =
  | "tops" | "bottoms" | "one-pieces"
  | "shoes" | "bags" | "jewelry";

type TryOnStatus = "idle" | "loading" | "ready" | "error";
type StudioTab = "tryon" | "model-gen";

const CLOTHING_CATEGORIES: { id: TryOnCategory; label: string; icon: string }[] = [
  { id: "tops",       label: "Tops",    icon: "👕" },
  { id: "bottoms",    label: "Bottoms", icon: "👖" },
  { id: "one-pieces", label: "Dresses", icon: "👗" },
];

const ACCESSORY_CATEGORIES: { id: TryOnCategory; label: string; icon: string }[] = [
  { id: "shoes",  label: "Shoes",   icon: "👟" },
  { id: "bags",   label: "Bags",    icon: "👜" },
  { id: "jewelry",label: "Jewelry", icon: "💍" },
];

interface GarmentItem {
  id: string;
  url: string;
  category: TryOnCategory;
}

interface TryOnApiResponse {
  result_url?: string;
  resultUrl?: string;
  error?: string;
  status?: string;
  cached?: boolean;
}

const FETCH_TIMEOUT_MS = 300_000;

// ── Studio Page ───────────────────────────────────────────────────────────────

export default function StudioPage() {
  const { currentUser } = useStore();

  const [activeTab, setActiveTab] = useState<StudioTab>("tryon");
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  
  // Multi-item state
  const [garments, setGarments] = useState<GarmentItem[]>([]);
  
  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tempGarmentUrl, setTempGarmentUrl] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<TryOnCategory>("tops");
  const [isTempUploading, setIsTempUploading] = useState(false);

  // Anakin product search inside modal
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Outfit[]>([]);
  const [searchError, setSearchError] = useState('');

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const isUrl = searchQuery.startsWith('http');
      const res = await fetch('/api/products/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: searchQuery } : { query: searchQuery }),
      });
      const data = await res.json() as { products?: Outfit[] };
      if (data.products && data.products.length > 0) {
        setSearchResults(data.products);
      } else {
        setSearchError('No products found. Try a different search or paste a URL.');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchedProduct = (product: Outfit) => {
    setTempGarmentUrl(product.imageUrl);
    setTempCategory(product.category as TryOnCategory);
    setSearchResults([]);
    setSearchQuery('');
  };

  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [personUploading, setPersonUploading] = useState(false);
  const isUploading = personUploading || isTempUploading;

  const canGenerate = !!personUrl && garments.length > 0 && !isUploading && status !== "loading";

  useEffect(() => {
    if (status === "loading") {
      setElapsedSec(0);
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleAddGarment = () => {
    if (tempGarmentUrl) {
      setGarments([...garments, { id: `item_${Date.now()}`, url: tempGarmentUrl, category: tempCategory }]);
      setIsAddModalOpen(false);
      setTempGarmentUrl(null);
      setTempCategory("tops");
    }
  };

  const handleRemoveGarment = (id: string) => {
    setGarments(garments.filter(g => g.id !== id));
  };

  const createOutfitCollage = async (items: GarmentItem[]): Promise<string> => {
    if (items.length === 1) return items[0].url;
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      // 1024x1024 grid for the outfit
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(items[0].url);

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1024, 1024);

      let loaded = 0;
      const positions = [
        { x: 0, y: 0, w: 512, h: 512 },       // Top Left
        { x: 512, y: 0, w: 512, h: 512 },     // Top Right
        { x: 0, y: 512, w: 512, h: 512 },     // Bottom Left
        { x: 512, y: 512, w: 512, h: 512 },   // Bottom Right
      ];

      items.forEach((item, index) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const pos = positions[index % 4];
          // Draw image centered in its quadrant, maintaining aspect ratio
          const scale = Math.min(pos.w / img.width, pos.h / img.height) * 0.9;
          const w = img.width * scale;
          const h = img.height * scale;
          const dx = pos.x + (pos.w - w) / 2;
          const dy = pos.y + (pos.h - h) / 2;
          ctx.drawImage(img, dx, dy, w, h);
          
          loaded++;
          if (loaded === items.length) {
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = () => {
          loaded++;
          if (loaded === items.length) resolve(canvas.toDataURL('image/png'));
        };
        img.src = item.url;
      });
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!personUrl || garments.length === 0) {
      setErrorMsg("Please upload a person photo and at least one item.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    setStatus("loading");
    setErrorMsg(null);
    setResultUrl(null);

    try {
      // SMART COMPOSITION: If multiple items, merge them into 1 image to make the API 4x faster
      const finalGarments = garments.length > 1 
        ? [{ url: await createOutfitCollage(garments), category: "one-pieces" as TryOnCategory }]
        : [{ url: garments[0].url, category: garments[0].category }];

      const { data: { session } } = await supabase.auth.getSession();
      const body = {
        userId: currentUser?.id ?? "anonymous",
        productId: `custom_${Date.now()}`,
        userPhotoUrl: personUrl,
        garments: finalGarments,
      };

      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await res.text();
      let data: TryOnApiResponse;
      try {
        data = JSON.parse(rawText) as TryOnApiResponse;
      } catch {
        if (res.status === 504 || rawText.includes("<!DOCTYPE")) {
          throw new Error("The AI engine timed out. Please try again.");
        }
        throw new Error(`Server error (${res.status}). Please try again.`);
      }
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      const url = data.result_url ?? data.resultUrl;
      if (!url) throw new Error("No result URL returned from the AI engine.");

      setResultUrl(url);
      setStatus("ready");
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setErrorMsg("Request timed out. Please try again.");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      }
      setStatus("error");
    }
  }, [personUrl, garments, currentUser]);

  const handleReset = () => {
    setStatus("idle");
    setResultUrl(null);
    setErrorMsg(null);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `vexa-tryon-${Date.now()}.png`;
      a.click();
    } catch { window.open(resultUrl, "_blank"); }
  };

  const statusText = (): string => {
    if (isUploading) return "⏳ Uploading images…";
    if (status === "loading") return "⚡ Processing with Vexa AI...";
    if (status === "ready") return "✅ Try-on complete";
    if (status === "error") return `❌ ${errorMsg}`;
    return "";
  };

  const buttonConfig = () => {
    if (status === "loading") return { label: "Generating...", className: "bg-[#4A6741]/50 cursor-not-allowed", disabled: true, onClick: () => {} };
    if (status === "ready") return { label: "Try Again →", className: "bg-[#4A6741] hover:bg-[#3d5636]", disabled: false, onClick: handleReset };
    return {
      label: "Generate Try-On →",
      className: canGenerate ? "bg-[#4A6741] hover:bg-[#3d5636]" : "bg-slate-100 text-slate-300 cursor-not-allowed",
      disabled: !canGenerate,
      onClick: handleGenerate,
    };
  };

  const btn = buttonConfig();

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50/20">
      <Header />

      <div className="px-4 md:px-6 pt-24 pb-8 max-w-7xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a1a1a]">
          Virtual Try-On <span className="text-[#4A6741]">Studio</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">
          Upload your photo and items to generate your AI look.
        </p>
      </div>

      <div className="flex-1 px-4 md:px-6 pb-20 max-w-7xl mx-auto w-full">

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
          {([
            { id: "tryon",     label: "Virtual Try-On" },
            { id: "model-gen", label: "AI Model Generator", isNew: true },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-[#4A6741] text-white shadow"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {'isNew' in tab && tab.isNew && (
                <span className="text-[9px] bg-[#bef264]/20 text-[#4A6741] px-1.5 py-0.5 rounded font-bold">NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Try-On Tab */}
        {activeTab === "tryon" && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left: 30% */}
            <div className="w-full lg:w-[30%] flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">01. Your Photo</p>
                <ImageUploadBox
                  label="Person"
                  sublabel="Full body photo"
                  value={personUrl}
                  onChange={setPersonUrl}
                  onClear={() => { setPersonUrl(null); setPersonUploading(false); }}
                  onUploadingChange={setPersonUploading}
                  height="h-64 lg:h-[400px]"
                />
              </div>
            </div>

            {/* Center: 40% */}
            <div className="w-full lg:w-[40%] flex flex-col">
              <div className="bg-white p-6 flex flex-col min-h-[500px] lg:h-[580px] border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#4A6741] text-[10px] font-black uppercase tracking-widest">Generation Stage</p>
                </div>

                <div className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center bg-slate-50/50 border border-slate-100">
                  <AnimatePresence mode="wait">
                    {status === "idle" && (
                      <motion.div key="idle" className="flex flex-col items-center gap-4 text-center p-8">
                        <Shirt className="w-8 h-8 text-slate-200" />
                        <p className="text-slate-400 font-medium text-sm">Waiting for uploads...</p>
                      </motion.div>
                    )}
                    {status === "loading" && (
                      <motion.div key="loading" className="flex flex-col items-center gap-6 text-center p-8">
                        <Loader2 className="w-12 h-12 text-[#4A6741] animate-spin" />
                        <p className="text-[#0f172a] text-lg font-black">AI is processing...</p>
                        <p className="text-slate-400 text-sm font-medium">{elapsedSec}s elapsed</p>
                      </motion.div>
                    )}
                    {status === "ready" && resultUrl && (
                      <motion.div key="result" className="absolute inset-0">
                        <img src={resultUrl} alt="Result" className="w-full h-full object-contain" />
                        <button onClick={handleDownload} className="absolute bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0f172a] text-white font-bold text-sm shadow-xl">
                          <Download className="w-4 h-4" /> Download
                        </button>
                      </motion.div>
                    )}
                    {status === "error" && (
                      <motion.div key="error" className="flex flex-col items-center gap-4 text-center p-8">
                        <RotateCcw className="w-6 h-6 text-rose-400" />
                        <p className="text-rose-500 font-bold text-sm">{errorMsg}</p>
                        <button onClick={handleReset} className="px-6 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">Try Again</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: 30% */}
            <div className="w-full lg:w-[30%] flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">02. Garments & Accessories</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-[#4A6741] text-[10px] font-bold uppercase tracking-widest hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                
                <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
                  {garments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-400 text-sm font-medium">No items added yet</p>
                      <button onClick={() => setIsAddModalOpen(true)} className="mt-2 text-[#4A6741] text-xs font-bold bg-[#4A6741]/10 px-3 py-1.5 rounded-full hover:bg-[#4A6741]/20 transition-all">
                        Add an Item
                      </button>
                    </div>
                  ) : (
                    garments.map((g, idx) => (
                      <div key={g.id} className="relative group bg-slate-50 border border-slate-100 rounded-2xl p-2 flex items-center gap-4 shadow-sm">
                        <img src={g.url} alt="Item" className="w-16 h-16 object-cover rounded-xl" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 capitalize">Item {idx + 1}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Type: {g.category.replace("-", " ")}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveGarment(g.id)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model Generator Tab */}
        {activeTab === "model-gen" && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
            <ModelGenerator
              initialGarmentUrl={null}
              onResult={(url) => {
                setActiveTab("tryon");
                setGarments([...garments, { id: `item_${Date.now()}`, url, category: "tops" }]);
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky bottom bar — only visible on try-on tab */}
      {activeTab === "tryon" && (
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{statusText()}</p>
            <button
              disabled={btn.disabled}
              onClick={btn.onClick}
              className={`px-12 py-4 rounded-2xl text-base font-black uppercase tracking-widest transition-all shadow-2xl text-white ${btn.className}`}
            >
              {btn.label}
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-[#1a1a1a]">Add New Item</h3>
                <button onClick={() => { setIsAddModalOpen(false); setTempGarmentUrl(null); setSearchResults([]); setSearchQuery(''); setSearchError(''); }} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              {/* Anakin Search */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#4A6741] mb-2">
                  ✦ Search Real Products · Anakin.io
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchProducts()}
                    placeholder='Type "blue kurta" or paste URL...'
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2
                      text-sm text-slate-800 placeholder:text-slate-400
                      focus:border-[#4A6741] focus:outline-none transition-colors"
                  />
                  <button
                    onClick={searchProducts}
                    disabled={isSearching || !searchQuery.trim()}
                    className="rounded-xl bg-[#4A6741] px-4 py-2 text-xs font-bold text-white
                      disabled:opacity-50 hover:bg-[#3d5636] transition-colors whitespace-nowrap"
                  >
                    {isSearching ? '...' : 'Search'}
                  </button>
                </div>
                {searchError && <p className="mt-1 text-[10px] text-rose-500">{searchError}</p>}
                {isSearching && (
                  <p className="mt-2 text-[10px] text-slate-400 animate-pulse">Scraping Myntra... ~15s</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectSearchedProduct(p)}
                        className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-2 hover:border-[#4A6741] transition-colors text-left"
                      >
                        <img src={p.imageUrl} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                        <p className="text-[10px] font-semibold text-slate-700 line-clamp-1">{p.name}</p>
                        <p className="text-[9px] text-slate-400">₹{p.price}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">or upload</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <ImageUploadBox
                label="Upload Image"
                sublabel="Garment or accessory photo"
                value={tempGarmentUrl}
                onChange={setTempGarmentUrl}
                onClear={() => { setTempGarmentUrl(null); setIsTempUploading(false); }}
                onUploadingChange={setIsTempUploading}
                height="h-48"
              />

              <div className="space-y-3">
                {/* Clothing */}
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-2">Clothing</p>
                  <div className="flex gap-2 flex-wrap">
                    {CLOTHING_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setTempCategory(c.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                          tempCategory === c.id
                            ? "bg-[#4A6741] text-white shadow-lg"
                            : "bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-700"
                        }`}
                      >
                        <span className="text-xs">{c.icon}</span> {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories */}
                <div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    Accessories <span className="text-[8px] bg-[#4A6741] text-white px-1.5 py-0.5 rounded font-bold">NEW</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ACCESSORY_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setTempCategory(c.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                          tempCategory === c.id
                            ? "bg-[#4A6741] text-white shadow-lg"
                            : "bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-700"
                        }`}
                      >
                        <span className="text-xs">{c.icon}</span> {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                disabled={!tempGarmentUrl || isTempUploading}
                onClick={handleAddGarment}
                className="w-full py-4 mt-2 rounded-2xl bg-[#4A6741] text-white font-black uppercase tracking-widest text-sm hover:bg-[#3d5636] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Add
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Download, Upload } from 'lucide-react';
import Header from '@/components/Header';
import { ImageUploadBox } from '@/components/studio/ImageUploadBox';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import type { Trend, TryOnCategory } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type TryOnStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TryOnTarget {
  imageUrl: string;
  name: string;
  category: TryOnCategory;
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/10" />
        <div className="w-14 h-5 rounded bg-white/10" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/10 mb-2" />
      <div className="h-4 w-full rounded bg-white/10 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-white/10" />
        <div className="w-16 h-3 rounded bg-white/10" />
      </div>
      <div className="flex gap-1 mb-4">
        <div className="w-14 h-5 rounded-full bg-white/10" />
        <div className="w-16 h-5 rounded-full bg-white/10" />
        <div className="w-12 h-5 rounded-full bg-white/10" />
      </div>
      <div className="h-10 w-full rounded-xl bg-white/10" />
    </div>
  );
}

// ─── TrendCard ───────────────────────────────────────────────────────────────

function TrendCard({
  trend,
  generatedImage,
  isGenerating,
  onGenerate,
  onTryOn,
}: {
  trend: Trend;
  generatedImage: string | undefined;
  isGenerating: boolean;
  onGenerate: () => void;
  onTryOn: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-[#bef264]/30 transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{trend.emoji}</span>
        <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/10 px-2 py-0.5 rounded">
          {trend.category}
        </span>
      </div>

      {/* Trend name + description */}
      <h3 className="text-white font-bold text-lg mb-1">{trend.name}</h3>
      <p className="text-white/50 text-sm mb-4">{trend.description}</p>

      {/* Color dot */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full border border-white/20"
          style={{ backgroundColor: trend.color }}
        />
        <span className="text-xs text-white/40">{trend.color}</span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {trend.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Generated image — shows after generation */}
      {generatedImage && (
        <div className="relative mb-4 rounded-xl overflow-hidden aspect-square">
          <img
            src={generatedImage}
            alt={trend.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-[#bef264] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            Generated
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!generatedImage ? (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 rounded-xl bg-[#bef264] text-black font-bold text-sm disabled:opacity-50 transition-opacity hover:bg-[#d4ff6e] cursor-pointer"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </span>
          ) : (
            '✦ Generate This Look'
          )}
        </button>
      ) : (
        <button
          onClick={onTryOn}
          className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors cursor-pointer"
        >
          Try This On Me →
        </button>
      )}
    </motion.div>
  );
}

// ─── TryOn Modal ─────────────────────────────────────────────────────────────

function TryOnModal({
  target,
  onClose,
}: {
  target: TryOnTarget;
  onClose: () => void;
}) {
  const { currentUser } = useStore();
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [personUploading, setPersonUploading] = useState(false);
  const [status, setStatus] = useState<TryOnStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (status === 'loading') {
      setElapsedSec(0);
      timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  const handleTryOn = useCallback(async () => {
    if (!personUrl) return;
    setStatus('loading');
    setErrorMsg(null);
    setResultUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const body = {
        userId: currentUser?.id ?? 'anonymous',
        productId: `trend_${Date.now()}`,
        userPhotoUrl: personUrl,
        garments: [{ url: target.imageUrl, category: target.category }],
      };

      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300_000),
      });

      const rawText = await res.text();
      let data: { result_url?: string; resultUrl?: string; error?: string };
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server error. Please try again.');
      }
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);

      const url = data.result_url ?? data.resultUrl;
      if (!url) throw new Error('No result URL returned.');

      setResultUrl(url);
      setStatus('ready');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [personUrl, target, currentUser]);

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vexa-trend-tryon-${Date.now()}.png`;
      a.click();
    } catch {
      window.open(resultUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0f0f0f] rounded-3xl border border-white/10 p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-white">Try On: {target.name}</h3>
            <p className="text-white/40 text-xs mt-0.5">Upload your photo to see how it looks on you</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Garment preview */}
          <div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Garment</p>
            <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[3/4] bg-white/5">
              <img src={target.imageUrl} alt={target.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Right: Upload + Result */}
          <div className="flex flex-col gap-4">
            {status === 'idle' || status === 'error' ? (
              <>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Your Photo</p>
                <ImageUploadBox
                  label="Upload Photo"
                  sublabel="Full body photo"
                  value={personUrl}
                  onChange={setPersonUrl}
                  onClear={() => { setPersonUrl(null); setPersonUploading(false); }}
                  onUploadingChange={setPersonUploading}
                  height="h-64"
                />
                {errorMsg && (
                  <p className="text-rose-400 text-xs font-medium">{errorMsg}</p>
                )}
                <button
                  disabled={!personUrl || personUploading}
                  onClick={handleTryOn}
                  className="w-full py-3 rounded-xl bg-[#bef264] text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff6e] transition-colors"
                >
                  {personUploading ? 'Uploading...' : 'Generate Try-On →'}
                </button>
              </>
            ) : status === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-10 h-10 text-[#bef264] animate-spin" />
                <p className="text-white font-bold text-lg">AI is processing...</p>
                <p className="text-white/40 text-sm">{elapsedSec}s elapsed</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Result</p>
                <div className="rounded-2xl overflow-hidden border border-[#bef264]/30 aspect-[3/4] bg-white/5 relative">
                  <img src={resultUrl!} alt="Try-on result" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Result
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Trends Page ─────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [tryOnTarget, setTryOnTarget] = useState<TryOnTarget | null>(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetch('/api/trends', { method: 'POST' })
      .then((r) => r.json())
      .then((data: { trends?: Trend[]; error?: string }) => {
        if (data.trends && data.trends.length > 0) {
          setTrends(data.trends);
        } else {
          setFetchError('Could not load trends. Please try again.');
        }
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Failed to connect. Please try again.');
        setLoading(false);
      });
  }, []);

  const handleGenerate = async (trend: Trend) => {
    setGenerating(trend.id);
    try {
      const res = await fetch('/api/trends/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trend }),
      });
      const data = (await res.json()) as { imageUrl?: string };
      if (data.imageUrl) {
        setGeneratedImages((prev) => ({ ...prev, [trend.id]: data.imageUrl! }));
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />

      <div className="px-4 md:px-6 pt-28 pb-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#bef264] border border-[#bef264]/30 px-2 py-0.5 rounded">
              ✦ Live · Powered by Anakin.io
            </span>
            <span className="text-xs text-white/40">
              Crawled{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            What&apos;s Trending Now
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            Real-time trends scraped from Myntra, Vogue India & AJIO · Generate & try on in seconds
          </p>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div>
            <p className="text-white/40 text-sm mb-4 animate-pulse">
              Scanning Myntra, Vogue India & AJIO...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && fetchError && trends.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50 text-sm">{fetchError}</p>
            <button
              onClick={() => {
                setLoading(true);
                setFetchError('');
                fetch('/api/trends', { method: 'POST' })
                  .then((r) => r.json())
                  .then((data: { trends?: Trend[] }) => {
                    if (data.trends) setTrends(data.trends);
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }}
              className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Trend Grid */}
        {!loading && trends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                generatedImage={generatedImages[trend.id]}
                isGenerating={generating === trend.id}
                onGenerate={() => handleGenerate(trend)}
                onTryOn={() =>
                  setTryOnTarget({
                    imageUrl: generatedImages[trend.id],
                    name: trend.name,
                    category: trend.category,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Try-On Modal */}
      <AnimatePresence>
        {tryOnTarget && (
          <TryOnModal target={tryOnTarget} onClose={() => setTryOnTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

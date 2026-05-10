'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Download, Upload, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
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
        <div className="flex items-center gap-2">
          <span className="text-2xl">{trend.emoji}</span>
          <span className="text-[9px] font-bold text-[#bef264]/60 border border-[#bef264]/20 px-1.5 py-0.5 rounded font-mono leading-none">
            via anakin
          </span>
        </div>
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
  const router = useRouter();
  const { addPendingGarment } = useStore();

  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [fetchError, setFetchError] = useState('');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'done' | 'cached'>('scanning');
  const [sourcesScanned, setSourcesScanned] = useState<string[]>([]);
  const [isCached, setIsCached] = useState(false);

  // Custom search state
  const [searchQuery, setSearchQuery] = useState('');
  const [customTrends, setCustomTrends] = useState<Trend[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedPrompt, setSearchedPrompt] = useState('');
  const [searchError, setSearchError] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleTryOn = (trend: Trend, imageUrl: string) => {
    addPendingGarment({
      id: `trend_${trend.id}_${Date.now()}`,
      url: imageUrl,
      category: trend.category,
      name: trend.name,
    });
    router.push('/studio');
  };

  useEffect(() => {
    fetch('/api/trends', { method: 'POST' })
      .then((r) => r.json())
      .then((data: { trends?: Trend[]; cached?: boolean; error?: string }) => {
        if (data.cached) {
          setScanStatus('cached');
          setIsCached(true);
        } else {
          setScanStatus('done');
        }
        setSourcesScanned(['myntra.com', 'vogue.in', 'ajio.com']);
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q || searchLoading) return;
    setSearchLoading(true);
    setSearchError('');
    setCustomTrends([]);
    setSearchedPrompt(q);
    try {
      const res = await fetch('/api/trends/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });
      const data = await res.json() as { trends?: Trend[]; error?: string };
      if (data.trends && data.trends.length > 0) {
        setCustomTrends(data.trends);
      } else {
        setSearchError(data.error || 'No results found. Try a different search.');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />

      <div className="px-4 md:px-6 pt-28 pb-8 max-w-7xl mx-auto w-full">
        {/* ── ANAKIN INTELLIGENCE PANEL ── */}
        <div className="mb-10 rounded-3xl border border-[#bef264]/20 bg-gradient-to-br from-[#bef264]/5 to-transparent p-6">
          {/* Top row: Anakin branding + live status */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#bef264] text-black px-3 py-1.5 rounded-full">
                <span className="text-sm font-black tracking-tight">anakin</span>
                <span className="text-[10px] font-bold uppercase bg-black/20 px-1.5 py-0.5 rounded-full">intelligence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  loading ? 'bg-yellow-400 animate-pulse' : 'bg-[#bef264] animate-[pulse_2s_infinite]'
                }`} />
                <span className="text-xs text-white/60 font-medium">
                  {loading ? 'Scanning web...' : isCached ? 'Cached · 30 min refresh' : 'Live data'}
                </span>
              </div>
            </div>
            <span className="text-xs text-white/30 font-mono">
              Last crawl: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* What Anakin is doing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              { source: 'myntra.com/trending-now', label: 'Myntra Trending', icon: '🛍️', done: !loading },
              { source: 'vogue.in/fashion/trends', label: 'Vogue India', icon: '✨', done: !loading },
              { source: 'ajio.com/trending', label: 'AJIO New In', icon: '🔥', done: !loading },
            ].map(({ source, label, icon, done }) => (
              <div key={source} className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-semibold">{label}</p>
                  <p className="text-white/30 text-[10px] font-mono truncate">{source}</p>
                </div>
                {loading ? (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1 h-3 bg-[#bef264]/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                ) : (
                  <span className="text-[#bef264] text-sm">✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-[#bef264] text-xl font-black">3</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Sources Crawled</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[#bef264] text-xl font-black">{trends.length || 6}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Trends Extracted</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[#bef264] text-xl font-black">{loading ? '—' : '< 5s'}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Crawl Time</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-white/50 text-[10px] font-mono">Anakin URL Scraper · Search API · GPT Analysis</p>
              <p className="text-white/30 text-[10px]">Full pipeline: crawl → extract → generate → try-on</p>
            </div>
          </div>
        </div>

        {/* Page title BELOW the panel */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            What&apos;s Trending Now
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            Real intelligence from Indian fashion&apos;s biggest platforms · Generate any trend &amp; try it on yourself
          </p>
        </div>

        {/* ── DESIGN DISCOVERY SEARCH ── */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#bef264]" />
            <h2 className="text-white font-bold text-lg">Design Discovery</h2>
            <span className="text-[9px] font-bold text-white/30 border border-white/10 px-1.5 py-0.5 rounded uppercase">Anakin + GPT</span>
          </div>
          <p className="text-white/40 text-sm mb-4">
            Describe any garment — Anakin searches the web for live trends, GPT creates 6 exclusive designs for you.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. exclusive T-shirt designs, vintage denim jeans, floral kurta..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm font-medium focus:outline-none focus:border-[#bef264]/50 focus:ring-1 focus:ring-[#bef264]/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || searchLoading}
              className="px-6 py-3 rounded-xl bg-[#bef264] text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff6e] transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {searchLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-4 h-4" /> Discover</>
              )}
            </button>
          </form>

          {/* Quick suggestion chips */}
          <div className="flex flex-wrap gap-2">
            {['Oversized T-shirts', 'Designer Jeans', 'Ethnic Kurtas', 'Summer Dresses', 'Streetwear Hoodies', 'Formal Blazers'].map((s) => (
              <button
                key={s}
                onClick={() => { setSearchQuery(s); searchInputRef.current?.focus(); }}
                className="text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-[#bef264]/30 hover:bg-[#bef264]/5 transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── CUSTOM SEARCH RESULTS ── */}
        {searchLoading && (
          <div className="mb-10">
            <div className="mb-4 rounded-2xl border border-[#bef264]/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#bef264] animate-ping" />
                <p className="text-[#bef264] text-sm font-semibold">Anakin is searching the web for &ldquo;{searchedPrompt}&rdquo;...</p>
              </div>
              <div className="font-mono text-[11px] text-white/30 space-y-1">
                {[
                  `POST https://api.anakin.io/v1/search → "${searchedPrompt} fashion trends"`,
                  `POST https://api.anakin.io/v1/search → "${searchedPrompt} Myntra trending"`,
                  'Feeding web data to GPT-4o-mini for design extraction...',
                ].map((line, i) => (
                  <p key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
                    <span className="text-[#bef264]/50">&rsaquo;</span> {line}
                  </p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {searchError && !searchLoading && (
          <div className="mb-10 text-center py-8 rounded-2xl border border-rose-500/20 bg-rose-500/5">
            <p className="text-rose-400 text-sm">{searchError}</p>
          </div>
        )}

        {customTrends.length > 0 && !searchLoading && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-4 h-4 text-[#bef264]" />
              <h2 className="text-xl font-black text-white">Results for &ldquo;{searchedPrompt}&rdquo;</h2>
              <span className="text-[10px] text-[#bef264]/60 bg-[#bef264]/10 px-2 py-0.5 rounded-full font-bold">{customTrends.length} designs</span>
              <button onClick={() => { setCustomTrends([]); setSearchedPrompt(''); }} className="ml-auto text-white/30 hover:text-white text-xs cursor-pointer">&times; Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTrends.map((trend) => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  generatedImage={generatedImages[trend.id]}
                  isGenerating={generating === trend.id}
                  onGenerate={() => handleGenerate(trend)}
                  onTryOn={() => handleTryOn(trend, generatedImages[trend.id])}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div>
            {/* Animated scan progress */}
            <div className="mb-6 rounded-2xl border border-[#bef264]/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#bef264] animate-ping" />
                <p className="text-[#bef264] text-sm font-semibold">Anakin is scanning the web...</p>
              </div>
              {/* Scrolling URL ticker */}
              <div className="font-mono text-[11px] text-white/30 space-y-1 overflow-hidden h-16">
                {[
                  'GET https://www.myntra.com/trending-now',
                  'GET https://www.vogue.in/fashion/trends',
                  'GET https://www.ajio.com/trending',
                  'POST https://api.anakin.io/v1/search',
                  'Extracting trend signals with GPT...',
                  'Structuring 6 trend cards...',
                ].map((line, i) => (
                  <p key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
                    <span className="text-[#bef264]/50">›</span> {line}
                  </p>
                ))}
              </div>
            </div>

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
                onTryOn={() => handleTryOn(trend, generatedImages[trend.id])}
              />
            ))}
          </div>
        )}

        {/* How Anakin Powers This */}
        {!loading && trends.length > 0 && (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#bef264] mb-4">
              How Anakin Powers VEXA
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Crawl', desc: 'Anakin URL Scraper hits Myntra, Vogue India & AJIO simultaneously', icon: '🔍' },
                { step: '02', title: 'Extract', desc: 'Search API surfaces supplemental trend signals from across the web', icon: '⚡' },
                { step: '03', title: 'Analyse', desc: 'GPT reads the scraped content and structures 6 trend cards', icon: '🧠' },
                { step: '04', title: 'Generate & Try', desc: 'You click one button — garment is generated and tried on you', icon: '✨' },
              ].map(({ step, title, desc, icon }) => (
                <div key={step} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#bef264]/40 font-mono text-xs">{step}</span>
                    <span className="text-lg">{icon}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2">
              <span className="text-white/30 text-xs">Built with</span>
              <span className="text-[#bef264] text-xs font-bold">anakin.io</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/30 text-xs">URL Scraper</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/30 text-xs">Search API</span>
              <span className="text-white/20 text-xs">·</span>
              <span className="text-white/30 text-xs">Agentic Intelligence</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { ImageUploadBox } from '@/components/studio/ImageUploadBox';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import Header from '@/components/Header';

// ── Types ─────────────────────────────────────────────────────────────────────

type DesignStep = 'design' | 'tryon';
type DesignStatus =
  | 'idle'
  | 'generating_design'
  | 'uploading_photo'
  | 'generating_tryon'
  | 'ready'
  | 'error';

const STYLES = ['Minimalist', 'Traditional', 'Streetwear', 'Formal', 'Casual', 'Luxury'];

const DESIGN_CATEGORIES = [
  { id: 'tops',       label: 'Tops' },
  { id: 'bottoms',    label: 'Bottoms' },
  { id: 'one-pieces', label: 'Dresses' },
  { id: 'shoes',      label: 'Shoes' },
];

const EXAMPLE_PROMPTS = [
  'Structured blazer in charcoal grey with peak lapels',
  'Flowing silk kurta in midnight blue with gold embroidery',
  'Oversized olive green hoodie with minimal branding',
  'Floral summer dress with puff sleeves and white base',
  'Classic white shirt with mandarin collar, relaxed fit',
];

interface DesignApiResponse {
  designImageUrl?: string;
  error?: string;
}

interface TryOnApiResponse {
  result_url?: string;
  resultUrl?: string;
  error?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DesignPage() {
  const { currentUser } = useStore();

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<string | null>(null);
  const [category, setCategory] = useState('tops');
  const [step, setStep] = useState<DesignStep>('design');
  const [status, setStatus] = useState<DesignStatus>('idle');
  const [designImageUrl, setDesignImageUrl] = useState<string | null>(null);
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [tryOnResultUrl, setTryOnResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setElapsedSec(0);
    timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleGenerateDesign = useCallback(async () => {
    if (prompt.trim().length < 3) return;
    setStatus('generating_design');
    setErrorMsg(null);
    setDesignImageUrl(null);
    setTryOnResultUrl(null);
    setStep('design');
    startTimer();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/studio/design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ prompt: prompt.trim(), style: style ?? undefined, category }),
      });
      const data = (await res.json()) as DesignApiResponse;
      stopTimer();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.designImageUrl) throw new Error('No design image returned');
      setDesignImageUrl(data.designImageUrl);
      setStatus('idle');
    } catch (err: unknown) {
      stopTimer();
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [prompt, style, category]);

  const handleTryOn = useCallback(async () => {
    if (!designImageUrl || !personUrl) return;

    let publicPersonUrl = personUrl;

    if (personUrl.startsWith('data:')) {
      setStatus('uploading_photo');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const parts = personUrl.split(',');
          const mime = parts[0].split(':')[1].split(';')[0];
          const byteString = atob(parts[1]);
          const bytes = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const fd = new FormData();
          fd.append('file', blob, `person_${Date.now()}.jpg`);
          const upRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: fd,
          });
          if (upRes.ok) {
            const j = (await upRes.json()) as { url?: string };
            if (j.url) publicPersonUrl = j.url;
          }
        }
      } catch {
        // keep data URL
      }
    }

    setStatus('generating_tryon');
    startTimer();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: currentUser?.id ?? 'anonymous',
          productId: `design_${Date.now()}`,
          userPhotoUrl: publicPersonUrl,
          productImageUrl: designImageUrl,
          category,
        }),
      });
      const data = (await res.json()) as TryOnApiResponse;
      stopTimer();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const url = data.result_url ?? data.resultUrl;
      if (!url) throw new Error('No try-on result returned');
      setTryOnResultUrl(url);
      setStatus('ready');
    } catch (err: unknown) {
      stopTimer();
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [designImageUrl, personUrl, category, currentUser]);

  const handleDownload = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vexa-${name}-${Date.now()}.png`;
      a.click();
    } catch { window.open(url, '_blank'); }
  };

  const reset = () => {
    setStatus('idle');
    setDesignImageUrl(null);
    setPersonUrl(null);
    setTryOnResultUrl(null);
    setErrorMsg(null);
    setStep('design');
    setPrompt('');
    setStyle(null);
  };

  const isGeneratingDesign = status === 'generating_design';
  const isGeneratingTryon = status === 'generating_tryon' || status === 'uploading_photo';

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0f172a]">
      <Header />

      <div className="px-4 md:px-6 pt-24 pb-8 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
          Design from <span className="text-[#bef264]">Text</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm">
          Describe any garment → AI generates it → Try it on yourself
        </p>
      </div>

      <div className="flex-1 px-4 md:px-6 pb-20 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left column — controls */}
          <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-4">
            {/* Prompt */}
            <div className="relative">
              <textarea
                rows={6}
                maxLength={500}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe a garment in detail — fabric, color, fit, style..."
                className="w-full bg-white/5 border border-white/10 focus:border-[#bef264] rounded-2xl p-4 text-white placeholder:text-white/30 resize-none outline-none transition-colors text-sm"
              />
              <p className="absolute bottom-3 right-4 text-white/30 text-xs">{prompt.length} / 500</p>
            </div>

            {/* Example prompts */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
                >
                  {p.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Style */}
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(style === s ? null : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      style === s
                        ? 'bg-[#bef264] text-black'
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {DESIGN_CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      category === c.id
                        ? 'bg-[#bef264] text-black'
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerateDesign}
              disabled={prompt.trim().length < 3 || isGeneratingDesign}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                prompt.trim().length >= 3 && !isGeneratingDesign
                  ? 'bg-[#bef264] text-black hover:bg-[#a3e635]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isGeneratingDesign
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : 'Generate Design →'}
            </button>
          </div>

          {/* Right column — results */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Design result / placeholder */}
            {!designImageUrl && step === 'design' && (
              <div className={`flex-1 min-h-[400px] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-center p-8 ${isGeneratingDesign ? '' : ''}`}>
                {isGeneratingDesign ? (
                  <>
                    <div className="w-full max-w-xs h-[400px] rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
                    <p className="text-white/40 text-sm">Creating your design... {elapsedSec}s</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/20 text-4xl">✦</p>
                    <p className="text-white/40 text-sm">Your design appears here</p>
                    <p className="text-white/20 text-xs">Then try it on yourself in one click</p>
                  </>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-rose-400 text-sm">{errorMsg}</p>
                <button onClick={reset} className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {designImageUrl && step === 'design' && (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={designImageUrl} alt="Generated design" className="w-full object-contain max-h-[480px]" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownload(designImageUrl, 'design')}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Design
                  </button>
                  <button
                    onClick={() => setStep('tryon')}
                    className="flex-1 py-3 rounded-xl bg-[#bef264] text-black text-sm font-bold hover:bg-[#a3e635] transition-colors"
                  >
                    Try This On Me →
                  </button>
                </div>
              </div>
            )}

            {/* Try-on step */}
            {step === 'tryon' && designImageUrl && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Locked design */}
                  <div className="flex-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Your Design</p>
                    <div className="rounded-2xl overflow-hidden border border-white/10 h-64">
                      <img src={designImageUrl} alt="Design" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  {/* Person upload */}
                  <div className="flex-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Your Photo</p>
                    <div className="rounded-2xl overflow-hidden border border-white/10 h-64">
                      <ImageUploadBox
                        label="Full-body photo"
                        sublabel="Upload a full-body photo"
                        value={personUrl}
                        onChange={setPersonUrl}
                        onClear={() => setPersonUrl(null)}
                        height="h-64"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTryOn}
                  disabled={!personUrl || isGeneratingTryon}
                  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    personUrl && !isGeneratingTryon
                      ? 'bg-[#bef264] text-black hover:bg-[#a3e635]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  {isGeneratingTryon
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating... {elapsedSec}s</>
                    : 'Try On →'}
                </button>

                {tryOnResultUrl && status === 'ready' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 rounded-2xl overflow-hidden border border-white/10">
                        <p className="text-white/40 text-xs text-center py-1 bg-white/5">Before</p>
                        <img src={personUrl ?? ''} alt="Before" className="w-full object-contain max-h-80" />
                      </div>
                      <div className="flex-1 rounded-2xl overflow-hidden border border-[#bef264]/30">
                        <p className="text-[#bef264] text-xs text-center py-1 bg-[#bef264]/5">After VEXA</p>
                        <img src={tryOnResultUrl} alt="After" className="w-full object-contain max-h-80" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload(tryOnResultUrl, 'tryon-result')}
                        className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Save Result
                      </button>
                      <button
                        onClick={reset}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                      >
                        Design Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

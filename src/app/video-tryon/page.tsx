'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, AlertCircle, Download, Film } from 'lucide-react';
import { ImageUploadBox } from '@/components/studio/ImageUploadBox';
import { VideoTryOn } from '@/components/VideoTryOn';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import type { Outfit } from '@/types';

type VideoGenStatus = 'idle' | 'generating' | 'ready' | 'error';

interface VideoGenResponse {
  videoUrl?: string;
  frameUrls?: string[];
  type?: 'video' | 'frames';
  error?: string;
}

export default function VideoTryOnPage() {
  // ── Animate section ────────────────────────────────────────────────────────
  const [animateImageUrl, setAnimateImageUrl] = useState<string | null>(null);
  const [animateStatus, setAnimateStatus] = useState<VideoGenStatus>('idle');
  const [animateResultUrl, setAnimateResultUrl] = useState<string | null>(null);
  const [animateError, setAnimateError] = useState<string | null>(null);
  const [animateElapsed, setAnimateElapsed] = useState(0);

  // ── Video try-on section ───────────────────────────────────────────────────
  const [garmentUrl, setGarmentUrl] = useState<string | null>(null);

  const animateTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setAnimateElapsed(0);
    animateTimerRef.current = setInterval(() => setAnimateElapsed(s => s + 1), 1000);
  };
  const stopTimer = () => {
    if (animateTimerRef.current) { clearInterval(animateTimerRef.current); animateTimerRef.current = null; }
  };

  const handleAnimate = useCallback(async () => {
    if (!animateImageUrl) return;

    let publicUrl = animateImageUrl;

    if (animateImageUrl.startsWith('data:')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const parts = animateImageUrl.split(',');
          const mime = parts[0].split(':')[1].split(';')[0];
          const byteString = atob(parts[1]);
          const bytes = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const fd = new FormData();
          fd.append('file', blob, `animate_${Date.now()}.jpg`);
          const upRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: fd,
          });
          if (upRes.ok) {
            const j = (await upRes.json()) as { url?: string };
            if (j.url) publicUrl = j.url;
          }
        }
      } catch {
        // keep data URL
      }
    }

    setAnimateStatus('generating');
    setAnimateError(null);
    setAnimateResultUrl(null);
    startTimer();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/studio/video-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ imageUrl: publicUrl, duration: '5' }),
      });

      const data = (await res.json()) as VideoGenResponse;
      stopTimer();

      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.videoUrl) throw new Error('No video URL returned');

      setAnimateResultUrl(data.videoUrl);
      setAnimateStatus('ready');
    } catch (err: unknown) {
      stopTimer();
      setAnimateError(err instanceof Error ? err.message : String(err));
      setAnimateStatus('error');
    }
  }, [animateImageUrl]);

  const mockProduct: Outfit = {
    id: `video_${Date.now()}`,
    name: 'Video Try-On',
    imageUrl: garmentUrl ?? '',
    price: 0,
    category: 'tops' as const,
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#0f172a]">
      <Header />

      <div className="px-4 md:px-6 pt-24 pb-8 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
          Video <span className="text-[#bef264]">Try-On</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm">
          Animate your try-on result or upload a video for garment try-on.
        </p>
      </div>

      <div className="flex-1 px-4 md:px-6 pb-20 max-w-7xl mx-auto w-full flex flex-col gap-10">

        {/* Section 1 — Animate Your Try-On */}
        <section>
          <h2 className="text-white text-lg font-bold mb-1">Animate Your Try-On</h2>
          <p className="text-white/40 text-sm mb-4">Upload a try-on result image → AI creates a short fashion video.</p>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left inputs */}
            <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-4">
              <ImageUploadBox
                label="Try-on result image"
                sublabel="Upload your generated try-on photo"
                value={animateImageUrl}
                onChange={setAnimateImageUrl}
                onClear={() => { setAnimateImageUrl(null); setAnimateStatus('idle'); }}
                height="h-64"
              />
              <button
                onClick={handleAnimate}
                disabled={!animateImageUrl || animateStatus === 'generating'}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  animateImageUrl && animateStatus !== 'generating'
                    ? 'bg-[#bef264] text-black hover:bg-[#a3e635]'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {animateStatus === 'generating'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Animating... {animateElapsed}s</>
                  : <><Film className="w-4 h-4" /> Animate →</>}
              </button>
            </div>

            {/* Right result */}
            <div className="flex-1 min-h-[280px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
              {animateStatus === 'idle' && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <Film className="w-10 h-10 text-white/20" />
                  <p className="text-white/40 text-sm">Your animated video appears here</p>
                </div>
              )}
              {animateStatus === 'generating' && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <Loader2 className="w-10 h-10 text-[#bef264] animate-spin" />
                  <p className="text-white font-medium text-sm">Generating video... {animateElapsed}s</p>
                  <p className="text-white/30 text-xs">This takes 1–2 minutes</p>
                </div>
              )}
              {animateStatus === 'ready' && animateResultUrl && (
                <div className="w-full h-full flex flex-col">
                  <video src={animateResultUrl} controls className="w-full rounded-2xl" />
                  <div className="p-4">
                    <a
                      href={animateResultUrl}
                      download={`vexa-video-${Date.now()}.mp4`}
                      className="flex items-center gap-2 text-[#bef264] text-sm font-medium"
                    >
                      <Download className="w-4 h-4" /> Download Video
                    </a>
                  </div>
                </div>
              )}
              {animateStatus === 'error' && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                  <p className="text-rose-400 text-sm">{animateError}</p>
                  <button onClick={() => setAnimateStatus('idle')} className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium">Try Again</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="border-t border-white/10" />

        {/* Section 2 — Video Try-On */}
        <section>
          <h2 className="text-white text-lg font-bold mb-1">Video Try-On</h2>
          <p className="text-white/40 text-sm mb-4">Upload a garment and record/upload a short video to try it on.</p>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-[340px] flex-shrink-0">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Garment Image</p>
              <ImageUploadBox
                label="Garment"
                sublabel="Flat-lay product photo"
                value={garmentUrl}
                onChange={setGarmentUrl}
                onClear={() => setGarmentUrl(null)}
                height="h-64"
              />
            </div>

            <div className="flex-1">
              {garmentUrl ? (
                <VideoTryOn product={mockProduct} />
              ) : (
                <div className="min-h-[280px] rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-center p-8">
                  <div>
                    <Film className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Upload a garment image first</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

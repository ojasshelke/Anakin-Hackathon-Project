'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Download, AlertCircle, UploadCloud } from 'lucide-react';
import { ImageUploadBox } from '@/components/studio/ImageUploadBox';
import { supabase } from '@/lib/supabase';

interface ModelGeneratorProps {
  initialGarmentUrl?: string | null;
  onResult?: (url: string) => void;
  className?: string;
}

type GenStatus = 'idle' | 'uploading' | 'generating' | 'ready' | 'error';

export function ModelGenerator({ initialGarmentUrl, onResult, className }: ModelGeneratorProps) {
  const [garmentUrl, setGarmentUrl] = useState<string | null>(initialGarmentUrl ?? null);
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [status, setStatus] = useState<GenStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialGarmentUrl) setGarmentUrl(initialGarmentUrl);
  }, [initialGarmentUrl]);

  useEffect(() => {
    if (status === 'generating') {
      setElapsedSec(0);
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const handleGenerate = useCallback(async () => {
    if (!garmentUrl) return;

    let publicUrl = garmentUrl;

    if (garmentUrl.startsWith('data:')) {
      setStatus('uploading');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const parts = garmentUrl.split(',');
          const mime = parts[0].split(':')[1].split(';')[0];
          const byteString = atob(parts[1]);
          const bytes = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const fd = new FormData();
          fd.append('file', blob, `garment_${Date.now()}.jpg`);
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: fd,
          });
          if (res.ok) {
            const j = (await res.json()) as { url?: string };
            if (j.url) publicUrl = j.url;
          }
        }
      } catch {
        // keep data URL, let server handle
      }
    }

    setStatus('generating');
    setErrorMsg(null);
    setResultUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/studio/model-gen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ garmentImageUrl: publicUrl, modelGender: gender }),
      });

      const data = (await res.json()) as { modelImageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.modelImageUrl) throw new Error('No result image returned');

      setResultUrl(data.modelImageUrl);
      setStatus('ready');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [garmentUrl, gender]);

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vexa-model-${Date.now()}.png`;
      a.click();
    } catch { window.open(resultUrl, '_blank'); }
  };

  const canGenerate = !!garmentUrl && status !== 'generating' && status !== 'uploading';

  return (
    <div className={`flex flex-col md:flex-row gap-6 ${className ?? ''}`}>
      {/* Left — inputs */}
      <div className="w-full md:w-[340px] flex-shrink-0 flex flex-col gap-4">
        <ImageUploadBox
          label="Upload Garment or Flat-lay"
          sublabel="Any product photo works best on white background"
          value={garmentUrl}
          onChange={setGarmentUrl}
          onClear={() => setGarmentUrl(null)}
          height="h-64"
        />

        {/* Gender selector */}
        <div className="flex gap-2">
          {(['female', 'male'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                gender === g
                  ? 'bg-[#bef264] text-black'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <button
          disabled={!canGenerate}
          onClick={handleGenerate}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-all ${
            canGenerate
              ? 'bg-[#bef264] text-black hover:bg-[#a3e635]'
              : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
          }`}
        >
          {status === 'generating' || status === 'uploading'
            ? 'Generating...'
            : 'Generate Model Photo →'}
        </button>
      </div>

      {/* Right — result */}
      <div className="flex-1 min-h-[400px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative flex items-center justify-center">
        {status === 'idle' && (
          <div className="flex flex-col items-center gap-3 text-center p-8">
            <UploadCloud className="w-10 h-10 text-white/20" />
            <p className="text-white/40 text-sm">Professional model photo appears here</p>
          </div>
        )}

        {(status === 'generating' || status === 'uploading') && (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <Loader2 className="w-10 h-10 text-[#bef264] animate-spin" />
            <p className="text-white font-medium text-sm">Creating professional model photo...</p>
            <p className="text-white/40 text-xs">{elapsedSec}s</p>
          </div>
        )}

        {status === 'ready' && resultUrl && (
          <>
            <img
              src={resultUrl}
              alt="Generated model"
              className="w-full h-full object-contain transition-opacity duration-500 opacity-100"
            />
            <button
              onClick={handleDownload}
              className="absolute bottom-3 right-3 px-3 py-2 rounded-xl bg-black/60 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black/80 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            {onResult && (
              <button
                onClick={() => { onResult(resultUrl); setStatus('idle'); }}
                className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-[#bef264] text-black text-xs font-bold flex items-center gap-1.5 hover:bg-[#a3e635] transition-colors"
              >
                Try On This Garment →
              </button>
            )}
          </>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 text-center p-8">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-rose-400 text-sm">{errorMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

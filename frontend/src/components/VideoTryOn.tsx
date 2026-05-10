'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import type { Outfit, VideoJobStatusResponse, VideoTryOnStartResponse } from '@/types';

const MAX_VIDEO_SECONDS = 10;
const POLL_INTERVAL_MS = 3000;

interface VideoTryOnProps {
  product: Outfit;
}

interface UploadResponseJson {
  url?: string;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function parseVideoJobStatus(value: unknown): VideoJobStatusResponse | null {
  if (!isRecord(value)) return null;
  const status = value.status;
  if (status !== 'processing' && status !== 'completed' && status !== 'failed') {
    return null;
  }
  const progress = value.progressPercent;
  return {
    status,
    progressPercent: typeof progress === 'number' ? progress : 0,
    resultVideoUrl:
      typeof value.resultVideoUrl === 'string' ? value.resultVideoUrl : null,
    errorMessage:
      typeof value.errorMessage === 'string' ? value.errorMessage : null,
  };
}

export function VideoTryOn({ product }: VideoTryOnProps) {
  const { currentUser } = useStore();
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'done' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const pollStatus = useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/tryon/video/status?jobId=${encodeURIComponent(jobId)}`
        );
        const raw: unknown = await res.json();
        if (!res.ok) {
          const err =
            isRecord(raw) && typeof raw.error === 'string'
              ? raw.error
              : 'Status request failed';
          throw new Error(err);
        }
        const data = parseVideoJobStatus(raw);
        if (!data) {
          throw new Error('Invalid status payload');
        }

        setProgress(data.progressPercent);

        if (data.status === 'completed' && data.resultVideoUrl) {
          stopPolling();
          setResultUrl(data.resultVideoUrl);
          setStatus('done');
          return false;
        }
        if (data.status === 'failed') {
          stopPolling();
          setErrorMsg(data.errorMessage ?? 'Processing failed');
          setStatus('error');
          return false;
        }
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Poll error:', msg);
        return true;
      }
    },
    [stopPolling]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error('Could not read video metadata'));
    });
    URL.revokeObjectURL(objectUrl);

    if (videoEl.duration > MAX_VIDEO_SECONDS) {
      setErrorMsg(
        `Video must be under ${MAX_VIDEO_SECONDS} seconds. Yours is ${Math.round(videoEl.duration)}s.`
      );
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setErrorMsg(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('You must be signed in to upload a video.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');
      formData.append('context', 'video_tryon');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadRaw: unknown = await uploadRes.json();
      const uploadData = uploadRaw as UploadResponseJson;
      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? 'Upload failed');
      }
      if (!uploadData.url) {
        throw new Error('Upload did not return a URL');
      }

      setStatus('processing');
      setProgress(0);

      const jobRes = await fetch('/api/tryon/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          videoUrl: uploadData.url,
          productImageUrl: product.imageUrl,
          productId: product.id,
        }),
      });

      const jobRaw: unknown = await jobRes.json();
      if (!jobRes.ok) {
        const errMsg =
          isRecord(jobRaw) && typeof jobRaw.error === 'string'
            ? jobRaw.error
            : 'Failed to start job';
        throw new Error(errMsg);
      }

      const jobOk = jobRaw as VideoTryOnStartResponse;
      if (!jobOk.jobId) {
        throw new Error('Failed to start job');
      }

      const keepPolling = await pollStatus(jobOk.jobId);
      if (keepPolling) {
        pollTimerRef.current = setInterval(() => {
          void pollStatus(jobOk.jobId).then((cont) => {
            if (!cont && pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          });
        }, POLL_INTERVAL_MS);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }

    e.target.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {status === 'idle' && (
        <div className="border-2 border-dashed border-white/15 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-[#bef264]/40 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-[#bef264]/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-[#bef264]" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium mb-1">Upload a short video</p>
            <p className="text-white/40 text-sm">
              Max {MAX_VIDEO_SECONDS} seconds · MP4 or MOV
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-[#bef264] text-black font-semibold hover:bg-[#a3e635] transition-colors"
          >
            Choose Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="flex flex-col items-center gap-5 py-10">
          <Loader2 className="w-10 h-10 text-[#bef264] animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium mb-2">
              {status === 'uploading'
                ? 'Uploading video...'
                : 'Processing frames...'}
            </p>
            {status === 'processing' && (
              <p className="text-white/40 text-sm">
                {progress}% complete · may take several minutes
              </p>
            )}
          </div>
          {status === 'processing' && (
            <div className="w-full max-w-xs bg-white/10 rounded-full h-2">
              <div
                className="bg-[#bef264] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {status === 'done' && resultUrl && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#bef264]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Video try-on complete</span>
          </div>
          <video
            src={resultUrl}
            controls
            className="w-full rounded-2xl border border-white/10 bg-black"
          />
          <div className="flex gap-3">
            <a
              href={resultUrl}
              download={`vexa_tryon_${product.id}.mp4`}
              className="flex-1 py-3 rounded-xl bg-[#bef264] text-black font-semibold flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              type="button"
              onClick={() => {
                stopPolling();
                setStatus('idle');
                setResultUrl(null);
                setProgress(0);
              }}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors"
            >
              Try Another
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-white/70 text-center">{errorMsg}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setErrorMsg(null);
            }}
            className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

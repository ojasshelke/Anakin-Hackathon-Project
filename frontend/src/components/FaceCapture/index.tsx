"use client";

/**
 * FaceCapture — photo upload OR webcam capture.
 * Preview stored in-component as objectURL only (no upload of raw photo).
 * Calls onCapture with a File object — consumer must handle it as base64.
 *
 * RULE: Original face photo MUST be deleted after UV texture is extracted.
 * RULE: "use client"
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (file: File) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

type CaptureMode = 'idle' | 'upload' | 'webcam' | 'preview';

export function FaceCapture({ onCapture, onClear, isLoading = false }: FaceCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopWebcam();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Only allow image files
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      const url = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setMode('preview');
      onCapture(file);
    },
    [previewUrl, onCapture]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const url = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setMode('preview');
      onCapture(file);
    },
    [previewUrl, onCapture]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    setMode('webcam');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      setWebcamError(
        err instanceof Error
          ? err.message
          : 'Camera access denied. Please allow camera permissions.'
      );
    }
  }, []);

  const captureFromWebcam = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the capture (selfie-style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `face_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setMode('preview');
      stopWebcam();
      onCapture(file);
    }, 'image/jpeg', 0.92);
  }, [previewUrl, stopWebcam, onCapture]);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMode('idle');
    stopWebcam();
    setWebcamError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  }, [previewUrl, stopWebcam, onClear]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (mode === 'preview' && previewUrl) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#bef264]/30 bg-black/20">
        <img
          src={previewUrl}
          alt="Face capture preview"
          className="w-full object-cover max-h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#bef264] text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Photo captured
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retake
          </button>
        </div>
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white">
              <span className="w-8 h-8 border-2 border-white/20 border-t-[#bef264] rounded-full animate-spin" />
              <span className="text-sm">Extracting face texture…</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'webcam') {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
        {webcamError ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="w-10 h-10 text-orange-400" />
            <p className="text-white/70 text-sm">{webcamError}</p>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm"
            >
              Go back
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-80 object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <button
                type="button"
                onClick={captureFromWebcam}
                disabled={!isCameraActive}
                className="px-6 py-3 rounded-2xl bg-[#bef264] text-black font-semibold text-sm hover:bg-[#a3e635] transition-colors disabled:opacity-50 shadow-lg flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Idle — show both options
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-[#bef264]" />
        <span className="text-white font-semibold text-lg">Front-Facing Photo</span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full rounded-2xl border-2 border-dashed border-white/10 hover:border-[#bef264]/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group min-h-[160px] flex flex-col items-center justify-center gap-3 p-6"
      >
        <Upload className="w-8 h-8 text-white/30 group-hover:text-[#bef264]/60 transition-colors" />
        <div className="text-center">
          <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
            Drop photo here or <span className="text-[#bef264]">click to browse</span>
          </p>
          <p className="text-white/30 text-xs mt-1">JPG, PNG, WebP — max 10 MB</p>
        </div>
        <input
          ref={fileInputRef}
          id="face-capture-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Webcam */}
      <button
        type="button"
        onClick={startWebcam}
        className="w-full py-3 rounded-2xl border border-white/10 hover:border-[#bef264]/30 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Camera className="w-4 h-4" />
        Use Webcam
      </button>

      <p className="text-white/30 text-xs text-center">
        Photo is used for face texture only. Original is deleted after processing.
      </p>
    </div>
  );
}

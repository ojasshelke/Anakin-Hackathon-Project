"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Camera, Zap, AlertCircle } from 'lucide-react';

function EmbedContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const productImageUrl = searchParams.get('productImageUrl');
  const marketplaceKey = searchParams.get('marketplaceKey');

  const { currentUser, userPhotoUrl } = useStore();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tryOnStatus, setTryOnStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultImage, setResultImage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Validate Marketplace Key
    const validateKey = async () => {
      try {
        setIsValidating(true);
        if (!marketplaceKey) throw new Error("No marketplace API key provided");

        const res = await fetch("/api/keys/validate", {
          headers: {
            'x-vexa-key': marketplaceKey
          }
        });

        const data = await res.json();
        if (data.valid) {
          setIsValid(true);
        } else {
          throw new Error(data.error || "Invalid marketplace key");
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setIsValidating(false);
      }
    };

    validateKey();
  }, [marketplaceKey]);

  useEffect(() => {
    // 2. Run Try-On if valid & user exists
    if (!isValid || !currentUser?.id || !userPhotoUrl || !productId || !productImageUrl) return;

    const runTryOn = async () => {
      setTryOnStatus('loading');
      try {
        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-vexa-key": marketplaceKey! // pass key to pass middleware checks safely
          },
          body: JSON.stringify({
            userId: currentUser.id,
            userPhotoUrl: userPhotoUrl,
            productImageUrl: productImageUrl,
            productId: productId
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to process try-on");
        }

        const data = await res.json();
        setResultImage(data.resultUrl);
        setTryOnStatus('success');
      } catch (e: unknown) {
        const err = e as Error;
        console.error('Failed to fetch try-on result:', err.message);
        setTryOnStatus('error');
      }
    };

    runTryOn();
  }, [isValid, currentUser, userPhotoUrl, productId, productImageUrl, marketplaceKey]);

  useEffect(() => {
    // Send resize message to parent window to adjust iframe bounds automatically
    const reportHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'VEXA_EMBED_RESIZE', height }, '*');
    };

    // Report soon after paint
    setTimeout(reportHeight, 300);
    // Report if window resizes
    window.addEventListener('resize', reportHeight);
    return () => window.removeEventListener('resize', reportHeight);
  });

  if (isValidating) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px] border border-white/5 rounded-2xl bg-black/40 text-black">
        <div className="w-8 h-8 border-2 border-[#bef264]/20 border-t-[#bef264] rounded-full animate-spin" />
        <p className="text-white/40 text-xs mt-3 uppercase tracking-widest font-semibold">Validating Connection</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-col min-h-[400px] p-6 flex items-center justify-center text-center bg-black/90 rounded-2xl border border-white/10 backdrop-blur-md">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-white font-bold mb-1 tracking-wide">Connection Error</h3>
        <p className="text-white/50 text-sm max-w-[240px]">{error}</p>
      </div>
    );
  }

  if (!userPhotoUrl) {
    return (
      <div className="w-full aspect-[3/4] p-6 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 hover:border-[#bef264]/30 transition-all flex flex-col items-center justify-center text-center group min-h-[400px]">
        <div className="w-16 h-16 bg-white/5 group-hover:bg-[#bef264]/20 rounded-full flex items-center justify-center mb-5 transition-colors border border-white/10 group-hover:border-[#bef264]/40">
          <Camera className="w-8 h-8 text-white/50 group-hover:text-[#bef264] transition-colors" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2 tracking-tight">Virtual Try-On</h3>
        <p className="text-white/50 text-sm mb-8 max-w-[220px] leading-relaxed">
          Set up your VEXA profile to instantly see how this item looks on you.
        </p>
        <a 
          href="/onboarding"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all w-full max-w-[240px]"
        >
          Set Up Fit Profile
        </a>
      </div>
    );
  }

  if (tryOnStatus === 'loading') {
    return (
      <div className="w-full aspect-[3/4] relative overflow-hidden rounded-2xl border border-white/10 bg-black flex flex-col items-center justify-center min-h-[400px]">
        {productImageUrl && (
          <img src={productImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" alt="Garment loading background" />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="w-10 h-10 border-2 border-[#bef264]/20 border-t-[#bef264] rounded-full animate-spin mb-4" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest text-[#bef264]">Generating Fit</h3>
          <p className="text-white/60 text-xs mt-2 max-w-[180px]">Applying clothing to your profile in real-time...</p>
        </div>
      </div>
    );
  }

  if (tryOnStatus === 'success' && resultImage) {
    return (
      <div className="w-full aspect-[3/4] relative overflow-hidden rounded-2xl border border-white/10 hover:border-[#bef264]/40 transition-colors group min-h-[400px]">
        <img src={resultImage} alt="Try On Result" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
        <div className="absolute inset-0 shadow-[inset_0_-80px_60px_-20px_rgba(0,0,0,0.6)] pointer-events-none" />
        <div className="absolute bottom-4 left-0 w-full flex justify-center">
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-[#bef264]/20 flex items-center gap-1.5 shadow-lg">
            <Zap className="w-3.5 h-3.5 fill-[#bef264] text-[#bef264]" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Personalized Look</span>
          </div>
        </div>
      </div>
    );
  }

  if (tryOnStatus === 'error') {
    return (
      <div className="w-full flex-col aspect-[3/4] min-h-[400px] p-6 flex items-center justify-center text-center bg-zinc-900 rounded-2xl border border-white/10">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
        <h3 className="text-white font-bold mb-1 tracking-wide">Processing Failed</h3>
        <p className="text-white/60 text-sm max-w-[200px]">Failed to generate try-on. We are looking into it.</p>
      </div>
    );
  }

  return null;
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-2 border-[#bef264]/20 border-t-[#bef264] rounded-full animate-spin"></div></div>}>
      <EmbedContent />
    </Suspense>
  );
}

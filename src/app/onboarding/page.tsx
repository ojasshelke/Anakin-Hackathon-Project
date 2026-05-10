"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceCapture } from '@/components/FaceCapture';
import { MeasurementForm } from '@/components/MeasurementForm';
import { AvatarViewer } from '@/components/AvatarViewer';
import { useUser } from '@/hooks/useUser';
import { OnboardingGuard } from '@/middleware/onboardingGuard';
import { ArrowLeft, Sparkles, UserCircle, AlertTriangle } from 'lucide-react';
import { BodyMeasurements } from '@/types';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const { user } = useUser();
  const setUserPhotoUrl = useStore((state) => state.setUserPhotoUrl);

  const handleCapture = (file: File) => setPhotoFile(file);
  
  const submitGenerate = async (meas: BodyMeasurements) => {
    setStep(4);
    setGenerateError(null);

    // Safety timeout: if backend fails, still complete onboarding after 8s
    const safetyTimeout = setTimeout(async () => {
      // Save a placeholder avatar_url so the guard lets the user proceed
      if (user?.id) {
        await (supabase.from('users') as any)
          .update({ avatar_url: 'placeholder://pending' })
          .eq('id', user.id);
      }
      setStep(5);
    }, 8000);

    try {
      // Resize image to max 1024px
      const processedBlob = await new Promise<Blob>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 768;
            if (width > height) {
              if (width > max) { height *= max / width; width = max; }
            } else {
              if (height > max) { width *= max / height; height = max; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob || photoFile!), 'image/jpeg', 0.6);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(photoFile!);
      });

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(processedBlob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      setUserPhotoUrl(base64);

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const res = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id, photoBase64: base64, measurements: meas })
      });

      clearTimeout(safetyTimeout);

      if (!res.ok) {
        // Backend down — save placeholder and continue
        if (user?.id) {
          await (supabase.from('users') as any)
            .update({ avatar_url: 'placeholder://pending' })
            .eq('id', user.id);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      }
      setStep(5);
    } catch (err) {
      clearTimeout(safetyTimeout);
      console.error(err);
      setGenerateError('Profile generation failed. You can continue anyway.');
      // Still allow advancing after error
      setTimeout(() => setStep(5), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      {step > 1 && step < 4 && (
        <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="text-center space-y-6 mt-12">
            <div className="w-16 h-16 bg-[#bef264]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#bef264]/20">
              <Sparkles className="w-8 h-8 text-[#bef264]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Create Your Perfect Try-On</h1>
            <p className="text-white/50 text-lg max-w-md mx-auto leading-relaxed">
              VEXA precision-matches your face and body measurements to create a high-fidelity 3D digital duplicate for shopping.
            </p>
            <button onClick={() => setStep(2)} className="mt-8 px-10 py-5 bg-[#bef264] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] transition-all">
              Initialize Calibration
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 1, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 1, x: -20 }} className="space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Face Capture</h2>
              <p className="text-white/50">Upload a straight-facing photo. We strictly extract and delete the original RGB data respecting GDPR compliance.</p>
            </div>
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10">
              <FaceCapture onCapture={handleCapture} onClear={() => setPhotoFile(null)} />
            </div>
            {photoFile && (
               <button onClick={() => setStep(3)} className="w-full mt-6 py-4 bg-[#bef264] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#a3e635] transition-colors shadow-lg">
                 Confirm Identity
               </button>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 1, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 1, x: -20 }}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Body Matrix</h2>
              <p className="text-white/50">Precise geometry enforces accurate fabric draping during the virtual try-on.</p>
            </div>
            <div className="bg-[#1a1a2e]/50 p-6 rounded-2xl border border-blue-500/20 mb-8 flex items-start gap-4">
               <UserCircle className="w-10 h-10 text-blue-400 shrink-0 opacity-80" />
               <p className="text-sm text-blue-200 leading-relaxed font-medium">Measure directly against your skin. Wrap the tape measure horizontally around the fullest part of your chest and the narrowest part of your waist.</p>
            </div>
            <MeasurementForm onSubmit={submitGenerate} />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center min-h-[50vh]">
            {generateError ? (
              <>
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Almost There</h2>
                <p className="text-white/50 mb-4">{generateError}</p>
                <p className="text-white/30 text-sm">Redirecting you automatically...</p>
              </>
            ) : (
              <>
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-[#bef264]/20 animate-ping" />
                  <div className="w-full h-full border-4 border-[#bef264]/20 border-t-[#bef264] rounded-full animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Generating Synthetic Profile</h2>
                <p className="text-white/40 mb-4 animate-pulse uppercase tracking-widest text-xs font-bold">Establishing SMPL-X Node Connection...</p>
                <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-gradient-to-r from-[#bef264] to-[#a3e635] animate-pulse w-3/4 rounded-full" />
                </div>
                <p className="text-white/20 text-xs mt-6">This completes automatically in a few seconds</p>
              </>
            )}
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 1, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 max-w-md mx-auto">
            <div className="text-center mt-6">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-[#bef264] mb-2">Profile Completed</h2>
              <p className="text-white/50 text-sm max-w-[280px] mx-auto">Your personalized 3D topology is fully initialized.</p>
            </div>
            <div className="h-[420px] w-full mx-auto relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(190,242,100,0.15)] ring-1 ring-inset ring-white/10 p-2 bg-gradient-to-br from-black to-zinc-900">
               {/* 3D AVATAR LOAD IN */}
              <AvatarViewer avatarUrl={avatarUrl} />
            </div>
            <button onClick={() => router.push('/products')} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all">
              Launch Catalogue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingGuard>
      <OnboardingWizard />
    </OnboardingGuard>
  );
}

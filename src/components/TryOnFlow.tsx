"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Sparkles, Wand2, Activity, Scan, Maximize } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STEPS = [
  { id: 'analyzing', text: "Analyzing body proportions...", icon: Scan },
  { id: 'detecting', text: "Processing with Vexa AI...", icon: Maximize },
  { id: 'fitting', text: "Fitting garment to your posture...", icon: Wand2 },
  { id: 'enhancing', text: "Enhancing lighting & shadows...", icon: Sparkles }
];

export default function TryOnFlow() {
  const { isProcessing, setIsProcessing, userPhotoUrl, selectedOutfit, setTryOnResult, currentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isProcessing || !userPhotoUrl || !selectedOutfit) return;

    setErrorMessage(null);
    let stepInterval: NodeJS.Timeout;
    let currentStepIndex = 0;

    const processTryOn = async () => {
      // Step transitions every 1.5s
      stepInterval = setInterval(() => {
        currentStepIndex++;
        if (currentStepIndex < STEPS.length) {
          setCurrentStep(currentStepIndex);
        }
      }, 1500);

      try {
        // Get session token for auth
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/tryon', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            userId: currentUser?.id ?? session?.user?.id ?? 'demo_user_001',
            userPhotoUrl: userPhotoUrl,
            productId: selectedOutfit?.id,
            productImageUrl: selectedOutfit?.imageUrl
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: Failed to process try-on`);
        }

        const data = await response.json() as {
          result_url?: string;
          resultUrl?: string;
          error?: string;
          status?: string;
          cached?: boolean;
        };
        
        // Support both result_url (new FASHN) and resultUrl (legacy backward-compat alias)
        const imageUrl = data.result_url ?? data.resultUrl;

        if (imageUrl) {
          // Immediately show result and hide processor
          setTryOnResult({
            id: `${Date.now()}`,
            userId: currentUser?.id ?? session?.user?.id ?? 'demo_user_001',
            productId: selectedOutfit.id,
            originalImage: userPhotoUrl,
            resultImage: imageUrl,
            result_url: imageUrl,
            outfit: selectedOutfit,
            cached: data.cached ?? false,
            status: 'ready'
          });
          setIsProcessing(false);
          setCurrentStep(0);
        } else {
          throw new Error("No result URL received from the engine");
        }
      } catch (error) {
        console.error("Try-on failed:", error);
        setIsProcessing(false);
        setCurrentStep(0);

        let friendlyMessage = 'AI engine is currently busy. Please try again in a moment.';
        if (error instanceof Error) {
          if (
            error.message.toLowerCase().includes('rate limit') ||
            error.message.includes('429')
          ) {
            friendlyMessage = 'Vexa AI is busy right now. Please try again in a few minutes.';
          } else {
            friendlyMessage = error.message;
          }
        }
        setErrorMessage(friendlyMessage);
      } finally {
        if (stepInterval) clearInterval(stepInterval);
      }
    };

    processTryOn();
    
    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [isProcessing, userPhotoUrl, selectedOutfit, setIsProcessing, setTryOnResult, currentUser]);

  if (!isProcessing && !errorMessage) return null;

  const CurrentIcon = STEPS[currentStep].icon;

  if (errorMessage) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
          <div className="max-w-md w-full glass-panel flex flex-col items-center p-10 relative overflow-hidden text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-6">
              <Activity className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-2xl font-medium text-white mb-2">Try-On Failed</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">{errorMessage}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep(0);
                  setIsProcessing(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setCurrentStep(0);
                  setIsProcessing(true);
                }}
                className="flex-1 py-3 rounded-xl bg-[#bef264] hover:bg-[#a3e635] text-black font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      >
        <div className="max-w-md w-full glass-panel flex flex-col items-center p-10 relative overflow-hidden">
          <motion.div 
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-[#bef264] to-transparent bg-[length:200%_auto]"
          />

          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-24 h-24 rounded-full border border-[#bef264]/30 bg-[#bef264]/10 flex items-center justify-center mb-8 relative shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-y-2 border-transparent border-t-[#bef264] border-b-[#ecfccb] opacity-70"
              />
              <motion.div
                key={currentStep}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring" }}
                className="absolute"
              >
                <CurrentIcon className="w-10 h-10 text-[#ecfccb]" />
              </motion.div>
            </div>

            <h3 className="text-2xl font-medium tracking-wide text-white mb-3">
              Vexa AI Engine
            </h3>
            
            <div className="h-6 relative flex items-center justify-center w-full">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={currentStep}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.4 }}
                  className="text-white/80 absolute text-center font-medium tracking-wide"
                >
                  {STEPS[currentStep].text}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="w-full h-1.5 bg-white/5 rounded-full mt-8 overflow-hidden relative">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#bef264] to-[#ecfccb] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 1.5, ease: "linear" }}
              />
            </div>
            
            <div className="w-full flex justify-between mt-2 text-xs font-medium text-[#d9f99d]">
              <span>Initializing</span>
              <span>Complete</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

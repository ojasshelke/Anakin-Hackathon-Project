'use client';

import React, { Suspense, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore, useXR } from '@react-three/xr';
import { useGLTF, Center, Environment } from '@react-three/drei';
import { Smartphone, X } from 'lucide-react';
import type { Group } from 'three';

const xrStore = createXRStore({ emulate: false });

interface ClothingOverlayProps {
  glbUrl: string;
}

function ClothingOverlay({ glbUrl }: ClothingOverlayProps) {
  const { scene } = useGLTF(glbUrl);
  const ref = useRef<Group>(null);
  return (
    <Center>
      <primitive ref={ref} object={scene} scale={1.8} position={[0, -1.2, -2]} />
    </Center>
  );
}

interface ARSessionContentProps {
  clothingGlbUrl: string;
}

function ARSessionContent({ clothingGlbUrl }: ARSessionContentProps) {
  const session = useXR((s) => s.session);
  if (session == null) return null;
  return (
    <Suspense fallback={null}>
      <ambientLight intensity={1} />
      <ClothingOverlay glbUrl={clothingGlbUrl} />
    </Suspense>
  );
}

interface ARTryOnProps {
  clothingGlbUrl: string;
  productName: string;
  onClose: () => void;
}

// PERF FIX: Renamed to Impl and export via next/dynamic to avoid SSR overhead for Three/XR
const ARTryOnImpl = ({ clothingGlbUrl, productName, onClose }: ARTryOnProps) => {
  const [arError, setArError] = useState<string | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' && 'xr' in navigator;

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
        <Smartphone className="w-12 h-12 text-white/30" />
        <p className="text-white font-medium">AR not supported</p>
        <p className="text-white/50 text-sm">
          AR requires Chrome on Android or Safari on iOS 16+. Make sure you&apos;re on a
          mobile device.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-white/10 text-white text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleStartAr = () => {
    void xrStore.enterAR().catch((e: unknown) => {
      setArError(e instanceof Error ? e.message : String(e));
    });
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-4 z-50 px-3 py-2 rounded-xl bg-black/60 backdrop-blur border border-white/10">
        <p className="text-white/60 text-xs">Trying on</p>
        <p className="text-white font-medium text-sm">{productName}</p>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
        <button
          type="button"
          onClick={handleStartAr}
          className="px-8 py-4 rounded-2xl bg-[#bef264] text-black font-bold text-lg flex items-center gap-3"
        >
          <Smartphone className="w-5 h-5" />
          Start AR Try-On
        </button>
      </div>

      {arError !== null && (
        <div className="absolute bottom-28 left-4 right-4 z-50 p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm text-center">
          {arError}
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 3] }} className="w-full h-full" gl={{ alpha: true }}>
        <XR store={xrStore}>
          <ARSessionContent clothingGlbUrl={clothingGlbUrl} />
          <Environment preset="city" />
        </XR>
      </Canvas>
    </div>
  );
}

// PERF FIX: Dynamic export with ssr: false
export const ARTryOn = dynamic(() => Promise.resolve(ARTryOnImpl), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center w-full h-screen bg-black text-white/50">Loading AR Engine...</div>
});

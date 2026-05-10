"use client";

/**
 * AvatarViewer — React Three Fiber canvas with OrbitControls.
 * Loads a GLB avatar from a signed URL, supports pose switching.
 * Wrapped in Suspense per hard rules.
 *
 * RULE: Always wrap R3F canvas in <Suspense fallback={...}>
 * RULE: "use client" — R3F requires client context
 * RULE: No raw GLB paths — consumer must pass signed URLs
 * RULE: No direct Supabase client inside components — parent fetches and passes avatarUrl
 */

import React, { Suspense, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Center } from '@react-three/drei';
import type { Group } from 'three';
import { RotateCcw, ZoomIn, ZoomOut, Sun } from 'lucide-react';

// ─── Error Boundary (Declarative Error Handling) ─────────────────────────────

class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for observability (production: send to Sentry/DataDog)
    console.error("AvatarModel Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── Avatar GLB Loader ────────────────────────────────────────────────────────

interface AvatarModelProps {
  glbUrl: string;
  pose?: AvatarPose;
}

type AvatarPose = 'a-pose' | 't-pose' | 'idle';

function AvatarModel({ glbUrl }: AvatarModelProps) {
  const { scene } = useGLTF(glbUrl);
  const ref = useRef<Group>(null);

  // Gentle idle rotation
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <Center>
      <primitive ref={ref} object={scene} scale={1} dispose={null} />
    </Center>
  );
}

// ─── Placeholder Avatar (shown when no GLB is loaded) ─────────────────────────

function PlaceholderAvatar() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={ref}>
      {/* Stylized humanoid placeholder */}
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#bef264" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.35, 0.55, 0.18]} />
        <meshStandardMaterial color="#a3e635" roughness={0.4} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.32, 0.2, 0.18]} />
        <meshStandardMaterial color="#84cc16" roughness={0.4} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.1, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.55, 0.12]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.5} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.1, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.55, 0.12]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.5} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.26, 1.1, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#65a30d" roughness={0.4} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.26, 1.1, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.1, 0.45, 0.1]} />
        <meshStandardMaterial color="#65a30d" roughness={0.4} />
      </mesh>
    </group>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────

function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[#bef264]/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-t-[#bef264] border-transparent animate-spin" />
      </div>
      <p className="text-white/40 text-sm">Loading avatar…</p>
    </div>
  );
}

// ─── Main AvatarViewer Export ─────────────────────────────────────────────────

interface AvatarViewerProps {
  /** Signed avatar URL — parent fetches from /api/avatar/[userId] and passes it down */
  avatarUrl?: string | null;
  /** Legacy prop alias */
  glbUrl?: string | null;
  className?: string;
  showControls?: boolean;
}

// PERF FIX: Renamed component to Impl and export via next/dynamic with ssr: false
const AvatarViewerImpl = ({ avatarUrl, glbUrl, className = '', showControls = true }: AvatarViewerProps) => {
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [envPreset, setEnvPreset] = useState<'city' | 'studio' | 'sunset'>('city');

  // avatarUrl takes precedence, then glbUrl (legacy compat)
  const finalGlbUrl = avatarUrl || glbUrl || null;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 ${className}`}>
      {/* R3F Canvas — always wrapped in Suspense per hard rules */}
      <Suspense fallback={<CanvasLoader />}>
        <Canvas
          camera={{ position: [0, 1.0, 3.0 * zoom], fov: 50 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          className="w-full"
          style={{ height: '100%' }}
          onError={(error) => console.error('Canvas Error:', error)}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
          <pointLight position={[-5, 5, 5]} intensity={0.3} color="#bef264" />

          <Environment preset={envPreset} />

          <Suspense fallback={null}>
            {finalGlbUrl ? (
              <ErrorBoundary fallback={<PlaceholderAvatar />}>
                <AvatarModel key={finalGlbUrl} glbUrl={finalGlbUrl} />
              </ErrorBoundary>
            ) : (
              <PlaceholderAvatar />
            )}
          </Suspense>

          <ContactShadows
            opacity={0.4}
            scale={2}
            blur={2}
            far={2}
            position={[0, -0.05, 0]}
          />

          <OrbitControls
            autoRotate={isAutoRotate}
            autoRotateSpeed={1.5}
            enablePan={false}
            minDistance={1.5}
            maxDistance={8}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>
      </Suspense>

      {/* ── Overlay Controls ── */}
      {showControls && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              id="avatar-viewer-rotate-toggle"
              onClick={() => setIsAutoRotate((p) => !p)}
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                isAutoRotate
                  ? 'bg-[#bef264]/20 border-[#bef264]/40 text-[#bef264]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}
              title="Toggle auto-rotate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="avatar-viewer-zoom-out"
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="avatar-viewer-zoom-in"
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="avatar-viewer-env-toggle"
              onClick={() =>
                setEnvPreset((p) =>
                  p === 'city' ? 'studio' : p === 'studio' ? 'sunset' : 'city'
                )
              }
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Toggle environment"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* No GLB badge */}
      {!finalGlbUrl && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white/40 text-xs">
          Placeholder — generate your avatar first
        </div>
      )}
    </div>
  );
}

// PERF FIX: Dynamic export with ssr: false prevents heavy Three.js dependencies from bloating the SSR pass
export const AvatarViewer = dynamic(() => Promise.resolve(AvatarViewerImpl), {
  ssr: false,
  loading: () => <CanvasLoader />
});

"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { RippleGrid } from '@/components/ui/ripple-grid';

const MARKETING_ROUTES = ['/', '/3d', '/virtual-try-on', '/pricing', '/integration', '/studio', '/admin', '/design', '/video-tryon', '/trends'];

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  // SSR / first paint can yield null — treat as home so marketing shell + theme vars apply
  const pathname = usePathname() ?? "/";
  const isMarketing = MARKETING_ROUTES.includes(pathname);

  const ripple = (
    <RippleGrid
      reactToGlobalClicks
      fillViewport
      cellSize={32}
      accentFractions={[
        { fr: 0.06, fc: 0.06 },
        { fr: 0.06, fc: 0.94 },
        { fr: 0.94, fc: 0.06 },
        { fr: 0.94, fc: 0.94 },
      ]}
      cellColor="transparent"
      filledCellColor="rgba(74, 103, 65, 0.03)"
      pulseColor="rgba(74, 103, 65, 0.12)"
      borderColor="rgba(74, 103, 65, 0.03)"
      borderWidth={1}
      pulseScale={1.05}
      pulseDuration={320}
      rippleDelay={32}
    />
  );

  if (isMarketing) {
    return (
      <>
        <div className="marketing-theme text-foreground relative z-10">
          <style dangerouslySetInnerHTML={{ __html: `
          body { background: none !important; animation: none !important; filter: none !important; background-color: #f8f7f2 !important; }
          body::before { display: none !important; }
        `}} />
          {ripple}
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      {ripple}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <main className="min-h-screen flex-1 pt-20">{children}</main>
        <Footer />
      </div>
    </>
  );
}

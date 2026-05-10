import React from 'react';
import { GooeyText } from '@/components/ui/gooey-text-morphing';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12">
      {/* Ambient Background Glows — ripple grid is global in GlobalLayout */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[50rem] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-[1]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[100px] pointer-events-none z-[1]" style={{ background: 'rgba(0,212,255,0.04)' }} />
      {/* Badge */}
      <div
        className="relative glass-card bg-primary/5 border-primary/20 rounded-full mt-8 px-5 py-2 flex items-center gap-2 z-20 opacity-100"
        style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
      >
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
        <span className="text-sm font-medium text-primary/90 font-mono">Virtual Try-On API · v3.0</span>
      </div>
      {/* Hero Headline */}
      <h1
        className="mt-8 text-center font-sans font-extrabold tracking-tighter leading-none z-20 relative px-4"
        style={{
          fontSize: 'clamp(3rem, 10vw, 9rem)',
          lineHeight: 0.9,
          animation: 'animationIn 0.8s ease-out 0.3s forwards',
          opacity: 0,
        }}
      >
        <span className="block text-gradient-primary">See It On You.</span>
        <span className="mt-2 block w-full max-w-[min(100%,42rem)] mx-auto">
          <GooeyText
            texts={[
              'Before You Buy.',
              'Try It On Virtually.',
              'Fewer Returns.',
              'One Software Development Kit.',
            ]}
            morphTime={1}
            cooldownTime={0.35}
            className="font-extrabold tracking-tighter"
            textClassName="text-slate-500 text-[clamp(1.75rem,5.5vw,4.5rem)] md:text-[clamp(2rem,6vw,5rem)] font-extrabold tracking-tighter leading-none"
          />
        </span>
      </h1>
      {/* Sub */}
      <p
        className="mt-8 text-base md:text-xl text-muted-foreground text-center max-w-2xl leading-relaxed font-normal px-6 z-20 relative"
        style={{ animation: 'animationIn 0.8s ease-out 0.4s forwards', opacity: 0 }}
      >
        VEXA embeds AI-powered 3D virtual try-on directly into your fashion platform.
        One Software Development Kit. Zero friction. Measurably fewer returns.
      </p>
      {/* CTAs */}
      <div
        className="flex flex-col sm:flex-row mt-10 gap-3 items-center z-20 relative"
        style={{ animation: 'animationIn 0.8s ease-out 0.5s forwards', opacity: 0 }}
      >
        {/* Primary CTA with solid Sage-Green */}
        <a href="/#booking" className="group relative flex items-center gap-3 bg-[#4A6741] rounded-full pt-2 pr-8 pb-2 pl-2 hover:bg-[#3d5636] transition-all duration-300 shadow-xl shadow-[#4A6741]/20">
          <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
          <span className="relative z-10 text-base font-bold text-white tracking-tight">Book a Demo</span>
        </a>

        <a href="/studio" className="flex items-center gap-2 border border-slate-200 hover:border-[#4A6741]/30 bg-white rounded-full px-6 py-3.5 text-sm font-bold text-[#1a1a1a] transition-all duration-300 group shadow-sm">
          <span>Start Integration</span>
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </a>
      </div>
      {/* Floating Cards */}
      {/* Card 1: Top Left — Conversion Rate */}
      <div
        className="hidden lg:block glass-card rounded-2xl p-4 absolute top-[18%] left-[6%] w-64 animate-float-1"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">Conversion Rate</span>
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
        </div>
        <div className="text-3xl font-bold text-[#4A6741] mb-1">+312%</div>
        <div className="text-xs text-slate-500">vs. standard product images</div>
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#4A6741]" style={{ width: '78%' }} />
        </div>
      </div>
      {/* Card 2: Top Right — Active Avatars */}
      <div
        className="hidden lg:block glass-card rounded-2xl p-4 absolute top-[22%] right-[6%] w-60 animate-float-2"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <span className="text-xs font-mono text-muted-foreground">Live Avatars</span>
        </div>
        <div className="text-2xl font-bold text-[#1a1a1a] mb-1">2.4M+</div>
        <div className="text-xs text-slate-500">generated this month</div>
        <div className="flex gap-1 mt-3">
          {[40, 65, 55, 80, 70, 90, 75]?.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 0.3}px`, background: i === 6 ? '#4A6741' : 'rgba(74,103,65,0.3)' }} />
          ))}
        </div>
      </div>
      {/* Card 3: Bottom Left — Return Rate */}
      <div
        className="hidden lg:block glass-card rounded-2xl p-4 absolute bottom-[12%] left-[8%] w-72 animate-float-3"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">Return Rate</span>
          <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">↓ 40%</span>
        </div>
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">Before VEXA</div>
            <div className="h-2 bg-red-500/40 rounded-full w-full" />
            <div className="text-xs text-red-400 mt-1">28% returns</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">After VEXA</div>
            <div className="h-2 rounded-full bg-[#4A6741]" style={{ width: '60%' }} />
            <div className="text-xs text-[#4A6741] mt-1">17% returns</div>
          </div>
        </div>
      </div>
      {/* Card 4: Bottom Right — API Latency */}
      <div
        className="hidden lg:block glass-card rounded-2xl p-4 absolute bottom-[14%] right-[7%] w-64 animate-float-4"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="text-xs font-mono text-muted-foreground">API Latency</span>
        </div>
        <div className="text-2xl font-bold text-[#1a1a1a] mb-1">
          <span className="text-[#4A6741]">&lt;200</span>
          <span className="text-sm text-slate-500 font-normal">ms</span>
        </div>
        <div className="text-xs text-slate-500">p99 render time</div>
        <div className="mt-3 flex items-end gap-1">
          {[60, 45, 80, 55, 70, 40, 65, 50, 75, 45]?.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h * 0.25}px`,
                background: i === 9 ? '#4A6741' : 'rgba(74,103,65,0.3)',
              }}
            />
          ))}
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground z-20 animate-bounce">
        <span className="text-xs font-mono">scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
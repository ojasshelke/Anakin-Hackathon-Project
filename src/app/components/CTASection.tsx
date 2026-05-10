import React from 'react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="relative glass-card rounded-3xl overflow-hidden opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] rounded-full blur-[80px]" style={{ background: 'rgba(74,103,65,0.1)' }} />
            <div className="absolute bottom-0 right-1/4 w-[20rem] h-[15rem] rounded-full blur-[60px]" style={{ background: 'rgba(74,103,65,0.05)' }} />
          </div>

          {/* Ghost text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <span className="text-[8vw] font-extrabold whitespace-nowrap tracking-tighter select-none" style={{ color: 'rgba(74,103,65,0.05)' }}>
              START BUILDING
            </span>
          </div>

          <div className="relative z-10 px-8 md:px-16 py-16 md:py-20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">
                Ready to integrate?
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                <span className="text-muted-foreground">Deploy virtual try-on</span>
                <span className="block text-gradient-primary">in one afternoon.</span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                Three lines of code. Full 3D virtual try-on. Your customers see it on themselves — before checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/pricing"
                className="group relative flex items-center gap-3 bg-white hover:bg-white/90 text-black rounded-full px-7 py-4 font-semibold text-sm transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Book a Demo</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/studio"
                className="flex items-center gap-2 border border-border hover:border-[#4A6741]/20 bg-white/5 hover:bg-white/10 rounded-full px-7 py-4 text-sm font-medium text-foreground transition-all duration-300"
              >
                Start Integration
              </Link>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="relative z-10 border-t border-border px-8 md:px-16 py-6 flex flex-wrap gap-8">
            {[
              { label: 'Setup time', val: '< 1 day' },
              { label: 'Uptime SLA', val: '99.9%' },
              { label: 'Brands integrated', val: '300+' },
              { label: 'Support', val: '24/7 dedicated' },
            ]?.map((item) => (
              <div key={item?.label}>
                <div className="text-lg font-bold font-mono text-gradient-accent">{item?.val}</div>
                <div className="text-xs text-muted-foreground">{item?.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
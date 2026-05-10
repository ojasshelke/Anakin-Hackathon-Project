import React from 'react';
import Link from 'next/link';

export default function IntegrationHero() {
  return (
    <section className="relative pt-40 pb-16 overflow-hidden">
      <div className="absolute top-0 right-0 w-[40rem] h-[30rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(74,103,65,0.07)' }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span
              className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block"
              style={{ animation: 'animationIn 0.8s ease-out 0.1s forwards', opacity: 1 }}
            >
              Developer Integration
            </span>
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6"
              style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
            >
              From zero to{' '}
              <span className="text-gradient-primary">try-on</span>{' '}
              in one afternoon.
            </h1>
            <p
              className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg"
              style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
            >
              VEXA ships as a drop-in Software Development Kit and a full REST API. Works with any frontend stack. No ML expertise required.
            </p>
            <div
              className="flex flex-wrap gap-4"
              style={{ animation: 'animationIn 0.8s ease-out 0.4s forwards', opacity: 1 }}
            >
              <Link
                href="/pricing"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-300"
              >
                Get API Key
              </Link>
              <a
                href="#quickstart"
                className="border border-border hover:border-primary/40 text-foreground hover:bg-white/5 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300"
              >
                View Quickstart
              </a>
            </div>
          </div>

          {/* Terminal card */}
          <div
            className="glass-card rounded-2xl overflow-hidden"
            style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
          >
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/[0.02]">
              <div className="flex gap-2">
                {['#EF4444','#F59E0B','#22C55E']?.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs font-mono text-muted-foreground">vexa-integration.js</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
                <span className="text-xs font-mono text-accent">live</span>
              </div>
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground/50 mb-3">// Install the Software Development Kit</div>
              <div className="text-accent mb-4">$ npm install @vexa/sdk</div>

              <div className="text-muted-foreground/50 mb-3">// Initialize VEXA</div>
              <div className="mb-1">
                <span style={{ color: '#4A6741' }}>import</span>
                <span className="text-foreground"> VEXA </span>
                <span style={{ color: '#4A6741' }}>from</span>
                <span style={{ color: '#8B7D3C' }}> &apos;@vexa/sdk&apos;</span>
              </div>
              <div className="mb-4">
                <span style={{ color: '#4A6741' }}>const</span>
                <span className="text-foreground"> sdk </span>
                <span className="text-muted-foreground">= </span>
                <span className="text-foreground">VEXA</span>
                <span className="text-muted-foreground">.</span>
                <span style={{ color: '#4A6741' }}>init</span>
                <span className="text-muted-foreground">(&#123;</span>
              </div>
              <div className="pl-4 mb-1">
                <span style={{ color: '#8B7D3C' }}>apiKey</span>
                <span className="text-muted-foreground">: </span>
                <span style={{ color: '#4A6741' }}>&apos;vxa_live_...&apos;</span>
                <span className="text-muted-foreground">,</span>
              </div>
              <div className="pl-4 mb-4">
                <span style={{ color: '#8B7D3C' }}>container</span>
                <span className="text-muted-foreground">: </span>
                <span style={{ color: '#4A6741' }}>&apos;#try-on-widget&apos;</span>
              </div>
              <div className="mb-6 text-muted-foreground">&#125;)</div>

              <div className="text-muted-foreground/50 mb-3">// Render the try-on widget</div>
              <div>
                <span className="text-foreground">sdk</span>
                <span className="text-muted-foreground">.</span>
                <span style={{ color: '#4A6741' }}>render</span>
                <span className="text-muted-foreground">(&#123;</span>
              </div>
              <div className="pl-4">
                <span style={{ color: '#8B7D3C' }}>productId</span>
                <span className="text-muted-foreground">: productId</span>
              </div>
              <div className="text-muted-foreground">&#125;)</div>

              <div className="mt-4 flex items-center gap-2 text-green-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
                VEXA widget mounted successfully
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

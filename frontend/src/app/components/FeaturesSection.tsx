import React from 'react';

// BENTO GRID AUDIT:
// Array has 6 cards: [3D Visualization, AI Body Mapping, Easy Integration, Real-time Rendering, Multi-brand Support, Analytics Dashboard]
// Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
// Row 1: [col-1: 3D Visualization cs-1] [col-2: AI Body Mapping cs-1] [col-3: Easy Integration cs-1]
// Row 2: [col-1+2: Real-time Rendering cs-2] [col-3: Multi-brand Support cs-1]
// Row 3: [col-1+2+3: Analytics Dashboard cs-3]
// Placed 6/6 cards ✓

const features = [
  {
    id: '3d-viz',
    title: '3D Visualization',
    desc: 'Photorealistic garment rendering with fabric physics, lighting simulation, and dynamic shadow casting.',
    tag: 'Core Engine',
    accent: '#4A6741',
    colSpan: 'lg:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    visual: (
      <div className="relative h-28 flex items-center justify-center">
        <div className="w-16 h-16 rounded-xl border border-primary/40 flex items-center justify-center" style={{ background: 'rgba(74,103,65,0.1)' }}>
          <div className="w-8 h-8 rounded-lg bg-primary/60 animate-pulse-glow" />
        </div>
        {[0,1,2]?.map(i => (
          <div key={i} className="absolute rounded-full border border-primary/20" style={{ width: `${(i+2)*40}px`, height: `${(i+2)*40}px`, animationDelay: `${i*0.5}s` }} />
        ))}
      </div>
    ),
  },
  {
    id: 'ai-body',
    title: 'AI Body Mapping',
    desc: '68-point skeletal analysis from a single photo. Works across 200+ body types with 99.2% dimensional accuracy.',
    tag: 'AI Core',
    accent: '#6B8C5E',
    colSpan: 'lg:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    visual: (
      <div className="relative h-28 flex items-center justify-center">
        <svg viewBox="0 0 80 100" className="w-16 h-20 opacity-60">
          <circle cx="40" cy="12" r="8" fill="none" stroke="#6B8C5E" strokeWidth="1.5" />
          <line x1="40" y1="20" x2="40" y2="55" stroke="#6B8C5E" strokeWidth="1.5" />
          <line x1="40" y1="30" x2="20" y2="45" stroke="#6B8C5E" strokeWidth="1.5" />
          <line x1="40" y1="30" x2="60" y2="45" stroke="#6B8C5E" strokeWidth="1.5" />
          <line x1="40" y1="55" x2="28" y2="80" stroke="#6B8C5E" strokeWidth="1.5" />
          <line x1="40" y1="55" x2="52" y2="80" stroke="#6B8C5E" strokeWidth="1.5" />
          {[[40,12],[20,45],[60,45],[28,80],[52,80],[40,35],[40,55]]?.map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="#6B8C5E" opacity="0.8" />
          ))}
        </svg>
      </div>
    ),
  },
  {
    id: 'integration',
    title: 'Easy Integration',
    desc: 'Drop-in Software Development Kit for React, Vue, and native mobile. Full REST API for custom implementations.',
    tag: 'Dev Ready',
    accent: '#A78BFA',
    colSpan: 'lg:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    visual: (
      <div className="relative h-28 p-3 font-mono text-xs overflow-hidden">
        <div className="text-muted-foreground/80 mb-1">// 3 lines to integrate</div>
        <div><span style={{ color: '#4A6741' }}>import</span> <span className="text-[#1a1a1a] font-bold">VEXA</span> <span style={{ color: '#4A6741' }}>from</span> <span style={{ color: '#059669' }}>&apos;@vexa/sdk&apos;</span></div>
        <div className="mt-1"><span style={{ color: '#4A6741' }}>const</span> <span className="text-[#1a1a1a] font-bold">sdk</span> = <span className="text-[#1a1a1a] font-bold">VEXA</span>.<span style={{ color: '#059669' }}>init</span>(<span style={{ color: '#059669' }}>&apos;key&apos;</span>)</div>
        <div className="mt-1"><span className="text-[#1a1a1a] font-bold">sdk</span>.<span style={{ color: '#059669' }}>render</span>(<span style={{ color: '#059669' }}>&apos;#container&apos;</span>)</div>
      </div>
    ),
  },
  {
    id: 'realtime',
    title: 'Real-time Rendering Engine',
    desc: 'Sub-200ms render times powered by distributed GPU clusters. Stream photorealistic garment previews to any device, anywhere, at any scale. No client-side processing required.',
    tag: '<200ms p99',
    accent: '#4A6741',
    colSpan: 'lg:col-span-2',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    visual: (
      <div className="h-20 flex items-end gap-1 px-2">
        {[45, 62, 38, 71, 55, 80, 48, 67, 52, 75, 44, 68, 59, 82, 50, 73, 46, 70]?.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${h * 0.22}px`,
              background: i % 3 === 0
                ? 'linear-gradient(to top, #4A6741, #8B7D3C)'
                : 'rgba(74,103,65,0.3)',
            }}
          />
        ))}
      </div>
    ),
  },
  {
    id: 'multibrand',
    title: 'Multi-brand Support',
    desc: 'One integration powers unlimited brands. White-label ready with custom theming per storefront.',
    tag: 'Enterprise',
    accent: '#8B7D3C',
    colSpan: 'lg:col-span-1',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
    visual: (
      <div className="h-20 flex items-center justify-center gap-3">
        {['A','B','C','D']?.map((l, i) => (
          <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(139,125,60,0.15)', color: '#8B7D3C', border: '1px solid rgba(139,125,60,0.3)' }}>
            {l}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    desc: 'Track try-on engagement, conversion lift, return rate delta, and size accuracy across every SKU. Exportable reports for your team.',
    tag: 'Insights',
    accent: '#4A6741',
    colSpan: 'lg:col-span-3',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    visual: (
      <div className="flex gap-8 items-end h-20 px-4">
        {[
          { label: 'Try-ons', val: '2.4M', color: '#4A6741' },
          { label: 'Conversions', val: '+312%', color: '#6B8C5E' },
          { label: 'Return ↓', val: '40%', color: '#8B7D3C' },
          { label: 'Accuracy', val: '99.2%', color: '#4A6741' },
        ]?.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="text-base font-bold font-mono" style={{ color: stat?.color }}>{stat?.val}</div>
            <div className="text-xs text-muted-foreground">{stat?.label}</div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative py-16 pb-24">
      {/* Ghost watermark */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none select-none w-full text-center z-0"
        style={{
          maskImage: 'linear-gradient(180deg, transparent, black 10%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, black 10%, black 70%, transparent)',
        }}
      >
        <span className="text-[10vw] font-extrabold whitespace-nowrap tracking-tighter" style={{ color: 'rgba(255,255,255,0.025)' }}>
          FEATURES
        </span>
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-16 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
        >
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Built for scale.<br />
              <span className="text-gradient-primary">Designed for precision.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-base leading-relaxed lg:text-right pt-4">
            Every component of VEXA is engineered for enterprise fashion platforms — from indie D2C to global retail.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features?.map((feature, i) => (
            <div
              key={feature?.id}
              className={`relative glass-card rounded-2xl p-5 group hover:border-primary/30 transition-all duration-500 overflow-hidden opacity-100 animate-on-scroll ${feature?.colSpan}`}
              style={{
                animation: `animationIn 0.8s ease-out ${0.2 + i * 0.1}s forwards`,
                opacity: 0,
              }}
            >
              {/* Subtle glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 50%, ${feature?.accent}08 0%, transparent 70%)` }}
              />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${feature?.accent}15`, color: feature?.accent }}
                  >
                    {feature?.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{feature?.title}</h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{ background: `${feature?.accent}15`, color: feature?.accent }}
                    >
                      {feature?.tag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual */}
              {feature?.visual}

              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{feature?.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
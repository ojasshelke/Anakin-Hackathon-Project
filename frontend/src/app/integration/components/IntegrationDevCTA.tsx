import React from 'react';
import Link from 'next/link';

export default function IntegrationDevCTA() {
  return (
    <section className="py-12 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sandbox card */}
          <div
            className="relative glass-card rounded-2xl p-8 overflow-hidden group opacity-100 animate-on-scroll"
            style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(74,103,65,0.1)' }} />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(74,103,65,0.15)' }}>
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Try the Sandbox</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Test VEXA with your own product catalog in our interactive sandbox. No production credentials needed. Full feature access for 14 days.
              </p>
              <div className="space-y-2 mb-6">
                {['No credit card required', 'Full API access', 'Test with real garments', '10,000 sandbox renders']?.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 group"
              >
                Start Free Sandbox
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Docs card */}
          <div
            className="relative glass-card rounded-2xl p-8 overflow-hidden group opacity-100 animate-on-scroll"
            style={{ animation: 'animationIn 0.8s ease-out 0.35s forwards', opacity: 1 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none" style={{ background: 'rgba(74,103,65,0.08)' }} />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(74,103,65,0.1)' }}>
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Full Documentation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Comprehensive guides, API reference, webhook documentation, and example projects. Everything you need to go from zero to production.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'API Reference', icon: '⚡' },
                  { label: 'Software Development Kit Guides', icon: '📦' },
                  { label: 'Webhooks', icon: '🔗' },
                  { label: 'Examples', icon: '💡' },
                ]?.map((doc) => (
                  <div
                    key={doc?.label}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <span className="text-base">{doc?.icon}</span>
                    <span className="text-xs font-medium text-foreground">{doc?.label}</span>
                  </div>
                ))}
              </div>

              <a
                href="#"
                className="inline-flex items-center gap-2 border border-border hover:border-accent/40 text-foreground hover:bg-white/5 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 group"
              >
                Browse Documentation
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom support strip */}
        <div
          className="mt-6 glass-card rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.5s forwards', opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,103,65,0.15)' }}>
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Need integration help?</div>
              <div className="text-xs text-muted-foreground">Our developer success team responds in under 2 hours.</div>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1 min-h-[44px]">
              Join Discord Community →
            </a>
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px]">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

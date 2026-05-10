import React from 'react';
import Link from 'next/link';

export default function PricingCTA() {
  return (
    <section className="py-12 pb-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div
          className="glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30rem] h-[15rem] rounded-full blur-[60px]" style={{ background: 'rgba(74,103,65,0.1)' }} />
          </div>
          <div className="relative z-10">
            <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Enterprise Ready</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
              Need a <span className="text-gradient-primary">custom arrangement?</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Multi-brand portfolios, platform aggregators, and global fashion groups — talk to our enterprise team for volume pricing and custom SLAs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
              >
                Contact Enterprise Sales
              </Link>
              <Link
                href="/integration"
                className="border border-border hover:border-primary/40 text-foreground hover:bg-white/5 rounded-full px-8 py-4 text-sm font-medium transition-all duration-300"
              >
                View Integration Docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

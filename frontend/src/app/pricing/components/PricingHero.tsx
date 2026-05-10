import React from 'react';

export default function PricingHero() {
  return (
    <section className="relative pt-40 pb-16 overflow-hidden text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(74,103,65,0.1)' }} />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <span
          className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block"
          style={{ animation: 'animationIn 0.8s ease-out 0.1s forwards', opacity: 1 }}
        >
          Transparent Pricing
        </span>
        <h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          Scale with{' '}
          <span className="text-gradient-primary">confidence.</span>
        </h1>
        <p
          className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
        >
          Usage-based B2B pricing. Pay for what you deploy. No hidden fees, no surprise invoices.
        </p>
      </div>
    </section>
  );
}

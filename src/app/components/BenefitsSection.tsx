import React from 'react';

const stats = [
  {
    value: '40%',
    label: 'Fewer Returns',
    desc: 'Customers who try before they buy return 40% less on average across VEXA-integrated storefronts.',
    accent: '#4A6741',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045a1.5 1.5 0 0 1 2.09-.003L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    value: '3.1×',
    label: 'Higher Conversions',
    desc: 'Shoppers who use the virtual try-on feature convert at 3× the rate of those viewing standard images.',
    accent: '#6B8C5E',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    value: '2 sec',
    label: 'Avatar Generation',
    desc: 'From photo upload to fully rendered 3D avatar in under 2 seconds. No waiting, no friction.',
    accent: '#8B7D3C',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    value: '99.2%',
    label: 'Size Accuracy',
    desc: 'VEXA body mapping achieves 99.2% dimensional accuracy — reducing size-related returns to near zero.',
    accent: '#4A6741',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export default function BenefitsSection() {
  return (
    <section className="relative py-16 pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[30rem] rounded-full blur-[100px]" style={{ background: 'rgba(74, 103, 65, 0.05)' }} />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          className="text-center mb-16 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
        >
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">
            The ROI
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Numbers that{' '}
            <span className="text-gradient-primary">move the needle.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-4 text-base leading-relaxed">
            Real metrics from VEXA-integrated storefronts. Not projections — production data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats?.map((stat, i) => (
            <div
              key={i}
              className="relative glass-card rounded-2xl p-6 group hover:border-primary/30 transition-all duration-500 overflow-hidden opacity-100 animate-on-scroll"
              style={{
                animation: `animationIn 0.8s ease-out ${0.2 + i * 0.12}s forwards`,
                opacity: 0,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 30% 30%, ${stat?.accent}10 0%, transparent 70%)` }}
              />

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${stat?.accent}15`, color: stat?.accent }}
              >
                {stat?.icon}
              </div>

              <div
                className="text-4xl font-extrabold font-mono mb-2 leading-none"
                style={{ color: stat?.accent }}
              >
                {stat?.value}
              </div>
              <div className="text-sm font-semibold text-foreground mb-3">{stat?.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat?.desc}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${stat?.accent}, transparent)` }}
              />
            </div>
          ))}
        </div>

        {/* Integration logos */}
        <div
          className="mt-16 pt-12 border-t border-border opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.6s forwards', opacity: 0 }}
        >
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center mb-8">
            Integrates with your stack
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Shopify', 'WooCommerce', 'Magento', 'React Native', 'Flutter', 'Next.js']?.map((platform) => (
              <div
                key={platform}
                className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
import React from 'react';

const rows = [
  { feature: 'Try-on renders / month', starter: '10,000', growth: '100,000', enterprise: 'Unlimited' },
  { feature: 'Storefront integrations', starter: '1', growth: '5', enterprise: 'Unlimited' },
  { feature: 'API access (REST)', starter: true, growth: true, enterprise: true },
  { feature: 'Software Development Kit (React / Vue / Mobile)', starter: false, growth: true, enterprise: true },
  { feature: 'Body mapping points', starter: '40', growth: '68', enterprise: '68 + custom' },
  { feature: 'Analytics dashboard', starter: 'Basic', growth: 'Full + export', enterprise: 'Custom BI' },
  { feature: 'Uptime SLA', starter: '99.5%', growth: '99.9%', enterprise: '99.99%' },
  { feature: 'Support', starter: 'Email', growth: 'Priority + Slack', enterprise: 'Dedicated CSM' },
  { feature: 'White-label avatars', starter: false, growth: true, enterprise: true },
  { feature: 'On-premise deployment', starter: false, growth: false, enterprise: true },
  { feature: 'SSO / SAML', starter: false, growth: false, enterprise: true },
];

function Cell({ val }: { val: string | boolean }) {
  if (typeof val === 'boolean') {
    return val ? (
      <svg className="w-5 h-5 mx-auto text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ) : (
      <svg className="w-5 h-5 mx-auto text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    );
  }
  return <span className="text-sm text-foreground font-medium">{val}</span>;
}

export default function PricingComparison() {
  return (
    <section className="py-12 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="text-center mb-10 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Full feature{' '}
            <span className="text-gradient-primary">comparison.</span>
          </h2>
          <p className="text-muted-foreground text-sm">Every detail, side by side.</p>
        </div>

        <div
          className="glass-card rounded-2xl overflow-hidden opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
        >
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-border">
            <div className="p-5 text-xs font-mono uppercase tracking-wider text-muted-foreground">Feature</div>
            {['Starter', 'Growth', 'Enterprise'].map((t, i) => (
              <div key={t} className={`p-5 text-center text-xs font-mono font-semibold uppercase tracking-wider ${i === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                {t}
              </div>
            ))}
          </div>

          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
            >
              <div className="p-4 text-sm text-muted-foreground">{row.feature}</div>
              <div className="p-4 text-center"><Cell val={row.starter} /></div>
              <div className="p-4 text-center bg-primary/[0.03]"><Cell val={row.growth} /></div>
              <div className="p-4 text-center"><Cell val={row.enterprise} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

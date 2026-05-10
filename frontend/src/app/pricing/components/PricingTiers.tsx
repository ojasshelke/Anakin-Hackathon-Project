import React from 'react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: '$499',
    period: '/mo',
    desc: 'For D2C startups and early-stage brands testing virtual try-on.',
    highlight: false,
    accent: '#6B8C5E',
    features: [
      '10,000 try-on renders/mo',
      '1 storefront integration',
      'REST API access',
      'Standard body mapping (40 points)',
      'Email support',
      '99.5% uptime SLA',
      'Basic analytics dashboard',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/integration',
  },
  {
    name: 'Growth',
    price: '$1,499',
    period: '/mo',
    desc: 'For scaling fashion brands ready to make try-on a core conversion lever.',
    highlight: true,
    accent: '#4A6741',
    features: [
      '100,000 try-on renders/mo',
      '5 storefront integrations',
      'REST API + Software Development Kit (React/Vue)',
      'Advanced body mapping (68 points)',
      'Priority support + Slack channel',
      '99.9% uptime SLA',
      'Full analytics + export',
      'Custom avatar branding',
      'Webhooks & event streaming',
    ],
    cta: 'Book a Demo',
    ctaHref: '/',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For fashion groups, platform builders, and multi-brand portfolios.',
    highlight: false,
    accent: '#8B7D3C',
    features: [
      'Unlimited renders',
      'Unlimited storefronts',
      'Full Software Development Kit + white-label',
      'Custom model training',
      'Dedicated CSM + SLA',
      '99.99% uptime SLA',
      'On-premise deployment option',
      'SSO / SAML / SCIM',
      'Custom reporting & BI integration',
    ],
    cta: 'Contact Sales',
    ctaHref: '/',
  },
];

export default function PricingTiers() {
  return (
    <section className="py-12 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers?.map((tier, i) => (
            <div
              key={tier?.name}
              className={`relative rounded-2xl p-8 flex flex-col transition-all duration-500 opacity-100 animate-on-scroll ${
                tier?.highlight
                  ? 'border-gradient-primary neon-glow-primary' :'glass-card'
              }`}
              style={{
                animation: `animationIn 0.8s ease-out ${0.2 + i * 0.15}s forwards`,
                opacity: 1,
              }}
            >
              {tier?.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-mono font-semibold text-white" style={{ background: 'linear-gradient(135deg, #4A6741, #3d5636)' }}>
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: tier?.accent }}>{tier?.name}</div>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-extrabold font-mono text-foreground">{tier?.price}</span>
                  <span className="text-muted-foreground text-sm pb-1">{tier?.period}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tier?.desc}</p>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {tier?.features?.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: tier?.accent }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href={tier?.ctaHref}
                className={`w-full py-3.5 rounded-full text-sm font-semibold text-center transition-all duration-300 ${
                  tier?.highlight
                    ? 'bg-primary hover:bg-primary/90 text-white' :'border border-border hover:border-primary/40 text-foreground hover:bg-white/5'
                }`}
              >
                {tier?.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
          All plans include 14-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

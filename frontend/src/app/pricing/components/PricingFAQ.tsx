'use client';
import React, { useState } from 'react';

const faqs = [
  {
    q: 'What counts as a "try-on render"?',
    a: 'A render is one instance of a customer loading a garment onto their avatar. Browsing product images does not count. Only the virtual try-on interaction is metered.',
  },
  {
    q: 'Can I upgrade or downgrade my plan mid-month?',
    a: 'Yes. Upgrades take effect immediately and are prorated. Downgrades take effect at the next billing cycle. Enterprise contracts are annual.',
  },
  {
    q: 'Is there a free trial?',
    a: 'All plans include a 14-day free trial with full feature access. No credit card required to start. Enterprise trials are available on request.',
  },
  {
    q: 'How does B2B invoicing work?',
    a: 'We issue monthly invoices in USD with net-30 payment terms for annual contracts. Monthly plans are charged via card. We support PO-based procurement for Enterprise.',
  },
  {
    q: 'Do you offer volume discounts beyond Enterprise?',
    a: 'Yes. If you expect 10M+ renders per month, contact our sales team for a custom rate. We work with major platform aggregators on custom arrangements.',
  },
  {
    q: 'What happens if I exceed my render limit?',
    a: 'Renders are not cut off. Overages are billed at $0.015/render for Starter and $0.008/render for Growth at month end. Enterprise plans have negotiated overage rates.',
  },
];

export default function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-12 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div
          className="text-center mb-12 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Pricing <span className="text-gradient-primary">questions.</span>
          </h2>
          <p className="text-muted-foreground text-sm">No ambiguity. Just answers.</p>
        </div>

        <div className="space-y-3">
          {faqs?.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl overflow-hidden opacity-100 animate-on-scroll"
              style={{ animation: `animationIn 0.8s ease-out ${0.2 + i * 0.08}s forwards`, opacity: 1 }}
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left min-h-[44px]"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq?.q}</span>
                <svg
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq?.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

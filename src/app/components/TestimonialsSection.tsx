import React from 'react';

const testimonials = [
  {
    quote: "We integrated VEXA in a single afternoon. Return rates dropped from 26% to 15% within the first month. The ROI was immediate.",
    name: "Priya Sharma",
    role: "CTO, Runway Republic",
    company: "D2C Fashion, Mumbai",
  },
  {
    quote: "Our customers spend 4× longer on product pages since adding VEXA try-on. Conversion jumped 280% on items with the feature enabled.",
    name: "Marcus Webb",
    role: "VP E-commerce, LookBook",
    company: "Fashion Retail, New York",
  },
  {
    quote: "The API documentation is exceptional. My team had a working integration in 3 hours. The accuracy of the body mapping is genuinely impressive.",
    name: "Yuki Tanaka",
    role: "Lead Engineer, StyleGrid",
    company: "Fashion Tech, Tokyo",
  },
  {
    quote: "VEXA\'s multi-brand support let us roll it out across all 12 of our portfolio brands from a single integration. Game-changing for our scale.",
    name: "Aisha Okonkwo",
    role: "Head of Product, Couture Group",
    company: "Fashion Conglomerate, Lagos",
  },
  {
    quote: "The 3D rendering quality rivals what luxury brands spend millions to produce. We\'re a startup and we look like we have a AAA tech team.",
    name: "Daniel Reyes",
    role: "Founder, Moderno",
    company: "D2C Menswear, São Paulo",
  },
  {
    quote: "Size confidence went through the roof. We now have 40% fewer support tickets about sizing, and our NPS jumped 22 points.",
    name: "Sophie Laurent",
    role: "Director of UX, Élite Mode",
    company: "Luxury Fashion, Paris",
  },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="relative glass-card rounded-2xl p-8 mb-6 group hover:border-primary/20 transition-all duration-500">
      <svg className="w-6 h-6 text-foreground mb-5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      </svg>
      <p className="text-muted-foreground text-base font-light leading-relaxed mb-6">{t.quote}</p>
      <div className="border-t border-border pt-5">
        <div className="font-semibold text-foreground text-sm">{t.name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{t.role}</div>
        <div className="text-xs text-primary/70 mt-0.5 font-mono">{t.company}</div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const col1 = testimonials.slice(0, 2);
  const col2 = testimonials.slice(2, 4);
  const col3 = testimonials.slice(4, 6);

  return (
    <section className="relative py-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="flex flex-col lg:flex-row justify-between gap-6 mb-16 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}
        >
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Social Proof</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Brands that{' '}
              <span className="text-gradient-primary">ship with VEXA.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-base leading-relaxed lg:text-right pt-4">
            From D2C startups to enterprise fashion groups — teams at every scale trust VEXA.
          </p>
        </div>

        {/* 3-column scroll */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[700px] overflow-hidden opacity-100 animate-on-scroll"
          style={{
            animation: 'animationIn 0.8s ease-out 0.4s forwards',
            opacity: 0,
            maskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)',
          }}
        >
          {/* Col 1 — scrolls up */}
          <div className="relative overflow-hidden">
            <div className="animate-marquee-up flex flex-col">
              <div>{col1.map((t, i) => <TestimonialCard key={i} t={t} />)}</div>
              <div>{col1.map((t, i) => <TestimonialCard key={`d${i}`} t={t} />)}</div>
            </div>
          </div>

          {/* Col 2 — scrolls down */}
          <div className="relative overflow-hidden">
            <div className="animate-marquee-down flex flex-col">
              <div>{col2.map((t, i) => <TestimonialCard key={i} t={t} />)}</div>
              <div>{col2.map((t, i) => <TestimonialCard key={`d${i}`} t={t} />)}</div>
            </div>
          </div>

          {/* Col 3 — scrolls up (hidden on mobile/tablet) */}
          <div className="hidden lg:block relative overflow-hidden">
            <div className="animate-marquee-up flex flex-col" style={{ animationDuration: '50s' }}>
              <div>{col3.map((t, i) => <TestimonialCard key={i} t={t} />)}</div>
              <div>{col3.map((t, i) => <TestimonialCard key={`d${i}`} t={t} />)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
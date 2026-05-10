import React from 'react';
import AppImage from '@/components/ui/AppImage';

export default function HowItWorksSection() {
  const steps = [
  {
    num: '01',
    title: 'Upload Body Photo',
    desc: 'Customer submits a single full-body photo. Our AI processes it in under 2 seconds — no special equipment needed.',
    detail: '1 photo → full 3D model',
    image: "https://images.unsplash.com/flagged/photo-1556138723-8f1bf9a28be4",
    imageAlt: 'Person taking a photo against a bright white wall, clean neutral clothing, well-lit indoor space',
    accent: '#4A6741'
  },
  {
    num: '02',
    title: 'Generate 3D Avatar',
    desc: 'VEXA builds a photorealistic digital twin using 68-point AI body mapping. Accurate proportions, skin tone, and posture.',
    detail: '68 body points mapped',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b669c127-1770082524794.png",
    imageAlt: '3D digital human avatar wireframe rendering on dark background, glowing blue mesh body scan, futuristic tech visualization',
    accent: '#6B8C5E'
  },
  {
    num: '03',
    title: 'Try Any Outfit',
    desc: 'The avatar wears any garment from your catalog. Fabric drape, fit, and color render realistically in real-time.',
    detail: 'Unlimited outfit swaps',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_14af37433-1777014634413.png",
    imageAlt: 'Fashion model wearing stylish outfit in clean studio setting, warm professional lighting, full body view against minimal background',
    accent: '#8B7D3C'
  }];


  return (
    <section className="relative py-16 pb-24 overflow-hidden">
      {/* Ghost watermark */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none select-none text-center w-full z-0"
        style={{
          maskImage: 'linear-gradient(180deg, transparent, black 10%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, black 10%, black 70%, transparent)'
        }}>
        
        <span className="text-[12vw] lg:text-[10rem] font-extrabold whitespace-nowrap tracking-tighter" style={{ color: 'rgba(74, 103, 65, 0.05)' }}>
          HOW IT WORKS
        </span>
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          className="text-center mb-16 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}>
          
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">
            The Process
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Three steps.{' '}
            <span className="text-gradient-primary">Infinite fits.</span>
          </h2>
        </div>

        {/* Asymmetric bento steps — NOT a numbered vertical timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {steps?.map((step, i) =>
          <div
            key={i}
            className="relative glass-card rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-500 opacity-100 animate-on-scroll"
            style={{
              animation: `animationIn 0.8s ease-out ${0.2 + i * 0.15}s forwards`,
              opacity: 0,
              minHeight: i === 1 ? '520px' : '460px'
            }}>
            
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <AppImage
                src={step?.image}
                alt={step?.imageAlt}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 33vw" />
              
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(248,247,242,0.9) 100%)' }} />
                {/* Step number overlay */}
                <div
                className="absolute top-4 left-4 text-6xl font-extrabold font-mono leading-none"
                style={{ color: `${step?.accent}30` }}>
                
                  {step?.num}
                </div>
                {/* Detail badge */}
                <div
                className="absolute bottom-4 right-4 text-xs font-mono px-3 py-1.5 rounded-full backdrop-blur-md"
                style={{ background: `${step?.accent}20`, color: step?.accent, border: `1px solid ${step?.accent}40` }}>
                
                  {step?.detail}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                style={{ background: `${step?.accent}20`, color: step?.accent, border: `1px solid ${step?.accent}40` }}>
                    {step?.num}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{step?.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step?.desc}</p>

                {/* Connector arrow (not on last) */}
                {i < 2 &&
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-30">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center glass-card border-primary/30">
                      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </div>
                  </div>
              }
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}
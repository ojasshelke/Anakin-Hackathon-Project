'use client';
import React, { useState } from 'react';
import AppImage from '@/components/ui/AppImage';

const OUTFITS = [
{
  color: '#5B4BF5',
  label: 'Violet',
  images: [
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_127dffa64-1772150517318.png",
    alt: 'Fashion model wearing violet oversized hoodie in studio, full body, clean background'
  },
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_11dd6aade-1767159208582.png",
    alt: 'Fashion model wearing violet streetwear outfit, side profile, studio lighting'
  }]

},
{
  color: '#00D4FF',
  label: 'Cyan',
  images: [
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_13d009c79-1774446338483.png",
    alt: 'Fashion model wearing cyan blue outfit in studio, full body portrait'
  },
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_1380919e7-1775817756683.png",
    alt: 'Fashion model in cyan streetwear, neutral studio background, full length'
  }]

},
{
  color: '#F59E0B',
  label: 'Amber',
  images: [
  {
    src: "https://images.unsplash.com/photo-1624810626198-f214d329f478",
    alt: 'Fashion model wearing amber yellow outfit, bright studio lighting, full body'
  },
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_1924807a7-1773082167529.png",
    alt: 'Fashion model in amber streetwear look, clean background, full length portrait'
  }]

},
{
  color: '#EF4444',
  label: 'Red',
  images: [
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_13d009c79-1774446338483.png",
    alt: 'Fashion model wearing red outfit in studio, full body, even lighting'
  },
  {
    src: "https://img.rocket.new/generatedImages/rocket_gen_img_13d009c79-1774446338483.png",
    alt: 'Fashion model in red streetwear, neutral studio background, full length'
  }]

}];


export default function DemoSection() {
  const [activeColor, setActiveColor] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const currentOutfit = OUTFITS[activeColor];

  const handleColorChange = (idx: number) => {
    setActiveColor(idx);
    setActiveImage(0);
  };

  return (
    <section className="relative py-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          className="text-center mb-16 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 0 }}>
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">
            Product Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Try-on that{' '}
            <span className="text-gradient-primary">feels real.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            AI body mapping generates a photorealistic 3D avatar in seconds. Customers see exactly how each garment fits their body — not a mannequin.
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Phone mockup stack */}
          <div
            className="relative flex justify-center items-center h-[520px] animate-on-scroll"
            style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 0 }}>

            {/* Glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-[60px] pointer-events-none transition-all duration-700"
              style={{ background: `radial-gradient(ellipse at center, ${currentOutfit.color}30 0%, transparent 70%)` }} />
            

            {/* Thumbnail strip (secondary images) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
              {currentOutfit.images.map((img, i) =>
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className="w-14 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 focus:outline-none"
                style={{
                  borderColor: activeImage === i ? currentOutfit.color : 'rgba(74, 103, 65, 0.2)',
                  boxShadow: activeImage === i ? `0 0 12px ${currentOutfit.color}60` : 'none'
                }}
                aria-label={`View outfit image ${i + 1}`}>
                  <AppImage
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover object-top"
                  sizes="56px" />
                
                </button>
              )}
            </div>

            {/* Main phone frame */}
            <div
              className="relative w-56 h-[440px] rounded-[2.5rem] border-2 overflow-hidden glass-card transition-all duration-500 z-10"
              style={{ borderColor: `${currentOutfit.color}60`, boxShadow: `0 0 40px ${currentOutfit.color}25` }}>
              {/* Screen */}
              <div className="w-full h-full relative bg-gradient-to-b from-secondary to-background">
                {/* Scan line animation */}
                <div
                  className="absolute left-0 right-0 h-0.5 z-30 pointer-events-none animate-scan-line"
                  style={{ background: `linear-gradient(90deg, transparent, ${currentOutfit.color}, transparent)` }} />
                

                {/* Avatar image — switches on color/image change */}
                <AppImage
                  key={`${activeColor}-${activeImage}`}
                  src={currentOutfit.images[activeImage].src}
                  alt={currentOutfit.images[activeImage].alt}
                  fill
                  className="object-cover object-top opacity-80 transition-opacity duration-500"
                  sizes="224px" />
                

                {/* Overlay grid lines */}
                <div
                  className="absolute inset-0 z-20 transition-all duration-500"
                  style={{
                    backgroundImage: `linear-gradient(${currentOutfit.color}18 1px, transparent 1px), linear-gradient(90deg, ${currentOutfit.color}18 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />
                

                {/* Body mapping dots */}
                {[
                { top: '15%', left: '50%' },
                { top: '30%', left: '35%' },
                { top: '30%', left: '65%' },
                { top: '50%', left: '40%' },
                { top: '50%', left: '60%' },
                { top: '70%', left: '45%' },
                { top: '70%', left: '55%' }].
                map((pos, i) =>
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full border z-30 transition-all duration-500"
                  style={{
                    ...pos,
                    transform: 'translate(-50%, -50%)',
                    background: `${currentOutfit.color}99`,
                    borderColor: currentOutfit.color
                  }} />

                )}

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-3 z-30 flex items-center justify-between">
                  <span className="text-xs font-mono text-accent">VEXA AI</span>
                  <span className="text-xs font-mono text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-glow" />
                    LIVE
                  </span>
                </div>

                {/* Bottom outfit selector — color switcher */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-30 glass-card rounded-none">
                  <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Outfit Preview</span>
                    <span style={{ color: currentOutfit.color }}>{currentOutfit.label}</span>
                  </div>
                  <div className="flex gap-2">
                    {OUTFITS.map((outfit, i) =>
                    <button
                      key={i}
                      onClick={() => handleColorChange(i)}
                      className="w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-300 focus:outline-none hover:scale-110"
                      style={{
                        background: outfit.color,
                        borderColor: activeColor === i ? 'white' : 'transparent',
                        boxShadow: activeColor === i ? `0 0 10px ${outfit.color}80` : 'none'
                      }}
                      aria-label={`Select ${outfit.label} outfit`} />

                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary phone (behind, offset) */}
            <div
              className="absolute w-48 h-[380px] rounded-[2rem] border border-border overflow-hidden glass-card opacity-40 z-0 transition-all duration-500"
              style={{ transform: 'translateX(100px) translateY(20px) rotate(8deg)' }}>
              <AppImage
                src={currentOutfit.images[(activeImage + 1) % currentOutfit.images.length].src}
                alt={currentOutfit.images[(activeImage + 1) % currentOutfit.images.length].alt}
                fill
                className="object-cover object-top opacity-60"
                sizes="192px" />
              
            </div>
          </div>

          {/* Right: Feature callouts */}
          <div
            className="space-y-4 animate-on-scroll"
            style={{ animation: 'animationIn 0.8s ease-out 0.4s forwards', opacity: 0 }}>
            {[
            {
              icon:
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>,

              color: '#5B4BF5',
              title: 'Real-time 3D Rendering',
              desc: 'Photorealistic garment simulation at 60fps. Fabric physics, lighting, and shadow — all computed in the cloud.',
              tag: '<200ms'
            },
            {
              icon:
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>,

              color: '#00D4FF',
              title: 'AI Body Mapping',
              desc: '68-point skeletal mapping from a single photo. Accurate size predictions across 200+ body types.',
              tag: '99.2% accuracy'
            },
            {
              icon:
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                  </svg>,

              color: '#A78BFA',
              title: 'Drop-in Software Development Kit Integration',
              desc: 'Three lines of code. Works with Shopify, WooCommerce, custom React apps, and native mobile.',
              tag: '3 lines of code'
            }].
            map((item, i) =>
            <div
              key={i}
              className="relative glass-card rounded-2xl p-5 flex items-start gap-4 group hover:border-primary/30 transition-all duration-300 overflow-hidden">
                <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}20`, color: item.color }}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${item.color}15`, color: item.color }}>
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}
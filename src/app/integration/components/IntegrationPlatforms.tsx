import React from 'react';

// BENTO GRID AUDIT:
// Array has 8 platform cards: [Shopify, WooCommerce, Magento, React Native, Flutter, Next.js, iOS Swift, Android]
// Grid: grid-cols-2 md:grid-cols-4
// Row 1: [col-1: Shopify] [col-2: WooCommerce] [col-3: Magento] [col-4: React Native]
// Row 2: [col-1: Flutter] [col-2: Next.js] [col-3: iOS Swift] [col-4: Android]
// Placed 8/8 cards ✓

const platforms = [
  {
    name: 'Shopify',
    type: 'E-commerce',
    status: 'Official Plugin',
    statusColor: '#4A6741',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 109 124" fill="none">
        <path d="M74.7 14.8s-.3-1.6-1.4-1.6c-.1 0-2.3-.3-2.3-.3s-1.5-1.5-1.7-1.7V14l-5.6 1.7s-3.8-11.2-13-11.2c-.2 0-.4 0-.7.1C47.3 2.4 45.1 1 42.7 1 27.8 1 20.7 19.5 18.5 29l-10 3.1c-3.1 1-3.2 1-3.6 4L0 93l55.5 10.4L109 92.5 74.7 14.8z" fill="#95BF47"/>
        <path d="M73.3 13.2c-.1 0-2.3-.3-2.3-.3s-1.5-1.5-1.7-1.7V14l-5.6 1.7s-3.8-11.2-13-11.2c-.2 0-.4 0-.7.1L55.5 103.4 109 92.5 74.7 14.8s-.3-1.6-1.4-1.6z" fill="#5E8E3E"/>
        <path d="M49.7 39.8l-4.4 13.1s-3.9-2.1-8.6-2.1c-6.9 0-7.2 4.3-7.2 5.4 0 5.9 15.4 8.2 15.4 22.1 0 10.9-6.9 17.9-16.2 17.9-11.2 0-16.9-7-16.9-7l3-9.9s5.8 5 10.7 5c3.2 0 4.5-2.5 4.5-4.3 0-7.6-12.6-7.9-12.6-20.7 0-10.6 7.6-20.9 23-20.9 6 0 9.3 1.4 9.3 1.4z" fill="#fff"/>
      </svg>
    ),
  },
  {
    name: 'WooCommerce',
    type: 'WordPress',
    status: 'Official Plugin',
    statusColor: '#4A6741',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 100 60" fill="none">
        <rect width="100" height="60" rx="8" fill="#7F54B3" />
        <text x="50" y="38" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">Woo</text>
      </svg>
    ),
  },
  {
    name: 'Magento',
    type: 'E-commerce',
    status: 'Extension',
    statusColor: '#8B7D3C',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 40 46" fill="none">
        <path d="M20 0L40 11.5V34.5L20 46L0 34.5V11.5L20 0Z" fill="#EE672F"/>
        <path d="M20 8L14 11.5V31.5L17 33.2V16.2L20 14.5L23 16.2V33.2L26 31.5V11.5L20 8Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'React Native',
    type: 'Mobile Software Development Kit',
    status: 'Native Module',
    statusColor: '#6B8C5E',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="10" fill="#61DAFB"/>
        <ellipse cx="50" cy="50" rx="48" ry="18" stroke="#61DAFB" strokeWidth="4" fill="none"/>
        <ellipse cx="50" cy="50" rx="48" ry="18" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(60 50 50)"/>
        <ellipse cx="50" cy="50" rx="48" ry="18" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(120 50 50)"/>
      </svg>
    ),
  },
  {
    name: 'Flutter',
    type: 'Mobile Software Development Kit',
    status: 'Dart Package',
    statusColor: '#6B8C5E',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 100 124" fill="none">
        <polygon points="50,0 100,50 75,75 25,25" fill="#54C5F8"/>
        <polygon points="25,75 75,75 50,100 0,100" fill="#01579B"/>
        <polygon points="50,50 75,75 50,100 25,75" fill="#29B6F6"/>
      </svg>
    ),
  },
  {
    name: 'Next.js',
    type: 'React Framework',
    status: 'Software Development Kit Ready',
    statusColor: '#4A6741',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 180 180" fill="none">
        <circle cx="90" cy="90" r="90" fill="white"/>
        <path d="M149 90c0 32.6-26.4 59-59 59S31 122.6 31 90s26.4-59 59-59 59 26.4 59 59z" fill="black"/>
        <path d="M121 63v54l-42-54v42" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    name: 'iOS Swift',
    type: 'Native Software Development Kit',
    status: 'CocoaPod',
    statusColor: '#8B7D3C',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="22" fill="#F05138"/>
        <text x="50" y="68" textAnchor="middle" fill="white" fontSize="36" fontWeight="bold" fontFamily="monospace">S</text>
      </svg>
    ),
  },
  {
    name: 'Android',
    type: 'Native Software Development Kit',
    status: 'Maven Package',
    statusColor: '#8B7D3C',
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="22" fill="#3DDC84"/>
        <path d="M25 65 L35 40 L65 40 L75 65 Z" fill="white" opacity="0.9"/>
        <circle cx="42" cy="34" r="4" fill="white"/>
        <circle cx="58" cy="34" r="4" fill="white"/>
        <line x1="35" y1="28" x2="28" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <line x1="65" y1="28" x2="72" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function IntegrationPlatforms() {
  return (
    <section className="py-12 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="text-center mb-12 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Compatibility</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Works with{' '}
            <span className="text-gradient-primary">your stack.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Official plugins, Software Development Kits, and packages for every major platform. Community integrations for everything else.
          </p>
        </div>

        {/* Bento: grid-cols-2 md:grid-cols-4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Row 1: Shopify, WooCommerce, Magento, React Native */}
          {/* Row 2: Flutter, Next.js, iOS Swift, Android */}
          {platforms?.map((platform, i) => (
            <div
              key={platform?.name}
              className="relative glass-card rounded-2xl p-6 flex flex-col items-center text-center group hover:border-primary/30 transition-all duration-500 overflow-hidden opacity-100 animate-on-scroll"
              style={{
                animation: `animationIn 0.8s ease-out ${0.2 + i * 0.07}s forwards`,
                opacity: 1,
              }}
            >
              <div className="mb-4 w-14 h-14 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                {platform?.icon}
              </div>
              <div className="text-sm font-bold text-foreground mb-1">{platform?.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{platform?.type}</div>
              <div
                className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{ background: `${platform?.statusColor}15`, color: platform?.statusColor }}
              >
                {platform?.status}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
          Don&apos;t see your platform?{' '}
          <a href="#" className="text-accent hover:text-accent/80 transition-colors">
            Check our community integrations →
          </a>
        </p>
      </div>
    </section>
  );
}

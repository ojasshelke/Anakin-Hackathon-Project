'use client';
import React, { useState } from 'react';

const tabs = [
  {
    label: 'React',
    lang: 'tsx',
    code: `import { VEXATryOn } from '@vexa/sdk/react';

export function ProductPage({ productId }: { productId: string }) {
  return (
    <div>
      <VEXATryOn
        apiKey="vxa_live_..."
        productId={productId}
        onTryOn={(result) => console.log(result)}
      />
    </div>
  );
}`,
  },
  {
    label: 'Vue',
    lang: 'vue',
    code: `<template>
  <vexa-try-on
    :api-key="apiKey"
    :product-id="productId"
    @try-on="handleTryOn"
  />
</template>

<script setup>
import { VEXATryOn } from '@vexa/sdk/vue';

const apiKey = 'vxa_live_...';
const props = defineProps(['productId']);
const handleTryOn = (result) => console.log(result);
</script>`,
  },
  {
    label: 'Vanilla JS',
    lang: 'javascript',
    code: `import VEXA from '@vexa/sdk';

const sdk = VEXA.init({
  apiKey: 'vxa_live_...',
  container: '#try-on-widget',
});

// Render widget for a product
sdk.render({ productId: 'prod_123' });

// Listen to try-on events
sdk.on('tryon:complete', (result) => {
  console.log('Avatar rendered:', result.avatarUrl);
});`,
  },
  {
    label: 'REST API',
    lang: 'bash',
    code: `# Generate avatar from photo
curl -X POST https://api.vexa.io/v1/avatars \\
  -H "Authorization: Bearer vxa_live_..." \ -H"Content-Type: multipart/form-data"\ -F"photo=@body_photo.jpg"

# Response
{
  "avatarId": "avt_7x9k2m",
  "status": "ready",
  "renderUrl": "https://cdn.vexa.io/avatars/avt_7x9k2m",
  "bodyMap": { "height": 172, "chest": 94, "waist": 76 }
}

# Apply garment to avatar
curl -X POST https://api.vexa.io/v1/tryon \\
  -H "Authorization: Bearer vxa_live_..." \\
  -d '{ "avatarId": "avt_7x9k2m", "productId": "prod_456" }'`,
  },
];

const tokenColors: Record<string, string> = {
  import: '#4A6741',
  from: '#4A6741',
  const: '#4A6741',
  return: '#4A6741',
  export: '#4A6741',
  function: '#4A6741',
  curl: '#8B7D3C',
  POST: '#4A6741',
  GET: '#22C55E',
};

function SimpleHighlight({ code, lang }: { code: string; lang: string }) {
  if (lang === 'bash') {
    return (
      <pre className="text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre">
        {code.split('\n').map((line, i) => {
          if (line.startsWith('#')) {
            return <div key={i} className="text-muted-foreground/50">{line}</div>;
          }
          if (line.startsWith('curl')) {
            return <div key={i}><span style={{ color: '#8B7D3C' }}>curl</span><span className="text-foreground">{line.slice(4)}</span></div>;
          }
          if (line.startsWith('{') || line.startsWith('}') || line.startsWith('  "')) {
            return <div key={i} style={{ color: '#6B8C5E' }}>{line}</div>;
          }
          return <div key={i} className="text-foreground">{line}</div>;
        })}
      </pre>
    );
  }

  return (
    <pre className="text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre">
      {code.split('\n').map((line, i) => {
        const parts = line.split(/(\s+)/);
        return (
          <div key={i}>
            {parts.map((part, j) => {
              const trimmed = part.trim();
              if (tokenColors[trimmed]) {
                return <span key={j} style={{ color: tokenColors[trimmed] }}>{part}</span>;
              }
              if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
                return <span key={j} style={{ color: '#8B7D3C' }}>{part}</span>;
              }
              if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
                return <span key={j} className="text-muted-foreground/50">{part}</span>;
              }
              if (trimmed.startsWith('<') || trimmed.startsWith('/>') || trimmed.startsWith('</')) {
                return <span key={j} style={{ color: '#4A6741' }}>{part}</span>;
              }
              return <span key={j} className="text-foreground">{part}</span>;
            })}
          </div>
        );
      })}
    </pre>
  );
}

export default function IntegrationQuickstart() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="quickstart" className="py-12 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="text-center mb-12 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Quickstart</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Pick your stack.{' '}
            <span className="text-gradient-primary">Ship in hours.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Full Software Development Kit support for React, Vue, and Vanilla JS. Or go direct with our REST API.
          </p>
        </div>

        <div
          className="glass-card rounded-2xl overflow-hidden opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
        >
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-border">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2.5 text-sm font-mono font-medium rounded-t-lg transition-all duration-200 min-h-[44px] ${
                  activeTab === i
                    ? 'text-foreground bg-white/5 border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pr-2 pb-2">
              <span className="text-xs font-mono text-muted-foreground/50">vexa-sdk</span>
            </div>
          </div>

          {/* Code content */}
          <div className="p-6 bg-black/20 min-h-[280px]">
            <SimpleHighlight code={tabs[activeTab].code} lang={tabs[activeTab].lang} />
          </div>

          {/* Footer bar */}
          <div className="px-6 py-4 border-t border-border bg-white/[0.01] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
              <span className="text-xs font-mono text-muted-foreground">Software Development Kit v3.2.1 · MIT License</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-xs font-mono text-accent hover:text-accent/80 transition-colors">
                Full API Reference →
              </a>
              <a href="#" className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

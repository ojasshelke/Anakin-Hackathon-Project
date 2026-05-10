import React from 'react';

export default function IntegrationArchitecture() {
  const nodes = [
    { id: 'client', label: 'Your App', sub: 'React / Vue / Native', x: 10, y: 42, color: '#8B8BA8' },
    { id: 'sdk', label: 'VEXA Software Development Kit', sub: 'Drop-in widget', x: 30, y: 20, color: '#5B4BF5' },
    { id: 'api', label: 'VEXA API', sub: 'REST / GraphQL', x: 30, y: 64, color: '#5B4BF5' },
    { id: 'ai', label: 'AI Engine', sub: 'Body mapping', x: 55, y: 20, color: '#00D4FF' },
    { id: 'render', label: 'Render Farm', sub: 'GPU cluster', x: 55, y: 64, color: '#00D4FF' },
    { id: 'cdn', label: 'Global CDN', sub: '< 200ms p99', x: 78, y: 42, color: '#A78BFA' },
  ];

  const edges = [
    { from: 'client', to: 'sdk' },
    { from: 'client', to: 'api' },
    { from: 'sdk', to: 'ai' },
    { from: 'api', to: 'render' },
    { from: 'ai', to: 'cdn' },
    { from: 'render', to: 'cdn' },
  ];

  const getPos = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <section className="py-12 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="text-center mb-12 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.2s forwards', opacity: 1 }}
        >
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Architecture</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            How VEXA{' '}
            <span className="text-gradient-primary">works under the hood.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Distributed GPU rendering + AI body mapping, delivered through a global CDN edge network.
          </p>
        </div>

        <div
          className="glass-card rounded-2xl p-8 opacity-100 animate-on-scroll"
          style={{ animation: 'animationIn 0.8s ease-out 0.3s forwards', opacity: 1 }}
        >
          {/* SVG Architecture diagram */}
          <div className="relative w-full overflow-x-auto">
            <svg viewBox="0 0 100 90" className="w-full" style={{ minWidth: '320px', maxHeight: '340px' }}>
              {/* Edges */}
              {edges.map((edge, i) => {
                const from = getPos(edge.from);
                const to = getPos(edge.to);
                const x1 = from.x + 8;
                const y1 = from.y + 5;
                const x2 = to.x;
                const y2 = to.y + 5;
                return (
                  <g key={i}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={`url(#grad-${i})`}
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      className="animate-flow-line"
                      style={{ animationDelay: `${i * 0.6}s` }}
                    />
                    <defs>
                      <linearGradient id={`grad-${i}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                        <stop offset="0" stopColor="#5B4BF5" stopOpacity="0" />
                        <stop offset="0.5" stopColor="#00D4FF" />
                        <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    width="18" height="12"
                    rx="1.5"
                    fill="rgba(10,10,20,0.8)"
                    stroke={node.color}
                    strokeWidth="0.5"
                    strokeOpacity="0.6"
                  />
                  <rect
                    width="18" height="12"
                    rx="1.5"
                    fill={node.color}
                    fillOpacity="0.05"
                  />
                  <text x="9" y="5.5" textAnchor="middle" fill={node.color} fontSize="2.8" fontWeight="700" fontFamily="monospace">
                    {node.label}
                  </text>
                  <text x="9" y="9" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="2" fontFamily="monospace">
                    {node.sub}
                  </text>
                  {/* Status dot */}
                  <circle cx="15.5" cy="1.5" r="1" fill="#22C55E" opacity="0.8" />
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
            {[
              { color: '#8B8BA8', label: 'Your Infrastructure' },
              { color: '#5B4BF5', label: 'VEXA Integration Layer' },
              { color: '#00D4FF', label: 'AI & Rendering Engine' },
              { color: '#A78BFA', label: 'Delivery Network' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: item.color, opacity: 1.7 }} />
                <span className="text-xs font-mono text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

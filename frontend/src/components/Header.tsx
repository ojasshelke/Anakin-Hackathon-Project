'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Product', href: '/' },
  { label: 'Try-On', href: '/studio' },
  { label: 'Design', href: '/design' },
  { label: 'Trends', href: '/trends', isLive: true },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integration', href: '/integration' },
];

const mobileNavLinks = [
  { label: 'Product', href: '/' },
  { label: '3D Try-On', href: '/3d' },
  { label: 'Virtual Try-On', href: '/studio' },
  { label: '✦ Design', href: '/design' },
  { label: '🔥 Trends', href: '/trends' },
  { label: 'Video', href: '/video-tryon' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integration', href: '/integration' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#4A6741] flex items-center justify-center shadow-lg shadow-lime-900/20 group-hover:rotate-12 transition-transform">
            <AppLogo size={20} />
          </div>
          <span className="text-lg font-black text-[#1a1a1a] tracking-tighter">VEXA</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#1a1a1a] transition-all whitespace-nowrap"
            >
              {link.label}
              {'isLive' in link && link.isLive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#bef264] rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <a
            href="/#booking-section"
            className="bg-[#4A6741] text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#4A6741]/20 flex items-center gap-1.5 hover:scale-105 transition-all"
          >
            Book a Demo
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[#1a1a1a]" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-4 shadow-xl">
          {mobileNavLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-lg font-bold text-[#1a1a1a]"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a 
            href="/#booking-section"
            className="w-full py-4 rounded-xl bg-[#4A6741] text-white font-bold text-center"
            onClick={() => setMenuOpen(false)}
          >
            Book a Demo
          </a>
        </div>
      )}
    </nav>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { label: "Product", href: "/" },
    { label: "3D Try-On", href: "/studio" },
    { label: "Virtual Try-On", href: "/studio" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integration", href: "/integration" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 px-4 py-4 transition-all duration-300 ${scrolled ? 'py-3 bg-white/90 backdrop-blur-xl border-b border-slate-200' : 'py-6 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#4A6741] flex items-center justify-center shadow-lg shadow-lime-900/20 group-hover:rotate-12 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-[#1a1a1a] tracking-tighter leading-none">VEXA</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold uppercase tracking-widest transition-all ${
                pathname === link.href
                  ? "text-[#4A6741]"
                  : "text-slate-400 hover:text-[#1a1a1a]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <motion.button
            onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-full bg-[#4A6741] text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-[#4A6741]/20 flex items-center gap-2"
          >
            Book a Demo
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-[#1a1a1a]" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-4 shadow-xl"
          >
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-lg font-bold text-[#1a1a1a]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button 
              onClick={() => { setIsOpen(false); document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="w-full py-4 rounded-xl bg-[#4A6741] text-white font-bold"
            >
              Book a Demo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

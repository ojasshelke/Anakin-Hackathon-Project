"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

const posts = [
  {
    slug: "future-of-virtual-try-on",
    title: "The Future of Virtual Try-On in 2026",
    excerpt: "How AI and 3D modeling are changing the way we shop for clothes online.",
    date: "May 1, 2026"
  },
  {
    slug: "reducing-returns-with-ai",
    title: "How AI Reduces Fashion Returns by 40%",
    excerpt: "The economic impact of precise fit technology for e-commerce brands.",
    date: "April 28, 2026"
  }
];

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-6xl font-black text-white mb-16">Insights & Innovations</h1>
      <div className="grid md:grid-cols-2 gap-12">
        {posts.map((post, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            <Link href={`/blog/${post.slug}`}>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all">
                <p className="text-blue-400 text-sm font-bold mb-4 uppercase tracking-widest">{post.date}</p>
                <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{post.title}</h2>
                <p className="text-gray-400 leading-relaxed mb-6">{post.excerpt}</p>
                <span className="text-white font-bold flex items-center gap-2">Read More →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

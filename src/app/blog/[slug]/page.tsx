import { notFound } from 'next/navigation';
import Link from 'next/link';

const blogContent: Record<string, { title: string; content: string; date: string }> = {
  "future-of-virtual-try-on": {
    title: "The Future of Virtual Try-On in 2026",
    date: "May 1, 2026",
    content: "Virtual try-on technology has evolved from a novelty to a necessity. In 2026, we see a massive shift towards real-time physics-based draping..."
  },
  "reducing-returns-with-ai": {
    title: "How AI Reduces Fashion Returns by 40%",
    date: "April 28, 2026",
    content: "One of the biggest challenges in fashion e-commerce is the high rate of returns. VEXA's precision fit engine addresses this by..."
  }
};

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogContent[slug];

  if (!post) notFound();

  return (
    <article className="max-w-4xl mx-auto px-4 py-24">
      <Link href="/blog" className="text-blue-400 font-bold mb-8 block">← Back to Blog</Link>
      <p className="text-gray-500 font-bold uppercase tracking-widest mb-4">{post.date}</p>
      <h1 className="text-5xl md:text-6xl font-black text-white mb-12">{post.title}</h1>
      <div className="prose prose-invert max-w-none text-gray-300 text-xl leading-relaxed">
        {post.content}
      </div>
    </article>
  );
}

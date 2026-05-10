"use client";
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "CEO, LuxFashion",
    text: "VEXA transformed our conversion rates. Returns dropped by 35% in the first month."
  },
  {
    name: "Michael Chen",
    role: "Tech Lead, Trendify",
    text: "The Software Development Kit is incredibly easy to integrate. We had it running in less than a day."
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">Loved by Brands Worldwide</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <p className="text-xl italic text-gray-300 mb-6">"{t.text}"</p>
              <div>
                <h4 className="text-white font-bold">{t.name}</h4>
                <p className="text-blue-400 text-sm">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: "How accurate is the virtual try-on?",
    answer: "Our AI uses advanced 3D body modeling to provide highly accurate visualizations based on standard sizing and garment physics."
  },
  {
    question: "Which platforms do you support?",
    answer: "VEXA integrates seamlessly with Shopify, WooCommerce, Magento, and custom web applications via our React and JavaScript Software Development Kits."
  },
  {
    question: "Can I use my own models?",
    answer: "Yes, Vexa Studio allows you to upload custom 3D models or use our library of diverse digital avatars."
  }
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-white/10 rounded-xl overflow-hidden">
              <button 
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full p-6 text-left flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                <span className="text-blue-400">{activeIndex === index ? '−' : '+'}</span>
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 text-gray-400 bg-white/5 border-t border-white/5">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

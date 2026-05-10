'use client';
import { useEffect } from 'react';

export default function ScrollAnimationInit() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    const observeElements = () => {
      document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach((el) => {
        el.classList.add('observed');
        io.observe(el);
      });
    };

    observeElements();
    
    // PERF FIX: Debounced MutationObserver to prevent hundreds of calls during page load
    let debounceTimer: ReturnType<typeof setTimeout>;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        observeElements();
      }, 100);
    });
    
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mutationObserver.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  return null;
}
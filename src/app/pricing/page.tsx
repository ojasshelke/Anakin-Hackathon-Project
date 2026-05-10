import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingHero from '@/app/pricing/components/PricingHero';
import PricingTiers from '@/app/pricing/components/PricingTiers';
import PricingComparison from '@/app/pricing/components/PricingComparison';
import PricingFAQ from '@/app/pricing/components/PricingFAQ';
import PricingCTA from '@/app/pricing/components/PricingCTA';
import ScrollAnimationInit from '@/app/components/ScrollAnimationInit';

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <ScrollAnimationInit />
      <Header />
      <PricingHero />
      <PricingTiers />
      <PricingComparison />
      <PricingFAQ />
      <PricingCTA />
      <Footer />
    </main>
  );
}

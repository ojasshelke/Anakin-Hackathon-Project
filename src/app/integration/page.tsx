import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import IntegrationHero from '@/app/integration/components/IntegrationHero';
import IntegrationQuickstart from '@/app/integration/components/IntegrationQuickstart';
import IntegrationArchitecture from '@/app/integration/components/IntegrationArchitecture';
import IntegrationPlatforms from '@/app/integration/components/IntegrationPlatforms';
import IntegrationDevCTA from '@/app/integration/components/IntegrationDevCTA';
import ScrollAnimationInit from '@/app/components/ScrollAnimationInit';

export default function IntegrationPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <ScrollAnimationInit />
      <Header />
      <IntegrationHero />
      <IntegrationQuickstart />
      <IntegrationArchitecture />
      <IntegrationPlatforms />
      <IntegrationDevCTA />
      <Footer />
    </main>
  );
}

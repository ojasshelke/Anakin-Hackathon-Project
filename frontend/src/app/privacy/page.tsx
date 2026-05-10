import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-white/80 leading-relaxed">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-white mb-4">1. Data Collection</h2>
        <p className="mb-4">
          VEXA collects specific personal data to provide accurate 3D avatar generation and virtual try-on services:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Body Measurements:</strong> Height, weight, chest, waist, hips, etc., used strictly to scale the 3D model.</li>
          <li><strong>Face Photo:</strong> Used to extract facial landmarks and create a UV texture for your personal avatar.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-white mb-4">2. Processing & Storage</h2>
        <p className="mb-4">
          To protect your privacy, we handle your data with the following strict rules:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Photo Deletion:</strong> Original face photos are automatically deleted immediately after the UV texture extraction process is complete. We do not store your original photos.</li>
          <li><strong>Encryption:</strong> All measurement data and generated assets are encrypted at rest.</li>
          <li><strong>Access Control:</strong> Data is only accessible to the authenticated account owner and the platform's core processing pipeline.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-white mb-4">3. Data Deletion (GDPR)</h2>
        <p className="mb-4">
          Under GDPR and other privacy regulations, you have the "right to be forgotten". You can request the complete deletion of your profile, measurements, and generated avatars at any time.
        </p>
        <p>
          To request deletion, use the <strong>Delete Profile</strong> option in your account settings or contact our privacy team at <span className="text-[#bef264]">privacy@vexa.com</span>. Deletion is irreversible and removes all cached try-on results.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Sharing</h2>
        <p>
          We do not sell your personal data to third parties. Data is only shared with our infrastructure providers (e.g., Supabase, Cloudflare) for the sole purpose of hosting and processing your requests.
        </p>
      </section>

      <p className="text-sm text-white/40 mt-20">
        Last updated: April 10, 2026
      </p>
    </div>
  );
}

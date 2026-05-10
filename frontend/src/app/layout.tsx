import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import GlobalLayout from "@/components/GlobalLayout";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vexatryon.in'),
  title: {
    default: 'VEXA — Virtual Try-On API for Fashion Brands',
    template: '%s | VEXA'
  },
  description: 'Revolutionize your fashion brand with VEXA\'s Virtual Try-On API. Reduce returns by 40% and increase conversions with AI-powered 3D garment visualization.',
  keywords: ['Virtual Try-On', 'VEXA', 'Fashion AI', 'E-commerce Software Development Kit', 'AI Fashion', 'Virtual Fitting Room', 'Digital Garments'],
  authors: [{ name: 'Vexa Team' }],
  creator: 'Vexa Solutions',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vexatryon.in',
    title: 'VEXA — Virtual Try-On API for Fashion Brands',
    description: 'Transform your e-commerce experience with AI-powered virtual try-on.',
    siteName: 'VEXA',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'VEXA AI Virtual Try-On',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VEXA — Virtual Try-On API for Fashion Brands',
    description: 'AI-powered virtual try-on for the next generation of fashion brands.',
    images: ['/assets/images/app_logo.png'],
  },
  verification: {
    google: 'OzdMEB7tqmLLYhYKIsvtWX6CZwf4M6zyImfKOD_L3Pw',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <GlobalLayout>
          {children}
        </GlobalLayout>
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      </body>
    </html>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Box, Sparkles, Rocket, Clock } from "lucide-react";
import dynamic from "next/dynamic";
// PERF FIX: Dynamically import heavy 3D components with ssr: false
const InteractiveRobotSpline = dynamic(() => import("@/components/ui/interactive-3d-robot").then(mod => mod.InteractiveRobotSpline), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] sm:h-[340px] bg-muted animate-pulse rounded-[1.5rem]" />
});
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Application } from "@splinetool/runtime";

const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

const statusItems = [
  { icon: Box, label: "3D Simulation", status: "In Development" },
  { icon: Clock, label: "Early Access", status: "Q3 2024" },
  { icon: Rocket, label: "Engine Beta", status: "Running" },
] as const;

export default function ThreeDComingSoon() {
  const handleRobotLoad = React.useCallback((spline: Application) => {
    // Make the Spline canvas background transparent
    spline.setBackgroundColor('transparent');

    const badgeTerms = ["built", "made", "spline", "logo", "watermark", "background", "bg", "backdrop", "plane", "environment"];

    spline.getAllObjects().forEach((object) => {
      const name = object.name.toLowerCase();
      if (badgeTerms.some((term) => name.includes(term))) {
        object.hide();
      }
    });
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col">
      <Header />

      <section className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[12%] top-28 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[8%] top-40 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pt-28 pb-16 md:pt-32 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
            <motion.div
              className="max-w-3xl text-center lg:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8 drop-shadow-sm">
                <Sparkles className="w-3 h-3" />
                Next Generation Feature
              </div>

              <h1 className="text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter text-foreground leading-none mb-6 drop-shadow-sm">
                3D Virtual
                <span className="block text-gradient-primary">Try-On</span>
              </h1>

              <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto lg:mx-0 mb-10 drop-shadow-sm">
                We&apos;re building a hyper-realistic 3D garment simulation engine. Experience digital fashion with
                high-precision physics and 360° visualization.
              </p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pointer-events-auto"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <a
                  href="/#booking-section"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-105 transition-all text-center"
                >
                  Join the Waitlist
                </a>
                <a
                  href="/#how-it-works"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-card/90 text-muted-foreground border border-border font-black uppercase tracking-widest text-sm hover:bg-muted transition-all text-center"
                >
                  View Roadmap
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative mx-auto w-full max-w-[320px] pointer-events-auto"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <div className="robot-theme-panel glass-card relative overflow-hidden rounded-[2rem] p-4">
                <div className="pointer-events-none absolute inset-x-10 top-5 h-24 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_28%,rgba(74,103,65,0.08)_100%)]" />
                <div className="robot-spline-frame relative h-[300px] overflow-hidden rounded-[1.5rem] border border-primary/15 sm:h-[340px]">
                  <InteractiveRobotSpline
                    scene={ROBOT_SCENE_URL}
                    className="robot-spline-canvas"
                    onLoad={handleRobotLoad}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.24em] text-primary/80">
                  <span>3D Preview</span>
                  <span>VEXA Tone</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 mt-14 w-full pointer-events-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {statusItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Card className="glass-card rounded-3xl border-border/70 bg-card/75 backdrop-blur-xl shadow-xl shadow-primary/10">
                    <CardHeader className="flex flex-col items-center gap-3 pb-2">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/15">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-base font-bold text-card-foreground">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center pb-6">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                        {item.status}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

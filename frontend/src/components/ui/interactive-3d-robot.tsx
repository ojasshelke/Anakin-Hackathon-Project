"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveRobotSplineProps {
  scene: string;
  className?: string;
  onLoad?: (spline: any) => void;
}

function SplineFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[200px] w-full items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="sr-only">Loading 3D scene</span>
    </div>
  );
}

export function InteractiveRobotSpline({ scene, className, onLoad }: InteractiveRobotSplineProps) {
  // @splinetool/react-spline-bundle is not installed — render fallback
  return <SplineFallback className={className} />;
}

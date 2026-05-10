"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient;
}

export interface RippleGridProps {
  size?: number;
  filledCells?: Array<{ row: number; col: number }>;
  fillViewport?: boolean;
  accentFractions?: Array<{ fr: number; fc: number }>;
  cellSize?: number;
  cellColor?: string;
  filledCellColor?: string;
  pulseColor?: string;
  borderColor?: string;
  borderWidth?: number;
  pulseScale?: number;
  pulseDuration?: number;
  rippleDelay?: number;
  className?: string;
  reactToGlobalClicks?: boolean;
}

interface ActiveRipple {
  row: number;
  col: number;
  startTime: number;
}

// PERF FIX: Replaced entire DOM-based grid with a single <canvas> element.
// This eliminates 1500-2000+ DOM nodes and avoids layout thrashing.
export function RippleGrid({
  size = 5,
  filledCells = [],
  fillViewport = false,
  accentFractions = [],
  cellSize = 50,
  cellColor = "transparent",
  filledCellColor = "rgba(74, 103, 65, 0.03)",
  pulseColor = "rgba(74, 103, 65, 0.12)",
  borderColor = "rgba(74, 103, 65, 0.03)",
  borderWidth = 1,
  pulseScale = 1.1,
  pulseDuration = 300,
  rippleDelay = 100,
  className,
  reactToGlobalClicks = false,
}: RippleGridProps) {
  const isClient = useIsClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [dims, setDims] = useState(() => fillViewport ? { cols: 0, rows: 0 } : { cols: size, rows: size });
  const activeRipplesRef = useRef<ActiveRipple[]>([]);

  useEffect(() => {
    if (!fillViewport) {
      setDims({ cols: size, rows: size });
      return;
    }

    const measure = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      const h = typeof window !== "undefined" ? window.innerHeight : 800;
      const cols = Math.max(8, Math.ceil(w / cellSize) + 1);
      const rows = Math.max(8, Math.ceil(h / cellSize) + 1);
      setDims({ cols, rows });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fillViewport, size, cellSize]);

  const { cols, rows } = dims;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isDrawing = true;

    const resizeCanvas = () => {
      // PERF FIX: Use devicePixelRatio for sharp rendering on retina screens
      const dpr = window.devicePixelRatio || 1;
      canvas.width = cols * cellSize * dpr;
      canvas.height = rows * cellSize * dpr;
      canvas.style.width = `${cols * cellSize}px`;
      canvas.style.height = `${rows * cellSize}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const isFilled = (row: number, col: number) => {
      if (fillViewport && accentFractions.length > 0) {
        const maxR = Math.max(0, rows - 1);
        const maxC = Math.max(0, cols - 1);
        return accentFractions.some(({ fr, fc }) => {
          const tr = Math.round(Math.min(1, Math.max(0, fr)) * maxR);
          const tc = Math.round(Math.min(1, Math.max(0, fc)) * maxC);
          return tr === row && tc === col;
        });
      }
      return filledCells.some((cell) => cell.row === row && cell.col === col);
    };

    const filledGrid = Array.from({ length: rows }, (_, r) => 
      Array.from({ length: cols }, (_, c) => isFilled(r, c))
    );

    const drawGrid = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

      const ripples = activeRipplesRef.current;
      
      activeRipplesRef.current = ripples.filter(ripple => {
        const maxDist = cols + rows;
        return now - ripple.startTime < maxDist * rippleDelay + pulseDuration;
      });

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cellFill = filledGrid[r]?.[c] ? filledCellColor : cellColor;
          let currentPulseScale = 1;

          for (const ripple of activeRipplesRef.current) {
            const distance = Math.abs(r - ripple.row) + Math.abs(c - ripple.col);
            const cellStartTime = ripple.startTime + distance * rippleDelay;
            const elapsed = now - cellStartTime;

            if (elapsed > 0 && elapsed < pulseDuration) {
              const progress = elapsed / pulseDuration;
              const pulseIntensity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
              
              if (!filledGrid[r]?.[c]) {
                cellFill = pulseColor;
              }
              currentPulseScale = 1 + (pulseScale - 1) * pulseIntensity;
              break; 
            }
          }

          const x = c * cellSize;
          const y = r * cellSize;

          if (cellFill !== "transparent") {
            ctx.fillStyle = cellFill;
            if (currentPulseScale !== 1) {
              const offset = (cellSize * currentPulseScale - cellSize) / 2;
              ctx.fillRect(x - offset, y - offset, cellSize * currentPulseScale, cellSize * currentPulseScale);
            } else {
              ctx.fillRect(x, y, cellSize, cellSize);
            }
          }

          ctx.strokeStyle = borderColor;
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      if (isDrawing) {
        animationFrameId = requestAnimationFrame(drawGrid);
      }
    };

    drawGrid();

    return () => {
      isDrawing = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [cols, rows, cellSize, cellColor, filledCellColor, pulseColor, borderColor, borderWidth, pulseScale, pulseDuration, rippleDelay, fillViewport, accentFractions, filledCells]);

  useEffect(() => {
    if (!reactToGlobalClicks || !canvasRef.current) return;
    
    const onDocumentClick = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const clickedCol = Math.min(cols - 1, Math.max(0, Math.floor(x / cellSize)));
      const clickedRow = Math.min(rows - 1, Math.max(0, Math.floor(y / cellSize)));
      
      activeRipplesRef.current.push({
        row: clickedRow,
        col: clickedCol,
        startTime: performance.now()
      });
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [reactToGlobalClicks, cols, rows, cellSize]);

  if (fillViewport && !isClient) return null;

  return (
    <div
      className={cn(
        "pointer-events-none",
        fillViewport
          ? "fixed inset-0 z-0 flex items-start justify-start overflow-hidden"
          : "flex items-center justify-center",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn("shrink-0", reactToGlobalClicks ? "pointer-events-none" : "pointer-events-auto")}
      />
    </div>
  );
}

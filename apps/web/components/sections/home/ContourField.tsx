"use client";

import { useEffect, useRef } from "react";
import {
  clampDpr,
  createContourProgram,
  type ContourProgram,
} from "@/lib/contour-shader";

// Starting the clock mid-cycle avoids opening on a flat frame.
const SEED_TIME = 6;
// Units per millisecond. Advancing per frame instead would run the field at
// double speed on a 120 Hz display.
const RATE = 0.0024;
// One full cycle: the shader reads `t = time * 0.05` through fract(), period 1.
// At the rate above that is ~8.3s per cycle.
const CYCLE = 20;

/**
 * Decorative triangular contour field for the Home hero. Presentational only —
 * every piece of hero content is server-rendered and readable without this.
 */
export function ContourField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    // No WebGL: leave the canvas blank and let the hero gradient stand alone.
    if (!gl) return;

    let program: ContourProgram;
    try {
      program = createContourProgram(gl);
    } catch {
      return;
    }

    let frame = 0;
    let time = SEED_TIME;
    // Read once at mount: reduced-motion users get a still frame, not a loop
    // that redraws the same pixels forever.
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = clampDpr(window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (width === 0 || height === 0) return;
      canvas.width = width;
      canvas.height = height;
      program.resize(width, height);
      program.draw(time);
    };

    let started = 0;
    const render = (now: number) => {
      if (!started) started = now;
      // Wrapped to one cycle so the uniform stays small however long the tab
      // stays open — float32 quantises the animation once `time` grows large.
      time = SEED_TIME + (((now - started) * RATE) % CYCLE);
      program.draw(time);
      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (!animate || frame) return;
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);

    // Nothing should burn GPU time while the hero is scrolled past.
    const viewObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    viewObserver.observe(canvas);

    resize();

    return () => {
      stop();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      program.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

// src/components/layout/LoadingScreen.tsx
// First visit: a sprinter runs the bend under the floodlights.
//
// The spark travels the middle lane of an oval track drawn in perspective,
// dragging a tapering trail and throwing sparks that fall behind it. Crossing
// the finish line sets off a burst, and the screen hands over to the site.
//
// Timing is driven by elapsed milliseconds rather than a per-frame increment,
// so the run takes the same 2.4s on a 60Hz laptop and a 120Hz phone.

import { useEffect, useRef, useState } from 'react';
import { MEET } from '../../data/catalog';

type Props = { onComplete: () => void };

const RUN_MS = 2400;
const HOLD_MS = 420;
const FADE_MS = 600;

/**
 * The visible sweep across the top of the ellipse. Tuned so the whole run
 * stays on screen — the runner enters low-left, arcs up behind the wordmark,
 * and crosses the line before leaving low-right.
 */
const THETA_START = Math.PI * 1.2;
const THETA_END = Math.PI * 1.74;
const THETA_FINISH = Math.PI * 1.66;

const LANES = 4;
const LANE_GAP = 26;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number };

export default function LoadingScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const sparks: Spark[] = [];

    /** Track geometry, recomputed each frame so a resize is picked up free. */
    // Centre sits below the viewport, so we look along the near bend.
    const geometry = () => ({
      cx: width * 0.5,
      cy: height * 1.15,
      rx: width * 0.6,
      ry: height * 0.52,
    });

    const pointOn = (theta: number, laneOffset: number) => {
      const { cx, cy, rx, ry } = geometry();
      return {
        x: cx + (rx + laneOffset) * Math.cos(theta),
        y: cy + (ry + laneOffset) * Math.sin(theta),
      };
    };

    // Middle of the lane block, so there are lanes either side of the runner.
    const RUNNER_LANE = ((LANES - 1) / 2) * LANE_GAP;

    function drawBackdrop() {
      const sky = ctx!.createRadialGradient(
        width * 0.5,
        height * 0.1,
        0,
        width * 0.5,
        height * 0.1,
        Math.max(width, height) * 0.95,
      );
      sky.addColorStop(0, '#101a2b');
      sky.addColorStop(0.45, '#0a0f18');
      sky.addColorStop(1, '#05070b');
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, width, height);

      // Two floodlights raking in, matching the hero
      for (const fx of [0.16, 0.84]) {
        const flood = ctx!.createRadialGradient(
          width * fx,
          -height * 0.1,
          0,
          width * fx,
          -height * 0.1,
          height * 0.85,
        );
        flood.addColorStop(0, 'rgba(18,58,94,0.5)');
        flood.addColorStop(1, 'rgba(18,58,94,0)');
        ctx!.fillStyle = flood;
        ctx!.fillRect(0, 0, width, height);
      }
    }

    function drawLanes() {
      for (let lane = 0; lane < LANES; lane++) {
        const offset = lane * LANE_GAP;
        const { cx, cy, rx, ry } = geometry();
        ctx!.beginPath();
        ctx!.ellipse(cx, cy, rx + offset, ry + offset, 0, THETA_START, THETA_END);
        // The runner's lane reads brighter than its neighbours.
        const isRunner = Math.abs(offset - RUNNER_LANE) < LANE_GAP / 2;
        ctx!.strokeStyle = isRunner ? 'rgba(217,168,46,0.4)' : 'rgba(217,168,46,0.15)';
        ctx!.lineWidth = isRunner ? 1.5 : 1;
        ctx!.stroke();
      }
    }

    function drawFinishLine() {
      // A radial band of blocks crossing every lane.
      const blocks = LANES * 2;
      const span = (LANES - 1) * LANE_GAP;
      for (let i = 0; i < blocks; i++) {
        const from = -LANE_GAP / 2 + (span + LANE_GAP) * (i / blocks);
        const to = -LANE_GAP / 2 + (span + LANE_GAP) * ((i + 1) / blocks);
        const a = pointOn(THETA_FINISH, from);
        const b = pointOn(THETA_FINISH, to);
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = i % 2 === 0 ? 'rgba(242,239,230,0.5)' : 'rgba(242,239,230,0.12)';
        ctx!.lineWidth = 3;
        ctx!.stroke();
      }
    }

    function drawTrail(theta: number) {
      // Dense enough that the dots read as one continuous streak.
      const steps = 190;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const th = THETA_START + (theta - THETA_START) * t;
        const p = pointOn(th, RUNNER_LANE);
        // Tapers to nothing at the far end of the trail.
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, Math.max(t * 3.2, 0.1), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(217,168,46,${t * 0.55})`;
        ctx!.fill();
      }
    }

    function drawRunner(x: number, y: number) {
      const halo = ctx!.createRadialGradient(x, y, 0, x, y, 34);
      halo.addColorStop(0, 'rgba(247,206,91,0.95)');
      halo.addColorStop(0.35, 'rgba(217,168,46,0.55)');
      halo.addColorStop(1, 'rgba(217,168,46,0)');
      ctx!.beginPath();
      ctx!.arc(x, y, 34, 0, Math.PI * 2);
      ctx!.fillStyle = halo;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx!.fillStyle = '#fffdf5';
      ctx!.fill();
    }

    function stepSparks(dt: number) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.05 * dt; // settle downwards like real embers
        s.life -= 0.028 * dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, Math.max(s.size * s.life, 0.1), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(247,206,91,${s.life * 0.8})`;
        ctx!.fill();
      }
    }

    function emit(x: number, y: number, count: number, spread: number) {
      for (let i = 0; i < count; i++) {
        sparks.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * spread,
          vy: (Math.random() - 0.5) * spread - 0.8,
          life: 1,
          size: 1 + Math.random() * 2.2,
        });
      }
    }

    // ── Loop ───────────────────────────────────────────────────────────────
    let frame = 0;
    let last = performance.now();
    const started = last;
    let burst = false;

    // smoothstep: eases out of the blocks and settles through the line
    const ease = (t: number) => t * t * (3 - 2 * t);

    function render(now: number) {
      // Normalised to 60fps so motion is frame-rate independent.
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      const raw = Math.min((now - started) / RUN_MS, 1);
      const t = ease(raw);
      const theta = THETA_START + (THETA_END - THETA_START) * t;
      const pos = pointOn(theta, RUNNER_LANE);

      drawBackdrop();
      drawLanes();
      drawFinishLine();
      drawTrail(theta);

      if (raw < 1) emit(pos.x, pos.y, 3, 3);

      // Crossing the line throws a burst
      if (!burst && theta >= THETA_FINISH) {
        burst = true;
        const line = pointOn(THETA_FINISH, RUNNER_LANE);
        emit(line.x, line.y, 46, 9);
      }

      stepSparks(dt);
      drawRunner(pos.x, pos.y);

      setProgress(Math.round(raw * 100));

      if (raw < 1) {
        frame = requestAnimationFrame(render);
      } else {
        // Let the sparks fall for a beat, then hand over.
        const settle = (n: number) => {
          const d = Math.min((n - last) / 16.67, 3);
          last = n;
          drawBackdrop();
          drawLanes();
          drawFinishLine();
          drawTrail(THETA_END);
          stepSparks(d);
          drawRunner(pos.x, pos.y);
          if (sparks.length) frame = requestAnimationFrame(settle);
        };
        frame = requestAnimationFrame(settle);
      }
    }

    if (reduced) {
      // One static frame: the finished race, no motion.
      drawBackdrop();
      drawLanes();
      drawFinishLine();
      drawTrail(THETA_END);
      const end = pointOn(THETA_END, RUNNER_LANE);
      drawRunner(end.x, end.y);
      setProgress(100);
    } else {
      frame = requestAnimationFrame(render);
    }

    const total = reduced ? 500 : RUN_MS + HOLD_MS;
    const fadeTimer = setTimeout(() => setLeaving(true), total);
    const doneTimer = setTimeout(onComplete, total + FADE_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-pitch-base transition-opacity duration-600"
      style={{ opacity: leaving ? 0 : 1, pointerEvents: leaving ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading Ankam"
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />

      <div className="pointer-events-none relative z-10 px-6 text-center">
        <p
          className="animate-rise font-display text-[10px] tracking-[0.38em] text-crest uppercase sm:text-[11px]"
          style={{ animationDelay: '150ms' }}
        >
          {MEET.union}
        </p>

        <p
          className="malayalam animate-rise mt-4 text-3xl leading-none text-ink-primary sm:text-4xl"
          style={{ animationDelay: '320ms' }}
        >
          {MEET.nameMl}
        </p>

        <p
          className="animate-rise mt-3 font-display text-sm tracking-[0.34em] text-ink-secondary uppercase sm:text-base"
          style={{ animationDelay: '460ms' }}
        >
          {MEET.name} · {MEET.tagline}
        </p>

        {/* Lane-striped progress track */}
        <div
          className="animate-rise mx-auto mt-7 h-[3px] w-44 overflow-hidden rounded-full bg-pitch-line"
          style={{ animationDelay: '620ms' }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-crest-dim via-crest to-crest-bright"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p
          className="score animate-rise mt-3 text-[10px] tracking-[0.2em] text-ink-muted"
          style={{ animationDelay: '620ms' }}
        >
          {progress}%
        </p>
      </div>
    </div>
  );
}

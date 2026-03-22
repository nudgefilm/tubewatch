"use client";

import { useEffect, useRef } from "react";

type Vec3 = { x: number; y: number; z: number };

type ActiveLine = {
  readonly nodeIndices: readonly number[];
  readonly startMs: number;
  readonly durationMs: number;
};

const PHI_STEP = 0.15;
const THETA_STEP = 0.15;

function ceilDiv(a: number, b: number): number {
  return Math.ceil(a / b);
}

function projectSpherePoint(
  phi: number,
  theta: number,
  time: number,
  centerX: number,
  centerY: number,
  radius: number
): Vec3 {
  let x = Math.sin(theta) * Math.cos(phi + time * 0.5);
  let y = Math.sin(theta) * Math.sin(phi + time * 0.5);
  let z = Math.cos(theta);

  const rotY = time * 0.3;
  const newX = x * Math.cos(rotY) - z * Math.sin(rotY);
  const newZ = x * Math.sin(rotY) + z * Math.cos(rotY);

  const rotX = time * 0.2;
  const newY = y * Math.cos(rotX) - newZ * Math.sin(rotX);
  const finalZ = y * Math.sin(rotX) + newZ * Math.cos(rotX);

  return {
    x: centerX + newX * radius,
    y: centerY + newY * radius,
    z: finalZ,
  };
}

function parseForegroundRgb(cssColor: string): { r: number; g: number; b: number } {
  const m = cssColor.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (m) {
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  }
  return { r: 0, g: 0, b: 0 };
}

function polylineLength(pts: readonly { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!a || !b) {
      continue;
    }
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

function cumulativeSegLens(pts: readonly { x: number; y: number }[]): number[] {
  const cum: number[] = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!a || !b) {
      cum.push(cum[cum.length - 1] ?? 0);
      continue;
    }
    const prev = cum[cum.length - 1] ?? 0;
    cum.push(prev + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return cum;
}

/**
 * 짧은 경로 + 순간 등장/소멸 + 헤드가 따라 이동하는 얇은 "데이터 펄스" 스트로크.
 * 항시 연결된 네트워크가 아니라 1~2개의 에페메럴 폴리라인만.
 */
function strokeEphemeralDataPath(
  ctx: CanvasRenderingContext2D,
  screenPts: readonly { x: number; y: number }[],
  rgb: { r: number; g: number; b: number },
  elapsedMs: number,
  durationMs: number
): void {
  if (screenPts.length < 2) {
    return;
  }

  const life = elapsedMs / durationMs;
  const envelope = Math.min(1, life * 6) * Math.min(1, (1 - life) * 5);
  if (envelope <= 0.02) {
    return;
  }

  const total = polylineLength(screenPts);
  if (total < 2) {
    return;
  }

  const cum = cumulativeSegLens(screenPts);
  const travelPhase = Math.min(1, elapsedMs / (durationMs * 0.52));
  const headDist = travelPhase * total;

  const baseA = 0.07 * envelope;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${baseA * 0.65})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenPts[0].x, screenPts[0].y);
  for (let i = 1; i < screenPts.length; i++) {
    const p = screenPts[i];
    if (p) {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();

  const windowPx = 16;
  for (let i = 0; i < screenPts.length - 1; i++) {
    const p0 = screenPts[i];
    const p1 = screenPts[i + 1];
    if (!p0 || !p1) {
      continue;
    }
    const segStart = cum[i] ?? 0;
    const segEnd = cum[i + 1] ?? segStart;
    const len = segEnd - segStart;
    const steps = Math.max(4, Math.ceil(len / 3));
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps;
      const t1 = (s + 1) / steps;
      const d0 = segStart + t0 * len;
      const d1 = segStart + t1 * len;
      const mid = (d0 + d1) / 2;
      const dist = Math.abs(mid - headDist);
      const falloff = Math.max(0, 1 - dist / windowPx);
      if (falloff <= 0.02) {
        continue;
      }
      const ax = p0.x + t0 * (p1.x - p0.x);
      const ay = p0.y + t0 * (p1.y - p0.y);
      const bx = p0.x + t1 * (p1.x - p0.x);
      const by = p0.y + t1 * (p1.y - p0.y);
      const ha = 0.26 * envelope * falloff;
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${ha})`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }
}

export function AnimatedSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const linesRef = useRef<ActiveLine[]>([]);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const chars = "░▒▓█▀▄▌▐│─┤├┴┬╭╮╰╯";
    let time = 0;

    const piCount = ceilDiv(Math.PI * 2, PHI_STEP);
    const tiCount = ceilDiv(Math.PI, THETA_STEP);

    const nodeIndex = (pi: number, ti: number): number => pi * tiCount + ti;

    const neighbors = (pi: number, ti: number): { pi: number; ti: number }[] => {
      const out: { pi: number; ti: number }[] = [];
      out.push({ pi: (pi + 1) % piCount, ti });
      out.push({ pi: (pi - 1 + piCount) % piCount, ti });
      if (ti + 1 < tiCount) {
        out.push({ pi, ti: ti + 1 });
      }
      if (ti - 1 >= 0) {
        out.push({ pi, ti: ti - 1 });
      }
      return out;
    };

    const spawnLine = (now: number): ActiveLine | null => {
      let pi = Math.floor(Math.random() * piCount);
      let ti = Math.floor(Math.random() * tiCount);
      const path: number[] = [nodeIndex(pi, ti)];
      const targetLen = 2 + Math.floor(Math.random() * 3);
      for (let s = 1; s < targetLen; s++) {
        const opts = neighbors(pi, ti);
        if (opts.length === 0) {
          break;
        }
        const pick = opts[Math.floor(Math.random() * opts.length)];
        if (!pick) {
          break;
        }
        pi = pick.pi;
        ti = pick.ti;
        const idx = nodeIndex(pi, ti);
        if (path.includes(idx)) {
          break;
        }
        path.push(idx);
      }
      if (path.length < 2) {
        return null;
      }
      return {
        nodeIndices: path,
        startMs: now,
        durationMs: 720 + Math.random() * 780,
      };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.4;

      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const fg = parseForegroundRgb(getComputedStyle(canvas).color);

      type GridProj = {
        x: number;
        y: number;
        z: number;
        char: string;
        phi: number;
        theta: number;
      };

      const projected: GridProj[] = [];
      for (let pi = 0; pi < piCount; pi++) {
        const phi = pi * PHI_STEP;
        for (let ti = 0; ti < tiCount; ti++) {
          const theta = ti * THETA_STEP;
          const p = projectSpherePoint(phi, theta, time, centerX, centerY, radius);
          const depth = (p.z + 1) / 2;
          const charIndex = Math.floor(depth * (chars.length - 1));
          projected.push({
            x: p.x,
            y: p.y,
            z: p.z,
            char: chars[charIndex] ?? chars[0] ?? "·",
            phi,
            theta,
          });
        }
      }

      const now = performance.now();
      let lines = linesRef.current.filter((ln) => now - ln.startMs < ln.durationMs);

      if (
        lines.length < 2 &&
        now - lastSpawnRef.current > 280 + Math.random() * 520
      ) {
        lastSpawnRef.current = now;
        if (Math.random() < 0.5) {
          const nl = spawnLine(now);
          if (nl) {
            lines = [...lines, nl];
          }
        }
      }
      if (lines.length === 0 && Math.random() < 0.28) {
        const nl = spawnLine(now);
        if (nl) {
          lines = [nl];
        }
      }
      linesRef.current = lines;

      const lineDrawData = lines
        .map((ln) => {
          const pts = ln.nodeIndices
            .map((idx) => projected[idx])
            .filter((g): g is GridProj => g != null)
            .map((g) => ({ x: g.x, y: g.y, z: g.z }));
          const avgZ =
            pts.reduce((s, q) => s + q.z, 0) / Math.max(1, pts.length);
          return { ln, pts, avgZ };
        })
        .filter((d) => d.pts.length >= 2)
        .sort((a, b) => a.avgZ - b.avgZ);

      for (const { ln, pts } of lineDrawData) {
        strokeEphemeralDataPath(
          ctx,
          pts,
          fg,
          now - ln.startMs,
          ln.durationMs
        );
      }

      const sortedDots = [...projected].sort((a, b) => a.z - b.z);
      for (const point of sortedDots) {
        const wave =
          0.72 +
          0.28 * Math.sin(time * 2.35 + point.phi * 2.1 + point.theta * 1.7);
        const alpha = (0.2 + (point.z + 1) * 0.4) * wave;
        ctx.fillStyle = `rgba(${fg.r},${fg.g},${fg.b},${alpha})`;
        ctx.fillText(point.char, point.x, point.y);
      }

      time += 0.016;
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", color: "inherit" }}
    />
  );
}

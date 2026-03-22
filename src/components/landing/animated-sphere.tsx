"use client";

import { useEffect, useRef } from "react";

type Vec3 = { x: number; y: number; z: number };

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

/**
 * ASCII 점 구(3D) — 데이터 펄스/에페메럴 폴리라인 오버레이는 제거됨.
 */
export function AnimatedSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

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

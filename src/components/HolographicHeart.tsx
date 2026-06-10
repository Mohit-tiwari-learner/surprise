"use client";

import React, { useEffect, useRef } from "react";

interface HolographicHeartProps {
  color?: "red" | "green";
  pulseSpeed?: number; // lower is slower, e.g. 0.005
  rotationSpeed?: number;
}

export default function HolographicHeart({
  color = "red",
  pulseSpeed = 0.006,
  rotationSpeed = 0.015,
}: HolographicHeartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Resize handler
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = canvas.width = parent.clientWidth;
        height = canvas.height = parent.clientHeight || 350;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Generate 3D grid points for a parametric heart shell
    // Math: x = 16 * sin^3(u)
    //       y = 13*cos(u) - 5*cos(2u) - 2*cos(3u) - cos(4u)
    //       z = v
    // We can vary u from 0 to 2*PI, and v from -5 to 5 (depth)
    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    const points: Point3D[][] = [];
    const tSteps = 24;
    const pSteps = 24;

    for (let j = 0; j <= tSteps; j++) {
      const t = (j / tSteps) * Math.PI; // 0 to PI
      const ring: Point3D[] = [];

      for (let i = 0; i <= pSteps; i++) {
        const p = (i / pSteps) * Math.PI * 2; // 0 to 2PI
        
        // Correct 3D heart equation:
        // x = 16 * sin^3(t) * sin(p)
        // y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)
        // z = 16 * sin^3(t) * cos(p)
        const x = 16 * Math.pow(Math.sin(t), 3) * Math.sin(p);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const z = 16 * Math.pow(Math.sin(t), 3) * Math.cos(p);

        ring.push({ x, y, z });
      }
      points.push(ring);
    }

    let angleY = 0;
    let angleX = 0.3; // Tilt slightly down

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Pulse calculations
      const pulseTime = Date.now();
      const pulseFactor = 1.0 + 0.12 * Math.sin(pulseTime * pulseSpeed);

      // Center of canvas
      const cx = width / 2;
      const cy = height / 2 - 10;
      const scale = Math.min(width, height) * 0.022 * pulseFactor;

      // Increment rotation
      angleY += rotationSpeed;

      // Precalculate trig for rotation
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Project 3D points to 2D
      const projected: { x: number; y: number; z: number }[][] = [];

      for (let j = 0; j < points.length; j++) {
        const ring = points[j];
        const projectedRing: { x: number; y: number; z: number }[] = [];

        for (let i = 0; i < ring.length; i++) {
          const pt = ring[i];

          // Rotate around Y-axis
          let x1 = pt.x * cosY - pt.z * sinY;
          let z1 = pt.x * sinY + pt.z * cosY;

          // Rotate around X-axis
          let y2 = pt.y * cosX - z1 * sinX;
          let z2 = pt.y * sinX + z1 * cosX;

          // Simple perspective projection
          const distance = 80;
          const projScale = distance / (distance + z2);

          const screenX = cx + x1 * scale * projScale;
          const screenY = cy + y2 * scale * projScale;

          projectedRing.push({ x: screenX, y: screenY, z: z2 });
        }
        projected.push(projectedRing);
      }

      // Draw Grid Lines (Neon Wireframe)
      ctx.lineWidth = 1;
      const themeColor = color === "green" ? "#00ff66" : "#ff1212";
      const glowColor = color === "green" ? "rgba(0, 255, 102, 0.4)" : "rgba(255, 18, 18, 0.4)";

      ctx.shadowBlur = 8;
      ctx.shadowColor = themeColor;

      // Draw longitudinal lines (along each ring)
      for (let j = 0; j < projected.length; j++) {
        const ring = projected[j];
        ctx.beginPath();
        // Depth-based color fading
        const avgZ = ring.reduce((sum, p) => sum + p.z, 0) / ring.length;
        // Map depth to opacity
        const opacity = Math.max(0.15, Math.min(0.8, 1.0 - (avgZ + 15) / 30));
        ctx.strokeStyle = color === "green" ? `rgba(0, 255, 102, ${opacity})` : `rgba(255, 18, 18, ${opacity})`;

        ctx.moveTo(ring[0].x, ring[0].y);
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(ring[i].x, ring[i].y);
        }
        ctx.stroke();
      }

      // Draw latitudinal lines (connecting rings)
      for (let i = 0; i < projected[0].length; i++) {
        ctx.beginPath();
        
        // Let's average depth of this line segment
        const opacity = 0.5;
        ctx.strokeStyle = color === "green" ? `rgba(0, 255, 102, ${opacity})` : `rgba(255, 18, 18, ${opacity})`;

        ctx.moveTo(projected[0][i].x, projected[0][i].y);
        for (let j = 1; j < projected.length; j++) {
          ctx.lineTo(projected[j][i].x, projected[j][i].y);
        }
        ctx.stroke();
      }

      // Draw random glitch line or holographic flickers
      if (Math.random() > 0.985) {
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.strokeStyle = color === "green" ? "rgba(0, 255, 102, 0.9)" : "rgba(255, 18, 18, 0.9)";
        
        const glitchIndex = Math.floor(Math.random() * projected.length);
        const ring = projected[glitchIndex];
        ctx.beginPath();
        ctx.moveTo(ring[0].x + (Math.random() - 0.5) * 20, ring[0].y);
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(ring[i].x + (Math.random() - 0.5) * 10, ring[i].y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0; // Reset shadow blur
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, pulseSpeed, rotationSpeed]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Glitch CRT Overlay on canvas */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-transparent to-black/30" />
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
  type: "heart" | "star" | "circle" | "spark";
  rotation?: number;
  rotationSpeed?: number;
  gravity?: number;
}

interface Rocket {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export default function FireworkCelebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const colors = [
      "#ff69b4", // hot pink
      "#ffb6c1", // light pink
      "#ffc0cb", // pink
      "#ff1493", // deep pink
      "#ffd700", // gold
      "#ffffff", // white
      "#e0aaff", // lavender
    ];

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number = 0) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.beginPath();
      // Draw bezier heart centered at (0, 0)
      const topCurveHeight = size * 0.3;
      c.moveTo(0, topCurveHeight);
      // Top left curve
      c.bezierCurveTo(
        -size / 2, -size / 2, 
        -size, -topCurveHeight, 
        -size, topCurveHeight
      );
      // Bottom left curve
      c.bezierCurveTo(
        -size, size * 0.6, 
        -size * 0.5, size * 0.8, 
        0, size
      );
      // Bottom right curve
      c.bezierCurveTo(
        size * 0.5, size * 0.8, 
        size, size * 0.6, 
        size, topCurveHeight
      );
      // Top right curve
      c.bezierCurveTo(
        size, -topCurveHeight, 
        size / 2, -size / 2, 
        0, topCurveHeight
      );
      c.closePath();
      c.fill();
      c.restore();
    };

    const drawStar = (c: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number = 0) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.beginPath();
      for (let i = 0; i < 5; i++) {
        c.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * size, -Math.sin(((18 + i * 72) * Math.PI) / 180) * size);
        c.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (size / 2), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (size / 2));
      }
      c.closePath();
      c.fill();
      c.restore();
    };

    const spawnExplosion = (ex: number, ey: number, color: string) => {
      const pCount = 50 + Math.floor(Math.random() * 40);
      
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        
        // Random particle type
        const typeRand = Math.random();
        let type: "heart" | "star" | "circle" = "circle";
        let size = 2 + Math.random() * 4;
        
        if (typeRand > 0.85) {
          type = "heart";
          size = 8 + Math.random() * 8;
        } else if (typeRand > 0.65) {
          type = "star";
          size = 5 + Math.random() * 6;
        }

        particles.push({
          x: ex,
          y: ey,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1.0,
          color,
          size,
          decay: 0.01 + Math.random() * 0.015,
          type,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          gravity: 0.06 + Math.random() * 0.04,
        });
      }

      // Add a couple of larger floating hearts specifically
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles.push({
          x: ex,
          y: ey,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.0, // Float slightly up
          alpha: 1.0,
          color: "#ff1493",
          size: 14 + Math.random() * 10,
          decay: 0.005 + Math.random() * 0.005,
          type: "heart",
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.04,
          gravity: -0.02, // Floating upwards!
        });
      }
    };

    const spawnRocket = () => {
      const rx = 100 + Math.random() * (width - 200);
      const ry = height;
      const targetY = 50 + Math.random() * (height / 2);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2; // roughly straight up
      const speed = 8 + Math.random() * 6;

      rockets.push({
        x: rx,
        y: ry,
        tx: rx + Math.cos(angle) * (ry - targetY),
        ty: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3,
      });
    };

    // Spawn initial rockets
    for (let i = 0; i < 3; i++) {
      spawnRocket();
    }

    // Interval to spawn rockets
    let rocketTimer = 0;

    const animate = () => {
      ctx.fillStyle = "rgba(255, 240, 245, 0.25)"; // Soft pink trail
      ctx.fillRect(0, 0, width, height);

      // Rocket handling
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;

        // Draw rocket trail
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        // Spark particles trailing behind
        if (Math.random() > 0.3) {
          particles.push({
            x: r.x,
            y: r.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 + 1.0,
            alpha: 0.8,
            color: "#ffd700",
            size: 1 + Math.random() * 2,
            decay: 0.03 + Math.random() * 0.03,
            type: "spark",
            gravity: 0.02,
          });
        }

        // Explode condition
        if (r.vy >= 0 || r.y <= r.ty) {
          spawnExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Particles handling
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) {
          p.vy += p.gravity;
        }

        // Apply rotation
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        // Fade out
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        // Draw correct shape
        if (p.type === "heart") {
          drawHeart(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.type === "star") {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          // Circle or sparks
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Auto-spawn rockets
      rocketTimer++;
      if (rocketTimer % 45 === 0) {
        spawnRocket();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-screen h-screen z-0 pointer-events-none" />;
}

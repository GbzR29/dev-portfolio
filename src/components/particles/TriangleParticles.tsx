"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
};

export default function TriangleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let particles: Particle[] = [];
    let animationId: number;
    let width = 0;
    let height = 0;
    const DPR = window.devicePixelRatio || 1;

    // -------------------------
    // Resize com DPR correto
    // -------------------------
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      canvas.width = width * DPR;
      canvas.height = height * DPR;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      createParticles();
    };

    // -------------------------
    // Densidade adaptativa
    // -------------------------
    const createParticles = () => {
      const density = 0.00008; // controla densidade
      const count = Math.floor(width * height * density);

      particles = [];

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 6 + Math.random() * 10,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    // -------------------------
    // Desenhar triângulo
    // -------------------------
    const drawTriangle = (p: Particle) => {
      ctx.save();

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size, p.size);
      ctx.lineTo(-p.size, p.size);
      ctx.closePath();

      ctx.fillStyle = "rgba(0, 102, 255, 0.08)";
      ctx.fill();

      ctx.restore();
    };

    // -------------------------
    // Loop
    // -------------------------
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // wrap suave
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        drawTriangle(p);
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

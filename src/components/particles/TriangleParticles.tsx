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

    const PARTICLE_COUNT = 200; 

    // -------------------------
    // resize
    // -------------------------
    const resize = () => {
      canvas.width = document.body.scrollWidth;
      canvas.height = document.body.scrollHeight;

    };

    resize();
    window.addEventListener("resize", resize);

    // -------------------------
    // create particles
    // -------------------------
    const createParticles = () => {
      particles = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 6 + Math.random() * 12,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    createParticles();

    // -------------------------
    // desenhar triângulo
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

      ctx.fillStyle = "rgba(0, 102, 255, 0.11)"; // azul suave
      ctx.fill();

      ctx.restore();
    };

    // -------------------------
    // loop
    // -------------------------
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // wrap screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        drawTriangle(p);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="
        fixed inset-0
        z-0
        pointer-events-none
      "
    />
  );
}

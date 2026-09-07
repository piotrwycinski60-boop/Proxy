import React, { useEffect, useRef } from 'react';

interface CyberBackgroundProps {
  active: boolean;
  opacity?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ active, opacity = 0.4 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create sparse, elegant floating telemetry nodes
    const nodeCount = Math.min(36, Math.floor((width * height) / 35000));
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle ambient corner gradients
      const radial = ctx.createRadialGradient(width * 0.2, height * 0.1, 10, width * 0.2, height * 0.1, width * 0.6);
      radial.addColorStop(0, 'rgba(14, 165, 233, 0.04)');
      radial.addColorStop(1, 'rgba(11, 15, 25, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle connecting telemetry lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};


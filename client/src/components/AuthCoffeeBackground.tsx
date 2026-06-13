import { useEffect, useRef } from 'react';
import '../styles/auth-coffee-bg.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  phase: number;
}

function spawnParticle(w: number, h: number): Particle {
  return {
    x: w * (0.34 + Math.random() * 0.1),
    y: h * (0.52 + Math.random() * 0.06),
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.45 - Math.random() * 0.55,
    life: 0,
    maxLife: 140 + Math.random() * 100,
    size: 18 + Math.random() * 28,
    phase: Math.random() * Math.PI * 2,
  };
}

/** Animated coffee scene background — reference image + rising steam loop */
export default function AuthCoffeeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let running = true;
    const cvs = canvas;
    const context = ctx;

    function resize() {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      if (particlesRef.current.length < 28) {
        particlesRef.current = Array.from({ length: 28 }, () =>
          spawnParticle(cvs.width, cvs.height),
        );
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!running) return;
      context.clearRect(0, 0, cvs.width, cvs.height);

      for (let i = 0; i < particlesRef.current.length; i += 1) {
        let p = particlesRef.current[i];
        p.life += 1;
        p.phase += 0.04;
        p.x += p.vx + Math.sin(p.phase) * 0.35;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.15
          ? progress / 0.15 * 0.38
          : progress > 0.7
            ? (1 - progress) / 0.3 * 0.32
            : 0.38;

        const scale = 0.6 + progress * 1.1;
        const radius = p.size * scale;

        const grad = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0, `rgba(255, 252, 248, ${alpha})`);
        grad.addColorStop(0.45, `rgba(245, 238, 230, ${alpha * 0.55})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        context.fillStyle = grad;
        context.beginPath();
        context.ellipse(p.x, p.y, radius * 0.55, radius, 0, 0, Math.PI * 2);
        context.fill();

        if (p.life >= p.maxLife || p.y < cvs.height * 0.08) {
          particlesRef.current[i] = spawnParticle(cvs.width, cvs.height);
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="auth-coffee-bg" aria-hidden="true">
      <div className="auth-coffee-image" />
      <canvas ref={canvasRef} className="auth-coffee-steam-canvas" />
      <div className="auth-coffee-shine" />
      <div className="auth-coffee-vignette" />
    </div>
  );
}

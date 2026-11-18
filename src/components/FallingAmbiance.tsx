import { useEffect, useRef } from 'react';

export type AmbianceMode = 'both' | 'petals' | 'stars';

interface FallingAmbianceProps {
  mode: AmbianceMode;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  hue: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  twinklePhase: number;
  twinkleSpeed: number;
  baseOpacity: number;
}

const PETAL_COLORS = [
  'rgba(255, 205, 222, 0.72)',
  'rgba(251, 164, 198, 0.68)',
  'rgba(244, 114, 182, 0.56)',
  'rgba(255, 232, 240, 0.68)',
];

export default function FallingAmbiance({ mode }: FallingAmbianceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const createPetal = (startFromTop = false): Petal => ({
      x: Math.random() * width,
      y: startFromTop ? -20 - Math.random() * 80 : Math.random() * height,
      size: 7 + Math.random() * 8,
      speedY: 0.55 + Math.random() * 0.85,
      speedX: (Math.random() - 0.5) * 0.35,
      swayAmp: 12 + Math.random() * 20,
      swayFreq: 0.008 + Math.random() * 0.01,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      opacity: 0.5 + Math.random() * 0.38,
      hue: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    });

    const createStar = (startFromTop = false): Star => ({
      x: Math.random() * width,
      y: startFromTop ? -12 - Math.random() * 60 : Math.random() * height,
      size: 2.2 + Math.random() * 3.8,
      speedY: 0.25 + Math.random() * 0.45,
      speedX: (Math.random() - 0.5) * 0.18,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.025 + Math.random() * 0.035,
      baseOpacity: 0.35 + Math.random() * 0.55,
    });

    const petalCount = mode === 'stars' ? 0 : mode === 'petals' ? 30 : 20;
    const starCount = mode === 'petals' ? 0 : mode === 'stars' ? 42 : 26;

    const petals: Petal[] = Array.from({ length: petalCount }, () => createPetal(false));
    const stars: Star[] = Array.from({ length: starCount }, () => createStar(false));

    const drawPetal = (p: Petal, tick: number) => {
      const swayOffset = Math.sin(tick * p.swayFreq + p.phase) * 0.6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation + swayOffset * 0.35);
      ctx.scale(1, 0.75 + Math.sin(tick * 0.02 + p.phase) * 0.25);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.hue;

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size * 0.9,
        -p.size * 0.65,
        p.size * 0.85,
        p.size * 0.65,
        0,
        p.size
      );
      ctx.bezierCurveTo(
        -p.size * 0.65,
        p.size * 0.6,
        -p.size * 0.75,
        -p.size * 0.55,
        0,
        -p.size
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawStar = (s: Star, tick: number) => {
      const twinkle = 0.5 + 0.5 * Math.sin(tick * s.twinkleSpeed + s.twinklePhase);
      const alpha = s.baseOpacity * (0.4 + 0.6 * twinkle);
      const rOuter = s.size;
      const rInner = s.size * 0.28;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const radius = i % 2 === 0 ? rOuter : rInner;
        const angle = (i * Math.PI) / 4;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let animationId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        drawStar(s, tick);
        if (!prefersReducedMotion) {
          s.y += s.speedY;
          s.x += s.speedX;
          if (s.y > height + 16) {
            stars[i] = createStar(true);
          } else if (s.x < -16) {
            s.x = width + 12;
          } else if (s.x > width + 16) {
            s.x = -12;
          }
        }
      }

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        drawPetal(p, tick);
        if (!prefersReducedMotion) {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(tick * p.swayFreq + p.phase) * (p.swayAmp * 0.025);
          p.rotation += p.rotationSpeed;
          if (p.y > height + 24) {
            petals[i] = createPetal(true);
          } else if (p.x < -28) {
            p.x = width + 24;
          } else if (p.x > width + 28) {
            p.x = -24;
          }
        }
      }

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-0"
    />
  );
}

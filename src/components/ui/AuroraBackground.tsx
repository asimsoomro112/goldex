import { useEffect, useRef } from 'react';

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    let   W = canvas.width  = window.innerWidth;
    let   H = canvas.height = window.innerHeight;
    let   t = 0;

    const orbs = [
      { x: 0.2, y: 0.3, r: 0.45, color: 'rgba(212,175,55,',  speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 0.40, color: 'rgba(180,140,20,',  speed: 0.0002, phase: 2 },
      { x: 0.5, y: 0.1, r: 0.55, color: 'rgba(255,215,0,',   speed: 0.0004, phase: 4 },
      { x: 0.8, y: 0.2, r: 0.35, color: 'rgba(245,197,24,',  speed: 0.0002, phase: 1 },
    ];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Deep void base
      ctx.fillStyle = '#07070D';
      ctx.fillRect(0, 0, W, H);

      orbs.forEach(orb => {
        const cx = W * (orb.x + Math.sin(t * orb.speed + orb.phase) * 0.15);
        const cy = H * (orb.y + Math.cos(t * orb.speed + orb.phase) * 0.10);
        const r  = Math.min(W, H) * orb.r;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0,   orb.color + '0.09)');
        grad.addColorStop(0.4, orb.color + '0.04)');
        grad.addColorStop(1,   orb.color + '0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // Horizontal scan line (trading terminal feel)
      const scanY = (Math.sin(t * 0.0008) * 0.5 + 0.5) * H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0,   'rgba(212,175,55,0)');
      scanGrad.addColorStop(0.5, 'rgba(212,175,55,0.015)');
      scanGrad.addColorStop(1,   'rgba(212,175,55,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 60, W, 120);

      t++;
      requestAnimationFrame(draw);
    };

    const raf = requestAnimationFrame(draw);
    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

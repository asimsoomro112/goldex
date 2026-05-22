import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function CustomCursor() {
  const location = useLocation();
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos     = useRef({ x: 0, y: 0 });
  const ring    = useRef({ x: 0, y: 0 });
  const raf     = useRef<number | null>(null);
  const disabled = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const stopLoop = () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px';
        dotRef.current.style.top  = e.clientY + 'px';
      }
      // Check if hovering over interactive element
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isTextEntry = el?.closest('input,textarea,select');
      if (isTextEntry) {
        if (dotRef.current) dotRef.current.style.opacity = '0';
        if (ringRef.current) ringRef.current.style.opacity = '0';
        return;
      }
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
      const isInteractive = el?.closest('button,a,input,select,textarea,[role="button"]');
      ringRef.current?.classList.toggle('hovering', !!isInteractive);
    };

    const lerp = () => {
      if (document.hidden) {
        raf.current = null;
        return;
      }
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px';
        ringRef.current.style.top  = ring.current.y + 'px';
      }
      raf.current = requestAnimationFrame(lerp);
    };

    const startLoop = () => {
      if (raf.current === null && !document.hidden) {
        raf.current = requestAnimationFrame(lerp);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('visibilitychange', onVisibilityChange);
    startLoop();
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopLoop();
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <>
      <div ref={dotRef}  className="cursor-dot hidden md:block"  />
      <div ref={ringRef} className="cursor-ring hidden md:block" />
    </>
  );
}

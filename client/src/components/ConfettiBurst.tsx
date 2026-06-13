import { useEffect, useRef } from 'react';

interface ConfettiBurstProps {
  active: boolean;
}

export default function ConfettiBurst({ active }: ConfettiBurstProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const colors = ['#9E4B3A', '#C4785A', '#F5D76E', '#81C784', '#FDFBF7'];
    const container = ref.current;
    container.innerHTML = '';
    for (let i = 0; i < 48; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-piece';
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[i % colors.length];
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      el.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
      container.appendChild(el);
    }
    const timer = setTimeout(() => { container.innerHTML = ''; }, 3000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;
  return <div className="confetti-burst" ref={ref} aria-hidden />;
}

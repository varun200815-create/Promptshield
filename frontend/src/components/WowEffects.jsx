import { useEffect, useRef, useState } from 'react';
import './WowEffects.css';

/**
 * Clean Typography Wrapper (human-crafted, no symbol scramble noise)
 */
export function DecryptedText({ text = '', className = '' }) {
  return <span className={`wow-decrypted ${className}`}>{text}</span>;
}

/**
 * Smooth Ease-Out Animated Number Counter
 */
export function CountUpNumber({ value = 0, duration = 900, suffix = '', prefix = '', className = '' }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    let raf = null;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}

/**
 * Magnetic Button Wrapper: pulls children toward the cursor on hover
 */
export function Magnetic({ children, strength = 0.28, className = '' }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    });
  };

  const handleLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <span
      ref={ref}
      className={`wow-magnetic ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Cursor Spotlight + Floating Decorative Aurora Orbs
 */
export function CursorSpotlight() {
  const spotRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!spotRef.current) return;
      spotRef.current.style.setProperty('--mx', `${e.clientX}px`);
      spotRef.current.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={spotRef} className="wow-spotlight-layer" aria-hidden="true">
      <div className="wow-cursor-glow" />
      <div className="wow-orb wow-orb-1" />
      <div className="wow-orb wow-orb-2" />
      <div className="wow-orb wow-orb-3" />
    </div>
  );
}

const MARQUEE_ITEMS = [
  { label: 'Runs locally in your browser (< 5 ms)' },
  { label: '35 PII, credential & banking rules' },
  { label: 'Luhn, Verhoeff & IBAN checksum validation' },
  { label: 'Hindi, Kannada, Marathi, Telugu, Tamil, Bengali, Spanish & English' },
  { label: 'Zero raw prompt bytes uploaded' },
  { label: 'Receipt, ID photo & video auto-blur' },
  { label: 'Reversible placeholders for AI replies' },
];

/**
 * Clean Feature Ticker Strip
 */
export function CyberMarquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="wow-marquee-wrap" aria-label="Security features">
      <div className="wow-marquee-track">
        {doubled.map((item, idx) => (
          <span key={idx} className="wow-marquee-pill">
            <span className="wow-marquee-dot" />
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

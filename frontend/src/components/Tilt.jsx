import { useEffect, useRef } from 'react';
import './Tilt.css';

/**
 * React implementation of gijsroge/tilt.js
 * https://github.com/gijsroge/tilt.js
 */
export default function Tilt({
  as: Tag = 'div',
  maxTilt = 14,
  perspective = 1000,
  easing = 'cubic-bezier(.03,.98,.52,.99)',
  scale = 1.03,
  speed = 400,
  transition = true,
  disableAxis = null,
  reset = true,
  glare = true,
  maxGlare = 0.22,
  className = '',
  style,
  children,
  ...rest
}) {
  const elRef = useRef(null);
  const glareInnerRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let raf = 0;
    let timeout = 0;
    let pos = { clientX: 0, clientY: 0 };

    const setTransition = () => {
      if (!transition) return;
      clearTimeout(timeout);
      el.style.transition = `${speed}ms ${easing}`;
      if (glare && glareInnerRef.current) {
        glareInnerRef.current.style.transition = `opacity ${speed}ms ${easing}`;
      }
      timeout = window.setTimeout(() => {
        el.style.transition = '';
        if (glare && glareInnerRef.current) {
          glareInnerRef.current.style.transition = '';
        }
      }, speed);
    };

    const getValues = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const x = Math.min(Math.max((pos.clientX - rect.left) / width, 0), 1);
      const y = Math.min(Math.max((pos.clientY - rect.top) / height, 0), 1);
      const tiltX = ((maxTilt / 2) - (x * maxTilt)).toFixed(2);
      const tiltY = ((y * maxTilt) - (maxTilt / 2)).toFixed(2);
      const angle =
        Math.atan2(
          pos.clientX - (rect.left + width / 2),
          -(pos.clientY - (rect.top + height / 2))
        ) * (180 / Math.PI);
      return {
        tiltX,
        tiltY,
        percentageX: x * 100,
        percentageY: y * 100,
        angle,
      };
    };

    const updateTransforms = () => {
      raf = 0;
      const values = getValues();
      const rx = disableAxis === 'x' ? 0 : values.tiltY;
      const ry = disableAxis === 'y' ? 0 : values.tiltX;
      el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${scale}, ${scale}, ${scale})`;
      if (glare && glareInnerRef.current) {
        glareInnerRef.current.style.transform = `rotate(${values.angle}deg) translate(-50%, -50%)`;
        glareInnerRef.current.style.opacity = `${(values.percentageY * maxGlare) / 100}`;
      }
    };

    const onEnter = () => {
      setTransition();
    };

    const onMove = (e) => {
      pos = { clientX: e.clientX, clientY: e.clientY };
      if (!raf) raf = requestAnimationFrame(updateTransforms);
    };

    const onLeave = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      setTransition();
      if (reset) {
        el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        if (glare && glareInnerRef.current) {
          glareInnerRef.current.style.transform = 'rotate(180deg) translate(-50%, -50%)';
          glareInnerRef.current.style.opacity = '0';
        }
      }
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      clearTimeout(timeout);
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxTilt, perspective, easing, scale, speed, transition, disableAxis, reset, glare, maxGlare]);

  return (
    <Tag ref={elRef} className={`js-tilt${className ? ` ${className}` : ''}`} style={style} {...rest}>
      {children}
      {glare && (
        <span className="js-tilt-glare" aria-hidden="true">
          <span ref={glareInnerRef} className="js-tilt-glare-inner" />
        </span>
      )}
    </Tag>
  );
}

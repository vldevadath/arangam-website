// src/components/Crest.tsx
// The Arangam emblem ships as gold artwork on a solid black field. Compositing
// it straight onto the page would paint that black box over the backdrop, so
// the black is keyed out here: brightness becomes alpha, and the colour is
// un-premultiplied back to full strength.

import { useEffect, useRef, useState } from 'react';
import crestSrc from '../assets/logo-arangam.jpg';

type Props = {
  /** Longest edge in device pixels. Kept modest — it is only ever decorative. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
};

/** Below this the pixel is film grain in the black field, not artwork. */
const FLOOR = 14;

export default function Crest({ size = 720, className, style, alt = 'അരങ്ങം · Arangam' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'loading' | 'keyed' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = crestSrc;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;

      const scale = Math.min(1, size / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        setState('failed');
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let pixels: ImageData;
      try {
        pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        setState('failed'); // tainted canvas — fall back to blend mode
        return;
      }

      const d = pixels.data;
      for (let i = 0; i < d.length; i += 4) {
        const peak = Math.max(d[i], d[i + 1], d[i + 2]);
        if (peak <= FLOOR) {
          d[i + 3] = 0;
          continue;
        }
        // Ease the alpha ramp so faint halos fade instead of forming a fringe.
        const a = (peak - FLOOR) / (255 - FLOOR);
        d[i + 3] = Math.round(255 * Math.min(1, a * 1.35));
        // Un-premultiply: recover the artwork's true colour at full opacity.
        const boost = 255 / peak;
        d[i] = Math.min(255, d[i] * boost);
        d[i + 1] = Math.min(255, d[i + 1] * boost);
        d[i + 2] = Math.min(255, d[i + 2] * boost);
      }
      ctx.putImageData(pixels, 0, 0);
      setState('keyed');
    };

    img.onerror = () => !cancelled && setState('failed');
    return () => {
      cancelled = true;
    };
  }, [size]);

  if (state === 'failed') {
    return <img src={crestSrc} alt={alt} className={`key-black ${className ?? ''}`} style={style} />;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        display: 'block',
        opacity: state === 'keyed' ? 1 : 0,
        transition: 'opacity 600ms ease',
        ...style,
      }}
    />
  );
}

import React from 'react';

/* A sparkline carries shape, not values — no axes, no labels.
   The number it belongs to is stated beside it. */
export default function Sparkline({ values, color, w = 74, h = 26 }) {
  const min = Math.min(...values), max = Math.max(...values), span = (max - min) || 1;
  const pts = values.map((v, i) => [i / (values.length - 1) * w, h - 2 - (v - min) / span * (h - 5)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ flex: 'none', display: 'block' }} aria-hidden="true">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={color} opacity=".1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.4" fill={color} />
    </svg>
  );
}

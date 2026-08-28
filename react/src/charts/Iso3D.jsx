import React, { useLayoutEffect, useRef, useState } from 'react';
import { shade, nf } from '../theme.js';

/* ══════════════════════════════════════════════════════════════
   Isometric column field — the 3D view of company × month volume.

   3D is decoration unless it stays honest, so: every floor cell is
   identical (no perspective, no foreshortening by position), columns
   are painted back to front, rows are ordered tallest-at-the-back so
   nothing is hidden, and each series is direct-labelled at its peak.
   The same data is one click away as 2D columns and as a table.
   ══════════════════════════════════════════════════════════════ */
export default function Iso3D({ data, months, height = 300 }) {
  const box = useRef(null);
  const [w, setW] = useState(620);
  const [tip, setTip] = useState(null);

  useLayoutEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(420, e.contentRect.width)));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const cols = months.length;
  const order = [...data].sort((a, b) => Math.max(...b.v) - Math.max(...a.v));
  const rows = order.length;
  const lg = 34, rg = 46;
  const ux = Math.min(56, (w - lg - rg) / (cols + rows));
  const uy = ux * 0.36;
  const barMax = 88;
  const max = Math.max(...order.flatMap((d) => d.v));
  const hScale = barMax / max;
  const ox = lg + rows * ux, oy = 20 + barMax;
  const H = Math.round(oy + (cols + rows) * uy + 16);
  const P = (c, r) => [ox + (c - r) * ux, oy + (c + r) * uy];

  const floor = [];
  for (let i = 0; i <= rows; i++) {
    const [x1, y1] = P(0, i), [x2, y2] = P(cols, i);
    floor.push(<line key={'r' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--grid)" />);
  }
  for (let i = 0; i <= cols; i++) {
    const [x1, y1] = P(i, 0), [x2, y2] = P(i, rows);
    floor.push(<line key={'c' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--grid)" />);
  }

  const bars = [], peaks = [];
  order.forEach((d, ri) => {
    const peak = Math.max(...d.v);
    d.v.forEach((v, ci) => {
      const h = v * hScale, wid = 0.74, o = (1 - wid) / 2;
      const base = [P(ci + o, ri + o), P(ci + o + wid, ri + o), P(ci + o + wid, ri + o + wid), P(ci + o, ri + o + wid)];
      const top = base.map(([x, y]) => [x, y - h]);
      const poly = (pts) => pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
      const delta = v - d.v[0];
      const enter = (e) => setTip({
        x: e.clientX, y: e.clientY, co: d.co, c: d.c, m: months[ci], v,
        foot: `${delta >= 0 ? '+' : ''}${delta} vs January`,
      });
      bars.push({
        depth: ri + ci,
        node: (
          <g key={d.co + ci} className="mark" onMouseMove={enter} onMouseLeave={() => setTip(null)}>
            <polygon points={poly([base[3], top[3], top[2], base[2]])} fill={shade(d.c, -40)} />
            <polygon points={poly([base[2], top[2], top[1], base[1]])} fill={shade(d.c, -14)} />
            <polygon points={poly(top)} fill={shade(d.c, 30)} />
          </g>
        ),
      });
      if (v === peak) {
        const mid = [(top[0][0] + top[2][0]) / 2, (top[0][1] + top[2][1]) / 2];
        peaks.push(
          <text key={'p' + d.co} className="val-lbl halo" x={mid[0].toFixed(1)} y={(mid[1] - 8).toFixed(1)} textAnchor="middle">
            {nf(v)}
          </text>,
        );
      }
    });
  });
  bars.sort((a, b) => a.depth - b.depth);           /* painter's algorithm */

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${H}`} height={H} role="img"
        aria-label="Inspections by company and month, isometric view">
        {floor}
        {bars.map((b) => b.node)}
        {peaks}
        {months.map((m, ci) => {
          const [x, y] = P(ci + 0.5, rows + 0.3);
          return <text key={m} className="axis-lbl" x={x + 6} y={y + 4}>{m}</text>;
        })}
      </svg>
      {tip && (
        <div className="cht-tip" style={{ display: 'block', left: tip.x + 14, top: tip.y - 10 }}>
          <div className="t-hd">{tip.co} · {tip.m} 2026</div>
          <div className="t-row">
            <span className="sw" style={{ background: tip.c }} />
            <span className="t-k">Inspections</span><span className="t-v">{nf(tip.v)}</span>
          </div>
          <div className="t-foot">{tip.foot}</div>
        </div>
      )}
    </div>
  );
}

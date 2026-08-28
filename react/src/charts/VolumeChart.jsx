import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from 'recharts';
import { OUTCOME, nf } from '../theme.js';
import { rechartsTip } from './tooltip.jsx';

/* Volume split by outcome. One axis, one unit (inspections), stacked
   because the parts sum to the total the reader wants. */
export default function VolumeChart({ data }) {
  const tip = rechartsTip((payload) => {
    const d = payload[0].payload;
    return {
      head: `${d.m} '${d.y}`,
      rows: [
        { c: OUTCOME.ok, k: 'In order', v: d.ok },
        { c: OUTCOME.go, k: 'Go-but', v: d.go },
        { c: OUTCOME.ng, k: 'No-go', v: d.ng },
      ],
      foot: `${nf(d.total)} inspections · ${(d.ok / d.total * 100).toFixed(1)}% pass`,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 18, right: 6, bottom: 0, left: -18 }} barCategoryGap="34%">
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }}
          tick={{ fontSize: 10.5, fill: 'var(--text3)' }} />
        <YAxis tickLine={false} axisLine={false} width={54}
          tick={{ fontSize: 10.5, fill: 'var(--text3)' }} tickFormatter={nf} />
        <Tooltip content={tip} cursor={{ fill: 'rgba(23,98,181,.05)' }} />
        {/* 2px surface gap between stacked segments */}
        <Bar dataKey="ok" stackId="a" fill={OUTCOME.ok} radius={[0, 0, 2, 2]} stroke="#fff" strokeWidth={1} />
        <Bar dataKey="go" stackId="a" fill={OUTCOME.go} stroke="#fff" strokeWidth={1} />
        <Bar dataKey="ng" stackId="a" fill={OUTCOME.ng} radius={[2, 2, 0, 0]} stroke="#fff" strokeWidth={1}>
          {/* selective direct label — the latest month only */}
          <LabelList dataKey="total" position="top" offset={8}
            content={({ x, y, width, value, index }) =>
              index === data.length - 1
                ? <text x={x + width / 2} y={y - 8} textAnchor="middle" className="val-lbl">{nf(value)}</text>
                : null} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

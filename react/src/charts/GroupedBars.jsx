import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { nf } from '../theme.js';
import { rechartsTip } from './tooltip.jsx';

/* The flat reading of the isometric field — same numbers, no projection. */
export default function GroupedBars({ data, months }) {
  const rows = months.map((m, i) => {
    const row = { m };
    data.forEach((d) => { row[d.co] = d.v[i]; });
    return row;
  });
  const tip = rechartsTip((payload, label) => ({
    head: `${label} 2026`,
    rows: payload.map((p) => ({ c: p.color, k: p.dataKey, v: p.value })),
  }));

  return (
    <ResponsiveContainer width="100%" height={286}>
      <BarChart data={rows} margin={{ top: 12, right: 6, bottom: 0, left: -18 }} barCategoryGap="24%" barGap={2}>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }}
          tick={{ fontSize: 10.5, fill: 'var(--text3)' }} />
        <YAxis tickLine={false} axisLine={false} width={54}
          tick={{ fontSize: 10.5, fill: 'var(--text3)' }} tickFormatter={nf} />
        <Tooltip content={tip} cursor={{ fill: 'rgba(23,98,181,.05)' }} />
        {data.map((d) => <Bar key={d.co} dataKey={d.co} fill={d.c} radius={[2, 2, 0, 0]} maxBarSize={16} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

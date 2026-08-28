import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, LabelList } from 'recharts';
import { rechartsTip } from './tooltip.jsx';

/* Ordered age bins → one hue, light to dark; the bin that breaches the
   30-day rule takes the reserved status red. */
export default function AgingChart({ data, total }) {
  const tip = rechartsTip((payload) => {
    const d = payload[0].payload;
    return {
      head: d.b,
      rows: [{ c: d.c, k: 'Open items', v: d.v }],
      foot: `${(d.v / total * 100).toFixed(0)}% of open go-but items${d.breach ? ' · past the 30-day rule' : ''}`,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 16}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 52, bottom: 4, left: 8 }} barCategoryGap="28%">
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="b" width={92} tickLine={false} axisLine={{ stroke: 'var(--stroke-strong)' }}
          tick={{ fontSize: 11, fill: 'var(--text2)' }} />
        <Tooltip content={tip} cursor={{ fill: 'rgba(23,98,181,.05)' }} />
        <Bar dataKey="v" radius={[0, 2, 2, 0]} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.b} fill={d.c} />)}
          <LabelList dataKey="v" position="right" offset={8} className="val-lbl" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

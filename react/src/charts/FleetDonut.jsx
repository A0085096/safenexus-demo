import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { rechartsTip } from './tooltip.jsx';

/* Part-to-whole at a glance: three segments, values in the legend beside it. */
export default function FleetDonut({ data }) {
  const total = data.reduce((a, d) => a + d.v, 0);
  const tip = rechartsTip((payload) => {
    const d = payload[0].payload;
    return {
      head: d.k,
      rows: [{ c: d.c, k: 'Vehicles', v: d.v }],
      foot: `${(d.v / total * 100).toFixed(1)}% of the fleet`,
    };
  });

  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={tip} />
          <Pie data={data} dataKey="v" nameKey="k" innerRadius={52} outerRadius={82}
            paddingAngle={2} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.k} fill={d.c} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ font: '600 26px var(--num)', color: 'var(--text)' }}>{total}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>vehicles</div>
      </div>
    </div>
  );
}

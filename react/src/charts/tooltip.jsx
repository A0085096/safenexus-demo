import React from 'react';
import { nf } from '../theme.js';

/* One tooltip shape for every chart in the app. */
export function ChartTip({ head, rows, foot }) {
  return (
    <div className="cht-tip" style={{ display: 'block', position: 'static', boxShadow: '0 6px 20px rgba(7,30,61,.16)' }}>
      {head && <div className="t-hd">{head}</div>}
      {rows.map((r) => (
        <div className="t-row" key={r.k}>
          {r.c && <span className="sw" style={{ background: r.c }} />}
          <span className="t-k">{r.k}</span>
          <span className="t-v">{typeof r.v === 'number' ? nf(r.v) : r.v}</span>
        </div>
      ))}
      {foot && <div className="t-foot">{foot}</div>}
    </div>
  );
}

/* recharts adapter */
export const rechartsTip = (build) => ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const spec = build(payload, label);
  return spec ? <ChartTip {...spec} /> : null;
};

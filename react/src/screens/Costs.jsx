import React, { useMemo } from 'react';
import {
  Coins, Wallet, TrendingUp, Fuel, Wrench, CircleDot, Landmark, Scale, Pencil,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES, SEQ } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Signed, Breakdown, Bar } from '../components/erpUi.jsx';
import {
  R, num, vehSpend, vehCpk, woCost, COST_HEADS, meterUnit,
} from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Costs.

   Every other module produces one. This is where they are read
   together, and the reading that matters is cost per kilometre —
   or per hour, for plant. A vehicle is not expensive because its
   maintenance bill is large; it is expensive when that bill buys
   less distance than the same class of machine next to it.
   ══════════════════════════════════════════════════════════════ */
export default function Costs({ run, openDialog }) {
  const { vehicles, budgets, workOrders, fuel, subView, setView, selection, select } = useStore();
  const view = subView.costs || 'vehicles';

  const actual = useMemo(() => ({
    fuel: vehicles.reduce((a, v) => a + (v.month?.fuel || 0), 0),
    maint: vehicles.reduce((a, v) => a + (v.month?.maint || 0), 0),
    tyres: vehicles.reduce((a, v) => a + (v.month?.tyres || 0), 0),
    consumables: vehicles.reduce((a, v) => a + (v.month?.consumables || 0), 0),
    finance: vehicles.reduce((a, v) => a + (v.finance?.instalment || 0), 0),
  }), [vehicles]);

  const totalActual = Object.values(actual).reduce((a, b) => a + b, 0);
  const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
  const variance = totalBudget - totalActual;
  const totalMeter = vehicles.reduce((a, v) => a + (v.month?.meter || 0), 0);

  /* the class average is the yardstick every row is read against —
     hoisted above the view switch, because a hook may not be
     conditional */
  const classAvg = useMemo(() => {
    const by = {};
    vehicles.forEach((v) => {
      const c = (by[v.cls] = by[v.cls] || { spend: 0, meter: 0 });
      c.spend += vehSpend(v); c.meter += v.month?.meter || 0;
    });
    return Object.fromEntries(Object.entries(by).map(([k, c]) => [k, c.meter ? c.spend / c.meter : 0]));
  }, [vehicles]);


  const kpis = (
    <Kpis items={[
      { l: 'Fleet cost, this month', v: R(totalActual).replace('R ', ''), unit: 'R', icon: Coins,
        note: `across ${vehicles.length} vehicles and plant items` },
      { l: 'Against budget', v: ((totalActual / totalBudget) * 100).toFixed(0), unit: '%', icon: Scale,
        dir: variance >= 0 ? 'up' : 'dn',
        delta: `${variance >= 0 ? 'under by ' : 'over by '}${R(Math.abs(variance))}`,
        note: `budget ${R(totalBudget)}` },
      { l: 'Blended cost per km', v: 'R ' + (totalMeter ? totalActual / totalMeter : 0).toFixed(2), icon: TrendingUp,
        note: `${num(totalMeter)} km and hours run this month` },
      { l: 'Workshop cost', v: R(workOrders.reduce((a, w) => a + woCost(w), 0)).replace('R ', ''), unit: 'R', icon: Wrench,
        note: `${workOrders.length} job cards, labour and parts` },
    ]} />
  );

  const switcher = (
    <Seg value={view} onChange={(v) => setView('costs', v)} options={[
      { v: 'vehicles', l: 'Cost per vehicle', icon: Coins },
      { v: 'budget', l: 'Budget against actual', icon: Scale },
      { v: 'sites', l: 'By site and class', icon: Landmark },
    ]} />
  );

  if (view === 'budget') {
    return (
      <>
        {kpis}
        <Budget actual={actual} budgets={budgets} switcher={switcher} openDialog={openDialog} />
      </>
    );
  }
  if (view === 'sites') return <><>{kpis}</><BySite vehicles={vehicles} switcher={switcher} /></>;

  /* ── cost per vehicle ─────────────────────────────────────── */
  const rows = [...vehicles].sort((a, b) => vehCpk(b) - vehCpk(a));

  const cols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'f', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 't', label: 'Type', value: (r) => r.type, render: (r) => (
      <div><div>{r.type}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.year} {r.make}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'm', label: 'Run', num: true, value: (r) => r.month?.meter,
      render: (r) => <span>{num(r.month?.meter)} <span style={{ color: 'var(--text3)', fontSize: 11 }}>{meterUnit(r)}</span></span> },
    { key: 'fu', label: 'Fuel', num: true, value: (r) => r.month?.fuel, render: (r) => <Money v={r.month?.fuel} /> },
    { key: 'mt', label: 'Maintenance', num: true, value: (r) => r.month?.maint, render: (r) => <Money v={r.month?.maint} /> },
    { key: 'ty', label: 'Tyres', num: true, value: (r) => r.month?.tyres, render: (r) => <Money v={r.month?.tyres} /> },
    { key: 'fi', label: 'Finance', num: true, value: (r) => r.finance?.instalment,
      render: (r) => (r.finance?.instalment ? <Money v={r.finance.instalment} /> : <span style={{ color: 'var(--text3)' }}>owned</span>) },
    { key: 'tot', label: 'Total', num: true, value: (r) => vehSpend(r), render: (r) => <Money v={vehSpend(r)} bold /> },
    { key: 'cpk', label: 'Cost per unit run', num: true, value: (r) => vehCpk(r), render: (r) => {
      const cpk = vehCpk(r);
      const avg = classAvg[r.cls] || 0;
      if (!cpk) return <span style={{ color: 'var(--text3)' }}>—</span>;
      return (
        <Bar value={cpk} max={Math.max(cpk, avg * 2)} target={avg}
          colour={cpk > avg * 1.25 ? SERIES[4] : cpk > avg ? SERIES[2] : SERIES[1]}
          label={'R ' + cpk.toFixed(2)} />
      );
    } },
    { key: 'vs', label: 'vs its class', num: true, value: (r) => vehCpk(r) - (classAvg[r.cls] || 0),
      render: (r) => {
        const avg = classAvg[r.cls] || 0;
        if (!avg || !vehCpk(r)) return <span style={{ color: 'var(--text3)' }}>—</span>;
        const pct = ((vehCpk(r) - avg) / avg) * 100;
        return <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: pct > 25 ? 'var(--red)' : pct > 0 ? 'var(--gold)' : 'var(--green)' }}>
          {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
        </span>;
      } },
  ];

  const worst = rows.filter((r) => vehCpk(r) > (classAvg[r.cls] || 0) * 1.4 && r.month?.meter);

  return (
    <>
      {kpis}
      {worst.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <TrendingUp size={15} strokeWidth={1.8} />
          <span>
            <b>{worst.length} vehicle{worst.length === 1 ? '' : 's'}</b> {worst.length === 1 ? 'is' : 'are'} running
            more than 40% above the average for {worst.length === 1 ? 'its' : 'their'} class. At that gap the
            question is no longer maintenance, it is replacement — and the case for it is on this row.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.plate} pageSize={20}
        selected={selection.vehicle} onSelect={(k) => select('vehicle', k)}
        rowClass={(r) => (vehCpk(r) > (classAvg[r.cls] || 0) * 1.4 && r.month?.meter ? 'overdue' : '')}
        toolbar={<>{switcher}<Btn small icon={Wallet} onClick={() => openDialog('budget')}>Set a budget</Btn></>}
        totals={(list) => (
          <>
            <td colSpan={4} style={{ fontWeight: 600 }}>{list.length} vehicles</td>
            <td className="num" style={{ fontWeight: 600 }}>{num(list.reduce((a, r) => a + (r.month?.meter || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.month?.fuel || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.month?.maint || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.month?.tyres || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.finance?.instalment || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + vehSpend(r), 0))}</td>
            <td colSpan={2} />
          </>
        )} />
    </>
  );
}

/* ── budget against actual ──────────────────────────────────────
   Five heads, each with the money the board agreed and the money
   the operation actually spent. The variance is the whole point,
   so it carries the colour. */
function Budget({ actual, budgets, switcher, openDialog }) {
  const rows = COST_HEADS.map((h) => {
    const a = actual[h.key] || 0;
    const b = budgets[h.key] || 0;
    return { ...h, actual: a, budget: b, variance: b - a, pct: b ? (a / b) * 100 : 0 };
  });
  const max = Math.max(...rows.map((r) => Math.max(r.actual, r.budget)));

  return (
    <>
      <div className="cmdstrip solo">
        {switcher}
        <Btn small primary icon={Pencil} onClick={() => openDialog('budget')}>Set a budget</Btn>
        <span className="count">June 2026 · month to date</span>
      </div>
      <Panel title="Budget against actual" note="the variance is the number that gets asked about" flush>
        <div className="gridwrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Cost head</th>
                <th className="num">Budget</th>
                <th className="num">Actual</th>
                <th className="num">Variance</th>
                <th>Spend against the line</th>
                <th>Standing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td className="num">{R(r.budget)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{R(r.actual)}</td>
                  <td className="num"><Signed v={r.variance} /></td>
                  <td>
                    <Bar value={r.actual} max={max} target={r.budget} width={190}
                      colour={r.pct > 100 ? SERIES[4] : r.pct > 92 ? SERIES[2] : SERIES[1]}
                      label={r.pct.toFixed(0) + '%'} />
                  </td>
                  <td>
                    {r.pct > 100 ? <Badge tone="red">Over</Badge>
                      : r.pct > 92 ? <Badge tone="gold">At the line</Badge>
                        : <Badge tone="green">Within budget</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600 }}>Total</td>
                <td className="num" style={{ fontWeight: 600 }}>{R(rows.reduce((a, r) => a + r.budget, 0))}</td>
                <td className="num" style={{ fontWeight: 600 }}>{R(rows.reduce((a, r) => a + r.actual, 0))}</td>
                <td className="num"><Signed v={rows.reduce((a, r) => a + r.variance, 0)} /></td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
      <div className="grid-2">
        <Panel title="Where the month went" note="share of total fleet cost" flush>
          <Breakdown format={R} rows={rows.map((r, i) => ({ k: r.label, v: r.actual, c: SERIES[i % SERIES.length] }))
            .sort((a, b) => b.v - a.v)} />
        </Panel>
        <Panel title="Overspend by head" note="only the heads that are over" flush>
          <Breakdown format={R} colour={SERIES[4]}
            rows={rows.filter((r) => r.variance < 0).map((r) => ({ k: r.label, v: -r.variance }))
              .sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}

/* ── by site and class ──────────────────────────────────────── */
function BySite(props) {
  const { vehicles, switcher } = props;

  const bySite = ['PIT', 'STL', 'HO'].map((k, i) => {
    const list = vehicles.filter((v) => v.site === k);
    const spend = list.reduce((a, v) => a + vehSpend(v), 0);
    const meter = list.reduce((a, v) => a + (v.month?.meter || 0), 0);
    return { key: k, site: siteName(k), n: list.length, spend, meter, cpk: meter ? spend / meter : 0, c: SERIES[i] };
  });

  const byClass = [...new Set(vehicles.map((v) => v.cls))].map((cls, i) => {
    const list = vehicles.filter((v) => v.cls === cls);
    const spend = list.reduce((a, v) => a + vehSpend(v), 0);
    const meter = list.reduce((a, v) => a + (v.month?.meter || 0), 0);
    return { cls, n: list.length, spend, meter, cpk: meter ? spend / meter : 0, c: SERIES[i % SERIES.length] };
  }).sort((a, b) => b.spend - a.spend);

  const cols = [
    { key: 'c', label: 'Class', value: (r) => r.cls, render: (r) => <span style={{ fontWeight: 600 }}>{r.cls}</span> },
    { key: 'n', label: 'Units', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'm', label: 'Run this month', num: true, value: (r) => r.meter, render: (r) => num(r.meter) },
    { key: 's', label: 'Spend', num: true, value: (r) => r.spend, render: (r) => <Money v={r.spend} bold /> },
    { key: 'cpk', label: 'Cost per unit run', num: true, value: (r) => r.cpk, render: (r) => (
      <Bar value={r.cpk} max={Math.max(...byClass.map((x) => x.cpk))} colour={r.c} label={'R ' + r.cpk.toFixed(2)} />
    ) },
    { key: 'sh', label: 'Share of fleet cost', num: true, value: (r) => r.spend, render: (r) => {
      const total = byClass.reduce((a, x) => a + x.spend, 0);
      return ((r.spend / total) * 100).toFixed(1) + '%';
    } },
  ];

  return (
    <>
      <DataGrid cols={cols} rows={byClass} keyOf={(r) => r.cls} toolbar={switcher} pageSize={20} />
      <div className="grid-2">
        <Panel title="Spend by site" flush>
          <Breakdown format={R} rows={bySite.map((s) => ({ k: s.site, v: s.spend, c: s.c }))} />
        </Panel>
        <Panel title="Cost per unit run, by site" note="the same money against what it bought" flush>
          <Breakdown rows={bySite.map((s) => ({ k: s.site, v: +s.cpk.toFixed(2), c: s.c }))}
            format={(v) => 'R ' + v.toFixed(2)} />
        </Panel>
      </div>
    </>
  );
}

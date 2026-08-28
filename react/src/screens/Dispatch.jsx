import React, { useMemo } from 'react';
import {
  Route, Plus, Truck, Banknote, Percent, Clock, FileCheck2, Play, CheckCircle2, XCircle, MapPin,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES, OUTCOME } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel, ChartCard } from '../components/ui.jsx';
import { Kpis, Money, Signed, Breakdown, Bar } from '../components/erpUi.jsx';
import {
  jobMargin, jobRpk, R, num, fmtShort, TODAY, shift, between, until, CUSTOMERS,
} from '../erp/seed.js';

export const jobTone = (s) => ({
  Delivered: 'green', 'In transit': 'blue', Loading: 'teal', Planned: 'grey', Cancelled: 'red',
}[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Dispatch — the haulage jobs the fleet runs.

   A job is where the fleet earns. Everything else on the platform
   is a cost against it, so every row carries revenue, cost and the
   margin between them: a job that runs at a loss should be visible
   without a spreadsheet.
   ══════════════════════════════════════════════════════════════ */
export default function Dispatch({ run, openDialog }) {
  const { jobs, selection, select, subView, setView, vehicles } = useStore();
  const view = subView.dispatch || 'register';

  const live = jobs.filter((j) => j.status === 'In transit' || j.status === 'Loading');
  const delivered = jobs.filter((j) => j.status === 'Delivered');
  const onTime = delivered.filter((j) => !j.lateBy).length;
  const revenue = delivered.reduce((a, j) => a + j.revenue, 0);
  const margin = delivered.reduce((a, j) => a + jobMargin(j), 0);
  const noPod = delivered.filter((j) => !j.pod).length;

  const cols = [
    { key: 'ref', label: 'Job', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'lane', label: 'Lane', wrap: true, value: (r) => r.origin + r.destination, render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.origin} → {r.destination}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.route} · {r.cargo} · {r.tons} t</div>
      </div>
    ) },
    { key: 'cust', label: 'Customer', value: (r) => r.customer, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.customer}</span> },
    { key: 'veh', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'drv', label: 'Operator', value: (r) => r.driver, render: (r) => r.driver },
    { key: 'dep', label: 'Departs', value: (r) => r.depart, render: (r) => (
      <span>{fmtShort(r.depart)} <span style={{ color: 'var(--text3)' }}>{r.departTime}</span></span>
    ) },
    { key: 'km', label: 'Km', num: true, value: (r) => r.distance, render: (r) => num(r.distance) },
    { key: 'rev', label: 'Revenue', num: true, value: (r) => r.revenue, render: (r) => <Money v={r.revenue} /> },
    { key: 'cost', label: 'Cost', num: true, value: (r) => r.cost, render: (r) => <span style={{ color: 'var(--text2)', fontFamily: 'var(--num)' }}>{R(r.cost)}</span> },
    { key: 'mg', label: 'Margin', num: true, value: (r) => jobMargin(r), render: (r) => <Signed v={jobMargin(r)} /> },
    { key: 'pod', label: 'POD', value: (r) => (r.pod ? 'In' : 'Out'), render: (r) => (r.status !== 'Delivered'
      ? <span style={{ color: 'var(--text3)' }}>—</span>
      : r.pod ? <CheckCircle2 size={14} color="var(--green)" /> : <XCircle size={14} color="var(--red)" />) },
    { key: 'inv', label: 'Invoice', value: (r) => r.invoice || '', render: (r) => (r.invoice
      ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openInvoice:' + r.invoice); }}>{r.invoice}</button>
      : <span style={{ color: 'var(--text3)' }}>{r.status === 'Delivered' ? 'not raised' : '—'}</span>) },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={jobTone(r.status)}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('dispatch', v)} options={[
      { v: 'register', l: `Jobs (${jobs.length})`, icon: Route },
      { v: 'board', l: 'Plan board', icon: MapPin },
      { v: 'lanes', l: 'Lane profitability', icon: Percent },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Jobs on the road', v: live.length, icon: Truck,
        note: `${jobs.filter((j) => j.status === 'Planned').length} planned behind them` },
      { l: 'Revenue delivered', v: R(revenue).replace('R ', ''), unit: 'R', icon: Banknote,
        note: `${delivered.length} jobs this period` },
      { l: 'Margin', v: revenue ? ((margin / revenue) * 100).toFixed(1) : '0', unit: '%', icon: Percent,
        delta: R(margin), dir: margin > 0 ? 'up' : 'dn', note: 'revenue less fuel, tolls, operator and other' },
      { l: 'On-time delivery', v: delivered.length ? ((onTime / delivered.length) * 100).toFixed(1) : '—', unit: '%', icon: Clock,
        note: `${delivered.length - onTime} late · target 95%`,
        dir: onTime / Math.max(1, delivered.length) >= 0.95 ? 'up' : 'dn',
        delta: noPod ? `${noPod} without a POD` : 'all PODs in' },
    ]} />
  );

  if (view === 'board') return <><>{kpis}</><PlanBoard jobs={jobs} run={run} switcher={switcher} openDialog={openDialog} /></>;
  if (view === 'lanes') return <><>{kpis}</><Lanes jobs={jobs} switcher={switcher} /></>;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={jobs} keyOf={(r) => r.ref}
        selected={selection.job} onSelect={(k) => select('job', k)}
        rowClass={(r) => (r.status === 'Delivered' && jobMargin(r) < 0 ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('planJob')}>Plan a job</Btn>
            <Btn small icon={Play} onClick={() => run('jobStatus:In transit')}>Dispatch</Btn>
            <Btn small icon={FileCheck2} onClick={() => run('raiseInvoice')}>Invoice</Btn>
          </>
        }
        totals={(rows) => (
          <>
            <td colSpan={6} style={{ fontWeight: 600 }}>{rows.length} jobs</td>
            <td className="num" style={{ fontWeight: 600 }}>{num(rows.reduce((a, r) => a + r.distance, 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(rows.reduce((a, r) => a + r.revenue, 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(rows.reduce((a, r) => a + r.cost, 0))}</td>
            <td className="num"><Signed v={rows.reduce((a, r) => a + jobMargin(r), 0)} /></td>
            <td colSpan={3} />
          </>
        )} />
    </>
  );
}

/* ── the plan board ─────────────────────────────────────────────
   Seven columns, because dispatch is planned by the day and the
   question is always "what is committed on Thursday". */
function PlanBoard({ jobs, run, switcher, openDialog }) {
  const { selection, select } = useStore();
  const days = Array.from({ length: 7 }, (_, i) => shift(i - 1));

  return (
    <>
      <div className="cmdstrip solo">
        {switcher}
        <Btn small primary icon={Plus} onClick={() => openDialog('planJob')}>Plan a job</Btn>
        <span className="count">
          {jobs.filter((j) => days.includes(j.depart)).length} jobs committed across the window
        </span>
      </div>
      <Panel title="Committed work" note="yesterday, today and the five days ahead — the planning horizon is 14 days">
        <div className="board">
          {days.map((d, i) => {
            const list = jobs.filter((j) => j.depart === d && j.status !== 'Cancelled');
            return (
              <div className={'board-col' + (i === 1 ? ' today' : '')} key={d}>
                <div className="board-hd">
                  {new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' })}
                  <span>{list.length}</span>
                </div>
                {list.map((j) => (
                  <div key={j.ref} className={'card' + (selection.job === j.ref ? ' sel' : '')}
                    style={{ borderLeftColor: j.priority === 'Urgent' ? 'var(--red)' : 'var(--brand)' }}
                    onClick={() => select('job', j.ref)}>
                    <b>{j.destination.split(',')[0]}</b>
                    <i>{j.vehicle} · {j.departTime} · {num(j.distance)} km</i>
                    <i style={{ color: jobMargin(j) < 0 ? 'var(--red)' : 'var(--text3)' }}>
                      {R(j.revenue)} · {j.status}
                    </i>
                  </div>
                ))}
                {!list.length && (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
                    Nothing committed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}

/* ── lane profitability ─────────────────────────────────────────
   A lane that loses money loses it every time it runs. Ranking by
   margin per kilometre is what tells you which one to reprice. */
function Lanes({ jobs, switcher }) {
  const lanes = useMemo(() => {
    const by = {};
    jobs.filter((j) => j.status === 'Delivered').forEach((j) => {
      const k = `${j.origin} → ${j.destination}`;
      const l = (by[k] = by[k] || { lane: k, route: j.route, n: 0, km: 0, revenue: 0, cost: 0, late: 0 });
      l.n += 1; l.km += j.distance; l.revenue += j.revenue; l.cost += j.cost; l.late += j.lateBy ? 1 : 0;
    });
    return Object.values(by)
      .map((l) => ({ ...l, margin: l.revenue - l.cost, rpk: l.revenue / l.km, mpk: (l.revenue - l.cost) / l.km }))
      .sort((a, b) => b.margin - a.margin);
  }, [jobs]);

  const customers = useMemo(() => {
    const by = {};
    jobs.filter((j) => j.status === 'Delivered').forEach((j) => {
      by[j.customer] = (by[j.customer] || 0) + jobMargin(j);
    });
    return Object.entries(by).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  }, [jobs]);

  const cols = [
    { key: 'l', label: 'Lane', wrap: true, value: (r) => r.lane, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.lane}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.route}</div></div>
    ) },
    { key: 'n', label: 'Jobs', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'km', label: 'Km run', num: true, value: (r) => r.km, render: (r) => num(r.km) },
    { key: 'rev', label: 'Revenue', num: true, value: (r) => r.revenue, render: (r) => <Money v={r.revenue} /> },
    { key: 'cost', label: 'Cost', num: true, value: (r) => r.cost, render: (r) => <span style={{ fontFamily: 'var(--num)', color: 'var(--text2)' }}>{R(r.cost)}</span> },
    { key: 'mg', label: 'Margin', num: true, value: (r) => r.margin, render: (r) => <Signed v={r.margin} /> },
    { key: 'pct', label: 'Margin %', num: true, value: (r) => r.margin / r.revenue,
      render: (r) => {
        const pct = (r.margin / r.revenue) * 100;
        return <Bar value={Math.max(0, pct)} max={45} target={22} colour={pct >= 22 ? SERIES[1] : pct > 0 ? SERIES[2] : SERIES[4]} label={pct.toFixed(1) + '%'} />;
      } },
    { key: 'rpk', label: 'Rate/km', num: true, value: (r) => r.rpk, render: (r) => 'R ' + r.rpk.toFixed(2) },
    { key: 'mpk', label: 'Margin/km', num: true, value: (r) => r.mpk,
      render: (r) => <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: r.mpk >= 0 ? 'var(--green)' : 'var(--red)' }}>R {r.mpk.toFixed(2)}</span> },
    { key: 'late', label: 'Late', num: true, value: (r) => r.late,
      render: (r) => <span style={{ color: r.late ? 'var(--gold)' : 'var(--text3)' }}>{r.late}</span> },
  ];

  return (
    <>
      <DataGrid cols={cols} rows={lanes} keyOf={(r) => r.lane} pageSize={20}
        toolbar={switcher}
        emptyText="No delivered job has been costed yet." />
      <div className="grid-2">
        <Panel title="Margin by customer" note="delivered jobs, this period" flush>
          <Breakdown rows={customers.map((c) => ({ ...c, c: c.v >= 0 ? SERIES[1] : SERIES[4] }))} format={R} />
        </Panel>
        <Panel title="Where the money goes" note="cost of a delivered job, by head" flush>
          <Breakdown
            format={R}
            rows={[
              ['Fuel', 'fuelCost', SERIES[0]], ['Tolls', 'tollCost', SERIES[2]],
              ['Operator', 'driverCost', SERIES[3]], ['Other running cost', 'other', SERIES[4]],
            ].map(([k, field, c]) => ({
              k, c, v: jobs.filter((j) => j.status === 'Delivered').reduce((a, j) => a + j[field], 0),
            }))} />
        </Panel>
      </div>
    </>
  );
}

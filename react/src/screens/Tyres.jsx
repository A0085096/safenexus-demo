import React, { useMemo } from 'react';
import {
  CircleDot, Plus, Trash2, Ruler, AlertTriangle, Coins,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar } from '../components/erpUi.jsx';
import { R, num, fmtShort } from '../erp/seed.js';

const tyreTone = (s) => ({
  New: 'green', Running: 'blue', Watch: 'gold', Scrap: 'red', Scrapped: 'grey',
}[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Tyres.

   The second-largest consumable after diesel, and the one that is
   managed by position rather than by vehicle: a tyre is fitted at
   a meter reading, runs, and is judged on what that run cost per
   kilometre. Below 3 mm it is not a cost question any more — it is
   a legal one, and the vehicle should not be moving.
   ══════════════════════════════════════════════════════════════ */
export default function Tyres({ run, openDialog }) {
  const { tyres, settings, selection, select, subView, setView } = useStore();
  const limit = settings.minTreadMm;
  const view = subView.tyres || 'register';

  const fitted = tyres.filter((t) => t.status !== 'Scrapped');
  const illegal = fitted.filter((t) => t.tread < limit);
  const watch = fitted.filter((t) => t.tread >= limit && t.tread < limit + 2);
  const spend = tyres.reduce((a, t) => a + t.cost, 0);
  const run90 = fitted.reduce((a, t) => a + t.run, 0);
  const fleetCpk = run90 ? fitted.reduce((a, t) => a + t.cost, 0) / run90 : 0;

  const cols = [
    { key: 'sn', label: 'Serial', mono: true, value: (r) => r.serial, render: (r) => r.serial },
    { key: 'br', label: 'Brand and size', wrap: true, value: (r) => r.brand, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.brand}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.size}{r.retreads ? ` · retread ×${r.retreads}` : ''}</div></div>
    ) },
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'p', label: 'Position', value: (r) => r.position, render: (r) => <Badge tone="grey">{r.position}</Badge> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'fit', label: 'Fitted', value: (r) => r.fittedOn, render: (r) => (
      <span><span style={{ color: 'var(--text2)' }}>{fmtShort(r.fittedOn)}</span>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}> at {num(r.fittedAt)}</span></span>
    ) },
    { key: 'run', label: 'Run', num: true, value: (r) => r.run, render: (r) => num(r.run) },
    { key: 'tr', label: 'Tread', num: true, value: (r) => r.tread, render: (r) => (
      <Bar value={Math.min(20, r.tread)} max={20} target={limit}
        colour={r.tread < limit ? SERIES[4] : r.tread < limit + 2 ? SERIES[2] : SERIES[1]}
        label={r.tread.toFixed(1) + ' mm'} />
    ) },
    { key: 'pr', label: 'Pressure', num: true, value: (r) => r.pressure, render: (r) => r.pressure + ' kPa' },
    { key: 'c', label: 'Cost', num: true, value: (r) => r.cost, render: (r) => <Money v={r.cost} /> },
    { key: 'cpk', label: 'Cost/km', num: true, value: (r) => r.cpk,
      render: (r) => <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>R {r.cpk.toFixed(3)}</span> },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={tyreTone(r.status)}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('tyres', v)} options={[
      { v: 'register', l: `Fitted (${fitted.length})`, icon: CircleDot },
      { v: 'legal', l: `Below the limit (${illegal.length})`, icon: AlertTriangle },
      { v: 'cost', l: 'Cost per kilometre', icon: Coins },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Tyres on the fleet', v: fitted.length, icon: CircleDot,
        note: `${tyres.filter((t) => t.status === 'Scrapped').length} scrapped in the period` },
      { l: `Below the ${limit} mm limit`, v: illegal.length, icon: AlertTriangle,
        dir: illegal.length ? 'dn' : 'up',
        delta: illegal.length ? 'not roadworthy' : 'all legal',
        note: `${watch.length} more on watch between ${limit} and ${limit + 2} mm` },
      { l: 'Tyre spend', v: R(spend).replace('R ', ''), unit: 'R', icon: Coins,
        note: 'fitted cost across the register' },
      { l: 'Fleet cost per km', v: 'R ' + fleetCpk.toFixed(3), icon: Ruler,
        note: 'total fitted cost over the distance run on them' },
    ]} />
  );

  if (view === 'cost') return <><>{kpis}</><TyreCost tyres={fitted} switcher={switcher} /></>;

  const rows = view === 'legal' ? illegal : fitted;

  return (
    <>
      {kpis}
      {view === 'legal' && illegal.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <AlertTriangle size={15} strokeWidth={1.8} />
          <span>
            A tyre under {limit} mm is below the legal tread depth. The vehicle it is on may not be operated until
            the tyre is replaced — scrapping it here raises the record, and the pre-use sheet will fail the
            vehicle on <b>Wheel condition</b> until it is fitted with a legal one.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.serial} totalLabel={tyres.length}
        selected={selection.tyre} onSelect={(k) => select('tyre', k)}
        rowClass={(r) => (r.tread < limit ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('fitTyre')}>Fit a tyre</Btn>
            <Btn small icon={Ruler} onClick={() => run('logTread')}>Record tread</Btn>
            <Btn small icon={Trash2} onClick={() => run('scrapTyre')}>Scrap</Btn>
          </>
        }
        emptyText={view === 'legal'
          ? `Every fitted tyre is above the ${limit} mm legal limit.`
          : 'No tyre matches this filter.'} />
    </>
  );
}

/* ── cost per kilometre, by brand and by position ──────────────
   A tyre is bought once and paid for over its life, so the price
   on the invoice is the wrong number to compare. Cost per
   kilometre is the right one. */
function TyreCost({ tyres, switcher }) {
  const byBrand = useMemo(() => {
    const by = {};
    tyres.forEach((t) => {
      const b = (by[t.brand] = by[t.brand] || { brand: t.brand, n: 0, cost: 0, run: 0, tread: 0, retreads: 0 });
      b.n += 1; b.cost += t.cost; b.run += t.run; b.tread += t.tread; b.retreads += t.retreads;
    });
    return Object.values(by)
      .map((b) => ({ ...b, cpk: b.cost / Math.max(1000, b.run), avgTread: b.tread / b.n }))
      .sort((a, b) => a.cpk - b.cpk);
  }, [tyres]);

  const byPosition = useMemo(() => {
    const by = {};
    tyres.forEach((t) => {
      const p = t.position.replace(/^A\d\s/, '').replace(/ (outer|inner)$/, '');
      by[p] = by[p] || { n: 0, cost: 0, run: 0 };
      by[p].n += 1; by[p].cost += t.cost; by[p].run += t.run;
    });
    return Object.entries(by)
      .map(([k, v]) => ({ k, v: +(v.cost / Math.max(1000, v.run)).toFixed(3) }))
      .sort((a, b) => b.v - a.v);
  }, [tyres]);

  const cols = [
    { key: 'b', label: 'Brand', value: (r) => r.brand, render: (r) => <span style={{ fontWeight: 600 }}>{r.brand}</span> },
    { key: 'n', label: 'Fitted', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'run', label: 'Distance run', num: true, value: (r) => r.run, render: (r) => num(r.run) },
    { key: 'c', label: 'Cost', num: true, value: (r) => r.cost, render: (r) => <Money v={r.cost} /> },
    { key: 'cpk', label: 'Cost per km', num: true, value: (r) => r.cpk, render: (r) => (
      <Bar value={r.cpk} max={Math.max(...byBrand.map((x) => x.cpk))}
        colour={r.cpk <= byBrand[0].cpk * 1.15 ? SERIES[1] : SERIES[2]}
        label={'R ' + r.cpk.toFixed(3)} />
    ) },
    { key: 't', label: 'Average tread left', num: true, value: (r) => r.avgTread,
      render: (r) => r.avgTread.toFixed(1) + ' mm' },
    { key: 'rt', label: 'Retreads', num: true, value: (r) => r.retreads, render: (r) => r.retreads },
  ];

  return (
    <>
      <DataGrid cols={cols} rows={byBrand} keyOf={(r) => r.brand} toolbar={switcher} pageSize={20}
        emptyText="No tyre has run far enough to be costed." />
      <div className="grid-2">
        <Panel title="Cost per kilometre by position" note="steer wears fastest, and costs most" flush>
          <Breakdown rows={byPosition} format={(v) => 'R ' + v.toFixed(3)} colour={SERIES[0]} />
        </Panel>
        <Panel title="Spend by brand" flush>
          <Breakdown format={R} rows={byBrand.map((b, i) => ({ k: b.brand, v: b.cost, c: SERIES[i % SERIES.length] }))
            .sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}

import React, { useMemo } from 'react';
import {
  Landmark, CreditCard, TrendingDown, CalendarClock, Repeat, Building2,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar, Expiry } from '../components/erpUi.jsx';
import {
  R, num, until, fmtDate, vehSpend, vehCpk, CONTRACT_KINDS, meterUnit,
} from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Contracts and replacement.

   Every vehicle is on one of four footings — bought outright, on
   an instalment sale, on a full maintenance lease or on an
   operating lease — and each one changes what the vehicle costs
   and when it has to go. The replacement case is built from two
   numbers the rest of the platform already holds: what the machine
   costs to run against its class, and what is left owing on it.
   ══════════════════════════════════════════════════════════════ */
export default function Contracts({ run, openDialog }) {
  const { vehicles, selection, select, subView, setView } = useStore();
  const view = subView.contracts || 'register';

  const financed = vehicles.filter((v) => v.finance?.kind !== 'Owned outright');
  const monthly = vehicles.reduce((a, v) => a + (v.finance?.instalment || 0), 0);
  const residual = financed.reduce((a, v) => a + (v.finance?.residual || 0), 0);
  const ending = financed.filter((v) => until(v.finance.end) >= 0 && until(v.finance.end) <= 180);
  const lapsed = financed.filter((v) => until(v.finance.end) < 0);

  const cols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'f', label: 'Fleet no.', value: (r) => r.fleetNo, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.fleetNo}</span> },
    { key: 'm', label: 'Asset', wrap: true, value: (r) => r.make, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.year} {r.make}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.type} · VIN {r.vin}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'k', label: 'Footing', value: (r) => r.finance?.kind, render: (r) => (
      <Badge tone={r.finance?.kind === 'Owned outright' ? 'green'
        : r.finance?.kind === 'Full maintenance lease' ? 'purple' : 'blue'}>{r.finance?.kind}</Badge>
    ) },
    { key: 'fi', label: 'Financier', value: (r) => r.finance?.financier, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.finance?.financier}</span> },
    { key: 'p', label: 'Purchase price', num: true, value: (r) => r.finance?.purchase, render: (r) => <Money v={r.finance?.purchase} /> },
    { key: 'i', label: 'Instalment', num: true, value: (r) => r.finance?.instalment,
      render: (r) => (r.finance?.instalment ? <Money v={r.finance.instalment} bold /> : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'rv', label: 'Residual', num: true, value: (r) => r.finance?.residual,
      render: (r) => (r.finance?.kind === 'Owned outright' ? <span style={{ color: 'var(--text3)' }}>—</span> : <Money v={r.finance?.residual} />) },
    { key: 'e', label: 'Contract ends', num: true, value: (r) => until(r.finance?.end),
      render: (r) => (r.finance?.kind === 'Owned outright'
        ? <span style={{ color: 'var(--text3)' }}>—</span>
        : <Expiry date={r.finance.end} />) },
    { key: 'age', label: 'Age', num: true, value: (r) => 2026 - r.year,
      render: (r) => <Badge tone={2026 - r.year > 10 ? 'red' : 2026 - r.year > 7 ? 'gold' : 'grey'}>{2026 - r.year} yrs</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('contracts', v)} options={[
      { v: 'register', l: `Contracts (${vehicles.length})`, icon: Landmark },
      { v: 'replacement', l: 'Replacement case', icon: TrendingDown },
      { v: 'financiers', l: 'By financier', icon: Building2 },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Assets under finance', v: financed.length, unit: `of ${vehicles.length}`, icon: CreditCard,
        note: `${vehicles.filter((v) => v.finance?.kind === 'Owned outright').length} owned outright` },
      { l: 'Monthly instalments', v: R(monthly).replace('R ', ''), unit: 'R', icon: Landmark,
        note: 'committed before a wheel turns' },
      { l: 'Residual exposure', v: R(residual).replace('R ', ''), unit: 'R', icon: TrendingDown,
        note: 'balloon and settlement value across the book' },
      { l: 'Contracts ending', v: ending.length, icon: CalendarClock,
        dir: lapsed.length ? 'dn' : 'flat',
        delta: lapsed.length ? `${lapsed.length} already past term` : 'none past term',
        note: 'within the next six months' },
    ]} />
  );

  if (view === 'replacement') return <><>{kpis}</><Replacement vehicles={vehicles} switcher={switcher} run={run} /></>;
  if (view === 'financiers') return <><>{kpis}</><Financiers vehicles={vehicles} switcher={switcher} /></>;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={vehicles} keyOf={(r) => r.plate} pageSize={20}
        selected={selection.vehicle} onSelect={(k) => select('vehicle', k)}
        rowClass={(r) => (r.finance?.kind !== 'Owned outright' && until(r.finance?.end) < 0 ? 'overdue' : '')}
        toolbar={<>{switcher}<Btn small icon={Repeat} onClick={() => run('renewContract')}>Renew or settle</Btn></>}
        totals={(list) => (
          <>
            <td colSpan={6} style={{ fontWeight: 600 }}>{list.length} assets</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.finance?.purchase || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.finance?.instalment || 0), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + (r.finance?.residual || 0), 0))}</td>
            <td colSpan={2} />
          </>
        )} />
    </>
  );
}

/* ── the replacement case ───────────────────────────────────────
   Three signals — age, cost against the class, and whether the
   contract has run out — scored together, because any one of them
   on its own is an argument and all three together is a decision. */
function Replacement({ vehicles, switcher, run }) {
  const classAvg = useMemo(() => {
    const by = {};
    vehicles.forEach((v) => {
      const c = (by[v.cls] = by[v.cls] || { spend: 0, meter: 0 });
      c.spend += vehSpend(v); c.meter += v.month?.meter || 0;
    });
    return Object.fromEntries(Object.entries(by).map(([k, c]) => [k, c.meter ? c.spend / c.meter : 0]));
  }, [vehicles]);

  const rows = useMemo(() => vehicles.map((v) => {
    const age = 2026 - v.year;
    const avg = classAvg[v.cls] || 0;
    const cpk = vehCpk(v);
    const over = avg && cpk ? ((cpk - avg) / avg) * 100 : 0;
    const termDone = v.finance?.kind !== 'Owned outright' && until(v.finance.end) < 0;
    /* the score is deliberately blunt: nobody trusts a decimal
       here, and the ranking is what gets acted on */
    const score = Math.round(
      Math.min(40, age * 4)
      + Math.min(40, Math.max(0, over))
      + (termDone ? 20 : 0),
    );
    return { ...v, age, cpk, over, termDone, score };
  }).sort((a, b) => b.score - a.score), [vehicles, classAvg]);

  const candidates = rows.filter((r) => r.score >= 55);

  const cols = [
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 'm', label: 'Asset', wrap: true, value: (r) => r.make, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.year} {r.make}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.type} · {siteName(r.site)}</div></div>
    ) },
    { key: 'a', label: 'Age', num: true, value: (r) => r.age,
      render: (r) => <Badge tone={r.age > 10 ? 'red' : r.age > 7 ? 'gold' : 'grey'}>{r.age} yrs</Badge> },
    { key: 'me', label: 'Meter', num: true, value: (r) => r.km,
      render: (r) => <span>{num(r.km)} <span style={{ color: 'var(--text3)', fontSize: 11 }}>{meterUnit(r)}</span></span> },
    { key: 'c', label: 'Cost per unit run', num: true, value: (r) => r.cpk,
      render: (r) => (r.cpk ? 'R ' + r.cpk.toFixed(2) : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'o', label: 'Against its class', num: true, value: (r) => r.over,
      render: (r) => (r.cpk
        ? <span style={{ fontFamily: 'var(--num)', fontWeight: 600, color: r.over > 25 ? 'var(--red)' : r.over > 0 ? 'var(--gold)' : 'var(--green)' }}>
            {r.over > 0 ? '+' : ''}{r.over.toFixed(0)}%
          </span>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 't', label: 'Contract', value: (r) => r.finance?.kind,
      render: (r) => (r.termDone
        ? <Badge tone="gold">Past term</Badge>
        : r.finance?.kind === 'Owned outright'
          ? <Badge tone="green">Owned</Badge>
          : <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>to {fmtDate(r.finance.end)}</span>) },
    { key: 'rv', label: 'Settlement', num: true, value: (r) => r.finance?.residual,
      render: (r) => (r.finance?.kind === 'Owned outright' ? <span style={{ color: 'var(--text3)' }}>—</span> : <Money v={r.finance?.residual} />) },
    { key: 's', label: 'Replacement case', num: true, value: (r) => r.score, render: (r) => (
      <Bar value={r.score} max={100} target={55}
        colour={r.score >= 70 ? SERIES[4] : r.score >= 55 ? SERIES[2] : SERIES[1]}
        label={String(r.score)} />
    ) },
    { key: 'v2', label: 'Verdict', value: (r) => r.score,
      render: (r) => (r.score >= 70 ? <Badge tone="red">Replace</Badge>
        : r.score >= 55 ? <Badge tone="gold">Review</Badge>
          : <Badge tone="green">Keep</Badge>) },
  ];

  return (
    <>
      <div className="infobar" style={{ marginBottom: 12 }}>
        <TrendingDown size={15} strokeWidth={1.8} />
        <span>
          The case is scored out of a hundred from three things the platform already knows: age, cost per
          kilometre against the same class of machine, and whether the finance term has run out.
          <b> {candidates.length} vehicle{candidates.length === 1 ? '' : 's'}</b> {candidates.length === 1 ? 'scores' : 'score'} above
          the review line, carrying {R(candidates.reduce((a, r) => a + (r.finance?.residual || 0), 0))} of
          settlement value between them.
        </span>
      </div>
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.plate} toolbar={switcher} pageSize={20}
        rowClass={(r) => (r.score >= 70 ? 'overdue' : '')} />
    </>
  );
}

/* ── by financier ───────────────────────────────────────────── */
function Financiers({ vehicles, switcher }) {
  const rows = useMemo(() => {
    const by = {};
    vehicles.filter((v) => v.finance?.kind !== 'Owned outright').forEach((v) => {
      const f = (by[v.finance.financier] = by[v.finance.financier] || {
        financier: v.finance.financier, n: 0, instalment: 0, residual: 0, purchase: 0, ending: 0,
      });
      f.n += 1;
      f.instalment += v.finance.instalment;
      f.residual += v.finance.residual;
      f.purchase += v.finance.purchase;
      f.ending += until(v.finance.end) <= 180 ? 1 : 0;
    });
    return Object.values(by).sort((a, b) => b.instalment - a.instalment);
  }, [vehicles]);

  const cols = [
    { key: 'f', label: 'Financier', value: (r) => r.financier, render: (r) => <span style={{ fontWeight: 600 }}>{r.financier}</span> },
    { key: 'n', label: 'Assets', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'p', label: 'Original cost', num: true, value: (r) => r.purchase, render: (r) => <Money v={r.purchase} /> },
    { key: 'i', label: 'Monthly instalments', num: true, value: (r) => r.instalment, render: (r) => <Money v={r.instalment} bold /> },
    { key: 'rv', label: 'Residual exposure', num: true, value: (r) => r.residual, render: (r) => <Money v={r.residual} /> },
    { key: 'e', label: 'Ending within 6 months', num: true, value: (r) => r.ending,
      render: (r) => (r.ending ? <Badge tone="gold">{r.ending}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
  ];

  return (
    <>
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.financier} toolbar={switcher} pageSize={20} />
      <div className="grid-2">
        <Panel title="Monthly commitment by financier" flush>
          <Breakdown format={R} rows={rows.map((r, i) => ({ k: r.financier, v: r.instalment, c: SERIES[i % SERIES.length] }))} />
        </Panel>
        <Panel title="Fleet by footing" note="how the assets are held" flush>
          <Breakdown rows={CONTRACT_KINDS.map((k, i) => ({
            k, c: SERIES[i % SERIES.length], v: vehicles.filter((v) => v.finance?.kind === k).length,
          })).sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}

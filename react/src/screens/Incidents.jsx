import React, { useMemo } from 'react';
import {
  AlertTriangle, Plus, ShieldAlert, Banknote, HeartPulse, FileCheck2, Wrench, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar } from '../components/erpUi.jsx';
import { R, num, fmtShort, INCIDENT_TYPES } from '../erp/seed.js';

const sevTone = (s) => ({ Critical: 'red', Major: 'gold', Moderate: 'blue', Minor: 'grey' }[s] || 'grey');
const statusTone = (s) => ({ Open: 'red', Investigating: 'gold', Closed: 'green' }[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Incidents and claims.

   Every incident carries the same four actions, because the order
   they are done in is what makes the difference between a record
   and an investigation: secure the scene, pull the evidence,
   establish the cause, lodge the claim. An incident that is
   "closed" with actions outstanding is not closed.
   ══════════════════════════════════════════════════════════════ */
export default function Incidents({ run, openDialog }) {
  const { incidents, selection, select, subView, setView } = useStore();
  const view = subView.incidents || 'register';

  const open = incidents.filter((i) => i.status !== 'Closed');
  const critical = incidents.filter((i) => i.severity === 'Critical');
  const exposure = open.reduce((a, i) => a + i.estimate, 0);
  const injuries = incidents.reduce((a, i) => a + i.injuries, 0);
  const lostDays = incidents.reduce((a, i) => a + i.lostDays, 0);

  const cols = [
    { key: 'r', label: 'Incident', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 't', label: 'Type', value: (r) => r.type, render: (r) => r.type },
    { key: 'sev', label: 'Severity', value: (r) => ['Critical', 'Major', 'Moderate', 'Minor'].indexOf(r.severity),
      render: (r) => <Badge tone={sevTone(r.severity)}>{r.severity}</Badge> },
    { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
    { key: 'd', label: 'Operator', value: (r) => r.driver, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.driver}</span> },
    { key: 'w', label: 'What happened', wrap: true, value: (r) => r.description, render: (r) => (
      <span style={{ color: 'var(--text2)', fontSize: 11.5 }}>{r.description}</span>
    ) },
    { key: 'dt', label: 'When', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.date)}</span> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'a', label: 'Actions', num: true, value: (r) => r.actions.filter((x) => x.done).length, render: (r) => {
      const done = r.actions.filter((x) => x.done).length;
      return (
        <Bar value={done} max={r.actions.length}
          colour={done === r.actions.length ? SERIES[1] : done > 1 ? SERIES[2] : SERIES[4]}
          label={`${done}/${r.actions.length}`} width={54} />
      );
    } },
    { key: 'c', label: 'Claim', value: (r) => r.claim || '',
      render: (r) => (r.claim ? <span style={{ fontFamily: 'var(--num)', color: 'var(--brand-dark)' }}>{r.claim}</span>
        : <span style={{ color: 'var(--text3)' }}>not lodged</span>) },
    { key: 'e', label: 'Estimate', num: true, value: (r) => r.estimate, render: (r) => <Money v={r.estimate} bold /> },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('incidents', v)} options={[
      { v: 'register', l: `All (${incidents.length})`, icon: AlertTriangle },
      { v: 'open', l: `Open (${open.length})`, icon: ShieldAlert },
      { v: 'analysis', l: 'Analysis', icon: FileCheck2 },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Open incidents', v: open.length, icon: ShieldAlert,
        dir: open.length ? 'dn' : 'up',
        delta: `${incidents.filter((i) => i.status === 'Investigating').length} under investigation`,
        note: `${incidents.length} logged in the period` },
      { l: 'Critical', v: critical.length, icon: AlertTriangle,
        dir: critical.length ? 'dn' : 'up',
        note: 'a critical incident is reportable within 24 hours' },
      { l: 'Open exposure', v: R(exposure).replace('R ', ''), unit: 'R', icon: Banknote,
        note: 'estimated cost of the incidents not yet closed' },
      { l: 'Injuries and lost days', v: injuries, unit: `· ${lostDays} days`, icon: HeartPulse,
        dir: injuries ? 'dn' : 'up',
        note: injuries ? 'every one is a section 24 report' : 'no injury this period' },
    ]} />
  );

  if (view === 'analysis') return <><>{kpis}</><Analysis incidents={incidents} switcher={switcher} /></>;

  const rows = view === 'open' ? open : incidents;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.ref} totalLabel={incidents.length}
        selected={selection.incident} onSelect={(k) => select('incident', k)}
        rowClass={(r) => (r.severity === 'Critical' && r.status !== 'Closed' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('incident')}>Log an incident</Btn>
            <Btn small icon={FileCheck2} onClick={() => run('lodgeClaim')}>Lodge a claim</Btn>
            <Btn small icon={Wrench} onClick={() => run('raiseWOFromIncident')}>Raise a work order</Btn>
            <Btn small icon={CheckCircle2} onClick={() => run('incidentStatus:Closed')}>Close</Btn>
          </>
        }
        totals={(list) => (
          <>
            <td colSpan={10} style={{ fontWeight: 600 }}>{list.length} incidents</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.estimate, 0))}</td>
            <td />
          </>
        )} />
    </>
  );
}

/* ── analysis ───────────────────────────────────────────────────
   Counting incidents by type answers "what keeps happening".
   Weighting them by cost answers "what should we fix first" —
   and the two rankings are rarely the same. */
function Analysis({ incidents, switcher }) {
  const byType = useMemo(() => {
    const kinds = [...new Set(incidents.map((i) => i.type))];
    return kinds.map((t, i) => {
      const list = incidents.filter((x) => x.type === t);
      return {
        type: t,
        n: list.length,
        cost: list.reduce((a, x) => a + x.estimate, 0),
        critical: list.filter((x) => x.severity === 'Critical' || x.severity === 'Major').length,
        open: list.filter((x) => x.status !== 'Closed').length,
        c: SERIES[i % SERIES.length],
      };
    }).sort((a, b) => b.cost - a.cost);
  }, [incidents]);

  const cols = [
    { key: 't', label: 'Type', value: (r) => r.type, render: (r) => <span style={{ fontWeight: 600 }}>{r.type}</span> },
    { key: 'n', label: 'Count', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'c', label: 'Serious', num: true, value: (r) => r.critical,
      render: (r) => (r.critical ? <Badge tone="red">{r.critical}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
    { key: 'o', label: 'Still open', num: true, value: (r) => r.open, render: (r) => r.open },
    { key: 'cost', label: 'Estimated cost', num: true, value: (r) => r.cost, render: (r) => <Money v={r.cost} bold /> },
    { key: 'avg', label: 'Average per incident', num: true, value: (r) => r.cost / r.n, render: (r) => <Money v={r.cost / r.n} /> },
    { key: 'sh', label: 'Share of cost', num: true, value: (r) => r.cost, render: (r) => (
      <Bar value={r.cost} max={Math.max(...byType.map((x) => x.cost))} colour={r.c}
        label={((r.cost / byType.reduce((a, x) => a + x.cost, 0)) * 100).toFixed(0) + '%'} />
    ) },
  ];

  const bySite = ['PIT', 'STL', 'HO'].map((k, i) => ({
    k: siteName(k), c: SERIES[i], v: incidents.filter((x) => x.site === k).length,
  }));
  const bySeverity = ['Critical', 'Major', 'Moderate', 'Minor'].map((s, i) => ({
    k: s, v: incidents.filter((x) => x.severity === s).length,
    c: [SERIES[4], SERIES[2], SERIES[0], SERIES[1]][i],
  }));

  return (
    <>
      <div className="infobar" style={{ marginBottom: 12 }}>
        <FileCheck2 size={15} strokeWidth={1.8} />
        <span>
          Ranked by cost rather than by count. The type that happens most often is rarely the type that
          costs most — <b>{byType[0]?.type.toLowerCase()}</b> accounts for {' '}
          {((byType[0]?.cost / byType.reduce((a, x) => a + x.cost, 0)) * 100).toFixed(0)}% of the estimated
          cost off {byType[0]?.n} incident{byType[0]?.n === 1 ? '' : 's'}.
        </span>
      </div>
      <DataGrid cols={cols} rows={byType} keyOf={(r) => r.type} toolbar={switcher} pageSize={20} />
      <div className="grid-2">
        <Panel title="By severity" flush><Breakdown rows={bySeverity} /></Panel>
        <Panel title="By site" flush><Breakdown rows={bySite} /></Panel>
      </div>
    </>
  );
}

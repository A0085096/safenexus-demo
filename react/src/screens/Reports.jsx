import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck, ShieldCheck, Truck, Users as UsersIcon, AlertTriangle, BadgeCheck,
  Download, Printer, ArrowLeft, Wrench, FileJson, Columns3, PlayCircle, PauseCircle, Mail,
  Route, Fuel, CircleDot, Coins, Package, Receipt, ShieldAlert, Files,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { nf } from '../theme.js';
import { Panel, Btn, Badge, Seg } from '../components/ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';
import { SITE_PERF, siteName } from '../data.js';
import {
  R, num, until, fmtDate, jobMargin, woCost, vehSpend, vehCpk, stockValue, invTotal,
  invPaid, invDue, invState,
} from '../erp/seed.js';

const ICONS = {
  clipboard: ClipboardCheck, shield: ShieldCheck, truck: Truck,
  users: UsersIcon, alert: AlertTriangle, cert: BadgeCheck, tool: Wrench,
  route: Route, fuel: Fuel, tyre: CircleDot, coins: Coins, part: Package,
  receipt: Receipt, incident: ShieldAlert, files: Files,
};

/* ══════════════════════════════════════════════════════════════
   Reports build from the live store and render as a document you
   can read on screen, export as CSV or print — rather than a
   message claiming a PDF was produced somewhere.
   ══════════════════════════════════════════════════════════════ */
const DEFS = [
  {
    id: 'dispatch', name: 'Dispatch report', icon: 'route', tone: 'blue',
    desc: 'Every haulage job, what it earned and what it cost to move the load.',
    build: ({ jobs }) => ({
      cols: ['Job', 'Customer', 'From', 'To', 'Vehicle', 'Operator', 'Departs', 'Km', 'Revenue', 'Cost', 'Margin', 'POD', 'Status'],
      rows: jobs.map((j) => [j.ref, j.customer, j.origin, j.destination, j.vehicle, j.driver, fmtDate(j.depart),
        j.distance, j.revenue, j.cost, jobMargin(j),
        j.status === 'Delivered' ? (j.pod ? 'In' : 'Missing') : '—', j.status]),
      summary: (rows) => [
        ['Jobs', rows.length],
        ['Delivered', rows.filter((r) => r[12] === 'Delivered').length],
        ['Revenue', R(rows.reduce((a, r) => a + r[8], 0))],
        ['Margin', R(rows.reduce((a, r) => a + r[10], 0))],
      ],
    }),
  },
  {
    id: 'fuel', name: 'Fuel report', icon: 'fuel', tone: 'gold',
    desc: 'Every fill measured against the model target, and the ones that will not reconcile.',
    build: ({ fuel }) => ({
      cols: ['Transaction', 'Date', 'Vehicle', 'Operator', 'Station', 'Litres', 'Rate', 'Amount', 'Meter', 'Achieved', 'Variance', 'Exception', 'Status'],
      rows: fuel.map((f) => [f.ref, fmtDate(f.date), f.vehicle, f.driver, f.station, f.litres, f.rate, f.amount,
        f.meter, `${f.consumption} ${f.unit}`, f.variance ? `${f.variance}%` : '—', f.exception || '—', f.status]),
      summary: (rows) => [
        ['Transactions', rows.length],
        ['Litres drawn', num(rows.reduce((a, r) => a + r[5], 0))],
        ['Spend', R(rows.reduce((a, r) => a + r[7], 0))],
        ['In exception', rows.filter((r) => r[11] !== '—').length],
      ],
    }),
  },
  {
    id: 'cost', name: 'Cost report', icon: 'coins', tone: 'purple',
    desc: 'What each vehicle costs to run, and what that buys in distance or hours.',
    build: ({ vehicles }) => ({
      cols: ['Plate', 'Fleet no.', 'Type', 'Class', 'Site', 'Run', 'Fuel', 'Maintenance', 'Tyres', 'Finance', 'Total', 'Cost per unit run'],
      rows: vehicles.map((v) => [v.plate, v.fleetNo, v.type, v.cls, siteName(v.site), v.month?.meter || 0,
        v.month?.fuel || 0, v.month?.maint || 0, v.month?.tyres || 0, v.finance?.instalment || 0,
        vehSpend(v), +vehCpk(v).toFixed(2)]),
      summary: (rows) => [
        ['Vehicles', rows.length],
        ['Total cost', R(rows.reduce((a, r) => a + r[10], 0))],
        ['Distance and hours run', num(rows.reduce((a, r) => a + r[5], 0))],
        ['Blended cost per unit', 'R ' + (rows.reduce((a, r) => a + r[10], 0) / Math.max(1, rows.reduce((a, r) => a + r[5], 0))).toFixed(2)],
      ],
    }),
  },
  {
    id: 'workshop2', name: 'Workshop cost report', icon: 'tool', tone: 'blue',
    desc: 'Every job card with its labour, its parts and the downtime it caused.',
    build: ({ workOrders }) => ({
      cols: ['Job card', 'Vehicle', 'Work type', 'Reported fault', 'Site', 'Opened', 'Days down', 'Labour hours', 'Part lines', 'Cost', 'From defect', 'Status'],
      rows: workOrders.map((w) => [w.ref, w.vehicle, w.type, w.fault || w.note, siteName(w.site), w.opened,
        w.downtimeDays || 0, w.labourHours || 0, (w.parts || []).length, woCost(w), w.defect || '—', w.status]),
      summary: (rows) => [
        ['Job cards', rows.length],
        ['Open', rows.filter((r) => r[11] !== 'Completed').length],
        ['Days down', rows.reduce((a, r) => a + r[6], 0)],
        ['Workshop cost', R(rows.reduce((a, r) => a + r[9], 0))],
      ],
    }),
  },
  {
    id: 'tyre', name: 'Tyre report', icon: 'tyre', tone: 'gold',
    desc: 'Tread, distance run and cost per kilometre for every tyre on the fleet.',
    build: ({ tyres }) => ({
      cols: ['Serial', 'Brand', 'Size', 'Vehicle', 'Position', 'Site', 'Fitted', 'Run', 'Tread', 'Cost', 'Cost per km', 'Status'],
      rows: tyres.map((t) => [t.serial, t.brand, t.size, t.vehicle, t.position, siteName(t.site),
        fmtDate(t.fittedOn), t.run, t.tread, t.cost, +t.cpk.toFixed(3), t.status]),
      summary: (rows) => [
        ['Tyres', rows.length],
        ['Below the 3 mm limit', rows.filter((r) => r[8] < 3 && r[11] !== 'Scrapped').length],
        ['Fitted cost', R(rows.reduce((a, r) => a + r[9], 0))],
        ['Distance run on them', num(rows.reduce((a, r) => a + r[7], 0))],
      ],
    }),
  },
  {
    id: 'stock', name: 'Stock report', icon: 'part', tone: 'purple',
    desc: 'What is on the shelf, what it is worth and what is about to run out.',
    build: ({ parts }) => ({
      cols: ['Part number', 'Description', 'Category', 'Store', 'Bin', 'On hand', 'Reorder at', 'On order', 'Used, 90 days', 'Unit cost', 'Stock value', 'Supplier'],
      rows: parts.map((p) => [p.sku, p.desc, p.category, siteName(p.store), p.bin, p.qty, p.reorder,
        p.onOrder, p.usage90, p.unitCost, stockValue(p), p.supplier]),
      summary: (rows) => [
        ['Lines', rows.length],
        ['Below reorder', rows.filter((r) => r[5] <= r[6]).length],
        ['Out of stock', rows.filter((r) => r[5] === 0).length],
        ['Stock value', R(rows.reduce((a, r) => a + r[10], 0))],
      ],
    }),
  },
  {
    id: 'debtors', name: 'Debtors report', icon: 'receipt', tone: 'green',
    desc: 'What has been invoiced, what has been collected and how old the rest is.',
    build: ({ invoices }) => ({
      cols: ['Invoice', 'Customer', 'Site', 'Jobs', 'Dated', 'Due', 'Total', 'Received', 'Outstanding', 'Days overdue', 'Status'],
      rows: invoices.map((i) => [i.ref, i.customer, siteName(i.site), i.jobs.length, fmtDate(i.date), fmtDate(i.due),
        Math.round(invTotal(i)), invPaid(i), invDue(i), Math.max(0, -until(i.due)), invState(i)]),
      summary: (rows) => [
        ['Invoices', rows.length],
        ['Invoiced', R(rows.reduce((a, r) => a + r[6], 0))],
        ['Collected', R(rows.reduce((a, r) => a + r[7], 0))],
        ['Outstanding', R(rows.reduce((a, r) => a + r[8], 0))],
      ],
    }),
  },
  {
    id: 'incident', name: 'Incident report', icon: 'incident', tone: 'red',
    desc: 'Every incident, its investigation state and what it is expected to cost.',
    build: ({ incidents }) => ({
      cols: ['Incident', 'Type', 'Severity', 'Vehicle', 'Operator', 'Site', 'Date', 'Where', 'Injuries', 'Actions done', 'Claim', 'Estimate', 'Status'],
      rows: incidents.map((i) => [i.ref, i.type, i.severity, i.vehicle, i.driver, siteName(i.site), fmtDate(i.date),
        i.location, i.injuries, `${i.actions.filter((a) => a.done).length} of ${i.actions.length}`,
        i.claim || '—', i.estimate, i.status]),
      summary: (rows) => [
        ['Incidents', rows.length],
        ['Open', rows.filter((r) => r[12] !== 'Closed').length],
        ['Injuries', rows.reduce((a, r) => a + r[8], 0)],
        ['Estimated cost', R(rows.reduce((a, r) => a + r[11], 0))],
      ],
    }),
  },
  {
    id: 'document', name: 'Document report', icon: 'files', tone: 'blue',
    desc: 'Every certificate held, read as the days it has left rather than a date.',
    build: ({ documents }) => ({
      cols: ['Reference', 'Kind', 'Held against', 'Type', 'Site', 'Owner', 'Issued', 'Expires', 'Days left', 'Status'],
      rows: documents.map((d) => [d.ref, d.kind, d.subject, d.subjectType, siteName(d.site), d.owner,
        fmtDate(d.issued), d.expires ? fmtDate(d.expires) : '—',
        d.expires ? until(d.expires) : '—', d.status]),
      summary: (rows) => [
        ['Documents', rows.length],
        ['Expired', rows.filter((r) => typeof r[8] === 'number' && r[8] < 0).length],
        ['Within 90 days', rows.filter((r) => typeof r[8] === 'number' && r[8] >= 0 && r[8] <= 90).length],
        ['Unverified', rows.filter((r) => r[9] !== 'Verified').length],
      ],
    }),
  },
  {
    id: 'asset', name: 'Asset register', icon: 'truck', tone: 'purple',
    desc: 'How each asset is held, what is owed on it and what it is worth.',
    build: ({ vehicles }) => ({
      cols: ['Plate', 'Fleet no.', 'VIN', 'Asset', 'Year', 'Site', 'Footing', 'Financier', 'Purchase price', 'Instalment', 'Residual', 'Contract ends'],
      rows: vehicles.map((v) => [v.plate, v.fleetNo, v.vin, v.make, v.year, siteName(v.site),
        v.finance?.kind, v.finance?.financier, v.finance?.purchase || 0, v.finance?.instalment || 0,
        v.finance?.kind === 'Owned outright' ? 0 : (v.finance?.residual || 0),
        v.finance?.kind === 'Owned outright' ? '—' : fmtDate(v.finance?.end)]),
      summary: (rows) => [
        ['Assets', rows.length],
        ['Under finance', rows.filter((r) => r[6] !== 'Owned outright').length],
        ['Monthly instalments', R(rows.reduce((a, r) => a + r[9], 0))],
        ['Residual exposure', R(rows.reduce((a, r) => a + r[10], 0))],
      ],
    }),
  },
  {
    id: 'inspection', name: 'Inspection report', icon: 'clipboard', tone: 'blue',
    desc: 'Every sheet captured in the period, with its outcome and sign-off state.',
    build: ({ inspections }) => ({
      cols: ['Ref', 'Captured', 'Vehicle', 'Operator', 'Site', 'Shift', 'In order', 'Go-but', 'No-go', 'Result', 'Sign-off'],
      rows: inspections.map((i) => [`#${i.ref}`, i.date, i.vehicle, i.op, siteName(i.site), i.shift, i.ok, i.go, i.ng,
        i.result === 'in-order' ? 'In order' : i.result === 'go-but' ? 'Go-but' : 'No-go', i.signed ? 'Signed' : 'Pending']),
      summary: (rows) => [
        ['Sheets captured', rows.length],
        ['Passed', rows.filter((r) => r[9] !== 'No-go').length],
        ['Grounded', rows.filter((r) => r[9] === 'No-go').length],
        ['Awaiting sign-off', rows.filter((r) => r[10] === 'Pending').length],
      ],
    }),
  },
  {
    id: 'compliance', name: 'Compliance report', icon: 'shield', tone: 'green',
    desc: 'Pass rate per company against the 90% target, with the trend behind it.',
    build: () => ({
      cols: ['Site', 'Users', 'Vehicles', 'Inspections', 'Pass rate', 'No-go', 'Trend', 'Status'],
      rows: SITE_PERF.map((p) => [p.site, p.users, p.vehicles, p.insp, `${p.pass}%`, p.ng,
        `${(p.trend[5] - p.trend[0]).toFixed(1)} pp`, p.pass >= 95 ? 'On track' : p.pass >= 90 ? 'Watch' : 'Below target']),
      summary: (rows) => [
        ['Sites', rows.length],
        ['Below target', rows.filter((r) => r[7] === 'Below target').length],
        ['Open no-go defects', rows.reduce((a, r) => a + r[5], 0)],
        ['Total inspections', nf(rows.reduce((a, r) => a + r[3], 0))],
      ],
    }),
  },
  {
    id: 'fleet', name: 'Fleet status report', icon: 'truck', tone: 'gold',
    desc: 'Assignment, odometer, service position and open defects per vehicle.',
    build: ({ vehicles, defects }) => ({
      cols: ['Plate', 'Fleet no.', 'Type', 'Make', 'Site', 'Operator', 'Odometer', 'To service', 'Open defects', 'Status'],
      rows: vehicles.map((v) => [v.plate, v.fleetNo, v.type, v.make, siteName(v.site), v.driver, nf(v.km),
        nf(v.serviceDue - v.km), defects.filter((d) => d.plate === v.plate && d.status !== 'Closed').length, v.status]),
      summary: (rows) => [
        ['Vehicles', rows.length],
        ['Assigned', rows.filter((r) => r[9] === 'Assigned').length],
        ['Grounded', rows.filter((r) => r[9] === 'Maintenance').length],
        ['Open defects', rows.reduce((a, r) => a + r[8], 0)],
      ],
    }),
  },
  {
    id: 'defects', name: 'Defect history', icon: 'alert', tone: 'red',
    desc: 'Every defect raised, its age against the 30-day rule and whether it is closed.',
    build: ({ defects }) => ({
      cols: ['Defect', 'Item', 'Section', 'Vehicle', 'Site', 'Severity', 'Raised by', 'Raised', 'Rectify by', 'Concession', 'Work order', 'Status'],
      rows: defects.map((d) => [d.id, d.item, d.section, d.plate, siteName(d.site), d.severity, d.raisedBy, d.raised, d.due,
        d.severity === 'No Go' ? 'n/a' : d.supervisorSigned ? 'Signed' : 'Unsigned', d.workOrder || '—', d.status]),
      summary: (rows) => [
        ['Defects', rows.length],
        ['Open', rows.filter((r) => r[11] !== 'Closed').length],
        ['No-go', rows.filter((r) => r[5] === 'No Go').length],
        ['Lapsed concessions', rows.filter((r) => r[11] === 'Overdue').length],
      ],
    }),
  },
  {
    id: 'users', name: 'User activity report', icon: 'users', tone: 'purple',
    desc: 'Who is on the platform, what they operate and how much they capture.',
    build: ({ users }) => ({
      cols: ['Name', 'Employee no.', 'Role', 'Site', 'Reports to', 'Vehicle', 'Inspections', 'Pass rate', 'Last active', 'Status'],
      rows: users.map((u) => [u.name, u.empNo, u.role, siteName(u.site), u.reports, u.vehicle, u.insps,
        u.passRate ? `${u.passRate}%` : '—', u.lastActive, u.status]),
      summary: (rows) => [
        ['Users', rows.length],
        ['Operators', rows.filter((r) => r[2] === 'Operator').length],
        ['Suspended', rows.filter((r) => r[9] === 'Suspended').length],
        ['Inspections captured', rows.reduce((a, r) => a + r[6], 0)],
      ],
    }),
  },
  {
    id: 'cof', name: 'COF expiry report', icon: 'cert', tone: 'teal',
    desc: 'Certificate of fitness expiry per operator and per vehicle.',
    build: ({ users, vehicles }) => ({
      cols: ['Holder', 'Kind', 'Site', 'Reference', 'Expires'],
      rows: [
        ...users.filter((u) => u.cof && u.cof !== 'N/A').map((u) => [u.name, 'Operator COF', siteName(u.site), u.empNo, u.cof]),
        ...vehicles.map((v) => [v.plate, 'Vehicle COF', siteName(v.site), v.fleetNo, v.cof]),
      ],
      summary: (rows) => [
        ['Certificates tracked', rows.length],
        ['Operator certificates', rows.filter((r) => r[1] === 'Operator COF').length],
        ['Vehicle certificates', rows.filter((r) => r[1] === 'Vehicle COF').length],
        ['Not captured', rows.filter((r) => r[4] === 'Not captured').length],
      ],
    }),
  },
  {
    id: 'workshop', name: 'Workshop report', icon: 'tool', tone: 'purple',
    desc: 'Work orders raised from defects, their state and the vehicle they hold.',
    build: ({ workOrders }) => ({
      cols: ['Work order', 'Vehicle', 'Site', 'Type', 'Opened', 'From defect', 'Assigned to', 'Status'],
      rows: workOrders.map((w) => [w.ref, w.vehicle, siteName(w.site), w.type, w.opened, w.defect || '—', w.assigned, w.status]),
      summary: (rows) => [
        ['Work orders', rows.length],
        ['Open', rows.filter((r) => r[7] !== 'Completed').length],
        ['Awaiting parts', rows.filter((r) => r[7] === 'Awaiting parts').length],
        ['From a defect', rows.filter((r) => r[5] !== '—').length],
      ],
    }),
  },
];

const csv = (cols, rows) =>
  [cols, ...rows].map((r) => r.map((c) => {
    const v = String(c ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\n');

function ReportView({ def, data, scope, period, onBack, flash, me }) {
  const built = def.build(data);
  const [hidden, setHidden] = useState([]);
  const [chooser, setChooser] = useState(false);

  /* Escape closes the chooser, like every other dismissible layer here */
  useEffect(() => {
    if (!chooser) return undefined;
    const onKey = (e) => e.key === 'Escape' && setChooser(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chooser]);

  const rows = scope === 'ALL' ? built.rows : built.rows.filter((r) => r.some((c) => String(c) === scope));
  const summary = built.summary(rows);
  const keep = built.cols.map((_, i) => i).filter((i) => !hidden.includes(i));
  const cols = keep.map((i) => built.cols[i]);
  const body = rows.map((r) => keep.map((i) => r[i]));

  const save = (asJson) => {
    const payload = asJson
      ? JSON.stringify({
        report: def.name, scope: scope === 'ALL' ? 'All sites' : scope, period,
        generated: new Date().toISOString(), generatedBy: me.name,
        summary: Object.fromEntries(summary), rows: body.map((r) => Object.fromEntries(r.map((c, i) => [cols[i], c]))),
      }, null, 2)
      : csv(cols, body);
    const blob = new Blob([payload], { type: asJson ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safenexus-${def.id}-${new Date().toISOString().slice(0, 10)}.${asJson ? 'json' : 'csv'}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    flash(`${body.length} row(s) written to ${asJson ? 'JSON' : 'CSV'}.`, { title: 'Export complete' });
  };

  return (
    <>
      <div className="cmdstrip solo">
        <Btn small icon={ArrowLeft} onClick={onBack}>All reports</Btn>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{def.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {scope === 'ALL' ? 'all sites' : scope} · {period} · generated by {me.name} at{' '}
          {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="count" style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <Btn small icon={Columns3} onClick={() => setChooser(!chooser)}>Columns</Btn>
          <Btn small icon={Download} onClick={() => save(false)}>Export CSV</Btn>
          <Btn small icon={FileJson} onClick={() => save(true)}>JSON</Btn>
          <Btn small icon={Printer} onClick={() => window.print()}>Print</Btn>
          {chooser && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setChooser(false)} />
              <div className="col-chooser">
                <div className="sec-head" style={{ margin: '0 0 6px' }}>Columns</div>
                {built.cols.map((c, i) => (
                  <label key={c} className="auth-row" style={{ padding: '3px 0' }}>
                    <input type="checkbox" checked={!hidden.includes(i)}
                      onChange={() => setHidden((h) => (h.includes(i) ? h.filter((x) => x !== i) : [...h, i]))} />
                    {c}
                  </label>
                ))}
                <Btn small onClick={() => setHidden([])}>Show all</Btn>
              </div>
            </>
          )}
        </span>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: `repeat(${summary.length}, 1fr)` }}>
        {summary.map(([l, v]) => (
          <div className="kpi" key={l}>
            <div className="kpi-lbl">{l}</div>
            <div className="kpi-row"><span className="kpi-val">{v}</span></div>
          </div>
        ))}
      </div>

      <Panel title={def.name} note={`${body.length} row${body.length === 1 ? '' : 's'}${hidden.length ? ` · ${hidden.length} column(s) hidden` : ''}`} flush
        right={<Badge tone="grey">SafeNexus · {new Date().toLocaleDateString('en-GB')}</Badge>}>
        <div className="gridwrap">
          <table className="grid">
            <thead><tr>{cols.map((c, i) => <th key={c} className={i > 4 ? 'num' : ''}>{c}</th>)}</tr></thead>
            <tbody>
              {body.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className={j > 4 ? 'num' : ''}>{String(c)}</td>)}</tr>
              ))}
              {!body.length && <tr><td colSpan={cols.length} style={{ padding: 30, textAlign: 'center', color: 'var(--text3)' }}>Nothing matches this scope.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export default function Reports({ run }) {
  const store = useStore();
  const { reportRuns, schedules, dispatch, me, flash } = store;
  const [open, setOpen] = useState(null);
  const [scope, setScope] = useState('ALL');
  const [period, setPeriod] = useState('June 2026');
  const def = DEFS.find((d) => d.id === open);

  const generate = (d) => {
    setOpen(d.id);
    const rows = d.build(store).rows;
    const n = scope === 'ALL' ? rows.length : rows.filter((r) => r.some((c) => String(c) === scope)).length;
    dispatch({
      type: 'RECORD_RUN', by: me.name,
      run: {
        id: 'RUN-' + Math.floor(4472 + Math.random() * 400),
        report: d.name, scope: scope === 'ALL' ? 'All sites' : scope, period,
        by: me.name, at: 'Just now', rows: n, format: 'On screen', status: 'Complete',
      },
    });
  };

  if (def) {
    return (
      <ReportView def={def} data={store} scope={scope} period={period} onBack={() => setOpen(null)}
        flash={flash} me={me} />
    );
  }

  return (
    <>
      <div className="cmdstrip solo">
        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Scope</span>
        <Seg value={scope} onChange={setScope} options={[
          { v: 'ALL', l: 'All sites' },
          ...SITE_PERF.map((c) => ({ v: c.site, l: c.site.split(' ')[0] })),
        ]} />
        <span style={{ fontSize: 12.5, color: 'var(--text2)', marginLeft: 6 }}>Period</span>
        <select className="inp" style={{ width: 168 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
          {['June 2026', 'May 2026', 'Q2 2026', 'Year to date', 'Last 12 months'].map((o) => <option key={o}>{o}</option>)}
        </select>
        <span className="count">built from live records</span>
      </div>

      <div className="grid-3">
        {DEFS.map((d) => {
          const Icon = ICONS[d.icon];
          const bg = d.tone === 'blue' ? 'var(--sel)' : `var(--${d.tone}-bg)`;
          const fg = d.tone === 'blue' ? 'var(--brand)' : `var(--${d.tone})`;
          const n = d.build(store).rows.length;
          return (
            <div className="chart-card" style={{ marginBottom: 0, cursor: 'pointer' }} key={d.id} onClick={() => generate(d)}>
              <div className="chart-body">
                <div className="tile-ico" style={{ background: bg, marginBottom: 9 }}>
                  <Icon size={15} strokeWidth={1.8} color={fg} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, lineHeight: 1.45 }}>{d.desc}</div>
              </div>
              <div style={{ padding: '8px 12px', borderTop: '1px solid var(--stroke-soft)', background: 'var(--pane)', fontSize: 12, color: 'var(--brand-dark)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Generate →</span><span style={{ color: 'var(--text3)' }}>{n} row{n === 1 ? '' : 's'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        <Panel title="Scheduled reports" note="delivered without anyone asking" flush>
          <div className="gridwrap">
            <table className="grid">
              <thead><tr><th>Report</th><th>Cadence</th><th>Recipients</th><th>Next run</th><th>State</th><th /></tr></thead>
              <tbody>
                {schedules.map((sc) => (
                  <tr key={sc.id}>
                    <td style={{ fontWeight: 600 }}>{sc.report}<div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{sc.scope}</div></td>
                    <td style={{ color: 'var(--text2)' }}>{sc.cadence}</td>
                    <td style={{ color: 'var(--text2)' }}>{sc.to}</td>
                    <td style={{ color: 'var(--text3)' }}>{sc.next}</td>
                    <td>{sc.on ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Paused</Badge>}</td>
                    <td>
                      <Btn small icon={sc.on ? PauseCircle : PlayCircle}
                        onClick={() => {
                          dispatch({ type: 'TOGGLE_SCHEDULE', id: sc.id, by: me.name });
                          flash(`${sc.report} schedule ${sc.on ? 'paused' : 'resumed'}.`, { tone: sc.on ? 'warn' : 'ok' });
                        }}>
                        {sc.on ? 'Pause' : 'Resume'}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid-foot">
            <span>Schedules run in the platform timezone</span>
            <span className="pager"><Btn small icon={Mail} onClick={() => run('schedule')}>New schedule</Btn></span>
          </div>
        </Panel>

        <Panel title="Run history" note="who generated what, and when" flush>
          <div className="gridwrap">
            <table className="grid">
              <thead><tr><th>Run</th><th>Report</th><th>Scope</th><th>By</th><th className="num">Rows</th><th>When</th><th>State</th></tr></thead>
              <tbody>
                {reportRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="mono" style={{ fontSize: 11.5 }}>{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.report}</td>
                    <td style={{ color: 'var(--text2)' }}>{r.scope}</td>
                    <td style={{ color: 'var(--text2)' }}>{r.by}</td>
                    <td className="num">{r.rows}</td>
                    <td style={{ color: 'var(--text3)' }}>{r.at}</td>
                    <td><Badge tone="green">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

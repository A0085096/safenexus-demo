import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck, ShieldCheck, Truck, Users as UsersIcon, AlertTriangle, BadgeCheck,
  Download, Printer, ArrowLeft, FileText, GraduationCap,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { SERIES, nf } from '../theme.js';
import { Panel, Btn, Badge, ChartCard, Seg, KV, SecHead } from '../components/ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';
import { PERF } from '../data.js';

const ICONS = {
  clipboard: ClipboardCheck, shield: ShieldCheck, truck: Truck,
  users: UsersIcon, alert: AlertTriangle, cert: BadgeCheck, learn: GraduationCap,
};

/* ══════════════════════════════════════════════════════════════
   Reports build from the live store and render as a document you
   can read on screen, export as CSV or print — rather than a
   message claiming a PDF was produced somewhere.
   ══════════════════════════════════════════════════════════════ */
const DEFS = [
  {
    id: 'inspection', name: 'Inspection report', icon: 'clipboard', tone: 'blue',
    desc: 'Every sheet captured in the period, with its outcome and sign-off state.',
    build: ({ inspections }) => ({
      cols: ['Ref', 'Captured', 'Vehicle', 'Operator', 'Company', 'Shift', 'In order', 'Go-but', 'No-go', 'Result', 'Sign-off'],
      rows: inspections.map((i) => [`#${i.ref}`, i.date, i.vehicle, i.op, i.co, i.shift, i.ok, i.go, i.ng,
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
      cols: ['Company', 'Plan', 'Users', 'Vehicles', 'Inspections', 'Pass rate', 'No-go', 'Trend', 'Status'],
      rows: PERF.map((p) => [p.co, p.plan, p.users, p.vehicles, p.insp, `${p.pass}%`, p.ng,
        `${(p.trend[5] - p.trend[0]).toFixed(1)} pp`, p.pass >= 95 ? 'On track' : p.pass >= 90 ? 'Watch' : 'Below target']),
      summary: (rows) => [
        ['Companies', rows.length],
        ['Below the 90% target', rows.filter((r) => r[8] === 'Below target').length],
        ['Open no-go defects', rows.reduce((a, r) => a + r[6], 0)],
        ['Total inspections', nf(rows.reduce((a, r) => a + r[4], 0))],
      ],
    }),
  },
  {
    id: 'fleet', name: 'Fleet status report', icon: 'truck', tone: 'gold',
    desc: 'Assignment, odometer, service position and open defects per vehicle.',
    build: ({ vehicles, defects }) => ({
      cols: ['Plate', 'Fleet no.', 'Type', 'Make', 'Company', 'Operator', 'Odometer', 'To service', 'Open defects', 'Status'],
      rows: vehicles.map((v) => [v.plate, v.fleetNo, v.type, v.make, v.co, v.driver, nf(v.km),
        nf(v.serviceDue - v.km), defects.filter((d) => d.plate === v.plate && d.status === 'Open').length, v.status]),
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
      cols: ['Defect', 'Item', 'Vehicle', 'Company', 'Severity', 'Raised', 'Age (days)', 'Status', 'From inspection'],
      rows: defects.map((d) => [d.id, d.item, d.plate, d.co, d.severity, d.raised, d.age, d.status, `#${d.inspection}`]),
      summary: (rows) => [
        ['Defects', rows.length],
        ['Open', rows.filter((r) => r[7] === 'Open').length],
        ['No-go', rows.filter((r) => r[4] === 'No Go').length],
        ['Past the 30-day rule', rows.filter((r) => r[6] > 30 && r[7] === 'Open').length],
      ],
    }),
  },
  {
    id: 'users', name: 'User activity report', icon: 'users', tone: 'purple',
    desc: 'Who is on the platform, what they operate and how much they capture.',
    build: ({ users }) => ({
      cols: ['Name', 'Employee no.', 'Role', 'Company', 'Reports to', 'Vehicle', 'Inspections', 'Pass rate', 'Last active', 'Status'],
      rows: users.map((u) => [u.name, u.empNo, u.role, u.co, u.reports, u.vehicle, u.insps,
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
      cols: ['Holder', 'Kind', 'Company', 'Reference', 'Expires'],
      rows: [
        ...users.filter((u) => u.cof && u.cof !== 'N/A').map((u) => [u.name, 'Operator COF', u.co, u.empNo, u.cof]),
        ...vehicles.map((v) => [v.plate, 'Vehicle COF', v.co, v.fleetNo, v.cof]),
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
    id: 'training', name: 'Training matrix', icon: 'learn', tone: 'blue',
    desc: 'Competency per person and course, with what has lapsed.',
    build: ({ enrolments, courses, users }) => ({
      cols: ['Person', 'Role', 'Course', 'Category', 'Required', 'Completed', 'Valid until', 'Score', 'Status'],
      rows: enrolments.map((e) => {
        const c = courses.find((x) => x.id === e.course);
        const u = users.find((x) => x.name === e.user);
        return [e.user, u?.role || '—', c?.name || e.course, c?.cat || '—', c?.required ? 'Yes' : 'No',
          e.done || '—', e.expires || '—', e.score != null ? `${e.score}%` : `${e.progress || 0}% done`, e.status];
      }),
      summary: (rows) => [
        ['Records', rows.length],
        ['Valid', rows.filter((r) => r[8] === 'Valid').length],
        ['Expiring', rows.filter((r) => r[8] === 'Expiring').length],
        ['Expired', rows.filter((r) => r[8] === 'Expired').length],
      ],
    }),
  },
];

const csv = (cols, rows) =>
  [cols, ...rows].map((r) => r.map((c) => {
    const v = String(c ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\n');

function ReportView({ def, data, scope, onBack, flash }) {
  const built = def.build(data);
  const rows = scope === 'ALL' ? built.rows
    : built.rows.filter((r) => r.some((c) => String(c) === scope));
  const summary = built.summary(rows);

  const download = () => {
    const blob = new Blob([csv(built.cols, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safenexus-${def.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);        /* Chromium ignores a click on a detached anchor */
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    flash(`${rows.length} row(s) exported to CSV.`, { title: 'Export complete' });
  };

  return (
    <>
      <div className="cmdstrip solo">
        <Btn small icon={ArrowLeft} onClick={onBack}>All reports</Btn>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{def.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {scope === 'ALL' ? 'all companies' : scope} · June 2026 · generated {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="count" style={{ display: 'flex', gap: 8 }}>
          <Btn small icon={Download} onClick={download}>Export CSV</Btn>
          <Btn small icon={Printer} onClick={() => window.print()}>Print</Btn>
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

      <Panel title={def.name} note={`${rows.length} row${rows.length === 1 ? '' : 's'}`} flush
        right={<Badge tone="grey">SafeNexus · {new Date().toLocaleDateString('en-GB')}</Badge>}>
        <div className="gridwrap">
          <table className="grid">
            <thead><tr>{built.cols.map((c, i) => <th key={c} className={i > 4 ? 'num' : ''}>{c}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className={j > 4 ? 'num' : ''}>{String(c)}</td>)}</tr>
              ))}
              {!rows.length && <tr><td colSpan={built.cols.length} style={{ padding: 30, textAlign: 'center', color: 'var(--text3)' }}>Nothing matches this scope.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export default function Reports({ run }) {
  const store = useStore();
  const [open, setOpen] = useState(null);
  const [scope, setScope] = useState('ALL');
  const def = DEFS.find((d) => d.id === open);

  if (def) {
    return (
      <ReportView def={def} data={store} scope={scope} onBack={() => setOpen(null)} flash={store.flash} />
    );
  }

  return (
    <>
      <div className="cmdstrip solo">
        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Scope</span>
        <Seg value={scope} onChange={setScope} options={[
          { v: 'ALL', l: 'All companies' },
          ...store.companies.slice(0, 3).map((c) => ({ v: c.name, l: c.name.split(' ')[0] })),
        ]} />
        <span className="count">June 2026 · built from live records</span>
      </div>
      <div className="grid-3">
        {DEFS.map((d) => {
          const Icon = ICONS[d.icon];
          const bg = d.tone === 'blue' ? 'var(--sel)' : `var(--${d.tone}-bg)`;
          const fg = d.tone === 'blue' ? 'var(--brand)' : `var(--${d.tone})`;
          const n = d.build(store).rows.length;
          return (
            <div className="chart-card" style={{ marginBottom: 0, cursor: 'pointer' }} key={d.id} onClick={() => setOpen(d.id)}>
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
    </>
  );
}

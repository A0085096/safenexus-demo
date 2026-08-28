import React, { useMemo } from 'react';
import {
  ShieldCheck, Truck, User, AlertTriangle, BadgeCheck, CalendarClock, CircleAlert,
  Wrench, Clock, Upload, CalendarPlus, Mail,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Expiry, Breakdown, Bar, dayTone } from '../components/erpUi.jsx';
import { until, fmtDate, num, meterUnit } from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Compliance.

   Three questions, and the answer to any one of them can stop a
   vehicle moving: is the machine legal, is the person driving it
   legal, and is anything running on a concession that has quietly
   run out. Everything is read as days remaining rather than as a
   date, because a date means nothing without today in your head.
   ══════════════════════════════════════════════════════════════ */

/* the certificates a vehicle must hold, and the ones a person must */
const VEHICLE_ITEMS = [
  ['Licence disc', 'licenceExpiry'],
  ['Certificate of fitness', 'cofExpiry'],
  ['Insurance', 'insuranceExpiry'],
];
const PERSON_ITEMS = [
  ['Driving licence', 'licenceExpiry'],
  ['Operating card (PrDP)', 'prdpExpiry'],
  ['Medical certificate', 'medicalExpiry'],
  ['Dangerous goods', 'dgTraining'],
];

/* a record is only as compliant as its worst certificate */
const worst = (record, items) => items
  .map(([, field]) => record[field])
  .filter(Boolean)
  .reduce((a, d) => Math.min(a, until(d)), 99999);

export default function Compliance({ run, goTab }) {
  const {
    defects, vehicles, users, settings, select, subView, setView,
  } = useStore();
  const view = subView.compliance || 'vehicles';

  const open = defects.filter((d) => d.status !== 'Closed');
  const noGo = open.filter((d) => d.severity === 'No Go');
  const lapsed = open.filter((d) => d.status === 'Overdue');
  const unsigned = open.filter((d) => d.severity === 'Go But' && !d.supervisorSigned);
  const grounded = vehicles.filter((v) => v.status === 'Maintenance');

  const vehExpired = vehicles.filter((v) => worst(v, VEHICLE_ITEMS) < 0);
  const opExpired = users.filter((u) => worst(u, PERSON_ITEMS) < 0);
  const warn = settings.cofWarnDays;
  const vehSoon = vehicles.filter((v) => {
    const d = worst(v, VEHICLE_ITEMS);
    return d >= 0 && d <= warn;
  });

  /* the whole point of the tab in one number: how much of the fleet
     is legal to dispatch right now */
  const clear = vehicles.filter((v) => worst(v, VEHICLE_ITEMS) >= 0 && v.status !== 'Maintenance').length;
  const rate = vehicles.length ? (clear / vehicles.length) * 100 : 0;

  const kpis = (
    <Kpis items={[
      { l: 'Fit to dispatch', v: rate.toFixed(0), unit: '%', icon: ShieldCheck,
        dir: rate >= settings.complianceTarget ? 'up' : 'dn',
        delta: `${clear} of ${vehicles.length}`,
        note: `target ${settings.complianceTarget}% · certificates in force and not grounded` },
      { l: 'Vehicles not legal', v: vehExpired.length, icon: Truck,
        dir: vehExpired.length ? 'dn' : 'up',
        delta: `${vehSoon.length} inside ${warn} days`,
        note: 'a lapsed certificate blocks dispatch outright' },
      { l: 'Operators not cleared', v: opExpired.length, icon: User,
        dir: opExpired.length ? 'dn' : 'up',
        note: 'licence, operating card or medical lapsed' },
      { l: 'Lapsed concessions', v: lapsed.length, icon: Clock,
        dir: lapsed.length ? 'dn' : 'up',
        delta: `${unsigned.length} unsigned`,
        note: 'a vehicle on a lapsed go-but is no better than an uninspected one' },
    ]} />
  );

  const switcher = (
    <Seg value={view} onChange={(v) => setView('compliance', v)} options={[
      { v: 'vehicles', l: `Vehicles (${vehExpired.length} lapsed)`, icon: Truck },
      { v: 'operators', l: `Operators (${opExpired.length} lapsed)`, icon: User },
      { v: 'defects', l: `Concessions (${open.length} open)`, icon: CircleAlert },
    ]} />
  );

  /* ── vehicle certificates ─────────────────────────────────── */
  if (view === 'vehicles') {
    const cols = [
      { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
      { key: 'f', label: 'Asset', wrap: true, value: (r) => r.fleetNo, render: (r) => (
        <div><div style={{ fontWeight: 600 }}>{r.fleetNo}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.year} {r.make}</div></div>
      ) },
      { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
      ...VEHICLE_ITEMS.map(([label, field]) => ({
        key: field, label, num: true, value: (r) => until(r[field]),
        render: (r) => <Expiry date={r[field]} showDate={false} />,
      })),
      { key: 'sv', label: 'Service due in', num: true, value: (r) => r.serviceDue - r.km, render: (r) => {
        const left = r.serviceDue - r.km;
        return (
          <span style={{ fontFamily: 'var(--num)', fontWeight: left < 0 ? 600 : 400, color: left < 0 ? 'var(--red)' : left < settings.serviceWarnKm ? 'var(--gold)' : 'var(--text)' }}>
            {left < 0 ? `${num(-left)} over` : num(left)} {meterUnit(r)}
          </span>
        );
      } },
      { key: 'st', label: 'Vehicle status', value: (r) => r.status,
        render: (r) => <Badge tone={r.status === 'Maintenance' ? 'red' : r.status === 'Assigned' ? 'green' : 'gold'}>{r.status}</Badge> },
      { key: 'ok', label: 'May be dispatched', value: (r) => worst(r, VEHICLE_ITEMS),
        render: (r) => {
          const d = worst(r, VEHICLE_ITEMS);
          if (r.status === 'Maintenance') return <Badge tone="red">Grounded</Badge>;
          if (d < 0) return <Badge tone="red">Not legal</Badge>;
          if (d <= warn) return <Badge tone="gold">Renew within {d}d</Badge>;
          return <Badge tone="green">Clear</Badge>;
        } },
    ];

    return (
      <>
        {kpis}
        {vehExpired.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <AlertTriangle size={15} strokeWidth={1.8} />
            <span>
              <b>{vehExpired.map((v) => v.plate).slice(0, 4).join(', ')}
              {vehExpired.length > 4 ? ` and ${vehExpired.length - 4} more` : ''}</b> {vehExpired.length === 1 ? 'is' : 'are'} carrying
              a lapsed certificate. The nightly expiry check flags them and dispatch will not plan a job on
              them — renewing is the only way off this list.
            </span>
          </div>
        )}
        <DataGrid cols={cols} rows={[...vehicles].sort((a, b) => worst(a, VEHICLE_ITEMS) - worst(b, VEHICLE_ITEMS))}
          keyOf={(r) => r.plate} pageSize={20}
          selected={undefined} onSelect={(k) => { select('vehicle', k); }}
          rowClass={(r) => (worst(r, VEHICLE_ITEMS) < 0 ? 'overdue' : '')}
          toolbar={
            <>
              {switcher}
              <Btn small primary icon={CalendarPlus} onClick={() => run('bookRenewal')}>Book a renewal</Btn>
              <Btn small icon={Upload} onClick={() => run('goto:documents')}>Documents</Btn>
            </>
          } />
      </>
    );
  }

  /* ── operator certificates ────────────────────────────────── */
  if (view === 'operators') {
    const people = users.filter((u) => u.role === 'Operator' || u.role === 'Supervisor');
    const cols = [
      { key: 'n', label: 'Person', value: (r) => r.name, render: (r) => (
        <div><div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.empNo} · {r.role}</div></div>
      ) },
      { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
      { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
      ...PERSON_ITEMS.map(([label, field]) => ({
        key: field, label, num: true, value: (r) => (r[field] ? until(r[field]) : 99999),
        render: (r) => (r[field] ? <Expiry date={r[field]} showDate={false} /> : <span style={{ color: 'var(--text3)' }}>n/a</span>),
      })),
      { key: 'c', label: 'Competencies', num: true, value: (r) => r.competencies?.length || 0, render: (r) => {
        const expired = (r.competencies || []).filter((c) => until(c.expires) < 0).length;
        return expired
          ? <Badge tone="red">{expired} of {r.competencies.length} lapsed</Badge>
          : <span style={{ color: 'var(--text2)' }}>{r.competencies?.length || 0} current</span>;
      } },
      { key: 'ok', label: 'May be rostered', value: (r) => worst(r, PERSON_ITEMS),
        render: (r) => {
          const d = worst(r, PERSON_ITEMS);
          if (r.status === 'Suspended') return <Badge tone="red">Suspended</Badge>;
          if (d < 0) return <Badge tone="red">Not cleared</Badge>;
          if (d <= 30) return <Badge tone="gold">Renew within {d}d</Badge>;
          return <Badge tone="green">Clear</Badge>;
        } },
    ];

    return (
      <>
        {kpis}
        {opExpired.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <BadgeCheck size={15} strokeWidth={1.8} />
            <span>
              <b>{opExpired.length} {opExpired.length === 1 ? 'person has' : 'people have'}</b> a lapsed licence,
              operating card or medical. An operator in that position may not be rostered, and the pre-use sheet
              they sign carries a declaration they are no longer entitled to make.
            </span>
          </div>
        )}
        <DataGrid cols={cols} rows={[...people].sort((a, b) => worst(a, PERSON_ITEMS) - worst(b, PERSON_ITEMS))}
          keyOf={(r) => r.name} pageSize={20}
          onSelect={(k) => select('user', k)}
          rowClass={(r) => (worst(r, PERSON_ITEMS) < 0 ? 'overdue' : '')}
          toolbar={
            <>
              {switcher}
              <Btn small primary icon={Mail} onClick={() => run('email')}>Notify the holder</Btn>
              <Btn small icon={Upload} onClick={() => run('goto:documents')}>Documents</Btn>
            </>
          } />
      </>
    );
  }

  /* ── concessions and defects ──────────────────────────────── */
  const cols = [
    { key: 'id', label: 'Defect', mono: true, value: (r) => r.id, render: (r) => r.id },
    { key: 'i', label: 'Item', wrap: true, value: (r) => r.item, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.item}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.section}</div></div>
    ) },
    { key: 'p', label: 'Vehicle', mono: true, value: (r) => r.plate, render: (r) => r.plate },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'sev', label: 'Severity', value: (r) => r.severity,
      render: (r) => <Badge tone={r.severity === 'No Go' ? 'red' : 'gold'}>{r.severity}</Badge> },
    { key: 'r', label: 'Raised', value: (r) => r.raised, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.raised}</span> },
    { key: 'd', label: 'Rectify by', value: (r) => r.due,
      render: (r) => <span style={{ color: r.status === 'Overdue' ? 'var(--red)' : 'var(--text2)', fontWeight: r.status === 'Overdue' ? 600 : 400 }}>{r.due}</span> },
    { key: 'c', label: 'Concession', value: (r) => (r.supervisorSigned ? 'Signed' : 'Unsigned'),
      render: (r) => (r.severity === 'No Go'
        ? <span style={{ color: 'var(--text3)' }}>n/a</span>
        : r.supervisorSigned ? <Badge tone="green">Signed</Badge> : <Badge tone="red">Unsigned</Badge>) },
    { key: 'w', label: 'Work order', value: (r) => r.workOrder || '',
      render: (r) => (r.workOrder
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openWO:' + r.workOrder); }}>{r.workOrder}</button>
        : <span style={{ color: 'var(--text3)' }}>not raised</span>) },
    { key: 'st', label: 'Status', value: (r) => r.status,
      render: (r) => <Badge tone={r.status === 'Overdue' ? 'red' : 'blue'}>{r.status}</Badge> },
  ];

  return (
    <>
      {kpis}
      {(lapsed.length > 0 || unsigned.length > 0) && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <CircleAlert size={15} strokeWidth={1.8} />
          <span>
            {lapsed.length > 0 && <><b>{lapsed.length} concession{lapsed.length === 1 ? '' : 's'}</b> passed the {settings.goButMaxDays}-day
            repair window without the work being done. </>}
            {unsigned.length > 0 && <><b>{unsigned.length}</b> {unsigned.length === 1 ? 'is' : 'are'} running without
            a supervisor’s signature. </>}
            Either way the vehicle is operating on a go-but that nothing supports, which is no better than
            operating with no inspection at all.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={open} keyOf={(r) => r.id} totalLabel={defects.length}
        onSelect={(k) => run('openDefect:' + k)}
        rowClass={(r) => (r.status === 'Overdue' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Wrench} onClick={() => run('raiseWO')}>Raise a work order</Btn>
            <Btn small icon={Clock} onClick={() => run('lapsedConcessions')}>Lapsed only</Btn>
          </>
        }
        emptyText="No defect is open. Every vehicle is running on a clean sheet." />
      <div className="grid-2">
        <Panel title="Certificates falling due" note={`by site, within ${warn} days`} flush>
          <Breakdown rows={['PIT', 'STL', 'HO'].map((k, i) => ({
            k: siteName(k), c: SERIES[i],
            v: vehicles.filter((v) => v.site === k && worst(v, VEHICLE_ITEMS) <= warn).length,
          }))} />
        </Panel>
        <Panel title="Grounded vehicles" note={`${grounded.length} off road`} flush>
          <Breakdown rows={['PIT', 'STL', 'HO'].map((k, i) => ({
            k: siteName(k), c: SERIES[4],
            v: grounded.filter((v) => v.site === k).length,
          }))} />
        </Panel>
      </div>
    </>
  );
}

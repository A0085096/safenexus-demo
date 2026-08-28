import React, { useMemo } from 'react';
import {
  Receipt, Plus, Banknote, Clock, Printer, Mail, CircleDollarSign, Users,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES, SEQ } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar, Expiry } from '../components/erpUi.jsx';
import {
  R, num, fmtShort, until, invNet, invTotal, invPaid, invDue, invState,
} from '../erp/seed.js';

const invTone = (s) => ({ Paid: 'green', 'Part paid': 'teal', Issued: 'blue', Overdue: 'red' }[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Billing.

   A delivered job is not revenue until it is invoiced, and an
   invoice is not money until it is paid. The aging profile is the
   real reading here: everything past sixty days is a conversation
   somebody has to have, and the longer it sits the less of it
   comes back.
   ══════════════════════════════════════════════════════════════ */
export default function Billing({ run, openDialog }) {
  const { invoices, jobs, selection, select, subView, setView } = useStore();
  const view = subView.billing || 'register';

  const outstanding = invoices.reduce((a, i) => a + invDue(i), 0);
  const overdue = invoices.filter((i) => invState(i) === 'Overdue');
  const billed = invoices.reduce((a, i) => a + invTotal(i), 0);
  const uninvoiced = jobs.filter((j) => j.status === 'Delivered' && !j.invoice);
  const uninvoicedValue = uninvoiced.reduce((a, j) => a + j.revenue, 0);

  const cols = [
    { key: 'ref', label: 'Invoice', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'c', label: 'Customer', wrap: true, value: (r) => r.customer, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.customer}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.contact}</div></div>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'j', label: 'Jobs', num: true, value: (r) => r.jobs.length, render: (r) => r.jobs.length },
    { key: 'd', label: 'Dated', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.date)}</span> },
    { key: 'du', label: 'Due', num: true, value: (r) => r.due,
      render: (r) => (invDue(r) <= 0 ? <span style={{ color: 'var(--text3)' }}>settled</span> : <Expiry date={r.due} showDate={false} />) },
    { key: 'n', label: 'Net', num: true, value: (r) => invNet(r), render: (r) => <span style={{ fontFamily: 'var(--num)', color: 'var(--text2)' }}>{R(invNet(r))}</span> },
    { key: 'vat', label: 'VAT', num: true, value: (r) => r.vat, render: (r) => r.vat + '%' },
    { key: 't', label: 'Total', num: true, value: (r) => invTotal(r), render: (r) => <Money v={invTotal(r)} bold /> },
    { key: 'p', label: 'Received', num: true, value: (r) => invPaid(r),
      render: (r) => (invPaid(r) ? <Money v={invPaid(r)} tone="good" /> : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'o', label: 'Outstanding', num: true, value: (r) => invDue(r),
      render: (r) => (invDue(r) ? <Money v={invDue(r)} tone={invState(r) === 'Overdue' ? 'bad' : undefined} bold /> : <span style={{ color: 'var(--green)' }}>settled</span>) },
    { key: 'st', label: 'Status', value: (r) => invState(r), render: (r) => <Badge tone={invTone(invState(r))}>{invState(r)}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('billing', v)} options={[
      { v: 'register', l: `Invoices (${invoices.length})`, icon: Receipt },
      { v: 'aging', l: 'Aging and customers', icon: Clock },
      { v: 'unbilled', l: `Ready to bill (${uninvoiced.length})`, icon: CircleDollarSign },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Invoiced', v: R(billed).replace('R ', ''), unit: 'R', icon: Receipt,
        note: `${invoices.length} invoices raised this period` },
      { l: 'Outstanding', v: R(outstanding).replace('R ', ''), unit: 'R', icon: Banknote,
        dir: outstanding > billed * 0.4 ? 'dn' : 'flat',
        note: `${((invoices.reduce((a, i) => a + invPaid(i), 0) / (billed || 1)) * 100).toFixed(0)}% of the book collected` },
      { l: 'Overdue', v: overdue.length, icon: Clock,
        dir: overdue.length ? 'dn' : 'up',
        delta: overdue.length ? R(overdue.reduce((a, i) => a + invDue(i), 0)) : 'nothing past its date',
        note: 'past the 30-day term' },
      { l: 'Delivered, not billed', v: uninvoiced.length, icon: CircleDollarSign,
        dir: uninvoiced.length ? 'warn' : 'up',
        delta: R(uninvoicedValue),
        note: 'revenue earned and not yet raised' },
    ]} />
  );

  if (view === 'aging') return <><>{kpis}</><Aging invoices={invoices} switcher={switcher} /></>;

  if (view === 'unbilled') {
    const jobCols = [
      { key: 'r', label: 'Job', mono: true, value: (r) => r.ref, render: (r) => r.ref },
      { key: 'c', label: 'Customer', value: (r) => r.customer, render: (r) => <span style={{ fontWeight: 600 }}>{r.customer}</span> },
      { key: 'l', label: 'Lane', wrap: true, value: (r) => r.destination, render: (r) => `${r.origin} → ${r.destination}` },
      { key: 'v', label: 'Vehicle', mono: true, value: (r) => r.vehicle, render: (r) => r.vehicle },
      { key: 'd', label: 'Delivered', value: (r) => r.depart, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.depart)}</span> },
      { key: 'km', label: 'Km', num: true, value: (r) => r.distance, render: (r) => num(r.distance) },
      { key: 'pod', label: 'POD', value: (r) => (r.pod ? 'In' : 'Out'),
        render: (r) => (r.pod ? <Badge tone="green">In</Badge> : <Badge tone="red">Missing</Badge>) },
      { key: 'rev', label: 'Value', num: true, value: (r) => r.revenue, render: (r) => <Money v={r.revenue} bold /> },
    ];
    const noPod = uninvoiced.filter((j) => !j.pod);
    return (
      <>
        {kpis}
        {noPod.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <Clock size={15} strokeWidth={1.8} />
            <span>
              <b>{noPod.length}</b> of these {uninvoiced.length} jobs have no proof of delivery.
              Billing is blocked until one is uploaded — the customer will ask for it, and 24 hours after
              delivery is the deadline the dispatch rules set.
            </span>
          </div>
        )}
        <DataGrid cols={jobCols} rows={uninvoiced} keyOf={(r) => r.ref}
          selected={selection.job} onSelect={(k) => select('job', k)}
          rowClass={(r) => (r.pod ? '' : 'overdue')}
          toolbar={
            <>
              {switcher}
              <Btn small primary icon={Plus} onClick={() => openDialog('invoice')}>Raise an invoice</Btn>
            </>
          }
          emptyText="Every delivered job has been invoiced."
          totals={(list) => (
            <>
              <td colSpan={7} style={{ fontWeight: 600 }}>{list.length} jobs ready to bill</td>
              <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.revenue, 0))}</td>
            </>
          )} />
      </>
    );
  }

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={invoices} keyOf={(r) => r.ref}
        selected={selection.invoice} onSelect={(k) => select('invoice', k)}
        rowClass={(r) => (invState(r) === 'Overdue' ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('invoice')}>Raise an invoice</Btn>
            <Btn small icon={Banknote} onClick={() => run('recordPayment')}>Receipt a payment</Btn>
            <Btn small icon={Printer} onClick={() => run('print')}>Print</Btn>
            <Btn small icon={Mail} onClick={() => run('email')}>Email</Btn>
          </>
        }
        totals={(list) => (
          <>
            <td colSpan={6} style={{ fontWeight: 600 }}>{list.length} invoices</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + invNet(r), 0))}</td>
            <td />
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + invTotal(r), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + invPaid(r), 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + invDue(r), 0))}</td>
            <td />
          </>
        )} />
    </>
  );
}

/* ── aging ──────────────────────────────────────────────────────
   Four buckets, on the sequential ramp, because they are ordered
   bins rather than categories — and one breach colour for the
   bucket that is past every reasonable term. */
function Aging({ invoices, switcher }) {
  const bins = useMemo(() => {
    const b = [
      { b: 'Current', v: 0, c: SEQ[1] },
      { b: '1–30 days', v: 0, c: SEQ[2] },
      { b: '31–60 days', v: 0, c: SEQ[3] },
      { b: '61–90 days', v: 0, c: SEQ[4] },
      { b: 'Over 90 days', v: 0, c: '#C33B3B' },
    ];
    invoices.forEach((i) => {
      const due = invDue(i);
      if (due <= 0) return;
      const late = -until(i.due);
      const n = late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4;
      b[n].v += due;
    });
    return b;
  }, [invoices]);

  const customers = useMemo(() => {
    const by = {};
    invoices.forEach((i) => {
      const c = (by[i.customer] = by[i.customer] || {
        customer: i.customer, contact: i.contact, n: 0, billed: 0, paid: 0, due: 0, oldest: 0,
      });
      c.n += 1; c.billed += invTotal(i); c.paid += invPaid(i); c.due += invDue(i);
      if (invDue(i) > 0) c.oldest = Math.max(c.oldest, -until(i.due));
    });
    return Object.values(by).sort((a, b) => b.due - a.due);
  }, [invoices]);

  const cols = [
    { key: 'c', label: 'Customer', wrap: true, value: (r) => r.customer, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.customer}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.contact}</div></div>
    ) },
    { key: 'n', label: 'Invoices', num: true, value: (r) => r.n, render: (r) => r.n },
    { key: 'b', label: 'Billed', num: true, value: (r) => r.billed, render: (r) => <Money v={r.billed} /> },
    { key: 'p', label: 'Received', num: true, value: (r) => r.paid, render: (r) => <Money v={r.paid} tone="good" /> },
    { key: 'd', label: 'Outstanding', num: true, value: (r) => r.due, render: (r) => <Money v={r.due} bold tone={r.due ? 'bad' : undefined} /> },
    { key: 'pct', label: 'Collected', num: true, value: (r) => r.paid / r.billed, render: (r) => (
      <Bar value={(r.paid / r.billed) * 100} max={100} target={90}
        colour={r.paid / r.billed >= 0.9 ? SERIES[1] : r.paid / r.billed >= 0.5 ? SERIES[2] : SERIES[4]}
        label={((r.paid / r.billed) * 100).toFixed(0) + '%'} />
    ) },
    { key: 'o', label: 'Oldest overdue', num: true, value: (r) => r.oldest,
      render: (r) => (r.oldest > 0
        ? <Badge tone={r.oldest > 60 ? 'red' : r.oldest > 30 ? 'gold' : 'blue'}>{r.oldest} days</Badge>
        : <span style={{ color: 'var(--text3)' }}>—</span>) },
  ];

  const bad = bins[4].v;

  return (
    <>
      {bad > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Clock size={15} strokeWidth={1.8} />
          <span>
            <b>{R(bad)}</b> is more than ninety days past its due date. At that age it is not a collection
            problem any more — it is a provision decision, and it needs to be on the finance report rather
            than the reminder list.
          </span>
        </div>
      )}
      <div className="grid-2" style={{ marginBottom: 12 }}>
        <Panel title="Aging profile" note="outstanding balance by how far past its term it is" flush>
          <Breakdown format={R} rows={bins.map((b) => ({ k: b.b, v: b.v, c: b.c }))} />
        </Panel>
        <Panel title="Outstanding by customer" flush>
          <Breakdown format={R} colour={SERIES[0]}
            rows={customers.filter((c) => c.due).map((c) => ({ k: c.customer, v: c.due }))} />
        </Panel>
      </div>
      <DataGrid cols={cols} rows={customers} keyOf={(r) => r.customer} toolbar={switcher} pageSize={20} />
    </>
  );
}

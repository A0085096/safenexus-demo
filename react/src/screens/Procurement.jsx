import React, { useMemo } from 'react';
import {
  ShoppingCart, Plus, PackageCheck, FileText, CircleAlert, Send, Building2, CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Expiry } from '../components/erpUi.jsx';
import { R, num, fmtShort, poTotal, until, SUPPLIERS } from '../erp/seed.js';

const poTone = (s) => ({
  Draft: 'grey', 'Awaiting approval': 'gold', Sent: 'blue', 'Part received': 'teal', Received: 'green',
}[s] || 'grey');
const sinTone = (s) => ({
  Paid: 'green', Approved: 'blue', 'Awaiting approval': 'gold', Query: 'red',
}[s] || 'grey');

/* ══════════════════════════════════════════════════════════════
   Procurement.

   Orders out and supplier invoices in, with the three-way match
   between them: the order says what was agreed, the receipt says
   what arrived, the invoice says what is being charged. An invoice
   that does not match one of the other two is a query, not a
   payment — and it stays a query until somebody says why.
   ══════════════════════════════════════════════════════════════ */
export default function Procurement({ run, openDialog }) {
  const { purchaseOrders, supplierInvoices, selection, select, subView, setView } = useStore();
  const view = subView.procurement || 'orders';

  const open = purchaseOrders.filter((p) => p.status !== 'Received');
  const awaiting = purchaseOrders.filter((p) => p.status === 'Awaiting approval');
  const committed = open.reduce((a, p) => a + poTotal(p), 0);
  const queries = supplierInvoices.filter((s) => s.status === 'Query');
  const payable = supplierInvoices.filter((s) => s.status !== 'Paid').reduce((a, s) => a + s.amount, 0);

  const poCols = [
    { key: 'ref', label: 'Order', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'sup', label: 'Supplier', value: (r) => r.supplier, render: (r) => <span style={{ fontWeight: 600 }}>{r.supplier}</span> },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'l', label: 'Lines', wrap: true, value: (r) => r.lines.length, render: (r) => (
      <div>
        <div>{r.lines.length} line{r.lines.length === 1 ? '' : 's'}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {r.lines.map((l) => l.desc).join(', ')}
        </div>
      </div>
    ) },
    { key: 'by', label: 'Raised by', value: (r) => r.raisedBy, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.raisedBy}</span> },
    { key: 'd', label: 'Raised', value: (r) => r.raised, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.raised)}</span> },
    { key: 'e', label: 'Expected', num: true, value: (r) => r.expected,
      render: (r) => (r.status === 'Received'
        ? <span style={{ color: 'var(--text3)' }}>received</span>
        : <Expiry date={r.expected} showDate={false} />) },
    { key: 'wo', label: 'Against', value: (r) => r.workOrder || '', render: (r) => (r.workOrder
      ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={(e) => { e.stopPropagation(); run('openWO:' + r.workOrder); }}>{r.workOrder}</button>
      : <span style={{ color: 'var(--text3)' }}>stock</span>) },
    { key: 'v', label: 'Value', num: true, value: (r) => poTotal(r), render: (r) => <Money v={poTotal(r)} bold /> },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={poTone(r.status)}>{r.status}</Badge> },
  ];

  const sinCols = [
    { key: 'ref', label: 'Invoice', mono: true, value: (r) => r.ref, render: (r) => r.ref },
    { key: 'sup', label: 'Supplier', value: (r) => r.supplier, render: (r) => <span style={{ fontWeight: 600 }}>{r.supplier}</span> },
    { key: 'po', label: 'Against order', mono: true, value: (r) => r.po, render: (r) => (
      <button className="link" style={{ fontFamily: 'var(--num)' }}
        onClick={(e) => { e.stopPropagation(); select('po', r.po); setView('procurement', 'orders'); }}>{r.po}</button>
    ) },
    { key: 's', label: 'Site', value: (r) => siteName(r.site), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.site)}</span> },
    { key: 'd', label: 'Dated', value: (r) => r.date, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.date)}</span> },
    { key: 'du', label: 'Due', num: true, value: (r) => r.due,
      render: (r) => (r.status === 'Paid' ? <span style={{ color: 'var(--text3)' }}>paid</span> : <Expiry date={r.due} showDate={false} />) },
    { key: 'm', label: 'Three-way match', value: (r) => (r.matched ? 'Matched' : 'Mismatch'),
      render: (r) => (r.matched
        ? <Badge tone="green">Matched</Badge>
        : <Badge tone="red">Price mismatch</Badge>) },
    { key: 'n', label: 'Note', wrap: true, value: (r) => r.note, render: (r) => <span style={{ fontSize: 11.5, color: 'var(--text2)' }}>{r.note || '—'}</span> },
    { key: 'a', label: 'Amount', num: true, value: (r) => r.amount, render: (r) => <Money v={r.amount} bold /> },
    { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={sinTone(r.status)}>{r.status}</Badge> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('procurement', v)} options={[
      { v: 'orders', l: `Orders (${purchaseOrders.length})`, icon: ShoppingCart },
      { v: 'invoices', l: `Supplier invoices (${supplierInvoices.length})`, icon: FileText },
      { v: 'suppliers', l: 'Suppliers', icon: Building2 },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Open orders', v: open.length, icon: ShoppingCart,
        note: `${purchaseOrders.filter((p) => p.status === 'Sent').length} with the supplier, awaiting delivery` },
      { l: 'Committed spend', v: R(committed).replace('R ', ''), unit: 'R', icon: PackageCheck,
        note: 'ordered and not yet received' },
      { l: 'Awaiting approval', v: awaiting.length, icon: CircleAlert,
        dir: awaiting.length ? 'dn' : 'up',
        note: 'an order cannot be sent until it is approved' },
      { l: 'Payable to suppliers', v: R(payable).replace('R ', ''), unit: 'R', icon: FileText,
        dir: queries.length ? 'dn' : 'flat',
        delta: queries.length ? `${queries.length} in query` : 'all matched',
        note: 'invoices approved or awaiting approval' },
    ]} />
  );

  if (view === 'suppliers') return <><>{kpis}</><Suppliers pos={purchaseOrders} sins={supplierInvoices} switcher={switcher} /></>;

  if (view === 'invoices') {
    return (
      <>
        {kpis}
        {queries.length > 0 && (
          <div className="infobar" style={{ marginBottom: 12 }}>
            <CircleAlert size={15} strokeWidth={1.8} />
            <span>
              <b>{queries.length} invoice{queries.length === 1 ? '' : 's'}</b> did not match the order it was
              raised against. Nothing on this list is paid until the difference is explained — the order says
              what was agreed, the receipt says what arrived, and the invoice has to agree with both.
            </span>
          </div>
        )}
        <DataGrid cols={sinCols} rows={supplierInvoices} keyOf={(r) => r.ref}
          selected={selection.supplierInvoice} onSelect={(k) => select('supplierInvoice', k)}
          rowClass={(r) => (r.status === 'Query' ? 'overdue' : '')}
          toolbar={
            <>
              {switcher}
              <Btn small primary icon={CheckCircle2} onClick={() => run('sinStatus:Approved')}>Approve</Btn>
              <Btn small icon={CircleAlert} onClick={() => run('sinStatus:Query')}>Query</Btn>
              <Btn small onClick={() => run('sinStatus:Paid')}>Mark paid</Btn>
            </>
          }
          totals={(list) => (
            <>
              <td colSpan={8} style={{ fontWeight: 600 }}>{list.length} invoices</td>
              <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.amount, 0))}</td>
              <td />
            </>
          )} />
      </>
    );
  }

  return (
    <>
      {kpis}
      <DataGrid cols={poCols} rows={purchaseOrders} keyOf={(r) => r.ref}
        selected={selection.po} onSelect={(k) => select('po', k)}
        rowClass={(r) => (r.status !== 'Received' && until(r.expected) < 0 ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={Plus} onClick={() => openDialog('po')}>Raise an order</Btn>
            <Btn small icon={Send} onClick={() => run('poStatus:Sent')}>Send to supplier</Btn>
            <Btn small icon={PackageCheck} onClick={() => run('poStatus:Received')}>Receive</Btn>
          </>
        }
        totals={(list) => (
          <>
            <td colSpan={8} style={{ fontWeight: 600 }}>{list.length} orders</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + poTotal(r), 0))}</td>
            <td />
          </>
        )} />
    </>
  );
}

/* ── suppliers ──────────────────────────────────────────────────
   Spend concentration and delivery reliability, because those are
   the two things that decide whether a supplier is a relationship
   or a risk. */
function Suppliers({ pos, sins, switcher }) {
  const rows = useMemo(() => SUPPLIERS.map((name) => {
    const orders = pos.filter((p) => p.supplier === name);
    const invoices = sins.filter((s) => s.supplier === name);
    const late = orders.filter((p) => p.status !== 'Received' && until(p.expected) < 0).length;
    return {
      name,
      orders: orders.length,
      spend: orders.reduce((a, p) => a + poTotal(p), 0),
      open: orders.filter((p) => p.status !== 'Received').length,
      late,
      invoices: invoices.length,
      queries: invoices.filter((s) => s.status === 'Query').length,
      payable: invoices.filter((s) => s.status !== 'Paid').reduce((a, s) => a + s.amount, 0),
    };
  }).filter((r) => r.orders).sort((a, b) => b.spend - a.spend), [pos, sins]);

  const total = rows.reduce((a, r) => a + r.spend, 0);

  const cols = [
    { key: 'n', label: 'Supplier', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'o', label: 'Orders', num: true, value: (r) => r.orders, render: (r) => r.orders },
    { key: 'op', label: 'Still open', num: true, value: (r) => r.open, render: (r) => r.open },
    { key: 'l', label: 'Past the promised date', num: true, value: (r) => r.late,
      render: (r) => (r.late ? <Badge tone="red">{r.late}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
    { key: 's', label: 'Spend', num: true, value: (r) => r.spend, render: (r) => <Money v={r.spend} bold /> },
    { key: 'sh', label: 'Share', num: true, value: (r) => r.spend,
      render: (r) => ((r.spend / total) * 100).toFixed(1) + '%' },
    { key: 'i', label: 'Invoices', num: true, value: (r) => r.invoices, render: (r) => r.invoices },
    { key: 'q', label: 'In query', num: true, value: (r) => r.queries,
      render: (r) => (r.queries ? <Badge tone="gold">{r.queries}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>) },
    { key: 'p', label: 'Payable', num: true, value: (r) => r.payable, render: (r) => <Money v={r.payable} /> },
  ];

  return (
    <>
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.name} toolbar={switcher} pageSize={20} />
      <div className="grid-2">
        <Panel title="Spend concentration" note="one supplier carrying too much of the book is a risk" flush>
          <Breakdown format={R} rows={rows.slice(0, 8).map((r, i) => ({ k: r.name, v: r.spend, c: SERIES[i % SERIES.length] }))} />
        </Panel>
        <Panel title="Payable by supplier" note="approved and awaiting approval" flush>
          <Breakdown format={R} colour={SERIES[2]}
            rows={rows.filter((r) => r.payable).map((r) => ({ k: r.name, v: r.payable }))
              .sort((a, b) => b.v - a.v)} />
        </Panel>
      </div>
    </>
  );
}

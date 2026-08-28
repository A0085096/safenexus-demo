import React, { useMemo } from 'react';
import {
  Package, Plus, PackageMinus, AlertTriangle, Boxes, ShoppingCart, SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { siteName } from '../data.js';
import { SERIES } from '../theme.js';
import { DataGrid, Btn, Badge, Seg, Panel } from '../components/ui.jsx';
import { Kpis, Money, Breakdown, Bar } from '../components/erpUi.jsx';
import {
  R, num, fmtShort, stockValue, PART_CATS,
} from '../erp/seed.js';

/* ══════════════════════════════════════════════════════════════
   Parts and stores.

   A part is only interesting in relation to two other numbers: how
   fast it moves, and how long it takes to replace. A bin that is
   empty of something used weekly is a workshop standing still; a
   bin full of something used twice a year is money on a shelf.
   Issuing a part moves it out of stock and onto the job card, so
   the workshop cost and the stock value cannot disagree.
   ══════════════════════════════════════════════════════════════ */
export default function Parts({ run, openDialog }) {
  const { parts, workOrders, selection, select, subView, setView } = useStore();
  const view = subView.parts || 'register';

  const below = parts.filter((p) => p.qty <= p.reorder);
  const out = parts.filter((p) => p.qty === 0);
  const value = parts.reduce((a, p) => a + stockValue(p), 0);

  const cols = [
    { key: 'sku', label: 'Part number', mono: true, value: (r) => r.sku, render: (r) => r.sku },
    { key: 'd', label: 'Description', wrap: true, value: (r) => r.desc, render: (r) => (
      <div><div style={{ fontWeight: 600 }}>{r.desc}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.supplier} · {r.lead}-day lead time</div></div>
    ) },
    { key: 'c', label: 'Category', value: (r) => r.category, render: (r) => <Badge tone="purple">{r.category}</Badge> },
    { key: 's', label: 'Store', value: (r) => siteName(r.store), render: (r) => <span style={{ color: 'var(--text2)' }}>{siteName(r.store)}</span> },
    { key: 'b', label: 'Bin', mono: true, value: (r) => r.bin, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.bin}</span> },
    { key: 'q', label: 'On hand', num: true, value: (r) => r.qty, render: (r) => (
      <Bar value={Math.min(r.qty, r.reorder * 3)} max={r.reorder * 3} target={r.reorder}
        colour={r.qty === 0 ? SERIES[4] : r.qty <= r.reorder ? SERIES[2] : SERIES[1]}
        label={String(r.qty)} width={54} />
    ) },
    { key: 'ro', label: 'Reorder at', num: true, value: (r) => r.reorder, render: (r) => <span style={{ color: 'var(--text2)' }}>{r.reorder}</span> },
    { key: 'oo', label: 'On order', num: true, value: (r) => r.onOrder,
      render: (r) => (r.onOrder ? <span style={{ color: 'var(--brand-dark)', fontWeight: 600 }}>{r.onOrder}</span> : <span style={{ color: 'var(--text3)' }}>—</span>) },
    { key: 'u', label: 'Used, 90 days', num: true, value: (r) => r.usage90, render: (r) => r.usage90 },
    { key: 'uc', label: 'Unit cost', num: true, value: (r) => r.unitCost, render: (r) => <Money v={r.unitCost} /> },
    { key: 'v', label: 'Stock value', num: true, value: (r) => stockValue(r), render: (r) => <Money v={stockValue(r)} bold /> },
    { key: 'li', label: 'Last issued', value: (r) => r.lastIssued, render: (r) => <span style={{ color: 'var(--text2)' }}>{fmtShort(r.lastIssued)}</span> },
  ];

  const switcher = (
    <Seg value={view} onChange={(v) => setView('parts', v)} options={[
      { v: 'register', l: `Catalogue (${parts.length})`, icon: Package },
      { v: 'reorder', l: `Below reorder (${below.length})`, icon: AlertTriangle },
      { v: 'movement', l: 'Movement and value', icon: Boxes },
    ]} />
  );

  const kpis = (
    <Kpis items={[
      { l: 'Lines in the catalogue', v: parts.length, icon: Package,
        note: `${PART_CATS.length} categories across ${new Set(parts.map((p) => p.store)).size} stores` },
      { l: 'Stock value', v: R(value).replace('R ', ''), unit: 'R', icon: Boxes,
        note: 'on-hand quantity at unit cost' },
      { l: 'Below the reorder level', v: below.length, icon: AlertTriangle,
        dir: below.length ? 'dn' : 'up',
        delta: `${below.filter((p) => p.onOrder).length} already on order`,
        note: 'a bin the workshop will find empty' },
      { l: 'Out of stock', v: out.length, icon: PackageMinus,
        dir: out.length ? 'dn' : 'up',
        note: out.length ? 'the workshop cannot start this work' : 'every line has cover' },
    ]} />
  );

  if (view === 'movement') return <><>{kpis}</><Movement parts={parts} workOrders={workOrders} switcher={switcher} /></>;

  const rows = view === 'reorder' ? below : parts;

  return (
    <>
      {kpis}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.sku} totalLabel={parts.length}
        selected={selection.part} onSelect={(k) => select('part', k)}
        rowClass={(r) => (r.qty === 0 ? 'overdue' : '')}
        toolbar={
          <>
            {switcher}
            <Btn small primary icon={PackageMinus} onClick={() => run('issuePart')}>Issue to a job card</Btn>
            <Btn small icon={ShoppingCart} onClick={() => run('orderPart')}>Raise an order</Btn>
            <Btn small icon={SlidersHorizontal} onClick={() => run('adjustStock')}>Adjust</Btn>
            <Btn small icon={Plus} onClick={() => openDialog('part')}>New line</Btn>
          </>
        }
        emptyText={view === 'reorder'
          ? 'Every line is above its reorder level.'
          : 'No part matches this filter.'}
        totals={(list) => (
          <>
            <td colSpan={9} style={{ fontWeight: 600 }}>{list.length} lines</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + r.unitCost, 0))}</td>
            <td className="num" style={{ fontWeight: 600 }}>{R(list.reduce((a, r) => a + stockValue(r), 0))}</td>
            <td />
          </>
        )} />
    </>
  );
}

/* ── movement and value ─────────────────────────────────────────
   Consumption over ninety days against what is on the shelf: the
   two numbers that decide whether a line is under-stocked, over-
   stocked or dead. */
function Movement({ parts, workOrders, switcher }) {
  const byCategory = useMemo(() => PART_CATS.map((c, i) => ({
    k: c, c: SERIES[i % SERIES.length],
    v: parts.filter((p) => p.category === c).reduce((a, p) => a + stockValue(p), 0),
  })).sort((a, b) => b.v - a.v), [parts]);

  const issued = useMemo(() => {
    const by = {};
    workOrders.forEach((w) => (w.parts || []).forEach((l) => {
      by[l.desc] = (by[l.desc] || 0) + l.qty * l.price;
    }));
    return Object.entries(by).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, 10);
  }, [workOrders]);

  /* Cover: how many months the shelf holds at the current rate.
     Nothing moving at all is dead stock, and says so. */
  const rows = parts.map((p) => {
    const monthly = p.usage90 / 3;
    return { ...p, monthly, cover: monthly ? p.qty / monthly : null, value: stockValue(p) };
  }).sort((a, b) => b.value - a.value);

  const dead = rows.filter((r) => !r.usage90 && r.qty > 0);

  const cols = [
    { key: 'sku', label: 'Part number', mono: true, value: (r) => r.sku, render: (r) => r.sku },
    { key: 'd', label: 'Description', wrap: true, value: (r) => r.desc, render: (r) => <span style={{ fontWeight: 600 }}>{r.desc}</span> },
    { key: 'c', label: 'Category', value: (r) => r.category, render: (r) => <Badge tone="purple">{r.category}</Badge> },
    { key: 'q', label: 'On hand', num: true, value: (r) => r.qty, render: (r) => r.qty },
    { key: 'u', label: 'Used per month', num: true, value: (r) => r.monthly, render: (r) => r.monthly.toFixed(1) },
    { key: 'cv', label: 'Months of cover', num: true, value: (r) => (r.cover == null ? 999 : r.cover),
      render: (r) => (r.cover == null
        ? <Badge tone="grey">no movement</Badge>
        : <Badge tone={r.cover < 1 ? 'red' : r.cover < 2 ? 'gold' : r.cover > 9 ? 'purple' : 'green'}>
            {r.cover.toFixed(1)}
          </Badge>) },
    { key: 'v', label: 'Stock value', num: true, value: (r) => r.value, render: (r) => <Money v={r.value} bold /> },
    { key: 'l', label: 'Lead time', num: true, value: (r) => r.lead, render: (r) => r.lead + ' days' },
  ];

  return (
    <>
      {dead.length > 0 && (
        <div className="infobar" style={{ marginBottom: 12 }}>
          <Boxes size={15} strokeWidth={1.8} />
          <span>
            <b>{R(dead.reduce((a, p) => a + stockValue(p), 0))}</b> sits in {dead.length} line
            {dead.length === 1 ? '' : 's'} that has not moved in ninety days. That is not stock, it is
            money on a shelf — worth a write-down decision rather than another order.
          </span>
        </div>
      )}
      <DataGrid cols={cols} rows={rows} keyOf={(r) => r.sku} toolbar={switcher} />
      <div className="grid-2">
        <Panel title="Stock value by category" flush>
          <Breakdown rows={byCategory} format={R} />
        </Panel>
        <Panel title="Most issued to job cards" note="by value, across the workshop's book of work" flush>
          <Breakdown rows={issued} format={R} colour={SERIES[3]} />
        </Panel>
      </div>
    </>
  );
}

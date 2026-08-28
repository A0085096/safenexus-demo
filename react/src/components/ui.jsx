import React, { useMemo, useState } from 'react';
import {
  Search, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';

/* ── badges ─────────────────────────────────────────────────── */
export const Badge = ({ tone = 'grey', children }) => (
  <span className={'bdg ' + tone}>{children}</span>
);

export const resultBadge = (r) =>
  r === 'go-but' ? <Badge tone="gold">Go-but</Badge>
    : r === 'no-go' ? <Badge tone="red">No-go</Badge>
      : r === 'in-order' ? <Badge tone="green">In order</Badge>
        : <Badge tone="grey">Pending</Badge>;

export const statusBadge = (s) =>
  s === 'Active' ? <Badge tone="green">Active</Badge>
    : s === 'Trial' ? <Badge tone="gold">Trial</Badge>
      : s === 'Suspended' ? <Badge tone="red">Suspended</Badge>
        : <Badge tone="grey">{s}</Badge>;

export const vehicleBadge = (s) =>
  s === 'Assigned' ? <Badge tone="green">Assigned</Badge>
    : s === 'Available' ? <Badge tone="gold">Available</Badge>
      : <Badge tone="red">Maintenance</Badge>;

export const roleBadge = (r) =>
  r === 'Administrator' ? <Badge tone="purple">{r}</Badge>
    : r === 'Safety officer' ? <Badge tone="green">{r}</Badge>
      : r === 'Supervisor' ? <Badge tone="blue">{r}</Badge>
        : <Badge tone="gold">{r}</Badge>;

export const planBadge = (p) =>
  p === 'Enterprise' ? <Badge tone="purple">{p}</Badge>
    : p === 'Pro' ? <Badge tone="blue">{p}</Badge>
      : <Badge tone="grey">{p}</Badge>;

/* ── primitives ─────────────────────────────────────────────── */
export const Btn = ({ children, onClick, primary, small, active, danger, icon: Icon }) => (
  <button
    className={['btn', small && 'sm', primary && 'primary', active && 'active', danger && 'danger'].filter(Boolean).join(' ')}
    onClick={onClick}
  >
    {Icon && <Icon size={small ? 14 : 15} strokeWidth={1.8} />}
    {children}
  </button>
);

export const Avatar = ({ init, tone = 'blue', large, icon: Icon }) => (
  <div className={'av ' + tone + (large ? ' lg' : '')}>
    {Icon ? <Icon size={15} strokeWidth={1.8} /> : init}
  </div>
);

export const Panel = ({ title, note, right, flush, children }) => (
  <div className="panel">
    {title && (
      <div className="panel-hd">
        <h2>{title}</h2>
        {note && <span className="note">{note}</span>}
        {right && <span className="right">{right}</span>}
      </div>
    )}
    <div className={'panel-body' + (flush ? ' flush' : '')}>{children}</div>
  </div>
);

export const ChartCard = ({ title, note, right, children, footer }) => (
  <div className="chart-card">
    <div className="chart-hd">
      <h2>{title}</h2>
      {note && <span className="note">{note}</span>}
      {right && <div className="right">{right}</div>}
    </div>
    <div className="chart-body chart">{children}</div>
    {footer}
  </div>
);

export const Seg = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map((o) => (
      <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
        {o.icon ? <o.icon size={14} strokeWidth={1.8} /> : null}
        {o.l}
      </button>
    ))}
  </div>
);

export const Legend = ({ items }) => (
  <div className="legend">
    {items.map((i) => (
      <span className="key" key={i.l}>
        <span className={'sw' + (i.line ? ' line' : '')} style={{ background: i.c }} />
        {i.l}
      </span>
    ))}
  </div>
);

export const ListRow = ({ avatar, title, sub, right, onClick }) => (
  <div className="lrow" onClick={onClick}>
    {avatar}
    <div className="ri">
      <div className="n">{title}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
    {right && <div className="rr">{right}</div>}
  </div>
);

export const SecHead = ({ children, note }) => (
  <div className="sec-head">{children}{note && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--text3)' }}>{note}</span>}</div>
);

export const KV = ({ k, v }) => (
  <div className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>
);

/* bold markers in the audit strings, without dangerouslySetInnerHTML */
export const RichText = ({ text }) => (
  <>{text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))}</>
);

/* ── data grid ──────────────────────────────────────────────── */
export function DataGrid({
  cols, rows, keyOf, toolbar, pageSize: initial = 20, totalLabel,
  totals, emptyText = 'Nothing here yet. Clear the filter, or add a record from the ribbon.',
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ k: null, d: 1 });
  const [pageSize, setPageSize] = useState(initial);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => cols.some((c) => String(c.value ? c.value(r) : '').toLowerCase().includes(s)));
  }, [rows, q, cols]);

  const sorted = useMemo(() => {
    if (!sort.k) return filtered;
    const c = cols.find((x) => x.key === sort.k);
    if (!c?.value) return filtered;
    return [...filtered].sort((a, b) => {
      const x = c.value(a), y = c.value(b);
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.d;
    });
  }, [filtered, sort, cols]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pg = Math.min(page, pages - 1);
  const view = sorted.slice(pg * pageSize, pg * pageSize + pageSize);

  return (
    <>
      <div className="cmdstrip">
        <div className="findbox">
          <Search size={14} strokeWidth={1.8} />
          <input value={q} placeholder="Filter this list" onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          {q && <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={() => setQ('')}><X size={12} /></button>}
        </div>
        {toolbar}
        <span className="count">{sorted.length} of {totalLabel ?? rows.length}</span>
      </div>

      <div className="panel">
        <div className="gridwrap">
          <table className="grid">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className={[c.num && 'num', c.value && 'sortable', sort.k === c.key && (sort.d === 1 ? 'sort-asc' : 'sort-desc')].filter(Boolean).join(' ')}
                    onClick={() => c.value && setSort((s) => (s.k === c.key ? { k: c.key, d: -s.d } : { k: c.key, d: 1 }))}
                  >{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => {
                const k = keyOf(r);
                return (
                  <tr key={k} className={sel === k ? 'sel' : ''} onClick={() => setSel(k)} tabIndex={0}>
                    {cols.map((c) => (
                      <td key={c.key} className={[c.num && 'num', c.mono && 'mono'].filter(Boolean).join(' ')} style={c.style}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {!view.length && (
                <tr><td colSpan={cols.length} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>{emptyText}</td></tr>
              )}
            </tbody>
            {totals && <tfoot><tr>{totals(sorted)}</tr></tfoot>}
          </table>
        </div>

        <div className="grid-foot">
          <span>Showing {sorted.length ? pg * pageSize + 1 : 0}–{Math.min((pg + 1) * pageSize, sorted.length)} of {sorted.length}</span>
          {[20, 50, 100].map((n) => (
            <Btn key={n} small active={pageSize === n} onClick={() => { setPageSize(n); setPage(0); }}>{n}</Btn>
          ))}
          <div className="pager">
            {[[ChevronsLeft, () => setPage(0), pg === 0],
              [ChevronLeft, () => setPage(pg - 1), pg === 0],
              [ChevronRight, () => setPage(pg + 1), pg >= pages - 1],
              [ChevronsRight, () => setPage(pages - 1), pg >= pages - 1]].map(([I, fn, dis], i) => (
                <button key={i} className="pgbtn" disabled={dis} style={{ opacity: dis ? 0.4 : 1 }} onClick={() => !dis && fn()}>
                  <I size={13} strokeWidth={1.8} />
                </button>
              ))}
            <span style={{ padding: '0 4px' }}>Page {pg + 1} of {pages}</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── dialog ─────────────────────────────────────────────────── */
export function Dialog({ title, note, fields, submit, onSubmit, onClose }) {
  return (
    <div className="overlay open" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="dlg">
        <div className="dlg-hd">{title}<button onClick={onClose}><X size={16} /></button></div>
        <div className="dlg-body">
          {note && <div className="dlg-note">{note}</div>}
          {fields.map((row, i) => (
            <div key={i} className={row.length > 1 ? 'row-2' : ''}>
              {row.map((f) => (
                <div className="field" key={f.l}>
                  <div className="field-lbl">{f.l}</div>
                  {f.options
                    ? <select className="inp" defaultValue={f.options[0]}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
                    : f.area
                      ? <textarea className="inp" rows={2} placeholder={f.p} />
                      : <input className="inp" type={f.type || 'text'} placeholder={f.p} />}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="dlg-foot">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn primary onClick={onSubmit}>{submit}</Btn>
        </div>
      </div>
    </div>
  );
}

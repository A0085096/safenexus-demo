import React, { useMemo, useState } from 'react';
import {
  Plus, Trash2, Download, FileJson, Printer, Save, PlayCircle, ArrowLeft,
  Table2, Layers, SlidersHorizontal, ArrowDownUp, X, BookmarkCheck,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { Panel, Btn, Badge, Seg } from '../components/ui.jsx';
import { num } from '../erp/seed.js';
import {
  SOURCES, sourceById, fieldOf, blankQuery, runQuery, columnTotals,
  describe, opsFor, OPS, AGGS, isNum, fmtVal,
} from '../erp/sources.js';

/* ══════════════════════════════════════════════════════════════
   The report builder.

   The seventeen definitions answer questions somebody knew to ask.
   This answers the rest: pick a register, pick columns, narrow it,
   group it, sort it, run it — then save the query so the next
   person does not rebuild it.

   What is saved is the query, never the result: a saved report
   re-runs against whatever the registers hold when it is opened,
   which is the difference between a report and a screenshot.
   ══════════════════════════════════════════════════════════════ */

const STEPS = [
  { k: 'source', l: 'Source', icon: Table2 },
  { k: 'cols', l: 'Columns', icon: Layers },
  { k: 'filters', l: 'Filters', icon: SlidersHorizontal },
  { k: 'shape', l: 'Shape', icon: ArrowDownUp },
];

const csv = (cols, rows) =>
  [cols, ...rows].map((r) => r.map((c) => {
    const v = String(c ?? '');
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\n');

/* ── the value input for one filter ───────────────────────────────
   A date field gets a date picker, a boolean gets nothing at all,
   and a field whose values repeat gets the list of them — typing
   "maintenance" from memory is how a filter silently returns
   nothing. */
function FilterValue({ src, filter, rows, onChange, which = 'v' }) {
  const field = fieldOf(src, filter.f);
  const op = OPS[filter.op];
  if (!field || !op || op.v === 0) return null;
  if (which === 'v2' && op.v < 2) return null;
  const value = filter[which] ?? '';
  const set = (x) => onChange({ [which]: x });

  if (op.date) {
    return <input className="inp" type="date" style={{ width: 142 }} value={value} onChange={(e) => set(e.target.value)} />;
  }
  if (isNum(field.t)) {
    return <input className="inp" type="number" style={{ width: 104 }} value={value}
      placeholder={field.t === 'money' ? 'rands' : 'number'} onChange={(e) => set(e.target.value)} />;
  }
  /* a short, repeating set of values is a list, not free text */
  const distinct = [...new Set(rows.map((r) => r[field.k]).filter((v) => v != null && v !== ''))];
  if (op.v === 1 && op.k !== 'has' && distinct.length > 1 && distinct.length <= 24 && !op.hint) {
    return (
      <select className="inp" style={{ width: 186 }} value={value} onChange={(e) => set(e.target.value)}>
        <option value="">choose a value…</option>
        {distinct.sort().map((d) => <option key={String(d)} value={String(d)}>{String(d)}</option>)}
      </select>
    );
  }
  return <input className="inp" style={{ width: 186 }} value={value}
    placeholder={op.hint || 'value'} onChange={(e) => set(e.target.value)} />;
}

export default function ReportBuilder({ scope, period, onBack }) {
  const store = useStore();
  const { savedReports, dispatch, me, flash } = store;
  const [q, setQ] = useState(() => blankQuery('vehicles'));
  const [step, setStep] = useState('source');
  const [ran, setRan] = useState(false);
  const [name, setName] = useState('');

  const src = sourceById(q.source);
  const raw = useMemo(() => src.of(store) || [], [src, store]);
  const result = useMemo(() => runQuery(store, q, scope), [store, q, scope]);
  const totals = useMemo(() => columnTotals(result), [result]);

  const patch = (x) => setQ((p) => ({ ...p, ...x }));

  /* Changing the source invalidates every column, filter and sort
     that referred to the old one, so the query starts again rather
     than carrying dangling field keys. */
  const setSource = (id) => { setQ(blankQuery(id)); setRan(false); };

  const toggleCol = (k) => patch({
    cols: q.cols.includes(k) ? q.cols.filter((x) => x !== k) : [...q.cols, k],
    sort: q.cols.includes(k) && q.sort.f === k
      ? { f: q.cols.filter((x) => x !== k)[0] || '', dir: 'asc' }
      : q.sort,
  });

  const moveCol = (k, by) => {
    const i = q.cols.indexOf(k);
    const j = i + by;
    if (i < 0 || j < 0 || j >= q.cols.length) return;
    const cols = [...q.cols];
    [cols[i], cols[j]] = [cols[j], cols[i]];
    patch({ cols });
  };

  const addFilter = () => {
    const field = src.fields[0];
    patch({ filters: [...q.filters, { f: field.k, op: opsFor(field.t)[0].k, v: '', v2: '' }] });
  };
  const setFilter = (i, x) => patch({
    filters: q.filters.map((ff, n) => {
      if (n !== i) return ff;
      const next = { ...ff, ...x };
      /* a new field may not offer the operator the old one did */
      if (x.f) {
        const ops = opsFor(fieldOf(src, x.f).t);
        if (!ops.some((o) => o.k === next.op)) next.op = ops[0].k;
        next.v = ''; next.v2 = '';
      }
      return next;
    }),
  });
  const dropFilter = (i) => patch({ filters: q.filters.filter((_, n) => n !== i) });

  const addAgg = () => {
    const field = src.fields.find((x) => isNum(x.t) && !q.aggs.some((a) => a.f === x.k));
    if (!field) return;
    patch({ aggs: [...q.aggs, { fn: 'sum', f: field.k }] });
  };

  const run = () => {
    setRan(true);
    dispatch({
      type: 'RECORD_RUN',
      by: me.name,
      run: {
        id: 'RUN-' + Math.floor(4472 + Math.random() * 400),
        report: name.trim() || `${src.name} (ad hoc)`,
        scope: scope === 'ALL' ? 'All sites' : scope,
        period, by: me.name, at: 'Just now',
        rows: result.rows.length, format: 'Builder', status: 'Complete',
      },
    });
    flash(`${num(result.rows.length)} row${result.rows.length === 1 ? '' : 's'} returned from ${src.name.toLowerCase()}.`,
      { title: 'Query run' });
  };

  const save = () => {
    const label = name.trim();
    if (!label) { flash('Give the report a name before saving it.', { tone: 'warn', title: 'Not saved' }); return; }
    dispatch({
      type: 'SAVE_REPORT', by: me.name,
      report: { id: 'RPT-' + Date.now().toString(36).slice(-5).toUpperCase(), name: label, desc: describe(q), by: me.name, q },
    });
    flash(`“${label}” saved. It re-runs against the live registers every time it is opened.`,
      { title: 'Report saved', tone: 'ok' });
  };

  const download = (asJson) => {
    const heads = result.cols.map((c) => c.l);
    const body = result.rows.map((r) => r.map((v, i) => fmtVal(result.cols[i].t, v)));
    const payload = asJson
      ? JSON.stringify({
        report: name.trim() || `${src.name} (ad hoc)`,
        query: q, scope: scope === 'ALL' ? 'All sites' : scope, period,
        generated: new Date().toISOString(), generatedBy: me.name, records: result.records,
        rows: result.rows.map((r) => Object.fromEntries(r.map((v, i) => [result.cols[i].l, v]))),
      }, null, 2)
      : csv(heads, body);
    const blob = new Blob([payload], { type: asJson ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safenexus-${q.source}-${new Date().toISOString().slice(0, 10)}.${asJson ? 'json' : 'csv'}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    flash(`${num(result.rows.length)} row(s) written to ${asJson ? 'JSON' : 'CSV'}.`, { title: 'Export complete' });
  };

  const numFields = src.fields.filter((x) => isNum(x.t));

  return (
    <>
      <div className="cmdstrip solo">
        <Btn small icon={ArrowLeft} onClick={onBack}>All reports</Btn>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Report builder</span>
        <input className="inp" style={{ width: 236 }} value={name} placeholder="Name this report…"
          onChange={(e) => setName(e.target.value)} />
        <span className="count" style={{ display: 'flex', gap: 8 }}>
          <Btn small primary icon={PlayCircle} onClick={run}>Run</Btn>
          <Btn small icon={Save} onClick={save}>Save</Btn>
          <Btn small icon={Download} onClick={() => download(false)}>CSV</Btn>
          <Btn small icon={FileJson} onClick={() => download(true)}>JSON</Btn>
          <Btn small icon={Printer} onClick={() => window.print()}>Print</Btn>
        </span>
      </div>

      <div className="bld-q">
        <span className="bld-q-l">Query</span>
        <span className="bld-q-v">{describe(q)}</span>
        <span className="bld-q-n">{num(result.records)} record{result.records === 1 ? '' : 's'}</span>
      </div>

      <div className="builder">
        {/* ── the query, built in four steps ───────────────────── */}
        <div className="bld-side">
          <Seg value={step} onChange={setStep}
            options={STEPS.map((s) => ({ v: s.k, l: s.l }))} />

          {step === 'source' && (
            <div className="bld-body">
              <div className="sec-head">Which register</div>
              {SOURCES.map((s) => (
                <button type="button" key={s.id}
                  className={'bld-src' + (s.id === q.source ? ' on' : '')}
                  onClick={() => setSource(s.id)}>
                  <div className="bld-src-h">
                    <span>{s.name}</span>
                    <span className="bld-n">{num((s.of(store) || []).length)}</span>
                  </div>
                  <div className="bld-src-d">{s.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 'cols' && (
            <div className="bld-body">
              <div className="sec-head">
                Columns · {q.cols.length} of {src.fields.length}
                <span style={{ float: 'right', fontWeight: 400 }}>
                  <button type="button" className="lnk" onClick={() => patch({ cols: [...src.default], sort: { f: src.default[0], dir: 'asc' } })}>reset</button>
                </span>
              </div>
              {/* chosen first, in the order they print */}
              {q.cols.map((k, i) => {
                const field = fieldOf(src, k);
                if (!field) return null;
                return (
                  <div className="bld-col on" key={k}>
                    <label className="bld-col-l">
                      <input type="checkbox" checked onChange={() => toggleCol(k)} />
                      <span>{field.l}</span>
                    </label>
                    <span className="bld-col-a">
                      <span className="bld-t">{field.t}</span>
                      <button type="button" className="lnk" disabled={i === 0} onClick={() => moveCol(k, -1)}>↑</button>
                      <button type="button" className="lnk" disabled={i === q.cols.length - 1} onClick={() => moveCol(k, 1)}>↓</button>
                    </span>
                  </div>
                );
              })}
              <div className="sec-head" style={{ marginTop: 10 }}>Available</div>
              {src.fields.filter((x) => !q.cols.includes(x.k)).map((field) => (
                <div className="bld-col" key={field.k}>
                  <label className="bld-col-l">
                    <input type="checkbox" checked={false} onChange={() => toggleCol(field.k)} />
                    <span>{field.l}</span>
                  </label>
                  <span className="bld-col-a"><span className="bld-t">{field.t}</span></span>
                </div>
              ))}
            </div>
          )}

          {step === 'filters' && (
            <div className="bld-body">
              <div className="sec-head">
                Filters
                {q.filters.length > 1 && (
                  <span style={{ float: 'right', fontWeight: 400 }}>
                    <Seg value={q.match} onChange={(v) => patch({ match: v })}
                      options={[{ v: 'all', l: 'match all' }, { v: 'any', l: 'match any' }]} />
                  </span>
                )}
              </div>
              {!q.filters.length && (
                <div className="bld-empty">
                  No filter, so the whole register is returned. Add one to
                  narrow it — the first field is the one worth narrowing on.
                </div>
              )}
              {q.filters.map((filter, i) => (
                <div className="bld-filter" key={i}>
                  <div className="bld-filter-h">
                    <span>{i === 0 ? 'Where' : q.match === 'any' ? 'or' : 'and'}</span>
                    <button type="button" className="lnk danger" onClick={() => dropFilter(i)}><X size={12} /></button>
                  </div>
                  <select className="inp" value={filter.f} onChange={(e) => setFilter(i, { f: e.target.value })}>
                    {src.fields.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
                  </select>
                  <div className="bld-filter-r">
                    <select className="inp" style={{ width: 132 }} value={filter.op}
                      onChange={(e) => setFilter(i, { op: e.target.value })}>
                      {opsFor(fieldOf(src, filter.f)?.t || 'text').map((o) => <option key={o.k} value={o.k}>{o.l}</option>)}
                    </select>
                    <FilterValue src={src} filter={filter} rows={raw} which="v" onChange={(x) => setFilter(i, x)} />
                    {OPS[filter.op]?.v === 2 && <span style={{ fontSize: 12, color: 'var(--text3)' }}>and</span>}
                    <FilterValue src={src} filter={filter} rows={raw} which="v2" onChange={(x) => setFilter(i, x)} />
                  </div>
                </div>
              ))}
              <Btn small icon={Plus} onClick={addFilter}>Add a filter</Btn>
            </div>
          )}

          {step === 'shape' && (
            <div className="bld-body">
              <div className="sec-head">Group by</div>
              <select className="inp" value={q.group}
                onChange={(e) => patch({
                  group: e.target.value,
                  /* the biggest group is the finding, so that is where a
                     newly grouped query lands rather than alphabetically */
                  sort: e.target.value ? { f: '__n', dir: 'desc' } : { f: q.cols[0], dir: 'asc' },
                  aggs: e.target.value && !q.aggs.length && numFields.length
                    ? [{ fn: 'sum', f: numFields[0].k }] : q.aggs,
                })}>
                <option value="">No grouping — one row per record</option>
                {src.fields.filter((x) => !isNum(x.t) || x.t === 'days').map((x) => (
                  <option key={x.k} value={x.k}>{x.l}</option>
                ))}
              </select>

              {q.group && (
                <>
                  <div className="sec-head" style={{ marginTop: 10 }}>Aggregate</div>
                  <div className="bld-empty" style={{ marginBottom: 6 }}>
                    Grouping replaces the rows with one line per {fieldOf(src, q.group)?.l.toLowerCase()}.
                    The record count always comes with it; add what else to total.
                  </div>
                  {q.aggs.map((a, i) => (
                    <div className="bld-filter-r" key={i} style={{ marginBottom: 6 }}>
                      <select className="inp" style={{ width: 96 }} value={a.fn}
                        onChange={(e) => patch({ aggs: q.aggs.map((x, n) => (n === i ? { ...x, fn: e.target.value } : x)) })}>
                        {Object.entries(AGGS).filter(([k]) => k !== 'count').map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                      </select>
                      <select className="inp" style={{ flex: 1 }} value={a.f}
                        onChange={(e) => patch({ aggs: q.aggs.map((x, n) => (n === i ? { ...x, f: e.target.value } : x)) })}>
                        {numFields.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
                      </select>
                      <button type="button" className="lnk danger"
                        onClick={() => patch({ aggs: q.aggs.filter((_, n) => n !== i) })}><Trash2 size={12} /></button>
                    </div>
                  ))}
                  {q.aggs.length < numFields.length && <Btn small icon={Plus} onClick={addAgg}>Add an aggregate</Btn>}
                </>
              )}

              <div className="sec-head" style={{ marginTop: 12 }}>Sort by</div>
              <div className="bld-filter-r">
                <select className="inp" style={{ flex: 1 }} value={q.sort.f}
                  onChange={(e) => patch({ sort: { ...q.sort, f: e.target.value } })}>
                  {result.cols.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
                </select>
                <Seg value={q.sort.dir} onChange={(v) => patch({ sort: { ...q.sort, dir: v } })}
                  options={[{ v: 'asc', l: 'A→Z' }, { v: 'desc', l: 'Z→A' }]} />
              </div>

              <div className="sec-head" style={{ marginTop: 12 }}>Limit</div>
              <div className="bld-filter-r">
                <select className="inp" style={{ flex: 1 }} value={q.limit}
                  onChange={(e) => patch({ limit: +e.target.value })}>
                  {[0, 10, 20, 50, 100, 250].map((n) => (
                    <option key={n} value={n}>{n === 0 ? 'Every row' : `Top ${n}`}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── the result, live as the query is built ───────────── */}
        <div className="bld-main">
          <Panel
            title={name.trim() || `${src.name} — ad hoc`}
            note={result.grouped
              ? `${num(result.groups)} group${result.groups === 1 ? '' : 's'} over ${num(result.records)} record${result.records === 1 ? '' : 's'}`
              : `${num(result.rows.length)} row${result.rows.length === 1 ? '' : 's'}${q.limit && result.records > q.limit ? ` of ${num(result.records)}` : ''}`}
            flush
            right={
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {scope !== 'ALL' && <Badge tone="blue">{scope}</Badge>}
                {q.filters.length ? <Badge tone="gold">{q.filters.length} filter{q.filters.length === 1 ? '' : 's'}</Badge> : null}
                {ran ? <Badge tone="green">Run recorded</Badge> : <Badge tone="grey">Preview</Badge>}
              </span>
            }>
            <div className="gridwrap bld-result" style={{ maxHeight: 520 }}>
              <table className="grid">
                <thead>
                  <tr>
                    {/* the grid's headers carry a pointer cursor everywhere
                        else in the app because they sort, so these do too —
                        clicking one is the shortest route to the sort a
                        person actually wanted */}
                    {result.cols.map((c) => (
                      <th key={c.k} className={isNum(c.t) ? 'num' : ''}
                        title={`Sort by ${c.l.toLowerCase()}`}
                        onClick={() => patch({
                          sort: q.sort.f === c.k
                            ? { f: c.k, dir: q.sort.dir === 'asc' ? 'desc' : 'asc' }
                            : { f: c.k, dir: isNum(c.t) ? 'desc' : 'asc' },
                        })}>
                        {c.l}
                        {q.sort.f === c.k && (
                          <span className="th-sort">{q.sort.dir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 300).map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j} className={isNum(result.cols[j].t) ? 'num' : ''}>
                          {fmtVal(result.cols[j].t, v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!result.rows.length && (
                    <tr>
                      <td colSpan={Math.max(1, result.cols.length)} style={{ padding: 34, textAlign: 'center', color: 'var(--text3)' }}>
                        Nothing matches this query. Loosen a filter, or widen the scope.
                      </td>
                    </tr>
                  )}
                </tbody>
                {!!result.rows.length && totals.some(Boolean) && (
                  <tfoot>
                    <tr>
                      {totals.map((t, i) => (
                        <td key={i} className={isNum(result.cols[i].t) ? 'num' : ''}>
                          {i === 0 && !t ? 'Total' : t ? fmtVal(t.t, Math.round(t.v)) : ''}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {result.rows.length > 300 && (
              <div className="grid-foot">
                <span>Showing the first 300 of {num(result.rows.length)} rows — the export carries all of them</span>
              </div>
            )}
          </Panel>

          {!!savedReports.length && (
            <Panel title="Saved reports" note="the query, re-run against the live registers" flush>
              <div className="gridwrap bld-saved">
                <table className="grid">
                  <thead><tr><th>Report</th><th>Register</th><th>Query</th><th>Saved by</th><th className="num">Rows now</th><th /></tr></thead>
                  <tbody>
                    {savedReports.map((s) => {
                      const n = runQuery(store, s.q, scope);
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: 'var(--text2)' }}>{sourceById(s.q.source).name}</td>
                          <td className="clip" style={{ maxWidth: 300 }}><span title={describe(s.q)}>{describe(s.q)}</span></td>
                          <td style={{ color: 'var(--text2)' }}>{s.by}</td>
                          <td className="num">{num(n.rows.length)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <Btn small icon={BookmarkCheck} onClick={() => { setQ(s.q); setName(s.name); setStep('shape'); setRan(false); }}>Open</Btn>
                            <Btn small icon={Trash2} onClick={() => {
                              dispatch({ type: 'DELETE_REPORT', id: s.id, by: me.name });
                              flash(`“${s.name}” removed.`, { tone: 'warn' });
                            }}>Delete</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

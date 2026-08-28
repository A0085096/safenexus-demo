import React, { useMemo, useState } from 'react';
import { X, CheckCheck, Eraser, AlertTriangle } from 'lucide-react';
import { Btn, Badge } from '../components/ui.jsx';
import { RESULT_ORDER, allItems } from './templates.js';
import './runner.css';

const COLOUR = { Go: 'var(--green)', 'Go But': '#BC7B09', 'No Go': 'var(--red)', 'N/A': 'var(--text3)' };

/* ══════════════════════════════════════════════════════════════
   The working pre-use inspection.

   The rules the paper form encodes, enforced here: a No Go item
   grounds the vehicle, a Go But item runs only on a supervisor's
   signed concession (and counts as a No Go until it is signed), and
   the sheet cannot be submitted with items left unanswered.
   ══════════════════════════════════════════════════════════════ */
export default function InspectionRunner({ tpl, vehicles, me, onClose, onSubmit, flash, gapFor }) {
  const eligible = vehicles.filter((v) => tpl.appliesTo.includes(v.type));
  const list = eligible.length ? eligible : vehicles;
  const [plate, setPlate] = useState(list[0]?.plate || '');
  const v = vehicles.find((x) => x.plate === plate);
  const [operator, setOperator] = useState(v && v.driver !== '—' ? v.driver : me.name);
  const [meter, setMeter] = useState(v ? String(v.km) : '');
  const [shift, setShift] = useState('Day A');
  const [conds, setConds] = useState(v?.permit ? [v.permit] : []);
  const [results, setResults] = useState({});
  const [remarks, setRemarks] = useState('');
  const [supSigned, setSupSigned] = useState(false);
  const [err, setErr] = useState('');

  const conditions = useMemo(
    () => [...new Set(tpl.sections.map((s) => s.condition).filter(Boolean))], [tpl]);
  const sections = tpl.sections.filter((s) => !s.condition || conds.includes(s.condition));
  const items = allItems(tpl).filter((i) => !i.condition || conds.includes(i.condition));

  const answered = items.filter((i) => results[i.id]).length;
  const noGo = items.filter((i) => results[i.id] === 'No Go');
  const goBut = items.filter((i) => results[i.id] === 'Go But');
  const outstanding = items.length - answered;

  const pickVehicle = (p) => {
    const nv = vehicles.find((x) => x.plate === p);
    setPlate(p);
    if (nv) {
      setMeter(String(nv.km));
      setOperator(nv.driver !== '—' ? nv.driver : me.name);
      setConds(nv.permit ? [nv.permit] : []);
    }
  };

  const mark = (id, val) => { setResults((r) => ({ ...r, [id]: val })); setErr(''); };
  const setAll = (val) => { setResults(Object.fromEntries(items.map((i) => [i.id, val]))); setErr(''); };
  const clearAll = () => { setResults({}); setErr(''); };

  const submit = () => {
    if (outstanding > 0) {
      setErr(`${outstanding} item${outstanding === 1 ? '' : 's'} still unanswered.`);
      flash(`${outstanding} item${outstanding === 1 ? '' : 's'} still unanswered — the sheet cannot be submitted.`);
      const first = items.find((i) => !results[i.id]);
      document.getElementById('it-' + first.id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (+meter < (v?.km || 0)) {
      setErr(`The reading is lower than the last recorded ${v.km.toLocaleString('en-GB')} km.`);
      return;
    }
    setErr('');
    onSubmit({
      plate, operator, meter: +meter || 0, shift, conds, results, remarks, supSigned,
      items, noGo, goBut, tpl,
    });
  };

  const verdict = noGo.length
    ? { text: 'The vehicle will be grounded and a defect raised.', tone: 'var(--red)' }
    : goBut.length
      ? supSigned
        ? { text: `The vehicle may operate on a signed concession, ${tpl.goButMaxDays} days to repair.`, tone: '#BC7B09' }
        : { text: 'A supervisor must sign the concession, or this counts as a No Go.', tone: '#BC7B09' }
      : { text: 'Fit for service.', tone: 'var(--green)' };

  return (
    <div className="runner-back" onClick={(e) => e.target.classList.contains('runner-back') && onClose()}>
      <div className="runner">
        <div className="runner-hd">
          <span className="t">{tpl.name}</span>
          <span className="c">{tpl.code} · Rev {tpl.revision}</span>
          <button onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="runner-meta">
          <div className="field">
            <div className="field-lbl">Vehicle</div>
            <select className="inp" style={{ width: 250 }} value={plate} onChange={(e) => pickVehicle(e.target.value)}>
              {list.map((x) => <option key={x.plate} value={x.plate}>{x.plate} — {x.fleetNo} · {x.type}</option>)}
            </select>
          </div>
          <div className="field">
            <div className="field-lbl">Operator</div>
            <input className="inp" style={{ width: 180 }} value={operator} onChange={(e) => setOperator(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-lbl">{tpl.meterLabel}</div>
            <input className="inp" style={{ width: 130, textAlign: 'right', fontFamily: 'var(--num)' }}
              type="number" value={meter} onChange={(e) => setMeter(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-lbl">Shift</div>
            <select className="inp" style={{ width: 110 }} value={shift} onChange={(e) => setShift(e.target.value)}>
              {['Day A', 'Day B', 'Aft A', 'Aft B', 'Night A', 'Night B'].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          {conditions.map((c) => (
            <label key={c} className={'runner-cond' + (conds.includes(c) ? ' on' : '')}>
              <input type="checkbox" checked={conds.includes(c)}
                onChange={() => setConds(conds.includes(c) ? conds.filter((x) => x !== c) : [...conds, c])} />
              {c}
            </label>
          ))}
        </div>

        {gapFor?.(operator) && (
          <div className="runner-warn">
            <AlertTriangle size={15} />
            <span>
              <strong>{operator}</strong> {gapFor(operator)}. The sheet can still be captured, but the
              supervisor must sign it and the training should be booked.
            </span>
          </div>
        )}

        {tpl.declaration && (
          <div className="runner-decl"><strong>Declaration. </strong>{tpl.declaration}</div>
        )}

        <div className="runner-body">
          <div className="runner-tools">
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Mark every item:</span>
            <Btn small icon={CheckCheck} onClick={() => setAll('Go')}>All Go</Btn>
            <Btn small icon={Eraser} onClick={clearAll}>Clear</Btn>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: answered === items.length ? 'var(--green)' : 'var(--gold)' }}>
              {answered} of {items.length} answered
            </span>
          </div>

          {sections.map((s) => (
            <div key={s.id}>
              <div className={'runner-sec ' + (s.severity === 'No Go' ? 'nogo' : 'gobut')}>
                <span>{s.title}</span><span style={{ opacity: .85 }}>{s.severity}</span>
              </div>
              {s.items.map((it) => {
                const r = results[it.id];
                return (
                  <div key={it.id} id={'it-' + it.id}
                    className={'runner-item' + (r === 'No Go' ? ' r-nogo' : r === 'Go But' ? ' r-gobut' : '')}>
                    <span className="lbl">{it.label}</span>
                    <div className="opts">
                      {RESULT_ORDER.filter((x) => s.severity !== 'Go But' || x !== 'No Go').map((x) => (
                        <button key={x} className={'opt' + (r === x ? ' on' : '')}
                          style={r === x ? { background: COLOUR[x], borderColor: COLOUR[x] } : undefined}
                          onClick={() => mark(it.id, x)}>{x}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ padding: 14, borderTop: '1px solid var(--stroke)' }}>
            <div className="field-lbl">Operator’s remarks</div>
            <textarea className="inp" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Anything the supervisor should know before the next shift." />
            {goBut.length > 0 && (
              <label className="concession">
                <input type="checkbox" checked={supSigned} onChange={(e) => setSupSigned(e.target.checked)} style={{ marginTop: 2 }} />
                <span>
                  Supervisor signs the Go-But concession. {goBut.length} item{goBut.length === 1 ? '' : 's'} will be
                  given {tpl.goButMaxDays} days to be rectified: {goBut.map((g) => g.label).join(', ')}.
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="runner-foot">
          <Badge tone={noGo.length ? 'red' : 'green'}>{noGo.length} No Go</Badge>
          <Badge tone={goBut.length ? 'gold' : 'grey'}>{goBut.length} Go But</Badge>
          <span className="runner-verdict" style={{ color: verdict.tone }}>{err || verdict.text}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn primary onClick={submit}>Submit inspection</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

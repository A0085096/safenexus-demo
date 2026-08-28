import React, { useMemo, useState } from 'react';
import {
  X, CheckCheck, Eraser, AlertTriangle, Camera, MessageSquarePlus, ChevronDown, ChevronRight,
} from 'lucide-react';
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
export default function InspectionRunner({ tpl, vehicles, me, onClose, onSubmit, flash, gapFor, rules }) {
  const eligible = vehicles.filter((v) => tpl.appliesTo.includes(v.type));
  const list = eligible.length ? eligible : vehicles;
  const [plate, setPlate] = useState(list[0]?.plate || '');
  const v = vehicles.find((x) => x.plate === plate);
  const [operator, setOperator] = useState(v && v.driver !== '—' ? v.driver : me.name);
  const [meter, setMeter] = useState(v ? String(v.km) : '');
  const [shift, setShift] = useState('Day A');
  const [conds, setConds] = useState(v?.permit ? [v.permit] : []);
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState({});          /* per item, required on a failure */
  const [photos, setPhotos] = useState({});        /* per item, a count stands in for the camera */
  const [openNote, setOpenNote] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [remarks, setRemarks] = useState('');
  const [declared, setDeclared] = useState(false);
  const [delay, setDelay] = useState({ reported: '', repaired: '', reason: '' });
  const [signers, setSigners] = useState({ Operator: '', Supervisor: '', Artisan: '' });
  const [supSigned, setSupSigned] = useState(!rules.requireConcession);
  const [err, setErr] = useState('');

  const conditions = useMemo(
    () => [...new Set(tpl.sections.map((s) => s.condition).filter(Boolean))], [tpl]);
  const sections = tpl.sections.filter((s) => !s.condition || conds.includes(s.condition));
  const items = allItems(tpl).filter((i) => !i.condition || conds.includes(i.condition));

  const answered = items.filter((i) => results[i.id]).length;
  const noGo = items.filter((i) => results[i.id] === 'No Go');
  const goBut = items.filter((i) => results[i.id] === 'Go But');
  const outstanding = items.length - answered;

  /* a failed item must say why: the note is what the workshop reads */
  const failing = items.filter((i) => ['No Go', 'Go But'].includes(results[i.id]));
  const missingNotes = failing.filter((i) => !(notes[i.id] || '').trim());

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
    if (!declared) {
      setErr('Accept the declaration before submitting.');
      return;
    }
    if (missingNotes.length) {
      setErr(`${missingNotes.length} failed item(s) still need a note saying what is wrong.`);
      setOpenNote(missingNotes[0].id);
      document.getElementById('it-' + missingNotes[0].id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!signers.Operator.trim()) {
      setErr('The operator must sign the sheet.');
      return;
    }
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
      notes, photos, delay, signers, items, noGo, goBut, tpl,
    });
  };

  const verdict = noGo.length
    ? {
      text: rules.autoGroundOnNoGo
        ? 'The vehicle will be grounded and a defect raised.'
        : 'A defect will be raised. Auto-grounding is off, so ground it by hand.',
      tone: 'var(--red)',
    }
    : goBut.length
      ? supSigned
        ? { text: `The vehicle may operate on a signed concession, ${rules.goButMaxDays} days to repair.`, tone: '#BC7B09' }
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
          <label className="runner-decl">
            <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setErr(''); }} />
            <span><strong>Declaration. </strong>{tpl.declaration}</span>
          </label>
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
              <button className={'runner-sec ' + (s.severity === 'No Go' ? 'nogo' : 'gobut')}
                onClick={() => setCollapsed({ ...collapsed, [s.id]: !collapsed[s.id] })}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {collapsed[s.id] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  {s.title}
                </span>
                <span style={{ opacity: .85 }}>
                  {s.items.filter((i) => results[i.id]).length}/{s.items.length} · {s.severity}
                </span>
              </button>
              {!collapsed[s.id] && s.items.map((it) => {
                const r = results[it.id];
                const failed = r === 'No Go' || r === 'Go But';
                const noteOpen = openNote === it.id || (failed && !(notes[it.id] || '').trim());
                return (
                  <div key={it.id} id={'it-' + it.id}
                    className={'runner-item-wrap' + (r === 'No Go' ? ' r-nogo' : r === 'Go But' ? ' r-gobut' : '')}>
                    <div className="runner-item">
                      <span className="lbl">{it.label}</span>
                      {(notes[it.id] || photos[it.id]) && (
                        <span className="item-marks">
                          {notes[it.id] && <MessageSquarePlus size={13} />}
                          {photos[it.id] > 0 && <span><Camera size={13} /> {photos[it.id]}</span>}
                        </span>
                      )}
                      <div className="opts">
                        {RESULT_ORDER.filter((x) => s.severity !== 'Go But' || x !== 'No Go').map((x) => (
                          <button key={x} className={'opt' + (r === x ? ' on' : '')}
                            style={r === x ? { background: COLOUR[x], borderColor: COLOUR[x] } : undefined}
                            onClick={() => mark(it.id, x)}>{x}</button>
                        ))}
                      </div>
                    </div>
                    {failed && noteOpen && (
                      <div className="item-detail">
                        <input className="inp" placeholder={`What is wrong with the ${it.label.toLowerCase()}?`}
                          value={notes[it.id] || ''} autoFocus={openNote === it.id}
                          onChange={(e) => { setNotes({ ...notes, [it.id]: e.target.value }); setErr(''); }} />
                        <Btn small icon={Camera}
                          onClick={() => setPhotos({ ...photos, [it.id]: (photos[it.id] || 0) + 1 })}>
                          Photo{photos[it.id] ? ` (${photos[it.id]})` : ''}
                        </Btn>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {tpl.delayCapture && (
            <div style={{ padding: 14, borderTop: '1px solid var(--stroke)' }}>
              <div className="field-lbl">Delay and breakdown</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {[['reported', 'Time reported'], ['repaired', 'Time repaired']].map(([k, l]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{l}</div>
                    <input className="inp" style={{ width: 110 }} placeholder="06:15" value={delay[k]}
                      onChange={(e) => setDelay({ ...delay, [k]: e.target.value })} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Reason</div>
                  <input className="inp" value={delay.reason}
                    onChange={(e) => setDelay({ ...delay, reason: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: 14, borderTop: '1px solid var(--stroke)' }}>
            <div className="field-lbl">Operator’s remarks</div>
            <textarea className="inp" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Anything the supervisor should know before the next shift." />
            <div className="field-lbl" style={{ marginTop: 14 }}>Sign-off chain</div>
            <div className="signers">
              {tpl.signoffs.map((role) => (
                <div key={role}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>
                    {role}{role === 'Operator' ? ' — required' : ' — optional at capture'}
                  </div>
                  <input className="inp" placeholder={role === 'Operator' ? operator : 'Name'}
                    value={signers[role] || ''}
                    onChange={(e) => { setSigners({ ...signers, [role]: e.target.value }); setErr(''); }} />
                </div>
              ))}
            </div>

            {goBut.length > 0 && rules.requireConcession && (
              <label className="concession">
                <input type="checkbox" checked={supSigned} onChange={(e) => setSupSigned(e.target.checked)} style={{ marginTop: 2 }} />
                <span>
                  Supervisor signs the Go-But concession. {goBut.length} item{goBut.length === 1 ? '' : 's'} will be
                  given {rules.goButMaxDays} days to be rectified: {goBut.map((g) => g.label).join(', ')}.
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="runner-foot">
          <Badge tone={noGo.length ? 'red' : 'green'}>{noGo.length} No Go</Badge>
          <Badge tone={goBut.length ? 'gold' : 'grey'}>{goBut.length} Go But</Badge>
          <span className="runner-verdict" style={{ color: err ? 'var(--red)' : verdict.tone }}>
            {err || verdict.text}
          </span>
          {missingNotes.length > 0 && !err && (
            <span style={{ fontSize: 11.5, color: 'var(--gold)' }}>{missingNotes.length} note(s) outstanding</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn primary onClick={submit}>Submit inspection</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

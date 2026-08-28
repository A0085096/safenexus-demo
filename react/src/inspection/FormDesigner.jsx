import React, { useState } from 'react';
import {
  X, ChevronUp, ChevronDown, Plus, Play, CheckCircle2, Repeat, Files, Trash2,
  Layers, FileText, SlidersHorizontal, Lock,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { Btn, Badge, Panel, Seg } from '../components/ui.jsx';
import { sevColour, SEVERITIES, allItems } from './templates.js';
import { VEHICLE_TYPES } from '../erp/seed.js';
import FormPreview from './FormPreview.jsx';

const INDUSTRIES = ['Mining', 'Construction', 'Logistics', 'Agriculture', 'Utilities', 'Government'];

/* ══════════════════════════════════════════════════════════════
   The inspection form designer.

   The form is the safety case, so this is the most consequential
   screen on the platform: what a section's severity says is the
   difference between a machine being parked and a machine running
   on a signed concession. Three modes —

     Design         what the form asks, section by section
     Paper preview   what prints for the clipboard in the yard
     Settings        the rules the runner enforces

   A published form is read-only here. Editing one in place would
   silently change what every past sheet meant, so publishing is a
   one-way door and a change means a new revision.
   ══════════════════════════════════════════════════════════════ */
export default function FormDesigner({ run }) {
  const {
    templates, selection, select, dispatch, me, flash, tenant, inspections,
  } = useStore();
  const [mode, setMode] = useState('design');

  const tpl = templates.find((t) => t.id === selection.template) || templates[0];
  if (!tpl) return null;
  const locked = tpl.status === 'Published';

  const patch = (p, what) => dispatch({ type: 'PATCH_TEMPLATE', id: tpl.id, patch: p, what, by: me.name, silent: !what });
  const patchSection = (sectionId, p) => dispatch({ type: 'PATCH_SECTION', id: tpl.id, sectionId, patch: p, by: me.name });

  /* the guard that makes publishing mean something */
  const guard = (fn) => () => {
    if (locked) {
      flash(`${tpl.code} is published and in use. Open a new revision to change it — completed sheets keep the revision they were captured on.`,
        { tone: 'warn', title: 'Published form' });
      return;
    }
    fn();
  };

  const counts = { 'No Go': 0, 'Go But': 0, Weekly: 0, Info: 0 };
  tpl.sections.forEach((s) => { counts[s.severity] = (counts[s.severity] || 0) + s.items.length; });
  const captured = inspections.filter((i) => i.templateId === tpl.id).length;

  /* ── the list of forms ────────────────────────────────────── */
  const list = (
    <div className="designer-list">
      <div className="designer-list-acts">
        <Btn small primary icon={Plus} onClick={() => run('newForm')}>New form</Btn>
        <Btn small icon={Files} onClick={() => run('duplicateForm')}>Duplicate</Btn>
      </div>
      {INDUSTRIES.filter((ind) => templates.some((t) => (t.industry || 'Mining') === ind)).map((ind) => (
        <div key={ind}>
          <div className="designer-group">{ind}</div>
          {templates.filter((t) => (t.industry || 'Mining') === ind).map((t) => (
            <button key={t.id} className={'designer-item' + (t.id === tpl.id ? ' on' : '')}
              onClick={() => select('template', t.id)}>
              <div className="n">{t.name}</div>
              <div className="m">
                {t.code} · Rev {t.revision}
                {t.status === 'Published' ? <Badge tone="green">Published</Badge> : <Badge tone="gold">Draft</Badge>}
              </div>
              <div className="m">{allItems(t).length} checks · {t.sections.length} sections</div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  /* ── the editor ───────────────────────────────────────────── */
  const bar = (
    <div className="designer-bar">
      <Seg value={mode} onChange={setMode} options={[
        { v: 'design', l: 'Design', icon: Layers },
        { v: 'paper', l: 'Paper preview', icon: FileText },
        { v: 'settings', l: 'Settings', icon: SlidersHorizontal },
      ]} />
      <Badge tone="red">{counts['No Go']} No Go</Badge>
      <Badge tone="gold">{counts['Go But']} Go But</Badge>
      {counts.Weekly > 0 && <Badge tone="grey">{counts.Weekly} periodic</Badge>}
      {locked && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text3)' }}>
          <Lock size={12} strokeWidth={1.9} /> read-only while published
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <Btn small icon={Play} onClick={() => run('startInspection:' + tpl.id)}>Use this form</Btn>
        {tpl.status === 'Draft'
          ? <Btn small primary icon={CheckCircle2} onClick={() => run('publishForm')}>Publish</Btn>
          : <Btn small icon={Repeat} onClick={() => run('reviseForm')}>New revision</Btn>}
      </div>
    </div>
  );

  return (
    <div className={'designer' + (locked ? ' locked' : '')}>
      {list}
      <div className="designer-body">
        {bar}

        {mode === 'design' && (
          <div style={{ padding: 14 }}>
            {locked && (
              <div className="infobar" style={{ marginBottom: 12 }}>
                <Lock size={15} strokeWidth={1.8} />
                <span>
                  <b>{tpl.code} Rev {tpl.revision}</b> is published and {captured
                    ? `${captured} sheet${captured === 1 ? ' has' : 's have'} been captured on it`
                    : 'in force'}. It cannot be edited in place — a change would silently rewrite what those
                  sheets meant. <b>New revision</b> opens a draft copy; the captured sheets keep this one.
                </span>
              </div>
            )}

            <Panel title="The form" note="what the operator sees at the top of the sheet">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 240 }}>
                  <div className="field-lbl">Form name</div>
                  <input className="inp" value={tpl.name} disabled={locked}
                    onChange={(e) => patch({ name: e.target.value })} />
                  <div className="field-hint">Everything before the em dash prints as the masthead.</div>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div className="field-lbl">Form number</div>
                  <input className="inp" value={tpl.code} disabled={locked}
                    onChange={(e) => patch({ code: e.target.value })} />
                </div>
                <div style={{ width: 160 }}>
                  <div className="field-lbl">Industry</div>
                  <select className="inp" value={tpl.industry || 'Mining'} disabled={locked}
                    onChange={(e) => patch({ industry: e.target.value })}>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </Panel>

            {tpl.sections.map((s, si) => {
              const c = sevColour(s.severity);
              return (
                <div className="sec-card" key={s.id}>
                  <div className="sec-bar" style={{ background: c.bg, color: c.fg }}>
                    <input className="inp" style={{ width: 240 }} value={s.title} disabled={locked}
                      onChange={(e) => patchSection(s.id, { title: e.target.value })} />
                    <select className="inp" style={{ width: 108 }} value={s.severity} disabled={locked}
                      onChange={(e) => patchSection(s.id, { severity: e.target.value })}>
                      {SEVERITIES.map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <input className="inp" style={{ width: 220 }} value={s.condition || ''}
                      placeholder="Only if… (e.g. Towing a trailer)" disabled={locked}
                      onChange={(e) => patchSection(s.id, { condition: e.target.value || null })} />
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      <Btn small icon={ChevronUp}
                        onClick={guard(() => dispatch({ type: 'MOVE_SECTION', id: tpl.id, index: si, dir: -1, by: me.name }))} />
                      <Btn small icon={ChevronDown}
                        onClick={guard(() => dispatch({ type: 'MOVE_SECTION', id: tpl.id, index: si, dir: 1, by: me.name }))} />
                      <Btn small danger icon={Trash2}
                        onClick={guard(() => dispatch({ type: 'DELETE_SECTION', id: tpl.id, sectionId: s.id, by: me.name }))}>
                        Remove
                      </Btn>
                    </span>
                  </div>

                  {s.items.map((it) => (
                    <div className="sec-item" key={it.id}>
                      <span className="dot" style={{ background: c.bg }} />
                      <input className="inp" value={it.label} disabled={locked}
                        onChange={(e) => dispatch({ type: 'PATCH_ITEM', id: tpl.id, sectionId: s.id, itemId: it.id, label: e.target.value })} />
                      <button className="x" title="Remove this check"
                        onClick={guard(() => dispatch({ type: 'DELETE_ITEM', id: tpl.id, sectionId: s.id, itemId: it.id }))}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {!s.items.length && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>
                      No checks yet. A section with no items prints as an empty band.
                    </div>
                  )}
                  <div style={{ padding: 8 }}>
                    <Btn small icon={Plus}
                      onClick={guard(() => dispatch({ type: 'ADD_ITEM', id: tpl.id, sectionId: s.id }))}>
                      Add a check
                    </Btn>
                  </div>
                </div>
              );
            })}

            <Btn primary icon={Plus} onClick={guard(() => dispatch({
              type: 'ADD_SECTION',
              id: tpl.id,
              section: { id: 'S' + Date.now(), title: 'New section', severity: 'No Go', condition: null, items: [] },
              by: me.name,
            }))}>Add a section</Btn>
          </div>
        )}

        {mode === 'paper' && (
          <div style={{ padding: 14 }}>
            <div className="infobar" style={{ marginBottom: 12 }}>
              <FileText size={15} strokeWidth={1.8} />
              <span>
                This is what prints for the clipboard in the yard. The colour bands carry the meaning, not
                the decoration: a <b>red</b> item grounds the machine until it is repaired and signed off; a
                <b> yellow</b> item may run on a supervisor’s concession with a {tpl.goButMaxDays}-day repair
                clock. Everything SafeNexus enforces on screen, this sheet enforces on paper.
              </span>
            </div>
            <FormPreview tpl={tpl} tenant={tenant.name} />
          </div>
        )}

        {mode === 'settings' && (
          <div style={{ padding: 14, maxWidth: 820 }}>
            <Panel title="Rules" note="read by the runner, the defect clock and the compliance board">
              <div className="set-row">
                <div className="set-lbl">
                  <div className="l">Go-but repair window</div>
                  <div className="n">How long a conceded item may run before the defect goes overdue.</div>
                </div>
                <div className="set-ctl">
                  <div className="set-num">
                    <input className="inp" type="number" min="1" max="90" value={tpl.goButMaxDays} disabled={locked}
                      onChange={(e) => patch({ goButMaxDays: +e.target.value || 1 }, 'the go-but window')} />
                    <span>days</span>
                  </div>
                </div>
              </div>
              <div className="set-row">
                <div className="set-lbl">
                  <div className="l">A go-but needs a supervisor’s signature</div>
                  <div className="n">Without one the sheet counts as a no-go and the machine is parked.</div>
                </div>
                <div className="set-ctl">
                  <button className={'toggle' + (tpl.requiresSupervisor ? ' on' : '')} disabled={locked}
                    onClick={() => patch({ requiresSupervisor: !tpl.requiresSupervisor }, 'the concession signature rule')}>
                    <span />
                  </button>
                </div>
              </div>
              <div className="set-row">
                <div className="set-lbl">
                  <div className="l">Capture delay and breakdown times</div>
                  <div className="n">Time reported, time repaired and the reason — what the availability figures are built from.</div>
                </div>
                <div className="set-ctl">
                  <button className={'toggle' + (tpl.delayCapture ? ' on' : '')} disabled={locked}
                    onClick={() => patch({ delayCapture: !tpl.delayCapture }, 'delay capture')}>
                    <span />
                  </button>
                </div>
              </div>
              <div className="set-row">
                <div className="set-lbl">
                  <div className="l">Meter prompt</div>
                  <div className="n">What the operator is asked to read off the machine.</div>
                </div>
                <div className="set-ctl">
                  <input className="inp" style={{ width: 280 }} value={tpl.meterLabel} disabled={locked}
                    onChange={(e) => patch({ meterLabel: e.target.value })} />
                </div>
              </div>
            </Panel>

            <Panel title="Applies to" note="which vehicle types offer this form when an operator starts an inspection">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {VEHICLE_TYPES.map((x) => {
                  const on = tpl.appliesTo.includes(x.t);
                  return (
                    <button key={x.t} className={'chip' + (on ? ' on' : '')} disabled={locked}
                      onClick={() => patch({
                        appliesTo: on ? tpl.appliesTo.filter((y) => y !== x.t) : [...tpl.appliesTo, x.t],
                      }, `which vehicles it applies to`)}>
                      {x.t}
                    </button>
                  );
                })}
              </div>
              {!tpl.appliesTo.length && (
                <div className="field-hint" style={{ marginTop: 8 }}>
                  Nothing selected — no vehicle will offer this form.
                </div>
              )}
            </Panel>

            <Panel title="Sign-off chain" note="who signs the sheet, and in what order">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Operator', 'Supervisor', 'Artisan', 'Safety officer', 'Engineering'].map((r) => {
                  const on = tpl.signoffs.includes(r);
                  return (
                    <button key={r} className={'chip' + (on ? ' on' : '')} disabled={locked}
                      onClick={() => patch({
                        signoffs: on ? tpl.signoffs.filter((y) => y !== r) : [...tpl.signoffs, r],
                      }, 'the sign-off chain')}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Declaration and note" note="printed on the sheet and shown in the runner">
              <div className="field-lbl">Operator’s declaration</div>
              <textarea className="inp" rows={5} value={tpl.declaration} disabled={locked}
                onChange={(e) => patch({ declaration: e.target.value })} />
              <div className="field-lbl" style={{ marginTop: 10 }}>Footer note</div>
              <textarea className="inp" rows={3} value={tpl.note} disabled={locked}
                onChange={(e) => patch({ note: e.target.value })} />
            </Panel>

            <Panel title="Header fields" note="the boxes the operator fills in by hand at the top of the sheet">
              <input className="inp" value={(tpl.header || []).join(', ')} disabled={locked}
                onChange={(e) => patch({ header: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
              <div className="field-hint">Comma separated. They print left to right across the sheet.</div>
              <div className="field-lbl" style={{ marginTop: 10 }}>Remark bands</div>
              <input className="inp" value={(tpl.remarks || []).join(', ')} disabled={locked}
                onChange={(e) => patch({ remarks: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
              <div className="field-hint">The write-in blocks below the checks.</div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

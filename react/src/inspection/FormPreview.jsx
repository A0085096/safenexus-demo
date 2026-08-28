import React from 'react';
import { sevColour } from './templates.js';

/* ══════════════════════════════════════════════════════════════
   The paper sheet.

   This is what prints for the clipboard in the yard, and it is the
   reason the whole platform exists: SafeNexus replaces this sheet,
   so the designer has to show the thing being replaced. The layout
   is the mining pre-use sheet — a black masthead, a row of header
   fields the operator fills in by hand, the No Go / Go But legend,
   the operator's declaration, then bands of items colour-coded by
   what failing one of them means.

   Nothing here is decorative. Red means the machine does not move.
   Yellow means it may move on a supervisor's signature, with a
   repair clock running. That is the entire safety case, printed.
   ══════════════════════════════════════════════════════════════ */
const bandTitle = (s) => (
  !s.condition || /^if\b/i.test(s.title.trim())
    ? s.title
    : `If ${s.condition.toLowerCase()} — ${s.title}`);

export default function FormPreview({ tpl, tenant = 'Acme Mining Corp' }) {
  if (!tpl) return null;
  const [title, subtitle] = tpl.name.includes(' — ')
    ? [tpl.name.split(' — ')[0], tpl.name.split(' — ').slice(1).join(' — ')]
    : [tpl.name, null];

  return (
    <div className="sheet">
      {/* masthead */}
      <div className="sheet-head">
        <div className="sheet-title">{title}</div>
        {subtitle && <div className="sheet-sub">{subtitle}</div>}
      </div>

      {/* the fields the operator fills in by hand, and the legend */}
      <div className="sheet-fields">
        {(tpl.header || []).map((h) => (
          <div className="sheet-field" key={h}>
            <div className="sheet-field-lbl">{h}</div>
            <div className="sheet-rule" />
          </div>
        ))}
        <div className="sheet-legend">
          <span><i style={{ background: sevColour('No Go').bg }} /> NO GO</span>
          <span><i style={{ background: sevColour('Go But').bg }} /> GO – BUT</span>
        </div>
      </div>

      {tpl.declaration && (
        <div className="sheet-decl">
          <b>Operator’s declaration. </b>{tpl.declaration}
        </div>
      )}

      {/* the checks, banded by what failing one of them costs */}
      {tpl.sections.map((s) => {
        const c = sevColour(s.severity);
        return (
          <div key={s.id}>
            <div className="sheet-band" style={{ background: c.bg, color: c.fg }}>
              {/* a title that already opens with "If" is its own
                  condition — prefixing it repeats the clause */}
              <span>{bandTitle(s)}</span>
              <span className="sheet-band-sev">{s.severity}</span>
            </div>
            {s.items.map((it, i) => (
              <div className="sheet-item" key={it.id}
                style={{ background: s.severity === 'No Go' || s.severity === 'Go But' ? c.tint : (i % 2 ? '#FCFDFE' : '#fff') }}>
                <span>{it.label}</span>
                <span className="sheet-tick" />
              </div>
            ))}
            {!s.items.length && (
              <div className="sheet-item sheet-item-empty"><span>No check items in this section yet.</span><span className="sheet-tick" /></div>
            )}
          </div>
        );
      })}

      {/* the bands the operator writes in */}
      {(tpl.remarks || []).map((r) => (
        <div key={r}>
          <div className="sheet-remark-hd">{r}</div>
          <div className="sheet-remark-box" />
        </div>
      ))}

      {tpl.note && <div className="sheet-note">Note: {tpl.note}</div>}

      {/* who signs, and in what order */}
      <div className="sheet-signs">
        {tpl.signoffs.map((s) => (
          <div className="sheet-sign" key={s}>
            <div className="sheet-sign-lbl">{s} — name, number, signature, date</div>
            <div className="sheet-rule" />
          </div>
        ))}
      </div>

      <div className="sheet-foot">
        <span>{tpl.code} · Rev {tpl.revision} · {tpl.owner}</span>
        <span>{tenant} · {tpl.industry || 'Mining'}</span>
      </div>
    </div>
  );
}

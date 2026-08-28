import React from 'react';
import {
  ClipboardCheck, Truck, AlertTriangle, CheckCircle2, XCircle, Wrench, Car, CarFront,
  Gauge, FileText, Printer, CircleAlert, RotateCcw, Users, Pencil, KeyRound, PauseCircle,
  PlayCircle, Trash2, Coins, CircleDot, Fuel,
} from 'lucide-react';
import { Btn, Badge, SecHead, KV, Avatar, resultBadge, vehicleBadge, roleBadge, statusBadge } from './ui.jsx';
import { Expiry, Money } from './erpUi.jsx';
import { allItems } from '../inspection/templates.js';
import { nf } from '../theme.js';
import {
  R, num, until, vehSpend, vehCpk, meterUnit,
} from '../erp/seed.js';

const Empty = ({ icon: Icon, text }) => (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
    <Icon size={26} strokeWidth={1.4} style={{ marginBottom: 10, opacity: .6 }} />
    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>{text}</div>
  </div>
);

/* ── vehicle ──────────────────────────────────────────────────── */
export function VehiclePane({ vehicle, defects, inspections, run }) {
  if (!vehicle) return <Empty icon={Truck} text="Select a vehicle to manage it." />;
  const v = vehicle;
  const mine = defects.filter((d) => d.plate === v.plate && d.status !== 'Closed');
  const noGo = mine.filter((d) => d.severity === 'No Go');
  const history = inspections.filter((i) => i.vehicle === v.plate).slice(0, 5);
  const toService = v.serviceDue - v.km;

  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{v.fleetNo} · {v.type}</div>
      <div style={{ font: '600 19px var(--num)', letterSpacing: '.4px', margin: '2px 0 8px' }}>{v.plate}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {vehicleBadge(v.status)}
        {v.permit && <Badge tone="purple">{v.permit}</Badge>}
        {noGo.length > 0 && <Badge tone="red">{noGo.length} no-go open</Badge>}
      </div>

      {v.status === 'Maintenance' && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>Grounded. It may not be operated until the no-go defect is closed and it is returned to service.</span>
        </div>
      )}

      <SecHead>Assignment</SecHead>
      <KV k="Operator" v={v.driver} />
      <KV k="Supervisor" v={v.sup} />
      <KV k="Site" v={v.site} />

      <SecHead>Condition</SecHead>
      <KV k="Meter" v={`${nf(v.km)} ${meterUnit(v)}`} />
      <KV k="Next service" v={toService > 0
        ? `${nf(toService)} ${meterUnit(v)} away (at ${nf(v.serviceDue)})`
        : <span style={{ color: 'var(--red)', fontWeight: 600 }}>overdue by {nf(-toService)} {meterUnit(v)}</span>} />
      <KV k="Last inspection" v={v.lastInsp} />
      <KV k="Model" v={`${v.year} ${v.make}`} />
      {v.vin && <KV k="VIN" v={<span style={{ fontFamily: 'var(--num)' }}>{v.vin}</span>} />}

      {v.cofExpiry && (
        <>
          <SecHead note="a lapsed certificate blocks dispatch">Certificates</SecHead>
          <KV k="Certificate of fitness" v={<Expiry date={v.cofExpiry} />} />
          <KV k="Licence disc" v={<Expiry date={v.licenceExpiry} />} />
          <KV k="Insurance" v={<Expiry date={v.insuranceExpiry} />} />
        </>
      )}

      {v.month && (
        <>
          <SecHead note="this month">Running cost</SecHead>
          <KV k="Distance or hours run" v={`${nf(v.month.meter)} ${meterUnit(v)}`} />
          <KV k="Fuel" v={`${R(v.month.fuel)} · ${nf(v.month.litres)} L`} />
          <KV k="Maintenance" v={R(v.month.maint)} />
          <KV k="Tyres" v={R(v.month.tyres)} />
          {v.finance?.instalment > 0 && <KV k="Instalment" v={R(v.finance.instalment)} />}
          <KV k="Total" v={<Money v={vehSpend(v)} bold />} />
          <KV k="Cost per unit run" v={vehCpk(v)
            ? <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>R {vehCpk(v).toFixed(2)}</span>
            : '—'} />
          <KV k="Utilisation" v={`${v.month.utilPct}% · ${v.month.idlePct}% idling`} />
        </>
      )}

      {v.finance && (
        <>
          <SecHead>How it is held</SecHead>
          <KV k="Footing" v={v.finance.kind} />
          {v.finance.kind !== 'Owned outright' && <>
            <KV k="Financier" v={v.finance.financier} />
            <KV k="Contract ends" v={<Expiry date={v.finance.end} />} />
            <KV k="Settlement value" v={R(v.finance.residual)} />
          </>}
          <KV k="Purchase price" v={R(v.finance.purchase)} />
        </>
      )}

      {v.telematics && (
        <>
          <SecHead>Telematics</SecHead>
          <KV k="Unit" v={<span style={{ fontFamily: 'var(--num)' }}>{v.telematics.unit}</span>} />
          <KV k="Reporting" v={v.telematics.online
            ? <Badge tone="green">Online</Badge>
            : <Badge tone="red">Offline since {v.telematics.lastPing}</Badge>} />
          <KV k="Last position" v={v.telematics.lastPing} />
        </>
      )}

      <SecHead note={mine.length ? undefined : 'none open'}>Open defects</SecHead>
      {mine.length === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>No open defects against this vehicle.</div>
        : mine.map((d) => (
          <div key={d.id} className="sheet-row">
            <Badge tone={d.severity === 'No Go' ? 'red' : 'gold'}>{d.severity}</Badge>
            <span className="s">{d.item}</span>
            <span style={{ fontSize: 11.5, color: d.status === 'Overdue' ? 'var(--red)' : 'var(--text3)' }}>{d.due}</span>
            <Btn small onClick={() => run('closeDefect:' + d.id)}>Close</Btn>
          </div>
        ))}

      <SecHead>Recent inspections</SecHead>
      {history.length === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>Nothing captured against this vehicle yet.</div>
        : history.map((i) => (
          <div key={i.ref} className="sheet-row">
            <span className="s" style={{ fontFamily: 'var(--num)' }}>#{i.ref}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{i.date}</span>
            {resultBadge(i.result)}
          </div>
        ))}

      <SecHead>Actions</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn small primary icon={ClipboardCheck} onClick={() => run('startInspection')}>Inspect</Btn>
        {v.status === 'Maintenance'
          ? <Btn small icon={RotateCcw} onClick={() => run('returnService')}>Return to service</Btn>
          : <Btn small icon={XCircle} onClick={() => run('ground')}>Take off road</Btn>}
        {v.driver === '—'
          ? <Btn small icon={Car} onClick={() => run('assignVehicle')}>Assign</Btn>
          : <Btn small icon={CarFront} onClick={() => run('unassignVehicle')}>Unassign</Btn>}
        <Btn small icon={Gauge} onClick={() => run('logOdo')}>Odometer</Btn>
        <Btn small icon={Wrench} onClick={() => run('bookService')}>Book service</Btn>
        <Btn small icon={Coins} onClick={() => run('goto:costs')}>Costs</Btn>
        <Btn small icon={Fuel} onClick={() => run('goto:fuel')}>Fuel</Btn>
        <Btn small icon={CircleDot} onClick={() => run('goto:tyres')}>Tyres</Btn>
        <Btn small icon={Printer} onClick={() => run('print')}>Print card</Btn>
      </div>
    </div>
  );
}

/* ── completed inspection sheet ───────────────────────────────── */
export function InspectionPane({ inspection, templates, defects, run }) {
  if (!inspection) return <Empty icon={ClipboardCheck} text="Select an inspection to see the completed sheet." />;
  const i = inspection;
  const tpl = templates.find((t) => t.id === i.templateId);
  const items = tpl ? allItems(tpl) : [];
  const answered = i.sheet ? items.filter((x) => i.sheet[x.id]) : [];
  const failed = answered.filter((x) => i.sheet[x.id] === 'No Go');
  const conceded = answered.filter((x) => i.sheet[x.id] === 'Go But');
  const mine = defects.filter((d) => d.inspection === i.ref);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>
        #{i.ref}{tpl ? ` · ${tpl.code} Rev ${tpl.revision}` : ''}
      </div>
      <div style={{ font: '600 19px var(--num)', letterSpacing: '.4px', margin: '2px 0 8px' }}>{i.vehicle}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {resultBadge(i.result)}
        <Badge tone="blue">Shift {i.shift}</Badge>
        {i.signed ? <Badge tone="green">Signed off</Badge> : <Badge tone="gold">Awaiting sign-off</Badge>}
        {i.rejected && <Badge tone="red">Returned to operator</Badge>}
      </div>

      {i.result === 'no-go' && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>{failed.length || i.ng} no-go item{(failed.length || i.ng) === 1 ? '' : 's'}. The vehicle may not be used until the defect is repaired and signed off.</span>
        </div>
      )}
      {i.result === 'go-but' && i.supSigned === false && (
        <div style={{ background: 'var(--gold-bg)', border: '1px solid #EDD9B0', color: 'var(--gold)', padding: '8px 10px', borderRadius: 4, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
          A go-but concession is running without a supervisor signature. Until it is signed, treat this vehicle as a no-go.
        </div>
      )}

      <SecHead>Capture</SecHead>
      <KV k="Operator" v={i.op} />
      <KV k="Company" v={i.co} />
      <KV k="Captured" v={i.date} />
      {i.meter ? <KV k="Meter reading" v={`${nf(i.meter)} km`} /> : null}
      {i.conds?.length ? <KV k="Conditions" v={i.conds.join(', ')} /> : null}
      <KV k="Result" v={`${i.ok} in order · ${i.go} go-but · ${i.ng} no-go`} />

      {failed.length > 0 && (
        <>
          <SecHead>No-go items</SecHead>
          {failed.map((x) => (
            <div key={x.id} className="sheet-row">
              <Badge tone="red">No Go</Badge><span className="s">{x.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{x.section}</span>
            </div>
          ))}
        </>
      )}
      {conceded.length > 0 && (
        <>
          <SecHead note={`${tpl?.goButMaxDays ?? 30}-day repair clock`}>Go-but items</SecHead>
          {conceded.map((x) => (
            <div key={x.id} className="sheet-row">
              <Badge tone="gold">Go But</Badge><span className="s">{x.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{x.section}</span>
            </div>
          ))}
        </>
      )}

      {i.remarks ? (<><SecHead>Operator’s remarks</SecHead>
        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text2)' }}>{i.remarks}</div></>) : null}

      {mine.length > 0 && (
        <>
          <SecHead>Defects raised</SecHead>
          {mine.map((d) => (
            <div key={d.id} className="sheet-row">
              <span className="s" style={{ fontFamily: 'var(--num)', fontSize: 11.5 }}>{d.id}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{d.item}</span>
              <Badge tone={d.status === 'Closed' ? 'green' : d.severity === 'No Go' ? 'red' : 'gold'}>{d.status}</Badge>
            </div>
          ))}
        </>
      )}

      <SecHead>Sign-off</SecHead>
      {i.signed
        ? <div style={{ fontSize: 12.5, color: 'var(--green)' }}>
            <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
            Signed by {i.signedBy || 'the supervisor'}.
          </div>
        : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn small primary icon={CheckCircle2} onClick={() => run('signOff')}>Sign off</Btn>
            <Btn small icon={XCircle} onClick={() => run('rejectInspection')}>Return to operator</Btn>
            <Btn small icon={Printer} onClick={() => run('print')}>Print sheet</Btn>
          </div>
        )}
    </div>
  );
}

/* ── defect ───────────────────────────────────────────────────── */
export function DefectPane({ defect, workOrders, settings, run }) {
  if (!defect) return <Empty icon={CircleAlert} text="Select a defect to work it." />;
  const d = defect;
  const lapsed = d.status === 'Overdue';
  const wo = workOrders?.find((w) => w.ref === d.workOrder);
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{d.id}</div>
      <div style={{ fontSize: 17, fontWeight: 600, margin: '2px 0 8px', lineHeight: 1.4 }}>{d.item}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge tone={d.severity === 'No Go' ? 'red' : 'gold'}>{d.severity}</Badge>
        <Badge tone={d.status === 'Closed' ? 'green' : lapsed ? 'red' : 'blue'}>{d.status}</Badge>
        <Badge tone="purple">{d.plate}</Badge>
      </div>

      {lapsed && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>The concession lapsed on {d.due}. The vehicle is running on an expired go-but, which is
            no better than running with no inspection at all.</span>
        </div>
      )}
      {d.severity === 'Go But' && !d.supervisorSigned && d.status !== 'Closed' && (
        <div style={{ background: 'var(--gold-bg)', border: '1px solid #EDD9B0', color: 'var(--gold)', padding: '8px 10px', borderRadius: 4, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
          No supervisor has signed this concession. Until one does, treat the vehicle as a no-go.
        </div>
      )}

      <SecHead>Defect</SecHead>
      <KV k="From inspection" v={
        <button className="link" onClick={() => run('openInspection:' + d.inspection)}>#{d.inspection}</button>
      } />
      <KV k="Section" v={d.section} />
      <KV k="Vehicle" v={d.plate} />
      <KV k="Raised" v={`${d.raised} by ${d.raisedBy}`} />
      <KV k="Rectify by" v={<span style={{ color: lapsed ? 'var(--red)' : 'var(--text)', fontWeight: lapsed ? 600 : 400 }}>{d.due}</span>} />
      <KV k="Concession" v={d.severity === 'No Go'
        ? 'Not applicable — a no-go grounds the vehicle'
        : d.supervisorSigned ? 'Signed by the supervisor' : 'Unsigned — treat as a no-go'} />
      <KV k="Work order" v={wo
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openWO:' + wo.ref)}>{wo.ref} · {wo.status}</button>
        : 'Not raised'} />
      {d.closedOn && <KV k="Closed" v={d.closedOn} />}

      <SecHead>Note</SecHead>
      <div style={{ fontSize: 12.5, lineHeight: 1.7, background: 'var(--pane)', border: '1px solid var(--stroke)', borderRadius: 4, padding: 10 }}>
        {d.note}
      </div>

      {d.status !== 'Closed' && (
        <>
          <SecHead>Actions</SecHead>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn small primary icon={CheckCircle2} onClick={() => run('closeDefect:' + d.id)}>Close defect</Btn>
            {!d.workOrder && <Btn small icon={Wrench} onClick={() => run('raiseWO:' + d.id)}>Raise work order</Btn>}
            {d.severity === 'Go But' && !d.supervisorSigned
              && <Btn small icon={CheckCircle2} onClick={() => run('signConcession:' + d.id)}>Sign concession</Btn>}
            {d.severity === 'Go But'
              && <Btn small icon={FileText} onClick={() => run('extendDefect:' + d.id)}>Extend</Btn>}
          </div>
        </>
      )}
    </div>
  );
}

/* ── work order ───────────────────────────────────────────────── */
export function WorkOrderPane({ wo, defects, run }) {
  if (!wo) return <Empty icon={Wrench} text="Select a work order." />;
  const d = defects.find((x) => x.id === wo.defect);
  const NEXT = ['Awaiting authorisation', 'Awaiting parts', 'In progress', 'Road test', 'Completed'];
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{wo.ref}</div>
      <div style={{ font: '600 19px var(--num)', letterSpacing: '.4px', margin: '2px 0 8px' }}>{wo.vehicle}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge tone={wo.status === 'Completed' ? 'green' : wo.status === 'In progress' ? 'blue' : 'gold'}>{wo.status}</Badge>
        <Badge tone="grey">{wo.type}</Badge>
      </div>
      {d && d.severity === 'No Go' && d.status !== 'Closed' && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>{wo.vehicle} stays off the road until {d.id} is closed and it is returned to service.</span>
        </div>
      )}
      <SecHead>Job</SecHead>
      <KV k="Opened" v={wo.opened} />
      <KV k="Assigned to" v={wo.assigned} />
      {wo.technician && wo.technician !== '—' && <KV k="Technician" v={wo.technician} />}
      {wo.priority && <KV k="Priority" v={
        <Badge tone={wo.priority === 'Critical' ? 'red' : wo.priority === 'High' ? 'gold' : 'grey'}>{wo.priority}</Badge>} />}
      {wo.meter > 0 && <KV k="Meter at open" v={nf(wo.meter)} />}
      <KV k="Days down" v={wo.downtimeDays > 4 && wo.status !== 'Completed'
        ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{wo.downtimeDays} — past the five-day escalation</span>
        : `${wo.downtimeDays || 0}`} />
      <KV k="From defect" v={d
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openDefect:' + d.id)}>{d.id} · {d.item}</button>
        : 'Raised directly'} />
      {wo.authorisedBy && <KV k="Authorised by" v={`${wo.authorisedBy} on ${wo.authorised}`} />}

      <SecHead>Reported fault</SecHead>
      <div style={{ fontSize: 12.5, lineHeight: 1.7, background: 'var(--pane)', border: '1px solid var(--stroke)', borderRadius: 4, padding: 10 }}>
        {wo.fault || wo.note}
      </div>

      {/* labour and parts are what the job card actually costs —
          without them it is a note, not a cost */}
      <SecHead note={`${wo.labourHours || 0} hours at ${R(wo.labourRate || 465)}`}>Labour</SecHead>
      <KV k="Booked" v={`${wo.labourHours || 0} hours`} />
      <KV k="Labour cost" v={R((wo.labourHours || 0) * (wo.labourRate || 465))} />

      <SecHead note={(wo.parts || []).length ? `${wo.parts.length} line${wo.parts.length === 1 ? '' : 's'}` : 'nothing issued'}>Parts issued</SecHead>
      {(wo.parts || []).length
        ? wo.parts.map((l, i) => (
          <div key={i} className="sheet-row">
            <span className="s" style={{ fontSize: 11.5 }}>{l.desc}</span>
            <span style={{ fontSize: 11.5, color: 'var(--text3)', fontFamily: 'var(--num)' }}>{l.qty} ×</span>
            <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{R(l.qty * l.price)}</span>
          </div>
        ))
        : <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>Nothing issued to this job card yet.</div>}

      <SecHead>Job cost</SecHead>
      <KV k="Labour" v={R((wo.labourHours || 0) * (wo.labourRate || 465))} />
      <KV k="Parts" v={R((wo.parts || []).reduce((a, l) => a + l.qty * l.price, 0))} />
      <KV k="Total" v={<Money v={(wo.labourHours || 0) * (wo.labourRate || 465)
        + (wo.parts || []).reduce((a, l) => a + l.qty * l.price, 0)} bold />} />

      <SecHead>Move it on</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {wo.status === 'Awaiting authorisation'
          ? <Btn small primary onClick={() => run('authoriseWO')}>Authorise</Btn>
          : null}
        {NEXT.filter((x) => x !== wo.status).map((x) => (
          <Btn key={x} small primary={x === 'Completed'} onClick={() => run('woStatus:' + x)}>{x}</Btn>
        ))}
      </div>
      <SecHead>Actions</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn small icon={Gauge} onClick={() => run('bookLabour')}>Book labour</Btn>
        <Btn small icon={Wrench} onClick={() => run('issuePart')}>Issue parts</Btn>
        <Btn small icon={Truck} onClick={() => run('openWOVehicle')}>Open the vehicle</Btn>
        <Btn small icon={Printer} onClick={() => run('print')}>Print job card</Btn>
      </div>
    </div>
  );
}

/* ── inspection form ──────────────────────────────────────────── */
export function FormPane({ template, run }) {
  if (!template) return <Empty icon={ClipboardCheck} text="Select a form to see what it asks." />;
  const t = template;
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{t.code} · Rev {t.revision}</div>
      <div style={{ fontSize: 16, fontWeight: 600, margin: '2px 0 8px', lineHeight: 1.4 }}>{t.name}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {t.status === 'Published' ? <Badge tone="green">Published</Badge> : <Badge tone="gold">Draft</Badge>}
        <Badge tone="grey">{t.owner}</Badge>
      </div>
      <SecHead>Rules</SecHead>
      <KV k="Applies to" v={t.appliesTo.join(', ')} />
      <KV k="Meter" v={t.meterLabel} />
      <KV k="Go-but window" v={`${t.goButMaxDays} days`} />
      <KV k="Sign-off chain" v={t.signoffs.join(' → ')} />
      <KV k="Last updated" v={t.updated} />
      <KV k="Used this month" v={`${t.usedThisMonth} sheets`} />
      <SecHead>Declaration</SecHead>
      <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--text2)' }}>{t.declaration}</div>
      <SecHead note={`${t.sections.reduce((a, x) => a + x.items.length, 0)} items`}>Sections</SecHead>
      {t.sections.map((sec) => (
        <div key={sec.id} className="sheet-row">
          <span className="s">
            {sec.title}
            {sec.condition && <span style={{ color: 'var(--text3)' }}> · only when “{sec.condition}”</span>}
          </span>
          <Badge tone={sec.severity === 'No Go' ? 'red' : 'gold'}>{sec.severity}</Badge>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{sec.items.length}</span>
        </div>
      ))}
      <SecHead>Actions</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {t.status === 'Published'
          ? <Btn small primary icon={ClipboardCheck} onClick={() => run('startInspection:' + t.id)}>Use this form</Btn>
          : <Btn small primary icon={CheckCircle2} onClick={() => run('publishForm')}>Publish</Btn>}
        <Btn small icon={FileText} onClick={() => run('reviseForm')}>New revision</Btn>
        <Btn small onClick={() => run('print')}>Print blank</Btn>
      </div>
    </div>
  );
}

/* ── user ─────────────────────────────────────────────────────── */
export function UserPane({ user, vehicles, inspections, siteOf, run }) {
  if (!user) return <Empty icon={Users} text="Select a user to manage them." />;
  const u = user;
  const history = inspections.filter((i) => i.op === u.name).slice(0, 4);
  const veh = vehicles.find((v) => v.plate === u.vehicle);
  const suspended = u.status === 'Suspended';

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
        <Avatar init={u.init} tone={u.tone} large />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{u.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.empNo} · {siteOf(u.site)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {roleBadge(u.role)}{statusBadge(u.status)}
      </div>

      {suspended && (
        <div style={{ background: 'var(--gold-bg)', border: '1px solid #EDD9B0', color: 'var(--gold)', padding: '8px 10px', borderRadius: 4, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
          Suspended. They cannot sign in or submit inspections until they are reactivated.
        </div>
      )}

      <SecHead>Contact</SecHead>
      <KV k="Email" v={<span style={{ color: 'var(--brand-dark)' }}>{u.email}</span>} />
      <KV k="Mobile" v={u.phone} />
      <KV k="Site" v={siteOf(u.site)} />
      <KV k="Started" v={u.started} />
      <KV k="Last active" v={u.lastActive} />

      <SecHead>Role and reporting</SecHead>
      <KV k="Role" v={u.role} />
      <KV k="Reports to" v={u.reports} />
      <KV k="Duty state" v={u.duty || '—'} />

      <SecHead note="a lapsed certificate stops them being rostered">Certificates</SecHead>
      <KV k="Driving licence" v={u.licenceExpiry
        ? <span><span style={{ fontSize: 11.5, color: 'var(--text2)' }}>{u.licenceCode} · </span><Expiry date={u.licenceExpiry} showDate={false} /></span>
        : u.licence} />
      {u.prdpExpiry && <KV k="Operating card (PrDP)" v={<Expiry date={u.prdpExpiry} />} />}
      {u.medicalExpiry && <KV k="Medical certificate" v={<Expiry date={u.medicalExpiry} />} />}
      {u.dgTraining && <KV k="Dangerous goods" v={<Expiry date={u.dgTraining} />} />}

      {u.competencies?.length > 0 && (
        <>
          <SecHead note={`${u.competencies.length} held`}>Competencies</SecHead>
          {u.competencies.map((c) => (
            <div key={c.name} className="sheet-row">
              <span className="s">{c.name}</span>
              <Expiry date={c.expires} showDate={false} />
            </div>
          ))}
        </>
      )}

      <SecHead>Vehicle</SecHead>
      {u.vehicle && u.vehicle !== '—'
        ? (
          <>
            <KV k="Assigned" v={<span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{u.vehicle}</span>} />
            {veh && <KV k="Model" v={`${veh.make} · ${veh.fleetNo}`} />}
            {veh && <KV k="Status" v={veh.status} />}
          </>
        )
        : <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>No vehicle assigned.</div>}

      {u.role === 'Operator' && u.events && (
        <>
          <SecHead note="from the telematics feed">Operating record</SecHead>
          <KV k="Behaviour score" v={
            <span style={{ fontWeight: 600, color: u.score >= 75 ? 'var(--green)' : u.score >= 55 ? 'var(--gold)' : 'var(--red)' }}>
              {u.score}
              <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 11.5 }}>
                {' '}· {u.score < 45 ? 'stand down for coaching' : u.score < 65 ? 'coaching due' : 'good standing'}
              </span>
            </span>} />
          <KV k="Over-speeding events" v={u.events.speeding} />
          <KV k="Harsh braking and cornering" v={u.events.harsh} />
          <KV k="Idling" v={`${u.events.idle}% of engine hours`} />
          <KV k="Hours this week" v={
            <span style={{ color: u.hoursWeek > 55 ? 'var(--red)' : 'var(--text)', fontWeight: u.hoursWeek > 55 ? 600 : 400 }}>
              {u.hoursWeek} of 60
            </span>} />
          <KV k="Distance this month" v={`${nf(u.kmMonth)} km`} />
          <KV k="Haulage jobs" v={u.jobsMonth} />
          <KV k="Incidents" v={u.incidents
            ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>{u.incidents}</span>
            : <span style={{ color: 'var(--text3)' }}>none</span>} />
        </>
      )}

      {u.role === 'Operator' && (
        <>
          <SecHead>Inspection record</SecHead>
          <KV k="Submitted" v={`${u.insps} inspections`} />
          <KV k="Pass rate" v={u.passRate ? `${u.passRate}%` : '—'} />
          <KV k="Defects raised" v={u.defects} />
          {history.map((i) => (
            <div key={i.ref} className="sheet-row">
              <span className="s" style={{ fontFamily: 'var(--num)' }}>#{i.ref}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{i.vehicle}</span>
              {resultBadge(i.result)}
            </div>
          ))}
        </>
      )}

      <SecHead>Actions</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn small primary icon={Pencil} onClick={() => run('editUser')}>Edit</Btn>
        {u.vehicle && u.vehicle !== '—'
          ? <Btn small icon={CarFront} onClick={() => run('unassignUserVehicle')}>Unassign vehicle</Btn>
          : <Btn small icon={Car} onClick={() => run('assignUserVehicle')}>Assign vehicle</Btn>}
        <Btn small icon={KeyRound} onClick={() => run('resetPassword')}>Reset password</Btn>
        {u.status === 'Suspended'
          ? <Btn small icon={PlayCircle} onClick={() => run('reactivateUser')}>Reactivate</Btn>
          : <Btn small icon={PauseCircle} onClick={() => run('suspendUser')}>Suspend</Btn>}
        <Btn small danger icon={Trash2} onClick={() => run('deleteUser')}>Delete</Btn>
      </div>
    </div>
  );
}

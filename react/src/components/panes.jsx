import React from 'react';
import {
  ClipboardCheck, Truck, AlertTriangle, CheckCircle2, XCircle, Wrench, Car, CarFront,
  Gauge, FileText, Printer, CircleAlert, RotateCcw, Users, Pencil, KeyRound, PauseCircle,
  PlayCircle, Trash2, GraduationCap, Mail, Phone,
} from 'lucide-react';
import { Btn, Badge, SecHead, KV, Avatar, resultBadge, vehicleBadge, roleBadge, statusBadge } from './ui.jsx';
import { allItems } from '../inspection/templates.js';
import { nf } from '../theme.js';

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
  const mine = defects.filter((d) => d.plate === v.plate && d.status === 'Open');
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
      <KV k="Company" v={v.co} />

      <SecHead>Condition</SecHead>
      <KV k="Odometer" v={`${nf(v.km)} km`} />
      <KV k="Next service" v={toService > 0 ? `${nf(toService)} km away (at ${nf(v.serviceDue)})` : <span style={{ color: 'var(--red)', fontWeight: 600 }}>overdue by {nf(-toService)} km</span>} />
      <KV k="Last inspection" v={v.lastInsp} />
      <KV k="COF expiry" v={v.cof} />
      <KV k="Model year" v={`${v.make} · ${v.year}`} />

      <SecHead note={mine.length ? undefined : 'none open'}>Open defects</SecHead>
      {mine.length === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>No open defects against this vehicle.</div>
        : mine.map((d) => (
          <div key={d.id} className="sheet-row">
            <Badge tone={d.severity === 'No Go' ? 'red' : 'gold'}>{d.severity}</Badge>
            <span className="s">{d.item}</span>
            <span style={{ fontSize: 11.5, color: d.age > 30 ? 'var(--red)' : 'var(--text3)' }}>{d.age} d</span>
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
export function DefectPane({ defect, run }) {
  if (!defect) return <Empty icon={CircleAlert} text="Select a defect to work it." />;
  const d = defect;
  const over = d.age > 30;
  return (
    <div style={{ padding: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{d.id}</div>
      <div style={{ fontSize: 17, fontWeight: 600, margin: '2px 0 8px' }}>{d.item}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Badge tone={d.severity === 'No Go' ? 'red' : 'gold'}>{d.severity}</Badge>
        <Badge tone={d.status === 'Closed' ? 'green' : 'grey'}>{d.status}</Badge>
        {over && d.status === 'Open' && <Badge tone="red">past the 30-day rule</Badge>}
      </div>
      <SecHead>Detail</SecHead>
      <KV k="Vehicle" v={d.plate} />
      <KV k="Company" v={d.co} />
      <KV k="Raised" v={`${d.raised} · ${d.age} days ago`} />
      <KV k="From inspection" v={'#' + d.inspection} />
      {d.severity === 'No Go' && <KV k="Effect" v="Vehicle grounded until closed" />}
      {d.status === 'Open' && (
        <>
          <SecHead>Actions</SecHead>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn small primary icon={CheckCircle2} onClick={() => run('closeDefect:' + d.id)}>Close defect</Btn>
            <Btn small icon={Wrench} onClick={() => run('bookService')}>Book repair</Btn>
            {d.severity === 'Go But' && <Btn small icon={FileText} onClick={() => run('extendDefect:' + d.id)}>Extend concession</Btn>}
          </div>
        </>
      )}
    </div>
  );
}

/* ── user ─────────────────────────────────────────────────────── */
const trainingTone = (s) => ({ Valid: 'green', Expiring: 'gold', Expired: 'red', 'In progress': 'blue' }[s] || 'grey');

export function UserPane({ user, vehicles, inspections, courses, enrolments, run }) {
  if (!user) return <Empty icon={Users} text="Select a user to manage them." />;
  const u = user;
  const mine = enrolments.filter((e) => e.user === u.name);
  const required = courses.filter((c) => c.roles.includes(u.role) && c.required);
  const gaps = required.filter((c) => {
    const e = mine.find((x) => x.course === c.id);
    return !e || e.status === 'Expired';
  });
  const history = inspections.filter((i) => i.op === u.name).slice(0, 4);
  const veh = vehicles.find((v) => v.plate === u.vehicle);
  const suspended = u.status === 'Suspended';

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
        <Avatar init={u.init} tone={u.tone} large />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{u.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.empNo} · {u.co}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {roleBadge(u.role)}{statusBadge(u.status)}
        {gaps.length > 0 && <Badge tone="red">{gaps.length} training gap{gaps.length === 1 ? '' : 's'}</Badge>}
      </div>

      {suspended && (
        <div style={{ background: 'var(--gold-bg)', border: '1px solid #EDD9B0', color: 'var(--gold)', padding: '8px 10px', borderRadius: 4, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
          Suspended. They cannot sign in or submit inspections until they are reactivated.
        </div>
      )}

      <SecHead>Contact</SecHead>
      <KV k="Email" v={<span style={{ color: 'var(--brand-dark)' }}>{u.email}</span>} />
      <KV k="Mobile" v={u.phone} />
      <KV k="Site" v={u.site} />
      <KV k="Started" v={u.started} />
      <KV k="Last active" v={u.lastActive} />

      <SecHead>Role and reporting</SecHead>
      <KV k="Role" v={u.role} />
      <KV k="Reports to" v={u.reports} />
      <KV k="Licence" v={u.licence} />
      <KV k="COF expiry" v={u.cof} />

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

      <SecHead note={`${mine.filter((e) => e.status === 'Valid').length} of ${required.length} required valid`}>Training</SecHead>
      {mine.length === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>No training recorded.</div>
        : mine.map((e) => {
          const c = courses.find((x) => x.id === e.course);
          return (
            <div key={e.course} className="sheet-row">
              <span className="s">{c?.name || e.course}</span>
              {e.status === 'In progress'
                ? <span style={{ fontSize: 11, color: 'var(--text3)' }}>{e.progress}%</span>
                : <span style={{ fontSize: 11, color: 'var(--text3)' }}>{e.expires || '—'}</span>}
              <Badge tone={trainingTone(e.status)}>{e.status}</Badge>
            </div>
          );
        })}
      {gaps.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6, lineHeight: 1.5 }}>
          Missing or expired: {gaps.map((c) => c.name).join(', ')}.
        </div>
      )}

      <SecHead>Actions</SecHead>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn small primary icon={Pencil} onClick={() => run('editUser')}>Edit</Btn>
        {u.vehicle && u.vehicle !== '—'
          ? <Btn small icon={CarFront} onClick={() => run('unassignUserVehicle')}>Unassign vehicle</Btn>
          : <Btn small icon={Car} onClick={() => run('assignUserVehicle')}>Assign vehicle</Btn>}
        <Btn small icon={GraduationCap} onClick={() => run('enrol')}>Assign training</Btn>
        <Btn small icon={KeyRound} onClick={() => run('resetPassword')}>Reset password</Btn>
        {suspended
          ? <Btn small icon={PlayCircle} onClick={() => run('reactivateUser')}>Reactivate</Btn>
          : <Btn small icon={PauseCircle} onClick={() => run('suspendUser')}>Suspend</Btn>}
        <Btn small danger icon={Trash2} onClick={() => run('deleteUser')}>Delete</Btn>
      </div>
    </div>
  );
}

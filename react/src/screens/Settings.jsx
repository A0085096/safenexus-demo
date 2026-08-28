import React, { useMemo, useState } from 'react';
import {
  Truck,
  Building2, ShieldCheck, ClipboardCheck, Bell, Plug, Database, KeyRound,
  Check, RotateCcw, AlertTriangle, Info, CircleCheck, XCircle,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { Btn, Badge, Panel, SecHead, KV } from '../components/ui.jsx';

/* ══════════════════════════════════════════════════════════════
   Settings that mean something: the inspection rules on this page
   are read by the runner, the defect clock and the compliance
   thresholds, so changing one changes how the platform behaves.
   Edits are staged, then saved as a set and written to the audit.
   ══════════════════════════════════════════════════════════════ */

const SECTIONS = [
  { id: 'org', label: 'Organisation', icon: Building2 },
  { id: 'inspection', label: 'Inspection rules', icon: ClipboardCheck },
  { id: 'operations', label: 'Fleet operations', icon: Truck },
  { id: 'security', label: 'Security and access', icon: ShieldCheck },
  { id: 'roles', label: 'Roles and permissions', icon: KeyRound },
  { id: 'notify', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'data', label: 'Data and retention', icon: Database },
];

const Row = ({ label, note, children }) => (
  <div className="set-row">
    <div className="set-lbl">
      <div className="l">{label}</div>
      {note && <div className="n">{note}</div>}
    </div>
    <div className="set-ctl">{children}</div>
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} aria-pressed={on}><span /></button>
);

const PERMISSIONS = [
  ['Capture an inspection', 1, 1, 1, 0],
  ['Sign off an inspection', 0, 1, 1, 1],
  ['Sign a go-but concession', 0, 1, 1, 1],
  ['Close a defect', 0, 1, 1, 1],
  ['Ground and return a vehicle', 0, 1, 1, 1],
  ['Assign a vehicle', 0, 1, 1, 1],
  ['Add or edit a user', 0, 0, 1, 1],
  ['Suspend or delete a user', 0, 0, 0, 1],
  ['Change inspection rules', 0, 0, 0, 1],
  ['Export the audit trail', 0, 0, 1, 1],
];
const ROLES = ['Operator', 'Supervisor', 'Safety officer', 'Administrator'];

const INTEGRATIONS = [
  { name: 'Microsoft Entra ID', kind: 'Single sign-on', status: 'Connected', note: 'SAML 2.0 · 248 users provisioned', tone: 'green' },
  { name: 'Sage 300 People', kind: 'HR records', status: 'Connected', note: 'Nightly employee sync at 01:30', tone: 'green' },
  { name: 'MiX Telematics', kind: 'Telematics', status: 'Available', note: 'Pull odometer readings automatically', tone: 'grey' },
  { name: 'NaTIS licence lookup', kind: 'Compliance', status: 'Connected', note: 'Vehicle licence and COF verification', tone: 'green' },
  { name: 'Twilio SMS', kind: 'Notifications', status: 'Error', note: 'Credentials rejected on 17 Jun', tone: 'red' },
  { name: 'Power BI', kind: 'Analytics', status: 'Available', note: 'Publish the datasets to your workspace', tone: 'grey' },
];

export default function Settings({ run }) {
  const { settings, set, dispatch, me, audit } = useStore();
  const [section, setSection] = useState('org');
  const [draft, setDraft] = useState({});

  const v = useMemo(() => ({ ...settings, ...draft }), [settings, draft]);
  const dirty = Object.keys(draft).filter((k) => settings[k] !== draft[k]);
  const edit = (k) => (val) => setDraft((d) => ({ ...d, [k]: val }));

  const save = () => {
    const patch = Object.fromEntries(dirty.map((k) => [k, draft[k]]));
    set(patch, SECTIONS.find((s) => s.id === section).label);
    setDraft({});
  };

  const changes = audit.filter((a) => a.meta === 'Configuration change').slice(0, 4);

  return (
    <div className="settings">
      <aside className="set-nav">
        {SECTIONS.map((s) => (
          <button key={s.id} className={'set-nav-item' + (section === s.id ? ' on' : '')} onClick={() => setSection(s.id)}>
            <s.icon size={15} strokeWidth={1.8} />{s.label}
          </button>
        ))}
        <div className="set-nav-foot">
          <SecHead>Recent changes</SecHead>
          {changes.length === 0
            ? <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>No configuration changes yet.</div>
            : changes.map((c) => (
              <div key={c.id} style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 6 }}>
                <b style={{ color: 'var(--text2)' }}>{c.actor}</b> · {c.time}
              </div>
            ))}
        </div>
      </aside>

      <div className="set-body">
        {dirty.length > 0 && (
          <div className="set-bar">
            <AlertTriangle size={15} />
            <span>{dirty.length} unsaved change{dirty.length === 1 ? '' : 's'} on this page.</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Btn small icon={RotateCcw} onClick={() => setDraft({})}>Discard</Btn>
              <Btn small primary icon={Check} onClick={save}>Save changes</Btn>
            </span>
          </div>
        )}

        {section === 'org' && (
          <Panel title="Organisation" note="how the platform presents itself">
            <Row label="Platform name" note="Shown in the title bar and on every export.">
              <input className="inp" value={v.platformName} onChange={(e) => edit('platformName')(e.target.value)} />
            </Row>
            <Row label="Support address" note="Where operators are told to write when they are stuck.">
              <input className="inp" type="email" value={v.supportEmail} onChange={(e) => edit('supportEmail')(e.target.value)} />
            </Row>
            <Row label="Timezone" note="Inspection timestamps are recorded against it.">
              <select className="inp" value={v.timezone} onChange={(e) => edit('timezone')(e.target.value)}>
                {['Africa/Johannesburg (SAST)', 'Africa/Windhoek (CAT)', 'Africa/Gaborone (CAT)'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Row>
            <Row label="Date format">
              <select className="inp" value={v.dateFormat} onChange={(e) => edit('dateFormat')(e.target.value)}>
                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Row>
          </Panel>
        )}

        {section === 'inspection' && (
          <>
            <div className="infobar">
              <Info size={15} />
              <span>These rules are read by the inspection runner, the defect clock and the compliance
                thresholds. Changing one changes how every capture behaves from the next sheet onwards.</span>
            </div>
            <Panel title="Defects and concessions">
              <Row label="Go-but repair window" note="How long a conceded item may run before it breaches.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="90" value={v.goButMaxDays}
                    onChange={(e) => edit('goButMaxDays')(+e.target.value)} />
                  <span>days</span>
                </div>
              </Row>
              <Row label="A go-but needs a supervisor's signature" note="With this off, a conceded sheet passes without a signature.">
                <Toggle on={v.requireConcession} onChange={edit('requireConcession')} />
              </Row>
              <Row label="Ground the vehicle on a no-go" note="Takes the vehicle off the road the moment a no-go item is captured.">
                <Toggle on={v.autoGroundOnNoGo} onChange={edit('autoGroundOnNoGo')} />
              </Row>
            </Panel>
            <Panel title="Targets and warnings">
              <Row label="Compliance target" note="The line drawn on every pass-rate bar.">
                <div className="set-num">
                  <input className="inp" type="number" min="50" max="100" value={v.complianceTarget}
                    onChange={(e) => edit('complianceTarget')(+e.target.value)} /><span>%</span>
                </div>
              </Row>
              <Row label="Pass-rate target" note="Reported against on the dashboard.">
                <div className="set-num">
                  <input className="inp" type="number" min="50" max="100" value={v.passRateTarget}
                    onChange={(e) => edit('passRateTarget')(+e.target.value)} /><span>%</span>
                </div>
              </Row>
              <Row label="COF warning window" note="How early an expiring certificate is flagged.">
                <div className="set-num">
                  <input className="inp" type="number" min="7" max="365" value={v.cofWarnDays}
                    onChange={(e) => edit('cofWarnDays')(+e.target.value)} /><span>days</span>
                </div>
              </Row>
              <Row label="Service warning distance" note="How close to the service interval a vehicle is flagged.">
                <div className="set-num">
                  <input className="inp" type="number" step="500" value={v.serviceWarnKm}
                    onChange={(e) => edit('serviceWarnKm')(+e.target.value)} /><span>km</span>
                </div>
              </Row>
            </Panel>
          </>
        )}

        {section === 'operations' && (
          <>
            <div className="infobar">
              <Info size={15} />
              <span>Everything below is read by a module rather than displayed by one. The fuel variance
                threshold decides which fills land in the exception queue, the diesel price and labour rate
                are what a job and a job card are costed at, and the dispatch rules are what block a job
                from being planned or invoiced.</span>
            </div>

            <Panel title="Fuel and consumption">
              <Row label="Consumption variance alert" note="How far a fill may deviate from the model target before it is flagged.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="50" value={v.fuelVariancePct}
                    onChange={(e) => edit('fuelVariancePct')(+e.target.value)} /><span>%</span>
                </div>
              </Row>
              <Row label="Idling alert" note="Raised on the daily exception report when idle time passes this share of engine hours.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="60" value={v.idleAlertPct}
                    onChange={(e) => edit('idleAlertPct')(+e.target.value)} /><span>%</span>
                </div>
              </Row>
              <Row label="Diesel price" note="Used to cost a haulage job until the fuel card file lands.">
                <div className="set-num">
                  <input className="inp" type="number" step="0.1" value={v.dieselPrice}
                    onChange={(e) => edit('dieselPrice')(+e.target.value)} /><span>R per litre</span>
                </div>
              </Row>
            </Panel>

            <Panel title="Workshop and stores">
              <Row label="Standard labour rate" note="The internal workshop recovery rate every job card is costed at.">
                <div className="set-num">
                  <input className="inp" type="number" step="5" value={v.labourRate}
                    onChange={(e) => edit('labourRate')(+e.target.value)} /><span>R per hour</span>
                </div>
              </Row>
              <Row label="Off-road escalation" note="Downtime beyond this is escalated to the fleet director.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="30" value={v.downtimeEscalationDays}
                    onChange={(e) => edit('downtimeEscalationDays')(+e.target.value)} /><span>days</span>
                </div>
              </Row>
              <Row label="Workshop authorisation limit" note="A job card above this needs an approval before work may start.">
                <div className="set-num">
                  <input className="inp" type="number" step="10000" value={v.woApprovalLimit}
                    onChange={(e) => edit('woApprovalLimit')(+e.target.value)} /><span>R</span>
                </div>
              </Row>
              <Row label="Stores order limit" note="A purchase order above this needs an approval before it can be sent.">
                <div className="set-num">
                  <input className="inp" type="number" step="10000" value={v.poApprovalLimit}
                    onChange={(e) => edit('poApprovalLimit')(+e.target.value)} /><span>R</span>
                </div>
              </Row>
              <Row label="Legal tread depth" note="A tyre below this may not run. The tyre register and the pre-use sheet both read it.">
                <div className="set-num">
                  <input className="inp" type="number" step="0.5" min="1" max="10" value={v.minTreadMm}
                    onChange={(e) => edit('minTreadMm')(+e.target.value)} /><span>mm</span>
                </div>
              </Row>
            </Panel>

            <Panel title="Dispatch and billing">
              <Row label="Planning horizon" note="How far ahead a haulage job may be committed.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="90" value={v.planningHorizonDays}
                    onChange={(e) => edit('planningHorizonDays')(+e.target.value)} /><span>days</span>
                </div>
              </Row>
              <Row label="Rate floor" note="A job planned below this needs an approval before it may run.">
                <div className="set-num">
                  <input className="inp" type="number" step="0.5" value={v.rateFloor}
                    onChange={(e) => edit('rateFloor')(+e.target.value)} /><span>R per km</span>
                </div>
              </Row>
              <Row label="On-time delivery target" note="Measured against the customer's expected date.">
                <div className="set-num">
                  <input className="inp" type="number" min="50" max="100" value={v.otdTarget}
                    onChange={(e) => edit('otdTarget')(+e.target.value)} /><span>%</span>
                </div>
              </Row>
              <Row label="Proof of delivery deadline" note="After delivery, before invoicing is blocked.">
                <div className="set-num">
                  <input className="inp" type="number" min="1" max="168" value={v.podDeadlineHours}
                    onChange={(e) => edit('podDeadlineHours')(+e.target.value)} /><span>hours</span>
                </div>
              </Row>
              <Row label="Payment terms" note="The due date every customer invoice is raised against.">
                <select className="inp" value={v.paymentTerms} onChange={(e) => edit('paymentTerms')(e.target.value)}>
                  {['14 days', '30 days', '60 days', 'On presentation'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Row>
            </Panel>

            <Panel title="Operator hours">
              <Row label="Maximum weekly driving" note="Dispatch blocks a job that would take an operator past this.">
                <div className="set-num">
                  <input className="inp" type="number" min="20" max="80" value={v.maxWeeklyHours}
                    onChange={(e) => edit('maxWeeklyHours')(+e.target.value)} /><span>hours</span>
                </div>
              </Row>
              <Row label="Coaching threshold" note="A behaviour score below this puts the operator on the coaching list.">
                <div className="set-num">
                  <input className="inp" type="number" min="0" max="100" value={v.coachingScore}
                    onChange={(e) => edit('coachingScore')(+e.target.value)} />
                </div>
              </Row>
              <Row label="Stand-down threshold" note="A score below this stands the operator down until coaching is done.">
                <div className="set-num">
                  <input className="inp" type="number" min="0" max="100" value={v.standDownScore}
                    onChange={(e) => edit('standDownScore')(+e.target.value)} />
                </div>
              </Row>
            </Panel>
          </>
        )}

        {section === 'security' && (
          <>
            <Panel title="Authentication">
              <Row label="Password policy" note="Applied at the next password change.">
                <select className="inp" value={v.passwordPolicy} onChange={(e) => edit('passwordPolicy')(e.target.value)}>
                  {['Strong (12+ characters, number, symbol)', 'Standard (8+ characters, number)', 'Basic (6+ characters)'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Row>
              <Row label="Session timeout" note="Idle sessions end and the audit records it.">
                <select className="inp" value={v.sessionTimeout} onChange={(e) => edit('sessionTimeout')(e.target.value)}>
                  {['8 hours', '4 hours', '1 hour', '30 minutes'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Row>
              <Row label="Two-factor authentication" note="Required on every administrator account.">
                <Toggle on={v.mfa} onChange={edit('mfa')} />
              </Row>
              <Row label="Login audit logging" note="Every attempt, successful or not, is written to the trail.">
                <Toggle on={v.loginAudit} onChange={edit('loginAudit')} />
              </Row>
              <Row label="Restrict sign-in to allowlisted IP ranges" note="Mine network and VPN ranges only.">
                <Toggle on={v.ipAllowlist} onChange={edit('ipAllowlist')} />
              </Row>
            </Panel>
            <Panel title="Recent sign-in activity" flush>
              <div className="gridwrap">
                <table className="grid">
                  <thead><tr><th>When</th><th>Account</th><th>Address</th><th>Location</th><th>Result</th></tr></thead>
                  <tbody>
                    {[['Today 07:41', 'admin@acmecorp.co.za', '196.213.44.17', 'Lephalale, LP', 'Allowed'],
                      ['Today 06:02', 'thabo.nkosi@acmecorp.co.za', '196.213.44.9', 'Lephalale, LP', 'Allowed'],
                      ['Yesterday 22:14', 'admin@acmecorp.co.za', '41.203.18.77', 'Unknown', 'Blocked — wrong password, third attempt'],
                      ['Yesterday 17:50', 'priya.dlamini@acmecorp.co.za', '105.4.9.221', 'Polokwane, LP', 'Allowed']].map((r) => (
                        <tr key={r[0] + r[1]}>
                          <td style={{ color: 'var(--text2)' }}>{r[0]}</td><td>{r[1]}</td>
                          <td className="mono">{r[2]}</td><td style={{ color: 'var(--text2)' }}>{r[3]}</td>
                          <td>{r[4].startsWith('Allowed')
                            ? <Badge tone="green">Allowed</Badge>
                            : <Badge tone="red">{r[4]}</Badge>}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}

        {section === 'roles' && (
          <Panel title="Roles and permissions" note="what each role may do" flush
            right={<Badge tone="grey">read-only in this build</Badge>}>
            <div className="gridwrap">
              <table className="grid">
                <thead>
                  <tr><th>Capability</th>{ROLES.map((r) => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}</tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map((p) => (
                    <tr key={p[0]}>
                      <td className="wrap">{p[0]}</td>
                      {p.slice(1).map((allowed, i) => (
                        <td key={i} style={{ textAlign: 'center' }}>
                          {allowed
                            ? <CircleCheck size={15} color="var(--green)" strokeWidth={2} />
                            : <XCircle size={15} color="var(--stroke-strong)" strokeWidth={2} />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {section === 'notify' && (
          <Panel title="Notifications" note="who hears about what, and how quickly">
            <Row label="No-go captured" note="Safety officer and the supervisor on shift, immediately.">
              <Toggle on={v.notifyNoGo} onChange={edit('notifyNoGo')} />
            </Row>
            <Row label="Sheet awaiting sign-off" note="Supervisor, if it is still unsigned after two hours.">
              <Toggle on={v.notifySignOff} onChange={edit('notifySignOff')} />
            </Row>
            <Row label="Certificate expiring" note={`Operator and supervisor, ${v.cofWarnDays} days before expiry.`}>
              <Toggle on={v.notifyCof} onChange={edit('notifyCof')} />
            </Row>
            <Row label="Training lapsed" note="Training coordinator, on the day a competency expires.">
              <Toggle on={v.notifyTraining} onChange={edit('notifyTraining')} />
            </Row>
          </Panel>
        )}

        {section === 'integrations' && (
          <Panel title="Integrations" note="systems this platform exchanges records with" flush>
            <div className="gridwrap">
              <table className="grid">
                <thead><tr><th>System</th><th>Kind</th><th>Detail</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {INTEGRATIONS.map((i) => (
                    <tr key={i.name}>
                      <td style={{ fontWeight: 600 }}>{i.name}</td>
                      <td><Badge tone="grey">{i.kind}</Badge></td>
                      <td className="wrap" style={{ color: 'var(--text2)' }}>{i.note}</td>
                      <td><Badge tone={i.tone}>{i.status}</Badge></td>
                      <td>
                        <Btn small onClick={() => run(i.status === 'Available' ? 'integrations' : 'integrations')}>
                          {i.status === 'Available' ? 'Connect' : i.status === 'Error' ? 'Fix' : 'Configure'}
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {section === 'data' && (
          <>
            <Panel title="Retention and backups">
              <Row label="Audit retention" note="The National Road Traffic Act requires five years; this platform keeps seven.">
                <div className="set-num">
                  <input className="inp" type="number" min="5" max="10" value={v.retentionYears}
                    onChange={(e) => edit('retentionYears')(+e.target.value)} /><span>years</span>
                </div>
              </Row>
              <Row label="Nightly backup window">
                <select className="inp" value={v.backupTime} onChange={(e) => edit('backupTime')(e.target.value)}>
                  {['00:00', '02:00', '04:00'].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Row>
            </Panel>
            <Panel title="Position">
              <KV k="Inspection records" v="5 years minimum · National Road Traffic Act" />
              <KV k="Audit trail" v={`Append-only, ${v.retentionYears}-year retention`} />
              <KV k="Personal data" v="POPIA — consent recorded per operator" />
              <KV k="Data residency" v="South Africa (Johannesburg region)" />
              <KV k="Last backup" v={`18 Jun 2026, ${v.backupTime}`} />
              <KV k="Last restore test" v="02 Jun 2026 — passed" />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn small onClick={() => run('export')}>Export everything</Btn>
                <Btn small onClick={() => run('backups')}>Run a backup now</Btn>
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

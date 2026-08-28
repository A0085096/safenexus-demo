import React, { useState } from 'react';
import {
  AlertTriangle, UserPlus, Truck, ClipboardCheck, ShieldCheck, Users as UsersIcon, Wrench,
  BarChart3, MapPin, FileText, BadgeCheck, Pencil, Download, Rocket, Trash2,
  Bell, Lock, FileCheck2, Receipt, ChevronRight, CircleAlert, Building2,
} from 'lucide-react';
import { TENANT, SITES, siteName } from '../data.js';
import { targetTone } from '../theme.js';
import {
  Panel, Btn, Badge, Avatar, ListRow, SecHead, KV, roleBadge, statusBadge, vehicleBadge, resultBadge,
} from '../components/ui.jsx';
import { useStore } from '../store.jsx';

const ICONS = {
  truck: Truck, clipboard: ClipboardCheck, shield: ShieldCheck, users: UsersIcon, tool: Wrench,
  chart: BarChart3, pin: MapPin, invoice: FileText, alert: AlertTriangle, cert: BadgeCheck,
};

/* ── hierarchy: this company's own reporting line ─────────────── */
export function Hierarchy({ run }) {
  const { users, select, settings } = useStore();
  const [site, setSite] = useState('ALL');
  const scoped = users.filter((u) => site === 'ALL' || u.site === site);

  const admins = scoped.filter((u) => u.role === 'Administrator');
  const officers = scoped.filter((u) => u.role === 'Safety officer');
  const sups = scoped.filter((u) => u.role === 'Supervisor');
  const ops = scoped.filter((u) => u.role === 'Operator');
  const orphans = ops.filter((o) => !sups.some((s) => s.name === o.reports));

  const tree = [];
  admins.forEach((a) => {
    tree.push({ ...a, indent: 0 });
    officers.filter((o) => o.reports === a.name).forEach((o) => {
      tree.push({ ...o, indent: 1 });
      sups.filter((s) => s.reports === o.name).forEach((s) => {
        tree.push({ ...s, indent: 2 });
        ops.filter((p) => p.reports === s.name).forEach((p) => tree.push({ ...p, indent: 3 }));
      });
    });
  });
  orphans.forEach((o) => { if (!tree.some((t) => t.name === o.name)) tree.push({ ...o, indent: 3, orphan: true }); });

  return (
    <div className="grid-2">
      <div>
        <div className="cmdstrip solo">
          {SITES.map((s) => (
            <Btn key={s.key} small active={site === s.key} onClick={() => setSite(s.key)}>{s.short}</Btn>
          ))}
        </div>
        <Panel title="Reporting line" note={`${scoped.length} people`} flush
          right={<button className="link" onClick={() => run('export')}>Export</button>}>
          {tree.map((t) => (
            <div className="hier" key={t.name} onClick={() => { select('user', t.name); run('goto:users'); }} style={{ cursor: 'pointer' }}>
              <div className="rail" style={{
                width: t.indent * 18,
                borderLeft: t.indent ? '1px solid var(--stroke-strong)' : 'none',
                marginLeft: t.indent ? 8 : 0,
              }} />
              <Avatar init={t.init} tone={t.tone} />
              <div className="ri" style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                  {t.vehicle && t.vehicle !== '—' ? `${t.role} · ${t.vehicle}` : t.role} · {siteName(t.site)}
                </div>
              </div>
              {t.orphan ? <Badge tone="gold">No supervisor</Badge> : roleBadge(t.role)}
            </div>
          ))}
        </Panel>
      </div>
      <div>
        <Panel title="Roles on this site">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[[admins.length, 'Administrators', 'purple'], [officers.length, 'Safety officers', 'green'],
              [sups.length, 'Supervisors', 'brand-dark'], [ops.length, 'Operators', 'gold']].map(([v, l, tone]) => (
                <div key={l} style={{
                  background: tone === 'brand-dark' ? 'var(--sel)' : `var(--${tone}-bg)`,
                  borderRadius: 3, padding: 11, textAlign: 'center',
                }}>
                  <div style={{ font: '600 20px var(--num)', color: `var(--${tone})` }}>{v}</div>
                  <div style={{ fontSize: 11.5, color: `var(--${tone})` }}>{l}</div>
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Gaps in the line" flush
          right={<Badge tone={orphans.length ? 'gold' : 'green'}>{orphans.length} open</Badge>}>
          {orphans.length === 0
            ? <div style={{ padding: 14, fontSize: 12.5, color: 'var(--text2)' }}>Every operator reports to a supervisor.</div>
            : orphans.map((o) => (
              <ListRow key={o.name} avatar={<Avatar init={o.init} tone="gold" />}
                title={`${o.name} has no supervisor`} sub={`Operator · ${siteName(o.site)}`}
                right={<Btn small onClick={() => { select('user', o.name); run('editUser'); }}>Assign</Btn>} />
            ))}
          <ListRow avatar={<Avatar tone="gold" icon={Truck} />}
            title="Vehicles without an operator" sub="Available in the pool"
            right={<Btn small onClick={() => run('goto:fleet')}>Fleet</Btn>} />
        </Panel>
      </div>
    </div>
  );
}

/* ── compliance ───────────────────────────────────────────────── */
export function Compliance({ run, goTab }) {
  const { defects, vehicles, users, settings, select } = useStore();
  const open = defects.filter((d) => d.status !== 'Closed');
  const noGo = open.filter((d) => d.severity === 'No Go');
  const lapsed = open.filter((d) => d.status === 'Overdue');
  const unsigned = open.filter((d) => d.severity === 'Go But' && !d.supervisorSigned);
  const grounded = vehicles.filter((v) => v.status === 'Maintenance').length;

  const cof = [...users.filter((u) => u.cof && u.cof !== 'N/A')
    .map((u) => ({ who: u.name, what: 'Operator COF', when: u.cof, site: u.site, init: u.init, tone: u.tone })),
  ...vehicles.map((v) => ({ who: v.plate, what: 'Vehicle COF', when: v.cof, site: v.site, init: v.fleetNo.slice(-2), tone: 'blue' }))]
    .slice(0, 8);

  return (
    <>
      <div className="grid-3">
        {[[String(lapsed.length), 'Lapsed concessions', 'red', 'dn', 'running as if uninspected'],
          [String(unsigned.length), 'Unsigned concessions', 'gold', 'warn', 'treat as a no-go until signed'],
          [String(noGo.length), 'Open no-go defects', 'red', 'dn', `${grounded} vehicle(s) grounded`]].map(([v, l, tone, dir, note]) => (
            <div className="tile" key={l}>
              <div className="tile-val" style={{ color: `var(--${tone})` }}>{v}</div>
              <div className="tile-lbl">{l}</div>
              <div className={'tile-trend t-' + (dir === 'warn' ? 'warn' : dir)}>{note}</div>
            </div>
          ))}
      </div>
      <div className="grid-2">
        <Panel title="Certificates of fitness" note={`warning window ${settings.cofWarnDays} days`} flush
          right={<button className="link" onClick={() => run('export')}>Export</button>}>
          {cof.map((c) => (
            <ListRow key={c.who + c.what} avatar={<Avatar init={c.init} tone={c.tone} />}
              title={c.who} sub={`${c.what} · ${siteName(c.site)}`}
              right={<div style={{ font: '600 12px var(--num)', color: 'var(--text2)' }}>{c.when}</div>} />
          ))}
        </Panel>
        <Panel title="Open defects" note={`${open.length} open · ${settings.goButMaxDays}-day window`} flush
          right={<button className="link" onClick={() => goTab('inspections')}>Defect register</button>}>
          {open.map((a) => (
            <ListRow key={a.id} avatar={<Avatar tone={a.severity === 'No Go' || a.status === 'Overdue' ? 'red' : 'gold'} icon={CircleAlert} />}
              title={a.item} sub={`${a.plate} · ${siteName(a.site)}`}
              onClick={() => run('openDefect:' + a.id)}
              right={
                <>
                  <div style={{ font: '600 12px var(--num)', color: a.status === 'Overdue' ? 'var(--red)' : 'var(--gold)' }}>
                    {a.severity === 'No Go' ? 'No Go' : a.status === 'Overdue' ? 'lapsed' : a.due}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {a.severity === 'No Go' ? 'grounded' : a.supervisorSigned ? 'concession signed' : 'unsigned'}
                  </div>
                </>
              } />
          ))}
        </Panel>
      </div>
    </>
  );
}

/* ── company profile ──────────────────────────────────────────── */
const TABS = ['Overview', 'Team', 'Fleet', 'Inspections', 'Modules', 'Settings'];

const MODULES = [
  { icon: 'truck', name: 'Fleet management', desc: 'Vehicle assignment and tracking', on: true },
  { icon: 'clipboard', name: 'Pre-use inspections', desc: 'Digital inspection forms', on: true },
  { icon: 'shield', name: 'Safety compliance', desc: 'COF tracking and concessions', on: true },
  { icon: 'tool', name: 'Workshop', desc: 'Work orders raised from defects', on: true },
  { icon: 'users', name: 'HR management', desc: 'Employee records', on: false },
  { icon: 'chart', name: 'Analytics', desc: 'Reports and dashboards', on: false },
  { icon: 'pin', name: 'GPS tracking', desc: 'Real-time vehicle location', on: false },
  { icon: 'invoice', name: 'Fuel management', desc: 'Fuel consumption tracking', on: false },
];

export function CompanyProfile({ run, openDialog }) {
  const { tenant, users: team, vehicles: fleet, inspections: insp, defects } = useStore();
  const [tab, setTab] = useState(0);

  return (
    <>
      <div className="dochead">
        <div className="mark">
          <svg width="34" height="34" viewBox="0 0 90 90">
            <polygon points="8,80 36,10 52,10 36,46" fill="#fff" opacity=".9" />
            <polygon points="82,80 52,46 52,10 95,80" fill="#93C5FD" opacity=".95" />
            <polygon points="36,46 52,10 44,28" fill="#CFE4FA" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.3px' }}>{tenant.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 2 }}>
            Trading as {tenant.trading} · Registration {tenant.reg}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            <Badge tone="blue">{tenant.industry}</Badge><Badge tone="green">Active</Badge>
            <Badge tone="purple">{tenant.plan} plan</Badge><Badge tone="grey">{tenant.seats}</Badge>
          </div>
          <div className="strip">
            <div><div className="v">{team.length}</div><div className="l">Users</div></div>
            <div><div className="v">{fleet.length}</div><div className="l">Vehicles</div></div>
            <div><div className="v">{defects.filter((d) => d.status !== 'Closed').length}</div><div className="l">Open defects</div></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Btn icon={Pencil} onClick={() => run('editCompany')}>Edit</Btn>
          <Btn primary icon={Download} onClick={() => run('export')}>Export</Btn>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--stroke)', borderRadius: '0 0 4px 4px', marginBottom: 14 }}>
        <div className="doctabs">
          {TABS.map((t, i) => (
            <button key={t} className={'doctab' + (tab === i ? ' on' : '')} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            <div>
              <SecHead>Company information</SecHead>
              <KV k="Registration no." v={tenant.reg} />
              <KV k="VAT number" v={tenant.vat} />
              <KV k="Company type" v="Private company (Pty) Ltd" />
              <KV k="Operating region" v={tenant.region} />
              <KV k="Registered" v={tenant.since} />
            </div>
            <div>
              <SecHead>Contact details</SecHead>
              <KV k="Physical address" v={tenant.address} />
              <KV k="Phone" v={tenant.phone} />
              <KV k="Email" v={<span style={{ color: 'var(--brand-dark)' }}>{tenant.email}</span>} />
              <KV k="Website" v={<span style={{ color: 'var(--brand-dark)' }}>{tenant.web}</span>} />
            </div>
            <div>
              <SecHead>Administrator</SecHead>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Avatar init="KM" tone="purple" large />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tenant.admin}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Administrator</div>
                  <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{tenant.email}</div>
                </div>
              </div>
              <SecHead>Statistics</SecHead>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--pane)', border: '1px solid var(--stroke)', borderRadius: 3, padding: 9, textAlign: 'center' }}>
                  <div style={{ font: '600 17px var(--num)' }}>142</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Inspections / month</div>
                </div>
                <div style={{ background: 'var(--green-bg)', borderRadius: 3, padding: 9, textAlign: 'center' }}>
                  <div style={{ font: '600 17px var(--num)', color: 'var(--green)' }}>0</div>
                  <div style={{ fontSize: 10.5, color: 'var(--green)' }}>Open defects</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <>
            <div className="cmdstrip" style={{ borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
              {[['Administrator', 'purple'], ['Safety officer', 'green'], ['Supervisor', 'blue'], ['Operator', 'gold']].map(([r, t]) => (
                <Badge key={r} tone={t}>{r} ×{team.filter((u) => u.role === r).length}</Badge>
              ))}
              <span className="count"><Btn small primary icon={UserPlus} onClick={() => openDialog('user')}>Add user</Btn></span>
            </div>
            <div className="gridwrap">
              <table className="grid">
                <thead><tr><th>User</th><th>Role</th><th>Reports to</th><th>Vehicle</th><th>Status</th><th>Last active</th><th /></tr></thead>
                <tbody>
                  {team.map((u) => (
                    <tr key={u.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Avatar init={u.init} tone={u.tone} />
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td>{roleBadge(u.role)}</td>
                      <td style={{ color: 'var(--text2)' }}>{u.reports}</td>
                      <td className="mono">{u.vehicle}</td>
                      <td>{statusBadge(u.status)}</td>
                      <td style={{ color: 'var(--text3)' }}>Today</td>
                      <td><Btn small onClick={() => run('editUser')}>Edit</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 2 && (
          <>
            <div className="cmdstrip" style={{ borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{fleet.length} vehicles on this company's register</span>
              <span className="count"><Btn small primary icon={Truck} onClick={() => openDialog('vehicle')}>Add vehicle</Btn></span>
            </div>
            <div className="gridwrap">
              <table className="grid">
                <thead><tr><th>Plate</th><th>Make and model</th><th className="num">Year</th><th>Assigned to</th><th>Supervisor</th><th>Last inspection</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {fleet.map((v) => (
                    <tr key={v.plate}>
                      <td className="mono">{v.plate}</td><td>{v.make}</td><td className="num">{v.year}</td>
                      <td>{v.driver}</td><td style={{ color: 'var(--text2)' }}>{v.sup}</td>
                      <td style={{ color: 'var(--text2)' }}>{v.lastInsp}</td>
                      <td>{vehicleBadge(v.status)}</td>
                      <td><Btn small onClick={() => run('assignVehicle')}>Assign</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 3 && (
          <div className="gridwrap">
            <table className="grid">
              <thead><tr><th>Ref</th><th>Date</th><th>Vehicle</th><th>Operator</th><th>Result</th><th>Sign-off</th></tr></thead>
              <tbody>
                {insp.map((i) => (
                  <tr key={i.ref}>
                    <td className="mono">#{i.ref}</td>
                    <td style={{ color: 'var(--text2)' }}>{i.date}</td>
                    <td className="mono">{i.vehicle}</td><td>{i.op}</td>
                    <td>{resultBadge(i.result)}</td>
                    <td>{i.signed ? <Badge tone="green">Signed</Badge> : <Badge tone="gold">Pending</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 4 && (
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: 16 }}>
              {MODULES.map((m) => {
                const Icon = ICONS[m.icon];
                return (
                  <div className={'modcard' + (m.on ? ' on' : '')} key={m.name} onClick={() => run('modules')}>
                    <div className="mi" style={{ background: m.on ? 'var(--sel)' : 'var(--stroke-soft)' }}>
                      <Icon size={17} strokeWidth={1.7} color={m.on ? 'var(--brand)' : 'var(--text3)'} />
                    </div>
                    <div className="mn">{m.name}</div>
                    <div className="md">{m.desc}</div>
                    <div style={{ marginTop: 8 }}>
                      {m.on ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Inactive</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: 'var(--pane)', border: '1px solid var(--stroke)', borderRadius: 4, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tenant.plan} plan · R 2 499 per month</span>
                <Badge tone="green">Active</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Renews 18 Jul 2026 · 4 of 8 modules active</div>
              <Btn primary icon={Rocket} onClick={() => run('upgrade')}>Upgrade to Enterprise</Btn>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <SecHead>General settings</SecHead>
              <div style={{ border: '1px solid var(--stroke)', borderRadius: 4, overflow: 'hidden' }}>
                {[[Pencil, 'Edit company profile', <ChevronRight size={14} color="var(--text3)" key="c" />],
                  [Bell, 'Notifications', <Badge tone="green" key="b">On</Badge>],
                  [Lock, 'Security and access', <ChevronRight size={14} color="var(--text3)" key="c2" />],
                  [FileCheck2, 'Compliance documents', <ChevronRight size={14} color="var(--text3)" key="c3" />],
                  [Receipt, 'Billing and invoices', <ChevronRight size={14} color="var(--text3)" key="c4" />]].map(([I, l, r]) => (
                    <ListRow key={l} avatar={<I size={16} strokeWidth={1.7} color="var(--text2)" />} title={l} right={r} />
                  ))}
              </div>
            </div>
            <div>
              <SecHead>Danger zone</SecHead>
              <div style={{ background: 'var(--red-bg)', border: '1px solid #F3B9BF', borderRadius: 4, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>Delete company account</div>
                <div style={{ fontSize: 12, color: '#7A1620', marginBottom: 12, lineHeight: 1.5 }}>
                  Permanently removes all data, users and fleet records for this company. This cannot be undone.
                </div>
                <Btn danger icon={Trash2} onClick={() => run('deleteCompany')}>Delete account</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


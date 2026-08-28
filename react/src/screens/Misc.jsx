import React, { useState } from 'react';
import {
  AlertTriangle, UserPlus, Truck, ClipboardCheck, ShieldCheck, Users as UsersIcon, Wrench,
  BarChart3, MapPin, FileText, BadgeCheck, Pencil, Download, Rocket, Trash2, Check,
  Bell, Lock, FileCheck2, Receipt, ChevronRight, CircleAlert,
} from 'lucide-react';
import {
  HIERARCHY, COF, AGING_TOP, CATEGORIES, MODULES, REPORTS, RECENT_REPORTS, USERS, FLEET, INSPECTIONS, PERF,
} from '../data.js';
import { SERIES, SEQ, nf, targetTone } from '../theme.js';
import {
  Panel, ChartCard, Btn, Badge, Avatar, ListRow, SecHead, KV, Legend,
  roleBadge, vehicleBadge, resultBadge, statusBadge,
} from '../components/ui.jsx';
import Sparkline from '../charts/Sparkline.jsx';
import { useStore } from '../store.jsx';

const passTone = (v, target = 90) => targetTone(v, target);
const ICONS = {
  truck: Truck, clipboard: ClipboardCheck, shield: ShieldCheck, users: UsersIcon, tool: Wrench,
  chart: BarChart3, pin: MapPin, invoice: FileText, alert: AlertTriangle, cert: BadgeCheck,
};

/* ── hierarchy ────────────────────────────────────────────────── */
export function Hierarchy({ run }) {
  return (
    <div className="grid-2">
      <div>
        <div className="cmdstrip solo">
          <Btn small active>Acme Mining Corp</Btn>
          <Btn small>Grootegeluk Coal</Btn>
          <Btn small>Zimele Logistics</Btn>
        </div>
        <Panel title="Organisation hierarchy" note="19 people" flush
          right={<button className="link" onClick={() => run('export')}>Export</button>}>
          {HIERARCHY.map((t) => (
            <div className="hier" key={t.name}>
              <div className="rail" style={{
                width: t.indent * 18,
                borderLeft: t.indent ? '1px solid var(--stroke-strong)' : 'none',
                marginLeft: t.indent ? 8 : 0,
              }} />
              <Avatar init={t.init} tone={t.tone} />
              <div className="ri" style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{t.sub}</div>
              </div>
              {roleBadge(t.role)}
            </div>
          ))}
        </Panel>
      </div>
      <div>
        <Panel title="Role distribution">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['1', 'Administrator', 'purple'], ['3', 'Safety officers', 'green'],
              ['6', 'Supervisors', 'brand-dark'], ['9', 'Operators', 'gold']].map(([v, l, tone]) => (
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
        <Panel title="Unassigned items" flush right={<Badge tone="gold">2 open</Badge>}>
          <ListRow avatar={<Avatar tone="gold" icon={UserPlus} />}
            title="3 operators without a supervisor" sub="Acme Mining Corp"
            right={<Btn small onClick={() => run('assignSupervisor')}>Assign</Btn>} />
          <ListRow avatar={<Avatar tone="gold" icon={Truck} />}
            title="8 vehicles unassigned" sub="Platform-wide"
            right={<Btn small onClick={() => run('assignVehicle')}>Assign</Btn>} />
        </Panel>
      </div>
    </div>
  );
}

/* ── compliance ───────────────────────────────────────────────── */
export function Compliance({ run, goTab }) {
  const { defects, vehicles, select, settings } = useStore();
  const open = defects.filter((d) => d.status === 'Open');
  const noGo = open.filter((d) => d.severity === 'No Go');
  const grounded = vehicles.filter((v) => v.status === 'Maintenance').length;
  return (
    <>
      <div className="grid-3">
        {[['98.2%', 'Platform compliance rate', 'green', 'up', 'Up 0.1 pp on last month'],
          ['2', 'Companies below threshold', 'gold', 'warn', 'Below the 90% target'],
          [String(noGo.length), 'Open no-go defects', 'red', 'dn', `${grounded} vehicle(s) grounded`]].map(([v, l, tone, dir, note]) => (
            <div className="tile" key={l}>
              <div className="tile-val" style={{ color: `var(--${tone})` }}>{v}</div>
              <div className="tile-lbl">{l}</div>
              <div className={'tile-trend t-' + (dir === 'warn' ? 'warn' : dir)}>{note}</div>
            </div>
          ))}
      </div>
      <div className="grid-2">
        <Panel title="COF expiry alerts" flush right={<Badge tone="gold">14 expiring soon</Badge>}>
          {COF.map((r) => (
            <ListRow key={r.name}
              avatar={<Avatar init={r.name.split(' ').map((n) => n[0]).join('')} tone={r.days < 30 ? 'red' : 'gold'} />}
              title={r.name} sub={r.co}
              right={
                <>
                  <div style={{ font: '600 12px var(--num)', color: r.days < 30 ? 'var(--red)' : 'var(--gold)' }}>{r.exp}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.days} days</div>
                </>
              } />
          ))}
        </Panel>
        <Panel title="Open defects" note={`${open.length} open · ${settings.goButMaxDays}-day rule`} flush
          right={<button className="link" onClick={() => goTab('inspections')}>Defect register</button>}>
          {[...open].sort((a, b) => b.age - a.age).map((a) => (
            <ListRow key={a.id} avatar={<Avatar tone={a.severity === 'No Go' ? 'red' : a.age > 30 ? 'red' : 'gold'} icon={CircleAlert} />}
              title={a.item} sub={`${a.plate} · ${a.co}`}
              onClick={() => run('openDefect:' + a.id)}
              right={
                <>
                  <div style={{ font: '600 12px var(--num)', color: a.age > settings.goButMaxDays ? 'var(--red)' : 'var(--gold)' }}>
                    {a.severity === 'No Go' ? 'No Go' : `${a.age} days`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.severity === 'No Go' ? 'grounded' : '30-day limit'}</div>
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

export function CompanyProfile({ run, openDialog }) {
  const [tab, setTab] = useState(0);
  const team = USERS.filter((u) => u.co === 'Acme Mining Corp');
  const fleet = FLEET.filter((v) => v.co === 'Acme Mining Corp');
  const insp = INSPECTIONS.filter((i) => i.co === 'Acme Mining Corp');

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
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.3px' }}>Acme Mining Corp</div>
          <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 2 }}>
            Trading as Acme Corp · Registration 2018/123456/07
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            <Badge tone="blue">Mining</Badge><Badge tone="green">Active</Badge>
            <Badge tone="purple">Pro plan</Badge><Badge tone="grey">51–200 employees</Badge>
          </div>
          <div className="strip">
            <div><div className="v">18</div><div className="l">Users</div></div>
            <div><div className="v">24</div><div className="l">Vehicles</div></div>
            <div><div className="v">98.2%</div><div className="l">Compliance</div></div>
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
              <KV k="Registration no." v="2018/123456/07" />
              <KV k="VAT number" v="4890123456" />
              <KV k="Company type" v="Private company (Pty) Ltd" />
              <KV k="Operating region" v="Limpopo · Gauteng" />
              <KV k="Registered" v="12 Mar 2024" />
            </div>
            <div>
              <SecHead>Contact details</SecHead>
              <KV k="Physical address" v="123 Mine Road, Lephalale, Limpopo, 0555" />
              <KV k="Phone" v="+27 14 763 0100" />
              <KV k="Email" v={<span style={{ color: 'var(--brand-dark)' }}>info@acmecorp.co.za</span>} />
              <KV k="Website" v={<span style={{ color: 'var(--brand-dark)' }}>www.acmecorp.co.za</span>} />
            </div>
            <div>
              <SecHead>Administrator</SecHead>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Avatar init="KM" tone="purple" large />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>Kobus van der Merwe</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Fleet Manager</div>
                  <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>admin@acmecorp.co.za</div>
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
              <Badge tone="purple">Administrator ×1</Badge><Badge tone="green">Safety officer ×3</Badge>
              <Badge tone="blue">Supervisor ×6</Badge><Badge tone="gold">Operator ×9</Badge>
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
              <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>24 vehicles registered to this company</span>
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
                <span style={{ fontSize: 13, fontWeight: 600 }}>Pro plan · R 2 499 per month</span>
                <Badge tone="green">Active</Badge>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Renews 18 Jul 2026 · 3 of 8 modules active</div>
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


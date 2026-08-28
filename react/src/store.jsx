import React, { createContext, useContext, useMemo, useReducer, useState, useCallback } from 'react';
import { TENANT, USERS, FLEET, INSPECTIONS, DEFECTS, WORK_ORDERS, AUDIT } from './data.js';
import { TEMPLATES } from './inspection/templates.js';
import { buildErp, invTotal, invPaid, poTotal, R, num, fmtDate, shift } from './erp/seed.js';

/* The ERP data set is assembled once, in dependency order, from the
   hand-written core in data.js. Everything below mutates it. */
const ERP = buildErp({ fleet: FLEET, users: USERS, workOrders: WORK_ORDERS });

/* ══════════════════════════════════════════════════════════════
   One store for everything the modules mutate. Every action that
   changes a record also writes the audit entry for it, so the trail
   cannot drift from the data — the same rule the real product needs.
   ══════════════════════════════════════════════════════════════ */

const LABELS = {
  goButMaxDays: 'the go-but repair window', requireConcession: 'the supervisor concession rule',
  autoGroundOnNoGo: 'auto-grounding on a no-go', complianceTarget: 'the compliance target',
  passRateTarget: 'the pass-rate target', cofWarnDays: 'the COF warning window',
  serviceWarnKm: 'the service warning distance', passwordPolicy: 'the password policy',
  sessionTimeout: 'the session timeout', mfa: 'two-factor authentication',
  loginAudit: 'login audit logging', ipAllowlist: 'the IP allowlist',
  retentionYears: 'the retention period', platformName: 'the platform name',
  supportEmail: 'the support address', timezone: 'the timezone', dateFormat: 'the date format',
  notifyNoGo: 'no-go alerts', notifySignOff: 'sign-off reminders',
  notifyCof: 'COF expiry alerts', notifyTraining: 'training alerts',
  backupTime: 'the backup window',
  fuelVariancePct: 'the fuel variance threshold', idleAlertPct: 'the idling alert',
  dieselPrice: 'the diesel price', labourRate: 'the standard labour rate',
  downtimeEscalationDays: 'the off-road escalation', woApprovalLimit: 'the workshop authorisation limit',
  poApprovalLimit: 'the stores order limit', minTreadMm: 'the legal tread depth',
  planningHorizonDays: 'the planning horizon', rateFloor: 'the rate floor',
  otdTarget: 'the on-time delivery target', podDeadlineHours: 'the proof-of-delivery deadline',
  paymentTerms: 'the payment terms', maxWeeklyHours: 'the weekly driving ceiling',
  coachingScore: 'the coaching threshold', standDownScore: 'the stand-down threshold',
};

const AppCtx = createContext(null);
export const useStore = () => useContext(AppCtx);

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const ref = (p) => p + '-' + Math.floor(100000 + Math.random() * 899999);

/* Every entry carries who, what, where and how it arrived, because an
   audit line that cannot answer those is not evidence. */
let seq = 4000;
const audit = (state, type, text, meta, extra = {}) => ({
  ...state,
  audit: [{
    id: 'AUD-' + (++seq),
    type,
    text,
    meta,
    actor: extra.actor || state.actor || 'System',
    entity: extra.entity || '—',
    severity: extra.severity || (type === 'warn' ? 'Warning' : 'Information'),
    ip: '196.213.44.17',
    session: 'sess-8841c2',
    channel: extra.channel || 'Web',
    date: today(),
    time: now(),
  }, ...state.audit],
});

const patchVehicle = (state, plate, patch) => ({
  ...state,
  vehicles: state.vehicles.map((v) => (v.plate === plate ? { ...v, ...patch } : v)),
});

const initial = {
  tenant: TENANT,
  users: ERP.people,
  vehicles: ERP.vehicles,
  inspections: INSPECTIONS.map((i) => ({ ...i, sheet: null })),
  defects: DEFECTS,
  workOrders: ERP.workOrders,
  templates: TEMPLATES,

  /* ── the ERP modules ─────────────────────────────────────── */
  jobs: ERP.jobs,
  fuel: ERP.fuel,
  tyres: ERP.tyres,
  parts: ERP.parts,
  incidents: ERP.incidents,
  invoices: ERP.invoices,
  purchaseOrders: ERP.purchaseOrders,
  supplierInvoices: ERP.supplierInvoices,
  documents: ERP.documents,
  events: ERP.events,
  budgets: ERP.budgets,
  scheduledJobs: ERP.scheduledJobs,
  integrations: ERP.integrations,
  roles: ERP.roles,
  approvals: ERP.approvals,
  audit: AUDIT.map((a, i) => ({
    ...a,
    id: 'AUD-' + (3990 + i),
    severity: a.type === 'warn' ? 'Warning' : 'Information',
    ip: a.channel === 'Mobile app' ? '105.4.9.221' : '196.213.44.17',
    session: a.actor === 'System' ? '—' : 'sess-8841c2',
  })),
  reportRuns: [
    { id: 'RUN-4471', report: 'Compliance report', scope: 'All sites', period: 'June 2026', by: 'Kobus van der Merwe', at: 'Today 08:02', rows: 3, format: 'PDF', status: 'Complete' },
    { id: 'RUN-4468', report: 'COF expiry report', scope: 'All sites', period: '90-day window', by: 'Thabo Nkosi', at: 'Today 07:41', rows: 12, format: 'PDF', status: 'Complete' },
    { id: 'RUN-4463', report: 'Fleet status report', scope: 'Steelpoort section', period: 'June 2026', by: 'Refilwe Sekhukhune', at: 'Yesterday 16:20', rows: 3, format: 'CSV', status: 'Complete' },
  ],
  schedules: [
    { id: 'SCH-11', report: 'Compliance report', scope: 'All sites', cadence: 'Monthly, first working day', to: 'exco@acmecorp.co.za', format: 'PDF', on: true, next: '01 Jul 2026' },
    { id: 'SCH-12', report: 'COF expiry report', scope: 'All sites', cadence: 'Weekly, Monday 06:00', to: 'safety@acmecorp.co.za', format: 'CSV', on: true, next: '22 Jun 2026' },
    { id: 'SCH-13', report: 'Defect history', scope: 'Lephalale open pit', cadence: 'Quarterly', to: 'board@acmecorp.co.za', format: 'PDF', on: false, next: '—' },
  ],
  settings: {
    goButMaxDays: 30,
    requireConcession: true,
    autoGroundOnNoGo: true,
    complianceTarget: 90,
    passRateTarget: 95,
    cofWarnDays: 90,
    serviceWarnKm: 2000,
    platformName: 'SafeNexus ERP',
    supportEmail: 'support@safenexus.co.za',
    timezone: 'Africa/Johannesburg (SAST)',
    dateFormat: 'DD/MM/YYYY',
    passwordPolicy: 'Strong (12+ characters, number, symbol)',
    sessionTimeout: '8 hours',
    mfa: true,
    loginAudit: true,
    ipAllowlist: false,
    notifyNoGo: true,
    notifySignOff: true,
    notifyCof: true,
    notifyTraining: false,
    retentionYears: 7,
    backupTime: '02:00',

    /* ── fleet operations ──────────────────────────────────────
       Read by a module rather than displayed by one. */
    fuelVariancePct: 12,
    idleAlertPct: 15,
    dieselPrice: 24.1,
    labourRate: 465,
    downtimeEscalationDays: 5,
    woApprovalLimit: 150000,
    poApprovalLimit: 250000,
    minTreadMm: 3,
    planningHorizonDays: 14,
    rateFloor: 24,
    otdTarget: 95,
    podDeadlineHours: 24,
    paymentTerms: '30 days',
    maxWeeklyHours: 60,
    coachingScore: 65,
    standDownScore: 45,
  },
  actor: 'Kobus van der Merwe',
};

function reducer(state, a) {
  state = { ...state, actor: a.by || state.actor };
  switch (a.type) {
    /* ── people ─────────────────────────────────────────────── */
    case 'ADD_USER': {
      const s = { ...state, users: [a.user, ...state.users] };
      return audit(s, 'user', `**${a.by}** added **${a.user.name}** as ${a.user.role.toLowerCase()} — invitation sent with auto-generated credentials`, `${a.user.co} · User created`);
    }
    case 'PATCH_USER': {
      const s = { ...state, users: state.users.map((u) => (u.name === a.name ? { ...u, ...a.patch } : u)) };
      return audit(s, 'user', `**${a.by}** updated **${a.name}** — ${a.note}`, `${a.co || 'Acme Mining Corp'} · User change`);
    }
    case 'SET_USER_STATUS': {
      const s = { ...state, users: state.users.map((u) => (u.name === a.name ? { ...u, status: a.status } : u)) };
      const verb = { Suspended: 'suspended', Active: 'reactivated', Disabled: 'disabled' }[a.status] || 'changed';
      return audit(s, 'user', `**${a.by}** ${verb} **${a.name}**${a.reason ? ` — ${a.reason}` : ''}`, 'Access control');
    }
    case 'DELETE_USER': {
      const u = state.users.find((x) => x.name === a.name);
      let s = { ...state, users: state.users.filter((x) => x.name !== a.name) };
      if (u && u.vehicle && u.vehicle !== '—') {
        s = patchVehicle(s, u.vehicle, { driver: '—', sup: '—', status: 'Available' });
      }
      return audit(s, 'user', `**${a.by}** deleted **${a.name}** (${u?.role || 'user'}) — records retained for ${state.settings.retentionYears} years`,
        'User removed', { entity: a.name, actor: a.by, severity: 'Warning' });
    }
    case 'RESTORE_USER': {
      let s = { ...state, users: [a.user, ...state.users] };
      if (a.user.vehicle && a.user.vehicle !== '—') {
        s = patchVehicle(s, a.user.vehicle, { driver: a.user.name, sup: a.user.reports, status: 'Assigned' });
      }
      return audit(s, 'user', `**${a.by}** restored **${a.user.name}**`, 'Deletion undone');
    }
    case 'ASSIGN_USER_VEHICLE': {
      let s = { ...state, users: state.users.map((u) => (u.name === a.name ? { ...u, vehicle: a.plate } : u)) };
      s = patchVehicle(s, a.plate, { driver: a.name, sup: a.sup, status: 'Assigned' });
      return audit(s, 'assign', `**${a.by}** assigned **${a.plate}** to operator **${a.name}** under supervisor ${a.sup}`, 'Vehicle assignment');
    }
    case 'UNASSIGN_USER_VEHICLE': {
      const u = state.users.find((x) => x.name === a.name);
      let s = { ...state, users: state.users.map((x) => (x.name === a.name ? { ...x, vehicle: '—' } : x)) };
      if (u?.vehicle && u.vehicle !== '—') s = patchVehicle(s, u.vehicle, { driver: '—', sup: '—', status: 'Available' });
      return audit(s, 'unassign', `**${a.by}** unassigned **${u?.vehicle}** from operator **${a.name}** — reason: ${a.reason}`, 'Vehicle assignment');
    }

    /* ── concessions and workshop ───────────────────────────── */
    case 'SIGN_CONCESSION': {
      const d = state.defects.find((x) => x.id === a.id);
      const s = { ...state, defects: state.defects.map((x) => (x.id === a.id ? { ...x, supervisorSigned: true } : x)) };
      return audit(s, 'assign', `**${a.by}** signed the go-but concession on **${a.id}** — ${d?.item} on ${d?.plate}`,
        'Concession signed', { entity: a.id, actor: a.by });
    }
    case 'RAISE_WO': {
      const d = state.defects.find((x) => x.id === a.id);
      const wo = {
        ref: a.ref, vehicle: d.plate, site: d.site, type: a.woType, status: 'Awaiting authorisation',
        opened: today(), defect: a.id, assigned: a.assigned, note: a.note || d.item,
      };
      let s = { ...state, workOrders: [wo, ...state.workOrders] };
      s = { ...s, defects: s.defects.map((x) => (x.id === a.id ? { ...x, workOrder: a.ref } : x)) };
      return audit(s, 'assign', `**${a.by}** raised work order **${a.ref}** against **${a.id}** — ${d.item} on ${d.plate}`,
        'Work order raised', { entity: a.ref, actor: a.by });
    }
    case 'RAISE_WO_DIRECT': {
      /* a work order that comes from an incident or a tyre rather
         than from a failed inspection — same record, no defect */
      const wo = {
        ref: a.ref, vehicle: a.vehicle, site: a.site, type: a.woType,
        status: 'Awaiting authorisation', opened: today(), defect: null,
        assigned: a.assigned, note: a.note, fleetNo: '—', priority: 'High',
        meter: 0, labourHours: 0, labourRate: 465, parts: [],
        technician: '—', downtimeDays: 0, fault: a.note, closed: null,
      };
      const s = { ...state, workOrders: [wo, ...state.workOrders] };
      return audit(s, 'assign', `**${a.by}** raised work order **${a.ref}** against **${a.vehicle}** — ${a.note}`,
        'Work order raised', { entity: a.ref, actor: a.by });
    }
    case 'WO_STATUS': {
      const w = state.workOrders.find((x) => x.ref === a.ref);
      const s = { ...state, workOrders: state.workOrders.map((x) => (x.ref === a.ref ? { ...x, status: a.status } : x)) };
      return audit(s, 'assign', `**${a.by}** moved work order **${a.ref}** to ${a.status.toLowerCase()} — ${w?.vehicle}`,
        'Workshop', { entity: a.ref, actor: a.by });
    }
    case 'PUBLISH_TEMPLATE': {
      const s = {
        ...state,
        templates: state.templates.map((t) => (t.id === a.id
          ? { ...t, status: 'Published', revision: t.status === 'Draft' ? t.revision : t.revision }
          : t)),
      };
      const t = state.templates.find((x) => x.id === a.id);
      return audit(s, 'user', `**${a.by}** published **${t?.name}** revision ${t?.revision}`,
        'Inspection form', { entity: a.id, actor: a.by, severity: 'Warning' });
    }
    case 'REVISE_TEMPLATE': {
      const t = state.templates.find((x) => x.id === a.id);
      const s = {
        ...state,
        templates: state.templates.map((x) => (x.id === a.id ? { ...x, revision: x.revision + 1, status: 'Draft' } : x)),
      };
      return audit(s, 'user', `**${a.by}** opened revision ${(t?.revision || 0) + 1} of **${t?.name}** as a draft`,
        'Inspection form', { entity: a.id, actor: a.by });
    }

    /* ── fleet ──────────────────────────────────────────────── */
    case 'ADD_VEHICLE': {
      const s = { ...state, vehicles: [a.vehicle, ...state.vehicles] };
      return audit(s, 'assign', `**${a.by}** added **${a.vehicle.plate}** (${a.vehicle.make}) to the fleet register`, `${a.vehicle.co} · Vehicle created`);
    }
    case 'PATCH_VEHICLE': {
      const s = patchVehicle(state, a.plate, a.patch);
      return a.note ? audit(s, 'assign', `**${a.by}** updated **${a.plate}** — ${a.note}`, 'Fleet register') : s;
    }
    case 'ASSIGN_VEHICLE': {
      const s = patchVehicle(state, a.plate, { driver: a.driver, sup: a.sup, status: 'Assigned' });
      return audit(s, 'assign', `**${a.by}** assigned **${a.plate}** to operator **${a.driver}** under supervisor ${a.sup}`, 'Vehicle assignment');
    }
    case 'UNASSIGN_VEHICLE': {
      const v = state.vehicles.find((x) => x.plate === a.plate);
      const s = patchVehicle(state, a.plate, { driver: '—', sup: '—', status: 'Available' });
      return audit(s, 'unassign', `**${a.by}** unassigned **${a.plate}** from operator ${v?.driver || '—'} — reason: ${a.reason}`, 'Vehicle assignment');
    }
    case 'GROUND_VEHICLE': {
      const s = patchVehicle(state, a.plate, { status: 'Maintenance' });
      return audit(s, 'warn', `**${a.by}** grounded vehicle **${a.plate}** — ${a.reason}`, 'Vehicle taken off road');
    }
    case 'RETURN_VEHICLE': {
      const v = state.vehicles.find((x) => x.plate === a.plate);
      const s = patchVehicle(state, a.plate, { status: v?.driver && v.driver !== '—' ? 'Assigned' : 'Available' });
      return audit(s, 'assign', `**${a.by}** returned **${a.plate}** to service after repair`, 'Vehicle returned');
    }
    case 'LOG_ODO': {
      const s = patchVehicle(state, a.plate, { km: a.km });
      return audit(s, 'insp', `**${a.by}** updated the odometer on **${a.plate}** to ${a.km.toLocaleString('en-GB').replace(/,/g, ' ')} km`, 'Fleet register');
    }

    /* ── inspections and defects ────────────────────────────── */
    case 'ADD_INSPECTION': {
      let s = { ...state, inspections: [a.inspection, ...state.inspections] };
      if (a.defects.length) s = { ...s, defects: [...a.defects, ...s.defects] };
      s = patchVehicle(s, a.inspection.vehicle, {
        lastInsp: 'Just now' + (a.inspection.result === 'no-go' ? ' (No-go)' : ''),
        km: a.inspection.meter || undefined,
        ...(a.ground ? { status: 'Maintenance' } : {}),
      });
      s = audit(s, 'insp', `**${a.inspection.op}** submitted inspection **#${a.inspection.ref}** for ${a.inspection.vehicle} — ${a.inspection.result === 'no-go' ? 'No-go' : a.inspection.result === 'go-but' ? `Go-but (W×${a.inspection.go})` : 'In order'}`, `${a.inspection.co} · Pre-use inspection`);
      if (a.ground) {
        s = audit(s, 'warn', `**System** grounded vehicle **${a.inspection.vehicle}** — no-go defect detected on inspection #${a.inspection.ref}`,
          `${a.inspection.co} · Automatic action`, { actor: 'System', entity: a.inspection.vehicle, severity: 'Critical' });
      }
      return s;
    }
    case 'SIGN_INSPECTION': {
      const s = { ...state, inspections: state.inspections.map((i) => (i.ref === a.ref ? { ...i, signed: true, signedBy: a.by } : i)) };
      return audit(s, 'insp', `**${a.by}** signed off inspection **#${a.ref}**`, 'Supervisor sign-off');
    }
    case 'REJECT_INSPECTION': {
      const s = { ...state, inspections: state.inspections.map((i) => (i.ref === a.ref ? { ...i, rejected: true } : i)) };
      return audit(s, 'warn', `**${a.by}** returned inspection **#${a.ref}** to the operator — ${a.reason}`, 'Sign-off rejected');
    }
    case 'CLOSE_DEFECT': {
      const d = state.defects.find((x) => x.id === a.id);
      let s = { ...state, defects: state.defects.map((x) => (x.id === a.id ? { ...x, status: 'Closed', closedOn: today() } : x)) };
      if (d && d.severity === 'No Go') {
        const stillOpen = s.defects.some((x) => x.plate === d.plate && x.severity === 'No Go' && x.status === 'Open');
        if (!stillOpen) {
          const v = s.vehicles.find((x) => x.plate === d.plate);
          s = patchVehicle(s, d.plate, { status: v?.driver && v.driver !== '—' ? 'Assigned' : 'Available' });
        }
      }
      return audit(s, 'assign', `**${a.by}** closed defect **${a.id}** — ${d?.item} on ${d?.plate}`, 'Defect closed');
    }
    case 'EXTEND_DEFECT': {
      const s = { ...state, defects: state.defects.map((x) => (x.id === a.id ? { ...x, age: 0, extended: true } : x)) };
      return audit(s, 'warn', `**${a.by}** extended the concession on **${a.id}** by ${a.days} days`, 'Concession extended');
    }

    /* ══════════════════════════════════════════════════════════
       Dispatch — the haulage jobs the fleet runs.
       ══════════════════════════════════════════════════════════ */
    case 'PLAN_JOB': {
      const s = { ...state, jobs: [a.job, ...state.jobs] };
      return audit(s, 'assign',
        `**${a.by}** planned **${a.job.ref}** — ${a.job.origin} → ${a.job.destination}, ${num(a.job.distance)} km on ${a.job.vehicle}`,
        'Dispatch', { entity: a.job.ref, actor: a.by });
    }
    case 'JOB_STATUS': {
      const j = state.jobs.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        jobs: state.jobs.map((x) => (x.ref === a.ref
          ? { ...x, status: a.status, ...(a.status === 'Delivered' ? { arrived: today() } : {}) }
          : x)),
      };
      return audit(s, a.status === 'Cancelled' ? 'warn' : 'assign',
        `**${a.by}** moved **${a.ref}** to ${a.status.toLowerCase()} — ${j?.customer}, ${j?.destination}`,
        'Dispatch', { entity: a.ref, actor: a.by });
    }
    case 'RECORD_POD': {
      const s = { ...state, jobs: state.jobs.map((x) => (x.ref === a.ref ? { ...x, pod: true } : x)) };
      return audit(s, 'insp', `**${a.by}** captured the proof of delivery for **${a.ref}**`,
        'Dispatch', { entity: a.ref, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Fuel. A transaction the system cannot reconcile is an
       exception until a person clears it, with a reason.
       ══════════════════════════════════════════════════════════ */
    case 'ADD_FUEL': {
      let s = { ...state, fuel: [a.entry, ...state.fuel] };
      if (a.entry.meter) s = patchVehicle(s, a.entry.vehicle, { km: a.entry.meter });
      return audit(s, 'insp',
        `**${a.by}** captured **${a.entry.ref}** — ${num(a.entry.litres)} L on ${a.entry.vehicle} at ${a.entry.station}, ${R(a.entry.amount)}`,
        'Fuel', { entity: a.entry.ref, actor: a.by });
    }
    case 'VERIFY_FUEL': {
      const f = state.fuel.find((x) => x.ref === a.ref);
      const s = { ...state, fuel: state.fuel.map((x) => (x.ref === a.ref ? { ...x, status: 'Verified' } : x)) };
      return audit(s, 'insp', `**${a.by}** verified fuel transaction **${a.ref}** — ${f?.litres} L on ${f?.vehicle}`,
        'Fuel', { entity: a.ref, actor: a.by });
    }
    case 'CLEAR_EXCEPTION': {
      const f = state.fuel.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        fuel: state.fuel.map((x) => (x.ref === a.ref
          ? { ...x, exception: null, status: 'Verified', clearedReason: a.reason } : x)),
      };
      return audit(s, 'warn',
        `**${a.by}** cleared the exception on **${a.ref}** — ${f?.exception} · ${a.reason}`,
        'Fuel exception', { entity: a.ref, actor: a.by, severity: 'Warning' });
    }

    /* ══════════════════════════════════════════════════════════
       Tyres. A tyre below the legal tread may not run, so
       scrapping one raises the defect that grounds the vehicle.
       ══════════════════════════════════════════════════════════ */
    case 'LOG_TREAD': {
      const t = state.tyres.find((x) => x.serial === a.serial);
      const min = state.settings.minTreadMm;
      const status = a.tread < min ? 'Scrap' : a.tread < min + 2 ? 'Watch' : a.tread > 13 ? 'New' : 'Running';
      const s = {
        ...state,
        tyres: state.tyres.map((x) => (x.serial === a.serial ? { ...x, tread: a.tread, status } : x)),
      };
      return audit(s, a.tread < min ? 'warn' : 'insp',
        `**${a.by}** measured **${a.serial}** at ${a.tread} mm on ${t?.vehicle} ${t?.position}${a.tread < min ? ` — below the ${min} mm legal limit` : ''}`,
        'Tyre register', { entity: a.serial, actor: a.by, severity: a.tread < min ? 'Warning' : 'Information' });
    }
    case 'SCRAP_TYRE': {
      const t = state.tyres.find((x) => x.serial === a.serial);
      const s = {
        ...state,
        tyres: state.tyres.map((x) => (x.serial === a.serial
          ? { ...x, status: 'Scrapped', scrapped: today(), scrapReason: a.reason } : x)),
      };
      return audit(s, 'warn',
        `**${a.by}** scrapped **${a.serial}** off ${t?.vehicle} ${t?.position} at ${t?.tread} mm — ${a.reason}`,
        'Tyre register', { entity: a.serial, actor: a.by, severity: 'Warning' });
    }
    case 'FIT_TYRE': {
      const s = { ...state, tyres: [a.tyre, ...state.tyres] };
      return audit(s, 'assign',
        `**${a.by}** fitted **${a.tyre.serial}** (${a.tyre.brand}) to ${a.tyre.vehicle} ${a.tyre.position}`,
        'Tyre register', { entity: a.tyre.serial, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Stores. Issuing a part moves it out of stock and onto the
       job card, so the workshop cost and the stock value cannot
       disagree.
       ══════════════════════════════════════════════════════════ */
    case 'ISSUE_PART': {
      const p = state.parts.find((x) => x.sku === a.sku);
      if (!p || p.qty < a.qty) return state;
      let s = {
        ...state,
        parts: state.parts.map((x) => (x.sku === a.sku
          ? { ...x, qty: x.qty - a.qty, lastIssued: shift(0) } : x)),
      };
      if (a.workOrder) {
        s = {
          ...s,
          workOrders: s.workOrders.map((w) => (w.ref === a.workOrder
            ? { ...w, parts: [...(w.parts || []), { sku: p.sku, desc: p.desc, qty: a.qty, price: p.unitCost }] }
            : w)),
        };
      }
      return audit(s, 'assign',
        `**${a.by}** issued ${a.qty} × **${p.desc}** (${p.sku})${a.workOrder ? ` to ${a.workOrder}` : ''} — ${R(a.qty * p.unitCost)}`,
        'Stores', { entity: p.sku, actor: a.by });
    }
    case 'ADJUST_STOCK': {
      const p = state.parts.find((x) => x.sku === a.sku);
      const s = { ...state, parts: state.parts.map((x) => (x.sku === a.sku ? { ...x, qty: a.qty } : x)) };
      return audit(s, 'warn',
        `**${a.by}** adjusted **${p?.desc}** (${a.sku}) from ${p?.qty} to ${a.qty} — ${a.reason}`,
        'Stock adjustment', { entity: a.sku, actor: a.by, severity: 'Warning' });
    }
    case 'ADD_PART': {
      const s = { ...state, parts: [a.part, ...state.parts] };
      return audit(s, 'user', `**${a.by}** added **${a.part.desc}** (${a.part.sku}) to the stores catalogue`,
        'Stores', { entity: a.part.sku, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Workshop depth — labour, parts and authorisation.
       ══════════════════════════════════════════════════════════ */
    case 'WO_LABOUR': {
      const s = {
        ...state,
        workOrders: state.workOrders.map((w) => (w.ref === a.ref
          ? { ...w, labourHours: +(w.labourHours + a.hours).toFixed(1) } : w)),
      };
      return audit(s, 'assign', `**${a.by}** booked ${a.hours} labour hours to **${a.ref}** — ${a.technician}`,
        'Workshop', { entity: a.ref, actor: a.by });
    }
    case 'AUTHORISE_WO': {
      const w = state.workOrders.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        workOrders: state.workOrders.map((x) => (x.ref === a.ref
          ? { ...x, status: 'In progress', authorisedBy: a.by, authorised: today() } : x)),
      };
      return audit(s, 'assign', `**${a.by}** authorised **${a.ref}** — ${w?.type} on ${w?.vehicle}, ${R(a.cost)}`,
        'Workshop authorisation', { entity: a.ref, actor: a.by, severity: 'Warning' });
    }

    /* ══════════════════════════════════════════════════════════
       Procurement. Receiving an order puts the stock away.
       ══════════════════════════════════════════════════════════ */
    case 'RAISE_PO': {
      const s = { ...state, purchaseOrders: [a.po, ...state.purchaseOrders] };
      return audit(s, 'assign',
        `**${a.by}** raised **${a.po.ref}** on ${a.po.supplier} — ${a.po.lines.length} line(s), ${R(poTotal(a.po))}`,
        'Procurement', { entity: a.po.ref, actor: a.by });
    }
    case 'PO_STATUS': {
      const po = state.purchaseOrders.find((x) => x.ref === a.ref);
      let s = {
        ...state,
        purchaseOrders: state.purchaseOrders.map((x) => (x.ref === a.ref ? { ...x, status: a.status } : x)),
      };
      /* a received order lands in the bin it was ordered into */
      if (a.status === 'Received' && po) {
        s = {
          ...s,
          parts: s.parts.map((p) => {
            const line = po.lines.find((l) => l.sku === p.sku);
            return line ? { ...p, qty: p.qty + line.qty, onOrder: Math.max(0, p.onOrder - line.qty) } : p;
          }),
        };
      }
      return audit(s, 'assign',
        `**${a.by}** moved **${a.ref}** to ${a.status.toLowerCase()} — ${po?.supplier}`
        + (a.status === 'Received' ? `, ${po?.lines.length} line(s) taken into stock` : ''),
        'Procurement', { entity: a.ref, actor: a.by });
    }
    case 'SIN_STATUS': {
      const inv = state.supplierInvoices.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        supplierInvoices: state.supplierInvoices.map((x) => (x.ref === a.ref ? { ...x, status: a.status } : x)),
      };
      return audit(s, a.status === 'Query' ? 'warn' : 'assign',
        `**${a.by}** marked supplier invoice **${a.ref}** as ${a.status.toLowerCase()} — ${inv?.supplier}, ${R(inv?.amount)}`,
        'Supplier invoice', { entity: a.ref, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Incidents and claims.
       ══════════════════════════════════════════════════════════ */
    case 'ADD_INCIDENT': {
      let s = { ...state, incidents: [a.incident, ...state.incidents] };
      if (a.ground) s = patchVehicle(s, a.incident.vehicle, { status: 'Maintenance' });
      s = audit(s, 'warn',
        `**${a.by}** logged **${a.incident.ref}** — ${a.incident.type.toLowerCase()} on ${a.incident.vehicle}, ${a.incident.severity.toLowerCase()}`,
        'Incident logged', { entity: a.incident.ref, actor: a.by, severity: a.incident.severity === 'Critical' ? 'Critical' : 'Warning' });
      return s;
    }
    case 'INCIDENT_STATUS': {
      const i = state.incidents.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        incidents: state.incidents.map((x) => (x.ref === a.ref ? { ...x, status: a.status } : x)),
      };
      return audit(s, 'assign', `**${a.by}** moved **${a.ref}** to ${a.status.toLowerCase()} — ${i?.type}`,
        'Incident', { entity: a.ref, actor: a.by });
    }
    case 'INCIDENT_ACTION': {
      const s = {
        ...state,
        incidents: state.incidents.map((x) => (x.ref === a.ref
          ? { ...x, actions: x.actions.map((act, n) => (n === a.index ? { ...act, done: !act.done } : act)) }
          : x)),
      };
      const i = state.incidents.find((x) => x.ref === a.ref);
      return audit(s, 'insp',
        `**${a.by}** ${i?.actions[a.index].done ? 'reopened' : 'completed'} “${i?.actions[a.index].text}” on **${a.ref}**`,
        'Incident action', { entity: a.ref, actor: a.by });
    }
    case 'LODGE_CLAIM': {
      const s = {
        ...state,
        incidents: state.incidents.map((x) => (x.ref === a.ref ? { ...x, claim: a.claim, lodged: today() } : x)),
      };
      return audit(s, 'assign', `**${a.by}** lodged claim **${a.claim}** against **${a.ref}** with ${a.insurer}`,
        'Insurance claim', { entity: a.ref, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Billing.
       ══════════════════════════════════════════════════════════ */
    case 'RAISE_INVOICE': {
      let s = { ...state, invoices: [a.invoice, ...state.invoices] };
      s = { ...s, jobs: s.jobs.map((j) => (a.invoice.jobs.includes(j.ref) ? { ...j, invoice: a.invoice.ref } : j)) };
      return audit(s, 'assign',
        `**${a.by}** raised **${a.invoice.ref}** to ${a.invoice.customer} — ${a.invoice.jobs.length} job(s), ${R(invTotal(a.invoice))}`,
        'Billing', { entity: a.invoice.ref, actor: a.by });
    }
    case 'RECORD_PAYMENT': {
      const inv = state.invoices.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        invoices: state.invoices.map((x) => (x.ref === a.ref
          ? { ...x, payments: [...x.payments, a.payment] } : x)),
      };
      const outstanding = Math.max(0, Math.round(invTotal(inv) - invPaid(inv) - a.payment.amount));
      return audit(s, 'assign',
        `**${a.by}** receipted ${R(a.payment.amount)} against **${a.ref}** — ${inv?.customer}, ${outstanding ? `${R(outstanding)} still outstanding` : 'settled in full'}`,
        'Billing', { entity: a.ref, actor: a.by });
    }

    /* ══════════════════════════════════════════════════════════
       Documents, telematics and approvals.
       ══════════════════════════════════════════════════════════ */
    case 'UPLOAD_DOC': {
      const s = { ...state, documents: [a.doc, ...state.documents] };
      return audit(s, 'user',
        `**${a.by}** uploaded **${a.doc.kind}** for ${a.doc.subject}${a.doc.expires ? ` — expires ${fmtDate(a.doc.expires)}` : ''}`,
        'Document register', { entity: a.doc.ref, actor: a.by });
    }
    case 'VERIFY_DOC': {
      const d = state.documents.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        documents: state.documents.map((x) => (x.ref === a.ref ? { ...x, status: 'Verified' } : x)),
      };
      return audit(s, 'user', `**${a.by}** verified **${d?.kind}** for ${d?.subject}`,
        'Document register', { entity: a.ref, actor: a.by });
    }
    case 'ACK_EVENT': {
      const e = state.events.find((x) => x.id === a.id);
      const s = { ...state, events: state.events.map((x) => (x.id === a.id ? { ...x, acknowledged: true } : x)) };
      return audit(s, 'insp',
        `**${a.by}** acknowledged **${e?.kind}** on ${e?.vehicle} — ${e?.value}`,
        'Telematics', { entity: a.id, actor: a.by });
    }
    case 'DECIDE_APPROVAL': {
      const ap = state.approvals.find((x) => x.ref === a.ref);
      const s = {
        ...state,
        approvals: state.approvals.map((x) => (x.ref === a.ref
          ? { ...x, status: a.decision, decidedBy: a.by, decided: today(), comment: a.comment } : x)),
      };
      return audit(s, a.decision === 'Declined' ? 'warn' : 'assign',
        `**${a.by}** ${a.decision.toLowerCase()} **${a.ref}** — ${ap?.type}, ${R(ap?.amount)}`,
        'Approval', { entity: a.ref, actor: a.by, severity: 'Warning' });
    }
    case 'SET_BUDGET': {
      const s = { ...state, budgets: { ...state.budgets, [a.head]: a.amount } };
      return audit(s, 'user',
        `**${a.by}** set the ${a.label.toLowerCase()} budget to ${R(a.amount)} for the month`,
        'Cost control', { entity: a.head, actor: a.by, severity: 'Warning' });
    }
    case 'SET_PERM': {
      const s = {
        ...state,
        roles: state.roles.map((r) => (r.name === a.role
          ? { ...r, perms: { ...r.perms, [a.module]: a.level } } : r)),
      };
      return audit(s, 'user',
        `**${a.by}** set **${a.role}** access to ${a.module} at “${a.level}”`,
        'Roles and permissions', { entity: a.role, actor: a.by, severity: 'Warning' });
    }
    case 'RUN_JOB': {
      const s = {
        ...state,
        scheduledJobs: state.scheduledJobs.map((j) => (j.name === a.name
          ? { ...j, last: 'Just now', status: 'Success' } : j)),
      };
      return audit(s, 'insp', `**${a.by}** ran **${a.name}** manually`,
        'Scheduled job', { entity: a.name, actor: a.by });
    }

    case 'SET_SETTINGS': {
      const changed = Object.keys(a.patch).filter((k) => state.settings[k] !== a.patch[k]);
      const s = { ...state, settings: { ...state.settings, ...a.patch } };
      if (!changed.length) return s;
      return audit(s, 'user',
        `**${a.by}** changed ${a.section} — ${changed.map((k) => `${LABELS[k] || k} to “${a.patch[k]}”`).join(', ')}`,
        'Configuration change', { entity: a.section, severity: 'Warning', actor: a.by });
    }
    case 'RECORD_RUN': {
      const s = { ...state, reportRuns: [a.run, ...state.reportRuns].slice(0, 30) };
      return audit(s, 'insp', `**${a.by}** generated **${a.run.report}** — ${a.run.rows} rows, ${a.run.scope}`,
        'Report generated', { entity: a.run.id, actor: a.by });
    }
    case 'TOGGLE_SCHEDULE': {
      const sch = state.schedules.find((x) => x.id === a.id);
      const s = { ...state, schedules: state.schedules.map((x) => (x.id === a.id ? { ...x, on: !x.on } : x)) };
      return audit(s, 'user', `**${a.by}** ${sch?.on ? 'paused' : 'resumed'} the schedule for **${sch?.report}**`,
        'Report schedule', { entity: a.id, actor: a.by });
    }
    case 'AUDIT':
      return audit(state, a.kind || 'user', a.text, a.meta);
    default:
      return state;
  }
}

export function StoreProvider({ children, me, flash }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [selection, setSelection] = useState({
    vehicle: null, user: null, inspection: null, defect: null, company: null,
    job: null, fuel: null, tyre: null, part: null, po: null, supplierInvoice: null,
    incident: null, invoice: null, document: null, workOrder: null,
  });
  const [inspView, setInspView] = useState('sheets');   /* 'sheets' | 'defects' | 'forms' — the reading pane follows it */
  /* screens that carry more than one register keep their own sub-view */
  const [subView, setSubView] = useState({});
  const setView = useCallback((tab, v) => setSubView((s) => ({ ...s, [tab]: v })), []);

  const select = useCallback((kind, id) => setSelection((s) => ({ ...s, [kind]: id })), []);

  const value = useMemo(() => ({
    ...state,
    me,
    flash,
    dispatch,
    selection,
    select,
    inspView,
    setInspView,
    subView,
    setView,
    /* derived — one place, so a reading pane and its register can
       never be looking at two different records */
    vehicle: state.vehicles.find((v) => v.plate === selection.vehicle) || null,
    inspection: state.inspections.find((i) => i.ref === selection.inspection) || null,
    openDefects: state.defects.filter((d) => d.status !== 'Closed'),
    workOrder: state.workOrders.find((w) => w.ref === selection.workOrder) || null,
    user: state.users.find((u) => u.name === selection.user) || null,
    defect: state.defects.find((d) => d.id === selection.defect) || null,
    job: state.jobs.find((j) => j.ref === selection.job) || null,
    fuelTx: state.fuel.find((f) => f.ref === selection.fuel) || null,
    tyre: state.tyres.find((t) => t.serial === selection.tyre) || null,
    part: state.parts.find((p) => p.sku === selection.part) || null,
    po: state.purchaseOrders.find((x) => x.ref === selection.po) || null,
    supplierInvoice: state.supplierInvoices.find((x) => x.ref === selection.supplierInvoice) || null,
    incident: state.incidents.find((x) => x.ref === selection.incident) || null,
    invoice: state.invoices.find((x) => x.ref === selection.invoice) || null,
    document: state.documents.find((x) => x.ref === selection.document) || null,
    set: (patch, section) => dispatch({ type: 'SET_SETTINGS', patch, section, by: me.name }),
    newRef: () => String(2120353 + state.inspections.length),
    newId: ref,
  }), [state, selection, select, inspView, subView, setView, me, flash]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

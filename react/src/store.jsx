import React, { createContext, useContext, useMemo, useReducer, useState, useCallback } from 'react';
import { COMPANIES, USERS, FLEET, INSPECTIONS, AUDIT, COURSES, ENROLMENTS } from './data.js';
import { TEMPLATES } from './inspection/templates.js';

/* ══════════════════════════════════════════════════════════════
   One store for everything the modules mutate. Every action that
   changes a record also writes the audit entry for it, so the trail
   cannot drift from the data — the same rule the real product needs.
   ══════════════════════════════════════════════════════════════ */

const AppCtx = createContext(null);
export const useStore = () => useContext(AppCtx);

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const ref = (p) => p + '-' + Math.floor(100000 + Math.random() * 899999);

const audit = (state, type, text, meta) => ({
  ...state,
  audit: [{ type, text, meta, time: now() }, ...state.audit],
});

const patchVehicle = (state, plate, patch) => ({
  ...state,
  vehicles: state.vehicles.map((v) => (v.plate === plate ? { ...v, ...patch } : v)),
});

const initial = {
  companies: COMPANIES,
  users: USERS,
  vehicles: FLEET,
  inspections: INSPECTIONS.map((i) => ({ ...i, sheet: null })),
  defects: [
    { id: 'DEF-100241', item: 'Air conditioner', plate: 'DBN 001 NP', severity: 'Go But', raised: '15 May 2026', age: 34, status: 'Open', inspection: '2120290', co: 'Grootegeluk Coal' },
    { id: 'DEF-100238', item: 'Reflective tape condition', plate: 'GP 112 ZL', severity: 'Go But', raised: '17 May 2026', age: 32, status: 'Open', inspection: '2120281', co: 'Zimele Logistics' },
    { id: 'DEF-100252', item: 'Windows and windscreen wipers', plate: 'CA 123 GP', severity: 'Go But', raised: '21 May 2026', age: 28, status: 'Open', inspection: '2120302', co: 'Acme Mining Corp' },
    { id: 'DEF-100260', item: 'Window washer', plate: 'WC 321 CT', severity: 'Go But', raised: '23 May 2026', age: 26, status: 'Open', inspection: '2120311', co: 'Acme Mining Corp' },
    { id: 'DEF-100288', item: 'Brakes', plate: 'WC 321 CT', severity: 'No Go', raised: '17 Jun 2026', age: 1, status: 'Open', inspection: '2120345', co: 'Acme Mining Corp' },
  ],
  templates: TEMPLATES,
  courses: COURSES,
  enrolments: ENROLMENTS,
  audit: AUDIT,
};

function reducer(state, a) {
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
      s = { ...s, enrolments: s.enrolments.filter((e) => e.user !== a.name) };
      return audit(s, 'user', `**${a.by}** deleted **${a.name}** (${u?.role || 'user'}) — records retained for 7 years`, 'User removed');
    }
    case 'RESTORE_USER': {
      let s = { ...state, users: [a.user, ...state.users] };
      if (a.enrolments?.length) s = { ...s, enrolments: [...a.enrolments, ...s.enrolments] };
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

    /* ── learning ───────────────────────────────────────────── */
    case 'ENROL': {
      const s = { ...state, enrolments: [{ user: a.name, course: a.course, status: 'In progress', done: null, expires: null, score: null, progress: 0 }, ...state.enrolments] };
      const c = state.courses.find((x) => x.id === a.course);
      return audit(s, 'user', `**${a.by}** enrolled **${a.name}** on **${c?.name || a.course}**`, 'Training assigned');
    }
    case 'COMPLETE_COURSE': {
      const c = state.courses.find((x) => x.id === a.course);
      const done = new Date();
      const expires = c?.validity ? new Date(done.getFullYear() + Math.floor(c.validity / 12), done.getMonth() + (c.validity % 12), done.getDate()) : null;
      const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const s = {
        ...state,
        enrolments: state.enrolments.map((e) => (e.user === a.name && e.course === a.course
          ? { ...e, status: 'Valid', done: fmt(done), expires: expires ? fmt(expires) : null, score: a.score, progress: 100 }
          : e)),
      };
      return audit(s, 'insp', `**${a.name}** completed **${c?.name || a.course}** — ${a.score}%`, 'Training record');
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
        ...(a.inspection.result === 'no-go' ? { status: 'Maintenance' } : {}),
      });
      s = audit(s, 'insp', `**${a.inspection.op}** submitted inspection **#${a.inspection.ref}** for ${a.inspection.vehicle} — ${a.inspection.result === 'no-go' ? 'No-go' : a.inspection.result === 'go-but' ? `Go-but (W×${a.inspection.go})` : 'In order'}`, `${a.inspection.co} · Pre-use inspection`);
      if (a.inspection.result === 'no-go') {
        s = audit(s, 'warn', `**System** grounded vehicle **${a.inspection.vehicle}** — no-go defect detected on inspection #${a.inspection.ref}`, `${a.inspection.co} · Automatic action`);
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
      let s = { ...state, defects: state.defects.map((x) => (x.id === a.id ? { ...x, status: 'Closed' } : x)) };
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

    /* ── companies ──────────────────────────────────────────── */
    case 'ADD_COMPANY': {
      const s = { ...state, companies: [a.company, ...state.companies] };
      return audit(s, 'user', `**${a.by}** registered **${a.company.name}** on the ${a.company.plan} plan`, 'Company created');
    }
    case 'AUDIT':
      return audit(state, a.kind || 'user', a.text, a.meta);
    default:
      return state;
  }
}

export function StoreProvider({ children, me, flash }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [selection, setSelection] = useState({ vehicle: null, user: null, inspection: null, defect: null, company: null });
  const [inspView, setInspView] = useState('sheets');   /* 'sheets' | 'defects' — the reading pane follows it */

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
    /* derived */
    vehicle: state.vehicles.find((v) => v.plate === selection.vehicle) || null,
    inspection: state.inspections.find((i) => i.ref === selection.inspection) || null,
    openDefects: state.defects.filter((d) => d.status === 'Open'),
    newRef: () => String(2120353 + state.inspections.length),
    newId: ref,
  }), [state, selection, select, inspView, me, flash]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

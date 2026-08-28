import React, { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';

import TitleBar from './shell/TitleBar.jsx';
import Ribbon from './shell/Ribbon.jsx';
import NavPane from './shell/NavPane.jsx';
import StatusBar from './shell/StatusBar.jsx';
import Backstage from './shell/Backstage.jsx';
import { MESSAGES } from './shell/ribbon.js';
import { Dialog } from './components/ui.jsx';
import { VehiclePane, InspectionPane, DefectPane, UserPane, WorkOrderPane, FormPane } from './components/panes.jsx';
import Toasts from './components/Toasts.jsx';
import AuthShell, { LockScreen } from './auth/AuthShell.jsx';
import InspectionRunner from './inspection/InspectionRunner.jsx';
import { templateFor } from './inspection/templates.js';
import { StoreProvider, useStore } from './store.jsx';
import { siteName, SITES } from './data.js';

import Dashboard from './screens/Dashboard.jsx';
import { Users, Fleet, Inspections } from './screens/Registers.jsx';
import AuditLog from './screens/AuditLog.jsx';
import Forms from './screens/Forms.jsx';
import Workshop from './screens/Workshop.jsx';
import { Hierarchy, Compliance, CompanyProfile } from './screens/Misc.jsx';
import Analytics from './screens/Analytics.jsx';
import Settings from './screens/Settings.jsx';
import Reports from './screens/Reports.jsx';

const ME = {
  name: 'Kobus van der Merwe', initials: 'KM', role: 'Administrator',
  email: 'admin@acmecorp.co.za', co: 'Acme Mining Corp',
};

/* screens that carry a reading pane */
const PANE_TABS = { fleet: 1, inspections: 1, users: 1, workshop: 1 };

function Workspace({ msg, setMsg, toasts, flash, closeToast }) {
  const store = useStore();
  const {
    dispatch, me, vehicles, users, defects, inspections, templates, selection, select, inspView,
  } = store;

  const [tab, setTab] = useState('dashboard');
  const [company, setCompany] = useState('ALL');
  const [collapsed, setCollapsed] = useState(false);
  const [navWidth, setNavWidth] = useState(208);
  const [navHidden, setNavHidden] = useState(false);
  const [paneWidth, setPaneWidth] = useState(360);
  const [paneOff, setPaneOff] = useState(false);
  const [density, setDensity] = useState('Comfortable');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [backstage, setBackstage] = useState(false);
  const [runner, setRunner] = useState(null);
  const [signedOut, setSignedOut] = useState(false);

  const goTab = useCallback((key) => { setTab(key); setCollapsed(false); }, []);

  const vehicle = store.vehicle;
  const inspection = store.inspection;
  const defect = defects.find((d) => d.id === selection.defect) || null;
  const user = users.find((u) => u.name === selection.user) || null;

  /* a command that acts on a selection says so when there is none */
  const need = (thing, what) => {
    if (thing) return true;
    flash(`Select ${what} first.`, { tone: 'warn', title: 'Nothing selected' });
    return false;
  };

  const openRunner = useCallback((templateId) => {
    const chosen = templateId && templates.find((t) => t.id === templateId);
    if (chosen && chosen.status !== 'Published') {
      flash(`${chosen.name} is a draft — publish it before it can be used to capture.`, { tone: 'warn', title: 'Draft form' });
      return;
    }
    const v = vehicle || vehicles.find((x) => x.status !== 'Maintenance') || vehicles[0];
    setRunner({ tpl: chosen || templateFor(v.type, templates), plate: v.plate });
  }, [vehicle, vehicles, templates, flash]);

  /* ── inspection submission: the rules live here ─────────────── */
  const submitInspection = (r) => {
    const ref = store.newRef();
    const ok = r.items.length - r.noGo.length - r.goBut.length;
    const rules = store.settings;
    const unsignedConcession = rules.requireConcession && r.goBut.length > 0 && !r.supSigned;
    const failed = r.noGo.length > 0 || unsignedConcession;
    const grounded = failed && rules.autoGroundOnNoGo;
    const result = failed ? 'no-go' : r.goBut.length ? 'go-but' : 'in-order';
    const v = vehicles.find((x) => x.plate === r.plate);

    const fmtDate = (dt) => dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const today = new Date();
    const due = new Date(today.getTime() + rules.goButMaxDays * 86400000);
    const raised = [
      ...r.noGo.map((i) => ({ severity: 'No Go', item: i })),
      ...r.goBut.map((i) => ({ severity: 'Go But', item: i })),
    ].map((d, n) => ({
      id: `DEF-26-${5100 + defects.length + n}`,
      item: d.item.label, section: d.item.section, plate: r.plate, site: v?.site || 'PIT',
      severity: d.severity,
      raised: fmtDate(today),
      due: d.severity === 'No Go' ? fmtDate(today) : fmtDate(due),
      age: 0, status: 'Open', inspection: ref, raisedBy: r.operator,
      supervisorSigned: d.severity === 'No Go' ? true : !!r.supSigned,
      workOrder: null,
      note: r.notes?.[d.item.id]
        || (d.severity === 'No Go'
          ? 'Vehicle grounded until the defect is repaired and signed off.'
          : 'Operating under a go-but concession.'),
    }));

    dispatch({
      type: 'ADD_INSPECTION',
      inspection: {
        ref, date: 'Just now', vehicle: r.plate, op: r.operator, site: v?.site || 'PIT',
        shift: r.shift, ok, go: r.goBut.length, ng: r.noGo.length, result,
        signed: false, sheet: r.results, meter: r.meter, remarks: r.remarks,
        conds: r.conds, supSigned: r.supSigned, templateId: r.tpl.id,
        notes: r.notes, photos: r.photos, delay: r.delay, signers: r.signers,
      },
      defects: raised,
      ground: grounded,
    });

    setRunner(null);
    select('inspection', ref);
    goTab('inspections');
    flash(
      result === 'no-go'
        ? `${r.plate} ${grounded ? 'grounded' : 'failed the check'}, ${raised.length} defect(s) raised.`
        : result === 'go-but'
          ? `Go-but concession recorded, ${r.goBut.length} item(s) on a ${rules.goButMaxDays}-day clock.`
          : `${r.plate} is fit for service.`,
      {
        tone: result === 'no-go' ? 'err' : result === 'go-but' ? 'warn' : 'ok',
        title: `Inspection #${ref} submitted`,
      },
    );
  };

  /* ── commands ───────────────────────────────────────────────── */
  const run = useCallback((cmd) => {
    const [head, arg] = cmd.includes(':') ? [cmd.slice(0, cmd.indexOf(':')), cmd.slice(cmd.indexOf(':') + 1)] : [cmd, null];

    switch (head) {
      case 'goto': return goTab(arg);
      case 'dlg': return setDialog(arg);
      case 'report': return flash(`Generating ${arg.toLowerCase()}…`);

      /* view */
      case 'density': {
        const next = density === 'Comfortable' ? 'Compact' : 'Comfortable';
        setDensity(next);
        return flash(`Row density set to ${next.toLowerCase()}.`);
      }
      case 'collapse': return setCollapsed((c) => !c);
      case 'toggleNav':
        setNavHidden((h) => { flash(`Navigation pane ${h ? 'shown' : 'hidden'}.`); return !h; });
        return undefined;
      case 'togglePane':
        setPaneOff((p) => { flash(`Reading pane ${p ? 'shown' : 'hidden'}.`); return !p; });
        return undefined;

      /* inspections */
      case 'startInspection': return openRunner(arg);
      case 'signOff': {
        if (!need(inspection, 'an inspection')) return goTab('inspections');
        if (inspection.signed) return flash(`#${inspection.ref} is already signed off.`);
        dispatch({ type: 'SIGN_INSPECTION', ref: inspection.ref, by: me.name });
        return flash(`Sign-off recorded against #${inspection.ref}.`);
      }
      case 'rejectInspection':
        if (!need(inspection, 'an inspection')) return undefined;
        return setDialog('reject');
      case 'signOffAll': {
        const pending = inspections.filter((i) => !i.signed);
        pending.forEach((i) => dispatch({ type: 'SIGN_INSPECTION', ref: i.ref, by: me.name }));
        return flash(`${pending.length} inspection(s) signed off in bulk.`);
      }
      case 'openDefect': {
        select('defect', arg);
        store.setInspView('defects');
        return goTab('inspections');
      }
      case 'closeDefect': {
        const id = arg || selection.defect;
        if (!need(id, 'a defect')) return undefined;
        dispatch({ type: 'CLOSE_DEFECT', id, by: me.name });
        return flash(`Defect ${id} closed.`);
      }
      case 'extendDefect': {
        const id = arg || selection.defect;
        if (!need(id, 'a defect')) return undefined;
        dispatch({ type: 'EXTEND_DEFECT', id, days: 14, by: me.name });
        return flash(`Concession on ${id} extended by 14 days.`);
      }

      /* fleet */
      case 'assignVehicle':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        return setDialog('assign');
      case 'unassignVehicle':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        if (vehicle.driver === '—') return flash(`${vehicle.plate} is not assigned to anyone.`);
        return setDialog('unassign');
      case 'ground':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        if (vehicle.status === 'Maintenance') return flash(`${vehicle.plate} is already off the road.`);
        return setDialog('ground');
      case 'returnService': {
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        const blocking = defects.filter((d) => d.plate === vehicle.plate && d.severity === 'No Go' && d.status === 'Open');
        if (blocking.length) return flash(`${vehicle.plate} still has ${blocking.length} open no-go defect(s) — close them first.`);
        dispatch({ type: 'RETURN_VEHICLE', plate: vehicle.plate, by: me.name });
        return flash(`${vehicle.plate} returned to service.`);
      }
      case 'logOdo':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        return setDialog('odo');
      case 'bookService':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        return setDialog('service');
      case 'editVehicle':
        if (!need(vehicle, 'a vehicle')) return goTab('fleet');
        return flash(`Editing ${vehicle.plate}. Use the reading pane actions to change its state.`);

      /* people */
      case 'openUser':
        if (!need(user, 'a user')) return goTab('users');
        return goTab('users');
      case 'editUser':
        if (!need(user, 'a user')) return goTab('users');
        return setDialog('editUser');
      case 'suspendUser':
        if (!need(user, 'a user')) return goTab('users');
        if (user.status === 'Suspended') return flash(`${user.name} is already suspended.`, { tone: 'warn' });
        return setDialog('suspend');
      case 'reactivateUser': {
        if (!need(user, 'a user')) return goTab('users');
        if (user.status === 'Active') return flash(`${user.name} is already active.`, { tone: 'warn' });
        dispatch({ type: 'SET_USER_STATUS', name: user.name, status: 'Active', by: me.name });
        return flash(`${user.name} can sign in again.`, { title: 'Reactivated' });
      }
      case 'deleteUser':
        if (!need(user, 'a user')) return goTab('users');
        return setDialog('deleteUser');
      case 'assignUserVehicle':
        if (!need(user, 'a user')) return goTab('users');
        if (user.vehicle && user.vehicle !== '—') return flash(`${user.name} already has ${user.vehicle}.`, { tone: 'warn' });
        if (!vehicles.some((v) => v.driver === '—')) return flash('No unassigned vehicle is available.', { tone: 'warn' });
        return setDialog('assignUser');
      case 'unassignUserVehicle':
        if (!need(user, 'a user')) return goTab('users');
        if (!user.vehicle || user.vehicle === '—') return flash(`${user.name} has no vehicle assigned.`, { tone: 'warn' });
        return setDialog('unassignUser');
      case 'openUserVehicle': {
        if (!need(user, 'a user')) return goTab('users');
        if (!user.vehicle || user.vehicle === '—') return flash(`${user.name} has no vehicle assigned.`, { tone: 'warn' });
        select('vehicle', user.vehicle);
        return goTab('fleet');
      }
      case 'resetPassword': {
        if (!need(user, 'a user')) return goTab('users');
        dispatch({ type: 'AUDIT', kind: 'user', text: `**${me.name}** sent a password reset to **${user.name}**`, meta: 'Access control' });
        return flash(`Reset link emailed to ${user.email}. It expires in 30 minutes.`, { title: 'Password reset sent' });
      }

      /* concessions, workshop and forms */
      case 'inspView':
        store.setInspView(arg);
        return goTab('inspections');
      case 'lapsedConcessions': {
        store.setInspView('defects');
        goTab('inspections');
        const n = defects.filter((d) => d.status === 'Overdue').length;
        return flash(n
          ? `${n} concession(s) have lapsed — those vehicles are running as if uninspected.`
          : 'No concession has lapsed.', { tone: n ? 'warn' : 'ok' });
      }
      case 'signConcession': {
        const id = arg || selection.defect;
        if (!need(id, 'a defect')) return undefined;
        const d = defects.find((x) => x.id === id);
        if (d?.severity !== 'Go But') return flash('Only a go-but defect carries a concession.', { tone: 'warn' });
        if (d.supervisorSigned) return flash(`${id} is already signed.`, { tone: 'warn' });
        dispatch({ type: 'SIGN_CONCESSION', id, by: me.name });
        return flash(`Concession on ${id} signed — ${d.item} may run to ${d.due}.`, { title: 'Concession signed' });
      }
      case 'raiseWO': {
        const id = arg || selection.defect;
        if (!need(id, 'a defect')) { store.setInspView('defects'); return goTab('inspections'); }
        const d = defects.find((x) => x.id === id);
        if (d?.workOrder) return flash(`${id} already has work order ${d.workOrder}.`, { tone: 'warn' });
        select('defect', id);
        return setDialog('raiseWO');
      }
      case 'woStatus': {
        const ref = selection.workOrder;
        if (!need(ref, 'a work order')) return goTab('workshop');
        dispatch({ type: 'WO_STATUS', ref, status: arg, by: me.name });
        return flash(`${ref} moved to ${arg.toLowerCase()}.`, { title: 'Workshop' });
      }
      case 'openWO': {
        select('workOrder', arg);
        return goTab('workshop');
      }
      case 'openWODefect': {
        const w = store.workOrders.find((x) => x.ref === selection.workOrder);
        if (!need(w?.defect, 'a work order raised from a defect')) return undefined;
        select('defect', w.defect);
        store.setInspView('defects');
        return goTab('inspections');
      }
      case 'openWOVehicle': {
        const w = store.workOrders.find((x) => x.ref === selection.workOrder);
        if (!need(w, 'a work order')) return goTab('workshop');
        select('vehicle', w.vehicle);
        return goTab('fleet');
      }
      case 'publishForm': {
        const t = templates.find((x) => x.id === selection.template);
        if (!need(t, 'a form')) { store.setInspView('forms'); return goTab('inspections'); }
        if (t.status === 'Published') return flash(`${t.name} is already published.`, { tone: 'warn' });
        dispatch({ type: 'PUBLISH_TEMPLATE', id: t.id, by: me.name });
        return flash(`${t.name} published at revision ${t.revision}.`, { title: 'Form published' });
      }
      case 'reviseForm': {
        const t = templates.find((x) => x.id === selection.template);
        if (!need(t, 'a form')) { store.setInspView('forms'); return goTab('inspections'); }
        dispatch({ type: 'REVISE_TEMPLATE', id: t.id, by: me.name });
        return flash(`Revision ${t.revision + 1} of ${t.name} opened as a draft.`, { tone: 'info', title: 'New revision' });
      }

      /* session */
      case 'signOut': return setSignedOut(true);
      default:
        return flash(MESSAGES[head] || 'Done.');
    }
  }, [density, flash, goTab, inspection, inspections, vehicle, defects, selection, dispatch, me, openRunner]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setBackstage(false); setDialog(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── dialogs ────────────────────────────────────────────────── */
  const operators = users.filter((u) => u.role === 'Operator').map((u) => u.name);
  const supervisors = users.filter((u) => ['Supervisor', 'Safety officer'].includes(u.role)).map((u) => u.name);
  const siteOptions = SITES.filter((x) => x.key !== 'ALL').map((x) => x.name);

  const DIALOGS = {
    user: {
      title: 'Add user', submit: 'Add user',
      note: 'The user receives an invitation email with auto-generated credentials. Operators must be linked to a supervisor before they can submit inspections.',
      fields: [
        [{ k: 'first', l: 'First name', p: 'Johan', required: true }, { k: 'last', l: 'Last name', p: 'Swart', required: true }],
        [{ k: 'email', l: 'Email address', p: 'johan.swart@acmecorp.co.za', type: 'email', required: true,
          validate: (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Enter a valid email address.') }],
        [{ k: 'role', l: 'Role', options: ['Operator', 'Supervisor', 'Safety officer', 'Administrator'] },
         { k: 'siteName', l: 'Site', options: siteOptions }],
        [{ k: 'reports', l: 'Reports to', options: ['—', ...supervisors] },
         { k: 'vehicle', l: 'Assign vehicle', options: ['—', ...vehicles.filter((v) => v.driver === '—').map((v) => v.plate)] }],
        [{ k: 'cof', l: 'COF expiry', type: 'date' }, { k: 'phone', l: 'Mobile number', p: '+27 82 000 0000' }],
      ],
      onSubmit: (v) => {
        const name = `${v.first.trim()} ${v.last.trim()}`;
        dispatch({
          type: 'ADD_USER', by: me.name,
          user: {
            name, init: (v.first[0] + v.last[0]).toUpperCase(), role: v.role,
            site: (SITES.find((x) => x.name === v.siteName) || SITES[1]).key,
            reports: v.reports, vehicle: v.vehicle, insps: 0, status: 'Active',
            empNo: 'AM-' + Math.floor(1400 + Math.random() * 500), email: v.email, phone: v.phone,
            started: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            licence: '—', lastActive: 'Never', passRate: null, defects: 0,
            cof: v.cof ? new Date(v.cof).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            tone: v.role === 'Administrator' ? 'purple' : v.role === 'Safety officer' ? 'green' : v.role === 'Supervisor' ? 'blue' : 'gold',
          },
        });
        if (v.vehicle !== '—') {
          dispatch({ type: 'ASSIGN_VEHICLE', plate: v.vehicle, driver: name, sup: v.reports, by: me.name });
        }
        goTab('users');
        flash(`${name} created. Credentials emailed automatically.`);
      },
    },
    vehicle: {
      title: 'Add vehicle', submit: 'Add vehicle',
      note: 'A vehicle must pass a pre-use inspection before it can be assigned to an operator.',
      fields: [
        [{ k: 'plate', l: 'Registration plate', p: 'CA 123 GP', required: true },
         { k: 'fleetNo', l: 'Fleet number', p: 'AM-025', required: true }],
        [{ k: 'make', l: 'Make and model', p: 'Toyota Hilux', required: true },
         { k: 'year', l: 'Year', p: '2026', type: 'number' }],
        [{ k: 'type', l: 'Type', options: ['LDV bakkie', 'Crew bus', 'Panel van', 'Haul truck', 'Excavator', 'Front-end loader'] },
         { k: 'siteName', l: 'Site', options: siteOptions }],
        [{ k: 'km', l: 'Current odometer', p: '0', type: 'number' },
         { k: 'permit', l: 'Permit area', options: ['—', 'Red permit area'] }],
      ],
      onSubmit: (v) => {
        const km = +v.km || 0;
        dispatch({
          type: 'ADD_VEHICLE', by: me.name,
          vehicle: {
            plate: v.plate.toUpperCase().trim(), fleetNo: v.fleetNo, type: v.type, make: v.make,
            year: +v.year || 2026, site: (SITES.find((x) => x.name === v.siteName) || SITES[1]).key,
            driver: '—', sup: '—', lastInsp: 'Never', km,
            status: 'Available', cof: 'Not captured', serviceDue: km + 15000,
            permit: v.permit === '—' ? '' : v.permit,
          },
        });
        select('vehicle', v.plate.toUpperCase().trim());
        goTab('fleet');
        flash(`${v.plate.toUpperCase()} added to the fleet register.`);
      },
    },
    assign: vehicle && {
      title: `Assign ${vehicle.plate}`, submit: 'Assign',
      note: 'The operator may only submit inspections for vehicles assigned to them, and the supervisor signs their go-but concessions.',
      fields: [
        [{ k: 'driver', l: 'Operator', options: operators.length ? operators : ['—'] }],
        [{ k: 'sup', l: 'Supervisor', options: supervisors.length ? supervisors : ['—'] }],
      ],
      onSubmit: (v) => {
        dispatch({ type: 'ASSIGN_VEHICLE', plate: vehicle.plate, driver: v.driver, sup: v.sup, by: me.name });
        flash(`${vehicle.plate} assigned to ${v.driver} under ${v.sup}.`);
      },
    },
    unassign: vehicle && {
      title: `Unassign ${vehicle.plate}`, submit: 'Unassign',
      note: `${vehicle.plate} is assigned to ${vehicle.driver}. The reason is written to the audit trail.`,
      fields: [[{ k: 'reason', l: 'Reason', options: ['scheduled maintenance', 'operator on leave', 'reassigned to another site', 'COF expired'] }]],
      onSubmit: (v) => {
        dispatch({ type: 'UNASSIGN_VEHICLE', plate: vehicle.plate, reason: v.reason, by: me.name });
        flash(`${vehicle.plate} unassigned and returned to the pool.`);
      },
    },
    ground: vehicle && {
      title: `Take ${vehicle.plate} off road`, submit: 'Take off road',
      note: 'A grounded vehicle cannot be operated. It stays off the road until the defect is closed and it is returned to service.',
      fields: [
        [{ k: 'reason', l: 'Reason', options: ['no-go defect', 'scheduled service', 'COF expired', 'accident damage'] }],
        [{ k: 'note', l: 'Note', p: 'What is wrong with it?', area: true }],
      ],
      onSubmit: (v) => {
        dispatch({ type: 'GROUND_VEHICLE', plate: vehicle.plate, reason: v.note ? `${v.reason}: ${v.note}` : v.reason, by: me.name });
        flash(`${vehicle.plate} taken off road — ${v.reason}.`);
      },
    },
    odo: vehicle && {
      title: `Odometer — ${vehicle.plate}`, submit: 'Update',
      note: `Last recorded reading is ${vehicle.km.toLocaleString('en-GB').replace(/,/g, ' ')} km. A reading may not go backwards.`,
      fields: [[{ k: 'km', l: 'Current reading (km)', type: 'number', value: String(vehicle.km), required: true,
        validate: (v) => (+v >= vehicle.km ? '' : `The reading cannot be lower than ${vehicle.km.toLocaleString('en-GB')} km.`) }]],
      onSubmit: (v) => {
        dispatch({ type: 'LOG_ODO', plate: vehicle.plate, km: +v.km, by: me.name });
        flash(`Odometer on ${vehicle.plate} updated to ${(+v.km).toLocaleString('en-GB').replace(/,/g, ' ')} km.`);
      },
    },
    service: vehicle && {
      title: `Book a service — ${vehicle.plate}`, submit: 'Book',
      note: `Next service is due at ${vehicle.serviceDue.toLocaleString('en-GB').replace(/,/g, ' ')} km.`,
      fields: [
        [{ k: 'date', l: 'Date', type: 'date', required: true }, { k: 'workshop', l: 'Workshop', options: ['On-site workshop', 'Toyota Lephalale', 'Ford Polokwane', 'Mobile technician'] }],
        [{ k: 'note', l: 'Instructions', p: 'Oils, filters and a brake inspection.', area: true }],
      ],
      onSubmit: (v) => {
        dispatch({
          type: 'PATCH_VEHICLE', plate: vehicle.plate, patch: {}, by: me.name,
          note: `service booked at ${v.workshop} for ${v.date}`,
        });
        flash(`Service booked for ${vehicle.plate} at ${v.workshop}.`);
      },
    },
    editUser: user && {
      title: `Edit ${user.name}`, submit: 'Save changes',
      note: 'Changes are written to the audit trail with your name against them.',
      fields: [
        [{ k: 'role', l: 'Role', options: [user.role, ...['Operator', 'Supervisor', 'Safety officer', 'Administrator'].filter((r) => r !== user.role)] },
         { k: 'reports', l: 'Reports to', options: [user.reports, ...supervisors.filter((x) => x !== user.reports), '—'] }],
        [{ k: 'email', l: 'Email', value: user.email, required: true,
           validate: (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Enter a valid email address.') },
         { k: 'phone', l: 'Mobile', value: user.phone }],
        [{ k: 'site', l: 'Site', value: user.site }, { k: 'licence', l: 'Licence', value: user.licence }],
      ],
      onSubmit: (v) => {
        dispatch({
          type: 'PATCH_USER', name: user.name, by: me.name, co: user.co,
          patch: { role: v.role, reports: v.reports, email: v.email, phone: v.phone, site: v.site, licence: v.licence },
          note: v.role !== user.role ? `role changed to ${v.role}` : 'contact details updated',
        });
        flash(`${user.name} updated.`, { title: 'Saved' });
      },
    },
    suspend: user && {
      title: `Suspend ${user.name}`, submit: 'Suspend',
      note: 'A suspended user cannot sign in or submit inspections. Their records stay in place.',
      fields: [[{ k: 'reason', l: 'Reason', options: ['certificate of fitness lapsed', 'training expired', 'under investigation', 'on extended leave'] }]],
      onSubmit: (v) => {
        dispatch({ type: 'SET_USER_STATUS', name: user.name, status: 'Suspended', reason: v.reason, by: me.name });
        flash(`${user.name} suspended — ${v.reason}.`, {
          tone: 'warn', title: 'Access suspended',
          action: { label: 'Undo', onClick: () => dispatch({ type: 'SET_USER_STATUS', name: user.name, status: 'Active', by: me.name }) },
        });
      },
    },
    deleteUser: user && {
      title: `Delete ${user.name}`, submit: 'Delete user',
      note: `This removes ${user.name} from the register${user.vehicle && user.vehicle !== '—' ? ` and returns ${user.vehicle} to the pool` : ''}. Their inspections and audit entries are kept for seven years. Type the surname to confirm.`,
      fields: [[{ k: 'confirm', l: `Type “${user.name.split(' ').slice(-1)[0]}” to confirm`, required: true,
        validate: (v) => (v.trim().toLowerCase() === user.name.split(' ').slice(-1)[0].toLowerCase() ? '' : 'That does not match the surname.') }]],
      onSubmit: () => {
        const snapshot = user;
        dispatch({ type: 'DELETE_USER', name: user.name, by: me.name });
        select('user', null);
        flash(`${snapshot.name} deleted.`, {
          tone: 'err', title: 'User removed',
          action: { label: 'Undo', onClick: () => dispatch({ type: 'RESTORE_USER', user: snapshot, by: me.name }) },
        });
      },
    },
    assignUser: user && {
      title: `Assign a vehicle to ${user.name}`, submit: 'Assign',
      note: 'Only unassigned vehicles are listed. The supervisor signs this operator’s go-but concessions.',
      fields: [
        [{ k: 'plate', l: 'Vehicle', options: vehicles.filter((v) => v.driver === '—').map((v) => `${v.plate} — ${v.make}`) }],
        [{ k: 'sup', l: 'Supervisor', options: [user.reports, ...supervisors.filter((x) => x !== user.reports)].filter((x) => x && x !== '—') }],
      ],
      onSubmit: (v) => {
        const plate = v.plate.split(' — ')[0];
        dispatch({ type: 'ASSIGN_USER_VEHICLE', name: user.name, plate, sup: v.sup, by: me.name });
        flash(`${plate} assigned to ${user.name}.`, { title: 'Vehicle assigned' });
      },
    },
    unassignUser: user && {
      title: `Unassign ${user.vehicle}`, submit: 'Unassign',
      note: `${user.vehicle} goes back to the available pool.`,
      fields: [[{ k: 'reason', l: 'Reason', options: ['scheduled maintenance', 'operator on leave', 'reassigned to another site', 'COF expired'] }]],
      onSubmit: (v) => {
        const plate = user.vehicle;
        dispatch({ type: 'UNASSIGN_USER_VEHICLE', name: user.name, reason: v.reason, by: me.name });
        flash(`${plate} unassigned from ${user.name}.`, { tone: 'info', title: 'Vehicle released' });
      },
    },
    raiseWO: defect && {
      title: `Raise a work order for ${defect.id}`, submit: 'Raise',
      note: `${defect.item} on ${defect.plate}. The work order keeps the link to this defect, so the vehicle can be traced from the sheet that failed it to the job that clears it.`,
      fields: [
        [{ k: 'woType', l: 'Type of work', options: ['Repair', 'Auto electrical', 'Brake overhaul', 'Tyres', 'Bodywork', 'Scheduled service A'] },
         { k: 'assigned', l: 'Assigned to', options: ['On-site workshop', 'Toyota Lephalale', 'Ford Polokwane', 'Mobile technician'] }],
        [{ k: 'note', l: 'Instructions', p: defect.item, area: true }],
      ],
      onSubmit: (v) => {
        const ref = 'WO-26-' + Math.floor(3230 + Math.random() * 200);
        dispatch({ type: 'RAISE_WO', id: defect.id, ref, woType: v.woType, assigned: v.assigned, note: v.note || defect.item, by: me.name });
        flash(`${ref} raised against ${defect.id}.`, {
          title: 'Work order raised',
          action: { label: 'Open it', onClick: () => { select('workOrder', ref); goTab('workshop'); } },
        });
      },
    },
    reject: inspection && {
      title: `Return #${inspection.ref} to the operator`, submit: 'Return',
      note: 'The operator recaptures the sheet. The rejection and its reason stay on the record.',
      fields: [[{ k: 'reason', l: 'Reason', options: ['items marked without inspection', 'wrong vehicle selected', 'meter reading incorrect', 'photographs missing'] }]],
      onSubmit: (v) => {
        dispatch({ type: 'REJECT_INSPECTION', ref: inspection.ref, reason: v.reason, by: me.name });
        flash(`#${inspection.ref} returned to ${inspection.op}.`);
      },
    },
  };
  const dlg = dialog ? DIALOGS[dialog] : null;

  const props = { run, goTab, openDialog: setDialog };
  const screen = {
    dashboard: <Dashboard {...props} />,
    users: <Users {...props} />,
    fleet: <Fleet {...props} />,
    workshop: <Workshop {...props} />,
    inspections: inspView === 'forms' ? <Forms {...props} /> : <Inspections {...props} />,
    hierarchy: <Hierarchy {...props} />,
    compliance: <Compliance {...props} />,
    audit: <AuditLog {...props} />,
    profile: <CompanyProfile {...props} />,
    reports: <Reports {...props} />,
    analytics: <Analytics {...props} />,
    settings: <Settings {...props} />,
    view: <Dashboard {...props} />,
  }[tab];

  const showPane = PANE_TABS[tab] && !paneOff;
  const paneDrag = (e) => {
    e.preventDefault();
    const x0 = e.clientX, base = paneWidth;
    const move = (ev) => setPaneWidth(Math.max(280, Math.min(560, base - (ev.clientX - x0))));
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = ''; document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize';
  };

  return (
    <div className={'app' + (collapsed ? ' collapsed' : '')} data-density={density}>
      <TitleBar search={search} setSearch={setSearch} run={run} me={me} />
      <Ribbon tab={tab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed}
        openBackstage={() => setBackstage(true)} run={run} />

      <div className="workspace">
        <NavPane hidden={navHidden} company={company} width={navWidth} setWidth={setNavWidth}
          setCompany={(k, name) => { setCompany(k); flash(`Scope set to ${name}.`); }} run={run} />
        <div className="content" key={tab}>{screen}</div>
        {showPane && (
          <>
            <div className="splitter" title="Drag to resize" onMouseDown={paneDrag}
              onDoubleClick={() => setPaneWidth(360)} />
            <aside className="readpane" style={{ width: paneWidth }}>
              {tab === 'fleet' && <VehiclePane vehicle={vehicle} defects={defects} inspections={inspections} run={run} />}
              {tab === 'users' && (
                <UserPane user={user} vehicles={vehicles} inspections={inspections} siteOf={siteName} run={run} />
              )}
              {tab === 'workshop' && <WorkOrderPane wo={store.workOrder} defects={defects} run={run} />}
              {tab === 'inspections' && (inspView === 'defects'
                ? <DefectPane defect={defect} workOrders={store.workOrders} settings={store.settings} run={run} />
                : inspView === 'forms'
                  ? <FormPane template={templates.find((t) => t.id === selection.template)} run={run} />
                  : <InspectionPane inspection={inspection} templates={templates} defects={defects} run={run} />)}
            </aside>
          </>
        )}
      </div>

      <StatusBar msg={msg} density={density} toggleDensity={() => run('density')} />

      {backstage && <Backstage onClose={() => setBackstage(false)} run={run} />}

      {dlg && (
        <Dialog {...dlg} onClose={() => setDialog(null)}
          onSubmit={(v) => { setDialog(null); dlg.onSubmit(v); }} />
      )}

      {runner && (
        <InspectionRunner tpl={runner.tpl} vehicles={vehicles} me={me} flash={flash}
          rules={store.settings}
          onClose={() => setRunner(null)} onSubmit={submitInspection} />
      )}

      {signedOut && <LockScreen me={me} onSignIn={() => { setSignedOut(false); flash('Signed back in.'); }} />}

      <Toasts items={toasts} onClose={closeToast} />
    </div>
  );
}

/* ── gate ─────────────────────────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [msg, setMsg] = useState('Ready');
  const [toasts, setToasts] = useState([]);

  /* flash(text) or flash(text, { tone, title, action }) — the tone drives the
     toast's colour and icon, and an action gives the user a way back. */
  const msgTimer = useRef(null);
  const flash = useCallback((text, opts = {}) => {
    const { tone = 'ok', title, action } = typeof opts === 'string' ? { tone: opts } : opts;
    setMsg(text);
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, tone, title, action }]);
    /* one timer, always the latest: an older one must not clear a newer message */
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg('Ready'), 4600);
  }, []);
  const closeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  if (!session) {
    return (
      <>
        <AuthShell
          flash={flash}
          onSignedIn={() => setSession(ME)}
          onRegistered={(company) => setSession({ ...ME, co: company.name, newCompany: company })}
        />
        <Toasts items={toasts} onClose={closeToast} />
      </>
    );
  }
  return (
    <StoreProvider me={session} flash={flash}>
      <Workspace msg={msg} setMsg={setMsg} toasts={toasts} flash={flash} closeToast={closeToast} />
    </StoreProvider>
  );
}

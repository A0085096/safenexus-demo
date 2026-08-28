import React, { useCallback, useEffect, useState } from 'react';
import './styles.css';

import TitleBar from './shell/TitleBar.jsx';
import Ribbon from './shell/Ribbon.jsx';
import NavPane from './shell/NavPane.jsx';
import StatusBar from './shell/StatusBar.jsx';
import Backstage from './shell/Backstage.jsx';
import { MESSAGES } from './shell/ribbon.js';
import { Dialog } from './components/ui.jsx';
import { VehiclePane, InspectionPane, DefectPane, UserPane } from './components/panes.jsx';
import Toasts from './components/Toasts.jsx';
import AuthShell, { LockScreen } from './auth/AuthShell.jsx';
import InspectionRunner from './inspection/InspectionRunner.jsx';
import { templateFor } from './inspection/templates.js';
import { StoreProvider, useStore } from './store.jsx';

import Dashboard from './screens/Dashboard.jsx';
import { Companies, Users, Fleet, Inspections, Audit } from './screens/Registers.jsx';
import { Hierarchy, Compliance, CompanyProfile, Analytics, Settings } from './screens/Misc.jsx';
import Reports from './screens/Reports.jsx';
import Learning from './screens/Learning.jsx';

const ME = {
  name: 'Kobus van der Merwe', initials: 'KM', role: 'Administrator',
  email: 'admin@acmecorp.co.za', co: 'Acme Mining Corp',
};

/* screens that carry a reading pane */
const PANE_TABS = { fleet: 1, inspections: 1, users: 1 };

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

  /* the competency behind the signature: a lapsed pre-use course is
     worth saying out loud before the sheet is captured */
  const competencyGap = useCallback((name) => {
    const u = users.find((x) => x.name === name);
    if (!u) return null;
    const required = store.courses.filter((c) => c.required && c.roles.includes(u.role));
    const lapsed = required.filter((c) => {
      const e = store.enrolments.find((x) => x.user === u.name && x.course === c.id);
      return !e || e.status === 'Expired';
    });
    if (!lapsed.length) return null;
    return `has no valid ${lapsed.map((c) => c.name.toLowerCase()).join(' or ')}`;
  }, [users, store.courses, store.enrolments]);

  const openRunner = useCallback(() => {
    const v = vehicle || vehicles.find((x) => x.status !== 'Maintenance') || vehicles[0];
    setRunner({ tpl: templateFor(v.type), plate: v.plate });
  }, [vehicle, vehicles]);

  /* ── inspection submission: the rules live here ─────────────── */
  const submitInspection = (r) => {
    const ref = store.newRef();
    const ok = r.items.length - r.noGo.length - r.goBut.length;
    const grounded = r.noGo.length > 0 || (r.goBut.length > 0 && !r.supSigned);
    const result = grounded ? 'no-go' : r.goBut.length ? 'go-but' : 'in-order';
    const v = vehicles.find((x) => x.plate === r.plate);

    const raised = [
      ...r.noGo.map((i) => ({ severity: 'No Go', label: i.label })),
      ...r.goBut.map((i) => ({ severity: 'Go But', label: i.label })),
    ].map((d, n) => ({
      id: `DEF-${100300 + defects.length + n}`,
      item: d.label, plate: r.plate, severity: d.severity,
      raised: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      age: 0, status: 'Open', inspection: ref, co: v?.co || me.co,
    }));

    dispatch({
      type: 'ADD_INSPECTION',
      inspection: {
        ref, date: 'Just now', vehicle: r.plate, op: r.operator, co: v?.co || me.co,
        shift: r.shift, ok, go: r.goBut.length, ng: r.noGo.length, result,
        signed: false, sheet: r.results, meter: r.meter, remarks: r.remarks,
        conds: r.conds, supSigned: r.supSigned, templateId: r.tpl.id,
      },
      defects: raised,
    });

    setRunner(null);
    select('inspection', ref);
    goTab('inspections');
    flash(
      result === 'no-go'
        ? `Inspection #${ref} submitted — ${r.plate} grounded, ${raised.filter((d) => d.severity === 'No Go').length || r.goBut.length} defect(s) raised.`
        : result === 'go-but'
          ? `Inspection #${ref} submitted — go-but concession signed, ${r.goBut.length} item(s) on the repair clock.`
          : `Inspection #${ref} submitted — ${r.plate} is fit for service.`,
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
      case 'startInspection': return openRunner();
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

      /* learning */
      case 'enrol':
        if (!need(user || selection.user, 'a user')) return goTab('users');
        return setDialog('enrol');
      case 'enrolFor': {
        const [name, course] = arg.split('|');
        dispatch({ type: 'ENROL', name, course, by: me.name });
        return flash(`${name} enrolled.`, { title: 'Training assigned', tone: 'info' });
      }
      case 'enrolCourse': {
        select('course', arg);
        return setDialog('enrolCourse');
      }
      case 'completeCourse': {
        const [name, course] = arg.split('|');
        dispatch({ type: 'COMPLETE_COURSE', name, course, score: 88, by: me.name });
        return flash(`${name} recorded as competent.`, { title: 'Course completed' });
      }
      case 'trainingGaps':
      case 'expiringTraining':
        return goTab('learning');

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
  const companyNames = store.companies.map((c) => c.name);

  const DIALOGS = {
    user: {
      title: 'Add user', submit: 'Add user',
      note: 'The user receives an invitation email with auto-generated credentials. Operators must be linked to a supervisor before they can submit inspections.',
      fields: [
        [{ k: 'first', l: 'First name', p: 'Johan', required: true }, { k: 'last', l: 'Last name', p: 'Swart', required: true }],
        [{ k: 'email', l: 'Email address', p: 'johan.swart@acmecorp.co.za', type: 'email', required: true,
          validate: (v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Enter a valid email address.') }],
        [{ k: 'role', l: 'Role', options: ['Operator', 'Supervisor', 'Safety officer', 'Administrator'] },
         { k: 'co', l: 'Company', options: companyNames }],
        [{ k: 'reports', l: 'Reports to', options: ['—', ...supervisors] },
         { k: 'vehicle', l: 'Assign vehicle', options: ['—', ...vehicles.filter((v) => v.driver === '—').map((v) => v.plate)] }],
        [{ k: 'cof', l: 'COF expiry', type: 'date' }, { k: 'phone', l: 'Mobile number', p: '+27 82 000 0000' }],
      ],
      onSubmit: (v) => {
        const name = `${v.first.trim()} ${v.last.trim()}`;
        dispatch({
          type: 'ADD_USER', by: me.name,
          user: {
            name, init: (v.first[0] + v.last[0]).toUpperCase(), role: v.role, co: v.co,
            reports: v.reports, vehicle: v.vehicle, insps: 0, status: 'Active',
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
    company: {
      title: 'Register company', submit: 'Register',
      note: 'Registering a company creates its administrator account and starts a 30-day trial.',
      fields: [
        [{ k: 'name', l: 'Company name', p: 'Acme Mining Corp', required: true }],
        [{ k: 'reg', l: 'Registration number', p: '2018/123456/07' }, { k: 'vat', l: 'VAT number', p: '4890123456' }],
        [{ k: 'industry', l: 'Industry', options: ['Mining', 'Logistics', 'Construction', 'Agriculture'] },
         { k: 'plan', l: 'Plan', options: ['Starter', 'Pro', 'Enterprise'] }],
        [{ k: 'email', l: 'Administrator email', p: 'admin@acmecorp.co.za', type: 'email', required: true }],
      ],
      onSubmit: (v) => {
        dispatch({
          type: 'ADD_COMPANY', by: me.name,
          company: {
            name: v.name.trim(), init: v.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
            industry: v.industry, users: 1, vehicles: 0, compliance: 0, plan: v.plan, status: 'Trial',
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          },
        });
        goTab('companies');
        flash(`${v.name} registered. Administrator credentials sent to ${v.email}.`);
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
        [{ k: 'type', l: 'Type', options: ['LDV bakkie', 'Crew bus', 'Panel van', 'Haul truck', 'Excavator'] },
         { k: 'co', l: 'Company', options: companyNames }],
        [{ k: 'km', l: 'Current odometer', p: '0', type: 'number' },
         { k: 'permit', l: 'Permit area', options: ['—', 'Red permit area'] }],
      ],
      onSubmit: (v) => {
        const km = +v.km || 0;
        dispatch({
          type: 'ADD_VEHICLE', by: me.name,
          vehicle: {
            plate: v.plate.toUpperCase().trim(), fleetNo: v.fleetNo, type: v.type, make: v.make,
            year: +v.year || 2026, co: v.co, driver: '—', sup: '—', lastInsp: 'Never', km,
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
        const theirTraining = store.enrolments.filter((e) => e.user === user.name);
        dispatch({ type: 'DELETE_USER', name: user.name, by: me.name });
        select('user', null);
        flash(`${snapshot.name} deleted.`, {
          tone: 'err', title: 'User removed',
          action: { label: 'Undo', onClick: () => dispatch({ type: 'RESTORE_USER', user: snapshot, enrolments: theirTraining, by: me.name }) },
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
    enrol: (user || selection.user) && {
      title: `Assign training — ${selection.user}`, submit: 'Enrol',
      note: 'The learner is notified, and the record shows as in progress until it is completed.',
      fields: [[{ k: 'course', l: 'Course', options: store.courses.map((c) => c.name) }]],
      onSubmit: (v) => {
        const c = store.courses.find((x) => x.name === v.course);
        dispatch({ type: 'ENROL', name: selection.user, course: c.id, by: me.name });
        flash(`${selection.user} enrolled on ${c.name}.`, { tone: 'info', title: 'Training assigned' });
      },
    },
    enrolCourse: selection.course && {
      title: `Enrol on ${store.courses.find((c) => c.id === selection.course)?.name}`, submit: 'Enrol',
      note: 'Pick the person to put on this course.',
      fields: [[{ k: 'name', l: 'Person', options: users.map((u) => u.name) }]],
      onSubmit: (v) => {
        dispatch({ type: 'ENROL', name: v.name, course: selection.course, by: me.name });
        flash(`${v.name} enrolled.`, { tone: 'info', title: 'Training assigned' });
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
    companies: <Companies {...props} />,
    users: <Users {...props} />,
    fleet: <Fleet {...props} />,
    inspections: <Inspections {...props} />,
    hierarchy: <Hierarchy {...props} />,
    compliance: <Compliance {...props} />,
    learning: <Learning {...props} />,
    audit: <Audit {...props} />,
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
                <UserPane user={user} vehicles={vehicles} inspections={inspections}
                  courses={store.courses} enrolments={store.enrolments} run={run} />
              )}
              {tab === 'inspections' && (inspView === 'defects'
                ? <DefectPane defect={defect} run={run} />
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
          gapFor={competencyGap}
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
  const flash = useCallback((text, opts = {}) => {
    const { tone = 'ok', title, action } = typeof opts === 'string' ? { tone: opts } : opts;
    setMsg(text);
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, tone, title, action }]);
    setTimeout(() => setMsg('Ready'), 4600);
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

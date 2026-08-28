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
import {
  JobPane, FuelPane, TyrePane, PartPane, POPane, IncidentPane, InvoicePane, DocumentPane,
} from './components/erpPanes.jsx';
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
import Dispatch from './screens/Dispatch.jsx';
import FuelScreen from './screens/Fuel.jsx';
import TyresScreen from './screens/Tyres.jsx';
import PartsScreen from './screens/Parts.jsx';
import Telematics from './screens/Telematics.jsx';
import Costs from './screens/Costs.jsx';
import Procurement from './screens/Procurement.jsx';
import Billing from './screens/Billing.jsx';
import Incidents from './screens/Incidents.jsx';
import Documents from './screens/Documents.jsx';
import Contracts from './screens/Contracts.jsx';
import Admin from './screens/Admin.jsx';
import {
  R, num, shift, fmtDate, fmtShort, until, poTotal, invTotal, invDue, woCost, vtype,
  LANES, CARGO, CUSTOMERS, SUPPLIERS, FUEL_SITES, TYRE_BRANDS, TYRE_POS_HEAVY, TYRE_POS_PLANT,
  INCIDENT_TYPES, DOC_TYPES, COST_HEADS, WO_TYPES, PART_CATS, FINANCIERS, jobMargin,
} from './erp/seed.js';

const ME = {
  name: 'Kobus van der Merwe', initials: 'KM', role: 'Administrator',
  email: 'admin@acmecorp.co.za', co: 'Acme Mining Corp',
};

/* screens that carry a reading pane */
const PANE_TABS = {
  fleet: 1, inspections: 1, users: 1, workshop: 1, dispatch: 1, fuel: 1, tyres: 1,
  parts: 1, procurement: 1, incidents: 1, billing: 1, documents: 1, contracts: 1, costs: 1,
};

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
  const {
    job, fuelTx, tyre, part, po, supplierInvoice, incident, invoice, document: doc, workOrder,
  } = store;

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


      /* ══════════════════════════════════════════════════════
         Dispatch
         ══════════════════════════════════════════════════════ */
      case 'dispatchView': store.setView('dispatch', arg); return goTab('dispatch');
      case 'jobStatus': {
        if (!need(job, 'a job')) return goTab('dispatch');
        if (job.status === arg) return flash(`${job.ref} is already ${arg.toLowerCase()}.`, { tone: 'warn' });
        if (job.status === 'Delivered' && arg !== 'Delivered') {
          return flash(`${job.ref} has been delivered — it cannot be moved back.`, { tone: 'warn' });
        }
        dispatch({ type: 'JOB_STATUS', ref: job.ref, status: arg, by: me.name });
        return flash(
          arg === 'Delivered'
            ? `${job.ref} delivered. Capture the proof of delivery before it can be invoiced.`
            : `${job.ref} moved to ${arg.toLowerCase()}.`,
          { tone: arg === 'Cancelled' ? 'warn' : 'ok', title: 'Dispatch' },
        );
      }
      case 'recordPod': {
        if (!need(job, 'a job')) return goTab('dispatch');
        if (job.status !== 'Delivered') return flash(`${job.ref} has not been delivered yet.`, { tone: 'warn' });
        if (job.pod) return flash(`The proof of delivery for ${job.ref} is already in.`, { tone: 'warn' });
        dispatch({ type: 'RECORD_POD', ref: job.ref, by: me.name });
        return flash(`Proof of delivery captured for ${job.ref} — it can now be invoiced.`, { title: 'POD in' });
      }
      case 'openJobVehicle':
        if (!need(job, 'a job')) return goTab('dispatch');
        select('vehicle', job.vehicle);
        return goTab('fleet');
      case 'openJobDriver':
        if (!need(job, 'a job')) return goTab('dispatch');
        select('user', job.driver);
        return goTab('users');

      /* ══════════════════════════════════════════════════════
         Fuel
         ══════════════════════════════════════════════════════ */
      case 'fuelView': store.setView('fuel', arg); return goTab('fuel');
      case 'verifyFuel': {
        if (!need(fuelTx, 'a transaction')) return goTab('fuel');
        if (fuelTx.exception) return flash('Clear the exception before verifying this transaction.', { tone: 'warn' });
        if (fuelTx.status === 'Verified') return flash(`${fuelTx.ref} is already verified.`, { tone: 'warn' });
        dispatch({ type: 'VERIFY_FUEL', ref: fuelTx.ref, by: me.name });
        return flash(`${fuelTx.ref} verified against the meter reading.`, { title: 'Fuel' });
      }
      case 'clearException':
        if (!need(fuelTx, 'a transaction')) return goTab('fuel');
        if (!fuelTx.exception) return flash(`${fuelTx.ref} is not in exception.`, { tone: 'warn' });
        return setDialog('clearException');
      case 'openFuelVehicle':
        if (!need(fuelTx, 'a transaction')) return goTab('fuel');
        select('vehicle', fuelTx.vehicle);
        return goTab('fleet');

      /* ══════════════════════════════════════════════════════
         Tyres
         ══════════════════════════════════════════════════════ */
      case 'tyresView': store.setView('tyres', arg); return goTab('tyres');
      case 'logTread':
        if (!need(tyre, 'a tyre')) return goTab('tyres');
        return setDialog('logTread');
      case 'scrapTyre':
        if (!need(tyre, 'a tyre')) return goTab('tyres');
        if (tyre.status === 'Scrapped') return flash(`${tyre.serial} is already scrapped.`, { tone: 'warn' });
        return setDialog('scrapTyre');
      case 'openTyreVehicle':
        if (!need(tyre, 'a tyre')) return goTab('tyres');
        select('vehicle', tyre.vehicle);
        return goTab('fleet');

      /* ══════════════════════════════════════════════════════
         Stores
         ══════════════════════════════════════════════════════ */
      case 'partsView': store.setView('parts', arg); return goTab('parts');
      case 'issuePart':
        if (!need(part, 'a part')) return goTab('parts');
        if (!part.qty) return flash(`${part.desc} is out of stock — nothing to issue.`, { tone: 'warn' });
        return setDialog('issuePart');
      case 'adjustStock':
        if (!need(part, 'a part')) return goTab('parts');
        return setDialog('adjustStock');
      case 'orderPart':
        if (!need(part, 'a part')) return goTab('parts');
        return setDialog('po');
      case 'reorderProposal': {
        const low = store.parts.filter((x) => x.qty <= x.reorder && !x.onOrder);
        return flash(low.length
          ? `${low.length} line(s) are below reorder with nothing on order — worth ${R(low.reduce((a, x) => a + x.reorder * 2 * x.unitCost, 0))} at the proposed quantities.`
          : 'Every line below its reorder level already has an order out.',
        { tone: low.length ? 'warn' : 'ok', title: 'Reorder proposal' });
      }

      /* ══════════════════════════════════════════════════════
         Workshop depth
         ══════════════════════════════════════════════════════ */
      case 'workshopView': store.setView('workshop', arg); return goTab('workshop');
      case 'authoriseWO': {
        if (!need(workOrder, 'a work order')) return goTab('workshop');
        if (workOrder.status !== 'Awaiting authorisation') {
          return flash(`${workOrder.ref} is already authorised.`, { tone: 'warn' });
        }
        const cost = woCost(workOrder);
        dispatch({ type: 'AUTHORISE_WO', ref: workOrder.ref, cost, by: me.name });
        return flash(`${workOrder.ref} authorised at ${R(cost)} and moved to in progress.`, { title: 'Workshop' });
      }
      case 'bookLabour':
        if (!need(workOrder, 'a work order')) return goTab('workshop');
        return setDialog('bookLabour');

      /* ══════════════════════════════════════════════════════
         Procurement
         ══════════════════════════════════════════════════════ */
      case 'procurementView': store.setView('procurement', arg); return goTab('procurement');
      case 'poStatus': {
        if (!need(po, 'a purchase order')) return goTab('procurement');
        if (po.status === arg) return flash(`${po.ref} is already ${arg.toLowerCase()}.`, { tone: 'warn' });
        if (arg === 'Sent' && po.status === 'Draft') {
          return flash(`${po.ref} must be approved before it can be sent.`, { tone: 'warn', title: 'Not approved' });
        }
        dispatch({ type: 'PO_STATUS', ref: po.ref, status: arg, by: me.name });
        return flash(
          arg === 'Received'
            ? `${po.ref} received — ${po.lines.length} line(s) taken into stock at ${siteName(po.site)}.`
            : `${po.ref} moved to ${arg.toLowerCase()}.`,
          { title: 'Procurement' },
        );
      }
      case 'sinStatus': {
        if (!need(supplierInvoice, 'a supplier invoice')) { store.setView('procurement', 'invoices'); return goTab('procurement'); }
        if (arg === 'Paid' && supplierInvoice.status === 'Query') {
          return flash(`${supplierInvoice.ref} is in query — settle the difference before paying it.`, { tone: 'warn' });
        }
        dispatch({ type: 'SIN_STATUS', ref: supplierInvoice.ref, status: arg, by: me.name });
        return flash(`${supplierInvoice.ref} marked ${arg.toLowerCase()}.`, { title: 'Supplier invoice' });
      }

      /* ══════════════════════════════════════════════════════
         Incidents
         ══════════════════════════════════════════════════════ */
      case 'incidentsView': store.setView('incidents', arg); return goTab('incidents');
      case 'incidentStatus': {
        if (!need(incident, 'an incident')) return goTab('incidents');
        if (incident.status === arg) return flash(`${incident.ref} is already ${arg.toLowerCase()}.`, { tone: 'warn' });
        const open = incident.actions.filter((x) => !x.done).length;
        if (arg === 'Closed' && open) {
          return flash(`${incident.ref} still has ${open} outstanding action(s). Close them first — an incident closed with actions open is a record, not an investigation.`,
            { tone: 'warn', title: 'Actions outstanding' });
        }
        dispatch({ type: 'INCIDENT_STATUS', ref: incident.ref, status: arg, by: me.name });
        return flash(`${incident.ref} moved to ${arg.toLowerCase()}.`, { title: 'Incident' });
      }
      case 'incidentAction':
        return dispatch({ type: 'INCIDENT_ACTION', ref: arg.split('|')[0], index: +arg.split('|')[1], by: me.name });
      case 'lodgeClaim':
        if (!need(incident, 'an incident')) return goTab('incidents');
        if (incident.claim) return flash(`${incident.ref} already carries claim ${incident.claim}.`, { tone: 'warn' });
        return setDialog('lodgeClaim');
      case 'raiseWOFromIncident': {
        if (!need(incident, 'an incident')) return goTab('incidents');
        const ref = 'WO-26-' + Math.floor(3400 + Math.random() * 200);
        dispatch({
          type: 'RAISE_WO_DIRECT', ref, vehicle: incident.vehicle, site: incident.site,
          woType: 'Repair', assigned: 'On-site workshop',
          note: `Damage from ${incident.ref}: ${incident.description}`, by: me.name,
        });
        select('workOrder', ref);
        return flash(`${ref} raised against ${incident.vehicle} from ${incident.ref}.`, {
          title: 'Work order raised',
          action: { label: 'Open it', onClick: () => goTab('workshop') },
        });
      }
      case 'groundFromIncident': {
        if (!need(incident, 'an incident')) return goTab('incidents');
        dispatch({ type: 'GROUND_VEHICLE', plate: incident.vehicle, reason: `damage from ${incident.ref}`, by: me.name });
        return flash(`${incident.vehicle} taken off road pending assessment.`, { tone: 'warn' });
      }
      case 'openIncidentVehicle':
        if (!need(incident, 'an incident')) return goTab('incidents');
        select('vehicle', incident.vehicle);
        return goTab('fleet');
      case 'openIncidentDriver':
        if (!need(incident, 'an incident')) return goTab('incidents');
        select('user', incident.driver);
        return goTab('users');

      /* ══════════════════════════════════════════════════════
         Billing
         ══════════════════════════════════════════════════════ */
      case 'billingView': store.setView('billing', arg); return goTab('billing');
      case 'raiseInvoice': return setDialog('invoice');
      case 'recordPayment':
        if (!need(invoice, 'an invoice')) return goTab('billing');
        if (invDue(invoice) <= 0) return flash(`${invoice.ref} is already settled.`, { tone: 'warn' });
        return setDialog('payment');
      case 'openInvoice':
        select('invoice', arg);
        return goTab('billing');
      case 'openInvoiceJob': {
        if (!need(invoice, 'an invoice')) return goTab('billing');
        select('job', invoice.jobs[0]);
        return goTab('dispatch');
      }

      /* ══════════════════════════════════════════════════════
         Documents, telematics, costs, contracts and admin
         ══════════════════════════════════════════════════════ */
      case 'documentsView': store.setView('documents', arg); return goTab('documents');
      case 'verifyDoc': {
        if (!need(doc, 'a document')) return goTab('documents');
        if (doc.status === 'Verified') return flash(`${doc.kind} for ${doc.subject} is already verified.`, { tone: 'warn' });
        dispatch({ type: 'VERIFY_DOC', ref: doc.ref, by: me.name });
        return flash(`${doc.kind} for ${doc.subject} verified.`, { title: 'Document register' });
      }
      case 'telematicsView': store.setView('telematics', arg); return goTab('telematics');
      case 'ackEvent':
        dispatch({ type: 'ACK_EVENT', id: arg, by: me.name });
        return flash('Event acknowledged.');
      case 'ackAll': {
        const open = store.events.filter((e) => !e.acknowledged);
        open.forEach((e) => dispatch({ type: 'ACK_EVENT', id: e.id, by: me.name }));
        return flash(`${open.length} event(s) acknowledged.`, { title: 'Telematics' });
      }
      case 'offlineUnits': {
        store.setView('telematics', 'units');
        goTab('telematics');
        const n = store.vehicles.filter((v) => !v.telematics?.online).length;
        return flash(n
          ? `${n} unit(s) have stopped reporting — those vehicles' figures are as old as their last pre-use sheet.`
          : 'Every telematics unit is reporting.', { tone: n ? 'warn' : 'ok' });
      }
      case 'liveMap':
        store.setView('telematics', 'units');
        goTab('telematics');
        return flash(`${store.vehicles.filter((v) => v.telematics?.online).length} units plotted from the last position poll.`, { title: 'Live map' });
      case 'costsView': store.setView('costs', arg); return goTab('costs');
      case 'openCostVehicle':
        if (!need(vehicle, 'a vehicle')) return goTab('costs');
        return goTab('fleet');
      case 'contractsView': store.setView('contracts', arg); return goTab('contracts');
      case 'openContractVehicle':
        if (!need(vehicle, 'a vehicle')) return goTab('contracts');
        return goTab('fleet');
      case 'renewContract': {
        if (!need(vehicle, 'a vehicle')) return goTab('contracts');
        if (vehicle.finance?.kind === 'Owned outright') return flash(`${vehicle.plate} is owned outright — there is nothing to renew.`, { tone: 'warn' });
        return flash(`Settlement quote for ${vehicle.plate} requested from ${vehicle.finance.financier} — ${R(vehicle.finance.residual)} outstanding.`,
          { title: 'Finance' });
      }
      case 'adminView': store.setView('admin', arg); return goTab('admin');
      case 'runJob':
        dispatch({ type: 'RUN_JOB', name: arg, by: me.name });
        return flash(`${arg} ran and completed.`, { title: 'Scheduled job' });
      case 'approve': {
        const [decision, ref] = arg.split(':');
        const target = ref || store.approvals.find((x) => x.status === 'Pending')?.ref;
        if (!need(target, 'a request')) { store.setView('admin', 'approvals'); return goTab('admin'); }
        const ap = store.approvals.find((x) => x.ref === target);
        if (ap?.status !== 'Pending') return flash(`${target} has already been decided.`, { tone: 'warn' });
        dispatch({ type: 'DECIDE_APPROVAL', ref: target, decision, by: me.name });
        return flash(`${target} ${decision.toLowerCase()} — ${ap.type}, ${R(ap.amount)}.`,
          { tone: decision === 'Declined' ? 'warn' : 'ok', title: 'Approval' });
      }
      case 'usersView': store.setView('users', arg); return goTab('users');
      case 'rateCard':
        return flash('Rate cards are held per customer and lane — the floor is R 24.00 per kilometre.', { title: 'Rates' });
      case 'download':
        return flash('File downloaded.');

      /* session */
      case 'signOut': return setSignedOut(true);
      default:
        return flash(MESSAGES[head] || 'Done.');
    }
  }, [density, flash, goTab, inspection, inspections, vehicle, defects, selection, dispatch, me,
    openRunner, store, job, fuelTx, tyre, part, po, supplierInvoice, incident, invoice, doc, workOrder]);

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

    /* ══════════════════════════════════════════════════════════
       Dispatch
       ══════════════════════════════════════════════════════════ */
    planJob: {
      title: 'Plan a haulage job', submit: 'Plan it',
      note: 'The job is costed from the lane distance, the vehicle’s own consumption and the standard operator rate, so the margin is real before it is committed.',
      fields: [
        [{ k: 'lane', l: 'Lane', options: LANES.map((l) => `${l[0]} → ${l[1]} · ${l[2]} km`) }],
        [{ k: 'customer', l: 'Customer', options: CUSTOMERS }, { k: 'cargo', l: 'Cargo', options: CARGO }],
        [{ k: 'plate', l: 'Vehicle', options: vehicles.filter((v) => v.cls === 'Heavy' && v.status !== 'Maintenance').map((v) => `${v.plate} — ${v.make}`) },
         { k: 'driver', l: 'Operator', options: operators.length ? operators : ['—'] }],
        [{ k: 'depart', l: 'Departure date', type: 'date', required: true },
         { k: 'departTime', l: 'Departure time', options: ['04:00', '05:00', '06:00', '07:00', '09:00', '13:00', '17:00'] }],
        [{ k: 'tons', l: 'Load, tons', type: 'number', value: '30' },
         { k: 'rate', l: 'Rate per kilometre', type: 'number', value: '26.40',
           validate: (v) => (+v >= 24 ? '' : 'Below the R 24.00 floor — this needs an approval before it can be planned.') }],
        [{ k: 'priority', l: 'Priority', options: ['Standard', 'Urgent'] }],
      ],
      onSubmit: (v) => {
        const lane = LANES.find((l) => `${l[0]} → ${l[1]} · ${l[2]} km` === v.lane) || LANES[0];
        const plate = v.plate.split(' — ')[0];
        const veh = vehicles.find((x) => x.plate === plate) || vehicles[0];
        const ref = 'JOB-26-' + Math.floor(4300 + Math.random() * 300);
        const hours = Math.max(2, Math.round(lane[2] / 58));
        const revenue = Math.round(lane[2] * (+v.rate || 26.4));
        const fuelCost = Math.round((lane[2] / (veh.rate || 2.6)) * 24.1);
        const tollCost = Math.round(lane[2] * 0.42);
        const driverCost = Math.round(hours * 128);
        const other = Math.round(lane[2] * 1.7);
        const depart = v.depart || shift(0);
        dispatch({
          type: 'PLAN_JOB', by: me.name,
          job: {
            ref, vehicle: plate, fleetNo: veh.fleetNo, driver: v.driver, customer: v.customer,
            origin: lane[0], destination: lane[1], distance: lane[2], route: lane[3], cargo: v.cargo,
            tons: +v.tons || 30, depart, departTime: v.departTime,
            eta: shift(Math.round((new Date(depart) - new Date()) / 86400000) + Math.ceil(hours / 11)),
            hours, status: 'Planned', site: veh.site, revenue, fuelCost, tollCost, driverCost, other,
            cost: fuelCost + tollCost + driverCost + other, lateBy: 0, pod: false,
            priority: v.priority, invoice: null,
          },
        });
        select('job', ref);
        goTab('dispatch');
        const margin = revenue - (fuelCost + tollCost + driverCost + other);
        flash(`${ref} planned — ${R(revenue)} revenue against ${R(fuelCost + tollCost + driverCost + other)} of cost, ${R(margin)} margin.`,
          { tone: margin > 0 ? 'ok' : 'warn', title: 'Job planned' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Fuel
       ══════════════════════════════════════════════════════════ */
    fuel: {
      title: 'Capture a fill', submit: 'Capture',
      note: 'The meter reading is checked against the last one on record. A reading that goes backwards, or litres above the tank capacity, is captured as an exception rather than rejected — the fill happened either way, and somebody has to explain it.',
      fields: [
        [{ k: 'plate', l: 'Vehicle', options: vehicles.filter((v) => v.tank > 0).map((v) => `${v.plate} — ${v.make}`) }],
        [{ k: 'station', l: 'Where', options: FUEL_SITES }, { k: 'driver', l: 'Operator', options: operators.length ? operators : ['—'] }],
        [{ k: 'litres', l: 'Litres', type: 'number', required: true,
           validate: (v) => (+v > 0 ? '' : 'Enter the litres drawn.') },
         { k: 'rate', l: 'Rate per litre', type: 'number', value: '24.10' }],
        [{ k: 'meter', l: 'Meter reading', type: 'number', required: true },
         { k: 'since', l: 'Distance or hours since the last fill', type: 'number', required: true }],
      ],
      onSubmit: (v) => {
        const plate = v.plate.split(' — ')[0];
        const veh = vehicles.find((x) => x.plate === plate) || vehicles[0];
        const plant = veh.meterType === 'hours';
        const litres = +v.litres;
        const since = +v.since || 1;
        const consumption = plant ? +(litres / since).toFixed(2) : +(since / litres).toFixed(2);
        const target = plant ? 18 : veh.targetRate;
        const variance = target ? +(((consumption - target) / target) * 100 * (plant ? -1 : 1)).toFixed(1) : 0;
        const exception = +v.meter < veh.km ? 'Meter reading lower than the previous fill'
          : litres > veh.tank ? 'Litres exceed the tank capacity'
            : Math.abs(variance) > 25 ? `Consumption ${Math.abs(variance).toFixed(0)}% off the model target` : null;
        const ref = 'FT-26-' + Math.floor(60300 + Math.random() * 400);
        dispatch({
          type: 'ADD_FUEL', by: me.name,
          entry: {
            ref, date: shift(0),
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            vehicle: plate, fleetNo: veh.fleetNo, driver: v.driver, site: veh.site,
            card: '6011 •••• 4417', station: v.station, litres, rate: +v.rate,
            amount: Math.round(litres * +v.rate),
            meter: exception === 'Meter reading lower than the previous fill' ? veh.km : +v.meter,
            since, consumption, unit: plant ? 'L/h' : 'km/L', variance, exception,
            status: exception ? 'Exception' : 'Unverified',
          },
        });
        select('fuel', ref);
        goTab('fuel');
        flash(exception
          ? `${ref} captured as an exception — ${exception.toLowerCase()}.`
          : `${ref} captured — ${litres} L, ${consumption} ${plant ? 'L/h' : 'km/L'}.`,
        { tone: exception ? 'warn' : 'ok', title: exception ? 'Exception raised' : 'Fuel captured' });
      },
    },
    clearException: fuelTx && {
      title: `Clear the exception on ${fuelTx.ref}`, submit: 'Clear it',
      note: `${fuelTx.exception}. Clearing this posts the fill against ${fuelTx.vehicle}’s cost, so the reason stays on the record and in the audit trail.`,
      fields: [[{ k: 'reason', l: 'Reason', options: [
        'meter fault confirmed on site, corrected from the telematics feed',
        'the previous fill was captured against the wrong vehicle',
        'a second tank was filled on the same transaction',
        'confirmed against the site’s own bunker record',
        'operator error on the meter capture, corrected',
      ] }]],
      onSubmit: (v) => {
        dispatch({ type: 'CLEAR_EXCEPTION', ref: fuelTx.ref, reason: v.reason, by: me.name });
        flash(`Exception on ${fuelTx.ref} cleared and the fill posted.`, { title: 'Fuel exception' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Tyres
       ══════════════════════════════════════════════════════════ */
    fitTyre: {
      title: 'Fit a tyre', submit: 'Fit it',
      note: 'The tyre is recorded at the vehicle’s current meter reading. Everything it costs from here is measured over the distance it runs from that point.',
      fields: [
        [{ k: 'plate', l: 'Vehicle', options: vehicles.filter((v) => v.cls === 'Heavy' || v.cls === 'Plant').map((v) => `${v.plate} — ${v.type}`) }],
        [{ k: 'position', l: 'Position', options: [...TYRE_POS_HEAVY, ...TYRE_POS_PLANT] },
         { k: 'brand', l: 'Brand', options: TYRE_BRANDS }],
        [{ k: 'tread', l: 'Tread depth, mm', type: 'number', value: '16' },
         { k: 'cost', l: 'Fitted cost', type: 'number', value: '8400' }],
        [{ k: 'retread', l: 'Retread', options: ['No', 'Yes'] }],
      ],
      onSubmit: (v) => {
        const plate = v.plate.split(' — ')[0];
        const veh = vehicles.find((x) => x.plate === plate) || vehicles[0];
        const serial = 'TY' + Math.floor(500000 + Math.random() * 99999);
        dispatch({
          type: 'FIT_TYRE', by: me.name,
          tyre: {
            serial, brand: v.brand, size: veh.cls === 'Plant' ? '29.5R25' : '315/80R22.5',
            position: v.position, vehicle: plate, fleetNo: veh.fleetNo, site: veh.site,
            fittedAt: veh.km, fittedOn: shift(0), currentMeter: veh.km, run: 0,
            tread: +v.tread, pressure: veh.cls === 'Plant' ? 560 : 820,
            retreads: v.retread === 'Yes' ? 1 : 0, cost: +v.cost,
            cpk: +(+v.cost / 1000).toFixed(3), status: 'New',
          },
        });
        select('tyre', serial);
        goTab('tyres');
        flash(`${serial} fitted to ${plate} at ${v.position}.`, { title: 'Tyre fitted' });
      },
    },
    logTread: tyre && {
      title: `Record the tread on ${tyre.serial}`, submit: 'Record',
      note: `${tyre.brand} at ${tyre.position} on ${tyre.vehicle}, last measured at ${tyre.tread} mm. Below 3 mm the tyre is not legal and the vehicle should not move on it.`,
      fields: [[{ k: 'tread', l: 'Tread depth, mm', type: 'number', value: String(tyre.tread), required: true,
        validate: (v) => (+v >= 0 && +v <= 30 ? '' : 'Enter a depth between 0 and 30 mm.') }]],
      onSubmit: (v) => {
        dispatch({ type: 'LOG_TREAD', serial: tyre.serial, tread: +v.tread, by: me.name });
        flash(+v.tread < 3
          ? `${tyre.serial} measured at ${v.tread} mm — below the legal limit. Scrap it before ${tyre.vehicle} runs again.`
          : `${tyre.serial} measured at ${v.tread} mm.`,
        { tone: +v.tread < 3 ? 'err' : +v.tread < 5 ? 'warn' : 'ok', title: 'Tread recorded' });
      },
    },
    scrapTyre: tyre && {
      title: `Scrap ${tyre.serial}`, submit: 'Scrap it',
      note: `Fitted at ${num(tyre.fittedAt)} and run ${num(tyre.run)} since, at R ${tyre.cpk.toFixed(3)} per kilometre. The cost stays on the vehicle’s record.`,
      fields: [[{ k: 'reason', l: 'Reason', options: [
        'tread below the 3 mm legal limit', 'sidewall damage', 'irreparable puncture',
        'irregular wear from misalignment', 'sent for retreading', 'casing failure',
      ] }]],
      onSubmit: (v) => {
        dispatch({ type: 'SCRAP_TYRE', serial: tyre.serial, reason: v.reason, by: me.name });
        flash(`${tyre.serial} scrapped — ${v.reason}.`, { tone: 'warn', title: 'Tyre scrapped' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Stores
       ══════════════════════════════════════════════════════════ */
    part: {
      title: 'Add a catalogue line', submit: 'Add it',
      note: 'A new line starts at zero on hand. The reorder level is what the nightly reorder proposal reads.',
      fields: [
        [{ k: 'desc', l: 'Description', p: 'Oil filter — Volvo FH', required: true }],
        [{ k: 'category', l: 'Category', options: PART_CATS }, { k: 'supplier', l: 'Supplier', options: SUPPLIERS }],
        [{ k: 'store', l: 'Store', options: siteOptions }, { k: 'bin', l: 'Bin', p: 'B4-27' }],
        [{ k: 'qty', l: 'Opening quantity', type: 'number', value: '0' },
         { k: 'reorder', l: 'Reorder level', type: 'number', value: '6' }],
        [{ k: 'unitCost', l: 'Unit cost', type: 'number', required: true },
         { k: 'lead', l: 'Lead time, days', type: 'number', value: '7' }],
      ],
      onSubmit: (v) => {
        const sku = 'P-' + Math.floor(20000 + Math.random() * 9000);
        dispatch({
          type: 'ADD_PART', by: me.name,
          part: {
            sku, desc: v.desc, category: v.category, bin: v.bin || 'A1-10',
            store: (SITES.find((x) => x.name === v.store) || SITES[1]).key,
            qty: +v.qty || 0, reorder: +v.reorder || 6, onOrder: 0,
            unitCost: +v.unitCost, supplier: v.supplier, lastIssued: shift(0),
            usage90: 0, lead: +v.lead || 7,
          },
        });
        select('part', sku);
        goTab('parts');
        flash(`${v.desc} added to the catalogue as ${sku}.`);
      },
    },
    issuePart: part && {
      title: `Issue ${part.desc}`, submit: 'Issue',
      note: `${part.qty} on hand in bin ${part.bin}. Issuing moves the part out of stock and onto the job card at ${R(part.unitCost)} each, so the workshop cost and the stock value cannot disagree.`,
      fields: [
        [{ k: 'qty', l: 'Quantity', type: 'number', value: '1', required: true,
          validate: (v) => (+v > 0 && +v <= part.qty ? '' : `Only ${part.qty} on hand.`) }],
        [{ k: 'wo', l: 'To job card', options: ['— stock issue —', ...store.workOrders.filter((w) => w.status !== 'Completed').map((w) => `${w.ref} · ${w.vehicle}`)] }],
      ],
      onSubmit: (v) => {
        const wo = v.wo === '— stock issue —' ? null : v.wo.split(' · ')[0];
        dispatch({ type: 'ISSUE_PART', sku: part.sku, qty: +v.qty, workOrder: wo, by: me.name });
        flash(`${v.qty} × ${part.desc} issued${wo ? ` to ${wo}` : ''} — ${R(+v.qty * part.unitCost)}.`,
          { title: 'Stores' });
      },
    },
    adjustStock: part && {
      title: `Adjust ${part.desc}`, submit: 'Adjust',
      note: `The system says ${part.qty}. An adjustment is a write-off or a write-on against the stock value, so it carries a reason and lands in the audit trail.`,
      fields: [
        [{ k: 'qty', l: 'Counted quantity', type: 'number', value: String(part.qty), required: true,
          validate: (v) => (+v >= 0 ? '' : 'A count cannot be negative.') }],
        [{ k: 'reason', l: 'Reason', options: [
          'stock count variance', 'damaged in the store', 'issued without a job card',
          'received short from the supplier', 'found on the shelf, previously written off',
        ] }],
      ],
      onSubmit: (v) => {
        const diff = +v.qty - part.qty;
        dispatch({ type: 'ADJUST_STOCK', sku: part.sku, qty: +v.qty, reason: v.reason, by: me.name });
        flash(`${part.desc} adjusted ${diff >= 0 ? 'up' : 'down'} by ${Math.abs(diff)} — ${R(Math.abs(diff) * part.unitCost)} ${diff >= 0 ? 'on' : 'off'} the stock value.`,
          { tone: 'warn', title: 'Stock adjusted' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Workshop
       ══════════════════════════════════════════════════════════ */
    bookLabour: workOrder && {
      title: `Book labour to ${workOrder.ref}`, submit: 'Book it',
      note: `${workOrder.labourHours} hours booked so far at ${R(workOrder.labourRate)} an hour. Labour and parts together are what the job card costs.`,
      fields: [
        [{ k: 'hours', l: 'Hours', type: 'number', value: '2', required: true,
          validate: (v) => (+v > 0 ? '' : 'Enter the hours worked.') },
         { k: 'technician', l: 'Technician', options: ['J. Marais', 'S. Ndlovu', 'P. Mokoena', 'A. Khoza', 'W. Botha'] }],
      ],
      onSubmit: (v) => {
        dispatch({ type: 'WO_LABOUR', ref: workOrder.ref, hours: +v.hours, technician: v.technician, by: me.name });
        flash(`${v.hours} hours booked to ${workOrder.ref} — ${R(+v.hours * workOrder.labourRate)}.`, { title: 'Workshop' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Procurement
       ══════════════════════════════════════════════════════════ */
    po: {
      title: 'Raise a purchase order', submit: 'Raise it',
      note: 'An order above R 250 000 needs an approval before it can be sent to the supplier.',
      fields: [
        [{ k: 'supplier', l: 'Supplier', options: SUPPLIERS }, { k: 'site', l: 'Deliver to', options: siteOptions }],
        [{ k: 'sku', l: 'Part', options: store.parts.map((x) => `${x.sku} · ${x.desc}`) },
         { k: 'qty', l: 'Quantity', type: 'number', value: '4', required: true }],
        [{ k: 'wo', l: 'Against a job card', options: ['— stock replenishment —', ...store.workOrders.filter((w) => w.status !== 'Completed').map((w) => `${w.ref} · ${w.vehicle}`)] }],
        [{ k: 'note', l: 'Note to the supplier', p: 'Deliver to the Lephalale stores, attention the foreman.', area: true }],
      ],
      onSubmit: (v) => {
        const sku = v.sku.split(' · ')[0];
        const p = store.parts.find((x) => x.sku === sku) || store.parts[0];
        const ref = 'PO-26-' + Math.floor(2300 + Math.random() * 200);
        const po2 = {
          ref, supplier: v.supplier,
          site: (SITES.find((x) => x.name === v.site) || SITES[1]).key,
          raisedBy: me.name, raised: shift(0), expected: shift(p.lead),
          lines: [{ sku: p.sku, desc: p.desc, qty: +v.qty, price: p.unitCost }],
          status: 'Draft',
          workOrder: v.wo === '— stock replenishment —' ? null : v.wo.split(' · ')[0],
          note: v.note,
        };
        dispatch({ type: 'RAISE_PO', po: po2, by: me.name });
        select('po', ref);
        goTab('procurement');
        const total = poTotal(po2);
        flash(total > 250000
          ? `${ref} raised at ${R(total)} — above the R 250 000 limit, so it needs an approval before it can be sent.`
          : `${ref} raised on ${v.supplier} at ${R(total)}.`,
        { tone: total > 250000 ? 'warn' : 'ok', title: 'Order raised' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Incidents
       ══════════════════════════════════════════════════════════ */
    incident: {
      title: 'Log an incident', submit: 'Log it',
      note: 'A critical incident is reportable within 24 hours and grounds the vehicle until it has been assessed. The four investigation actions are opened automatically.',
      fields: [
        [{ k: 'type', l: 'Type', options: INCIDENT_TYPES },
         { k: 'severity', l: 'Severity', options: ['Minor', 'Moderate', 'Major', 'Critical'] }],
        [{ k: 'plate', l: 'Vehicle', options: vehicles.map((v) => `${v.plate} — ${v.make}`) },
         { k: 'driver', l: 'Operator', options: operators.length ? operators : ['—'] }],
        [{ k: 'location', l: 'Where', p: 'Haul road 2, at the tip head' },
         { k: 'estimate', l: 'Estimated cost', type: 'number', value: '25000' }],
        [{ k: 'injuries', l: 'People injured', type: 'number', value: '0' },
         { k: 'thirdParty', l: 'Third party involved', options: ['No', 'Yes'] }],
        [{ k: 'description', l: 'What happened', p: 'Describe the sequence of events, the conditions and what was done immediately afterwards.', area: true, rows: 3, required: true }],
      ],
      onSubmit: (v) => {
        const plate = v.plate.split(' — ')[0];
        const veh = vehicles.find((x) => x.plate === plate) || vehicles[0];
        const ref = 'INC-26-' + Math.floor(200 + Math.random() * 90);
        const critical = v.severity === 'Critical';
        dispatch({
          type: 'ADD_INCIDENT', by: me.name, ground: critical,
          incident: {
            ref, type: v.type, severity: v.severity, description: v.description, status: 'Open',
            vehicle: plate, fleetNo: veh.fleetNo, driver: v.driver, site: veh.site,
            date: shift(0), location: v.location, claim: null,
            estimate: +v.estimate || 0, excess: 15000, thirdParty: v.thirdParty === 'Yes',
            injuries: +v.injuries || 0, lostDays: 0, reportedBy: me.name, workOrder: null,
            actions: [
              { text: 'Scene secured and the operator’s statement taken', done: false },
              { text: 'Telematics and camera footage pulled', done: false },
              { text: 'Root cause established and coaching booked', done: false },
              { text: 'Claim lodged with the insurer', done: false },
            ],
          },
        });
        select('incident', ref);
        goTab('incidents');
        flash(critical
          ? `${ref} logged as critical — ${plate} taken off road, and the incident is reportable within 24 hours.`
          : `${ref} logged against ${plate}.`,
        { tone: critical ? 'err' : 'warn', title: 'Incident logged' });
      },
    },
    lodgeClaim: incident && {
      title: `Lodge a claim on ${incident.ref}`, submit: 'Lodge it',
      note: `${incident.type} on ${incident.vehicle}, estimated at ${R(incident.estimate)} against a ${R(incident.excess)} excess.`,
      fields: [
        [{ k: 'insurer', l: 'Insurer', options: ['Santam Commercial', 'Old Mutual Insure', 'Hollard Fleet', 'Bryte Insurance'] }],
        [{ k: 'amount', l: 'Claim amount', type: 'number', value: String(incident.estimate) }],
      ],
      onSubmit: (v) => {
        const claim = 'CLM-26-' + Math.floor(4500 + Math.random() * 200);
        dispatch({ type: 'LODGE_CLAIM', ref: incident.ref, claim, insurer: v.insurer, by: me.name });
        flash(`${claim} lodged with ${v.insurer} for ${R(+v.amount)}.`, { title: 'Claim lodged' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Billing
       ══════════════════════════════════════════════════════════ */
    invoice: {
      title: 'Raise an invoice', submit: 'Raise it',
      note: 'Only delivered jobs with a proof of delivery in are billable — that is the rule the dispatch settings set, and it is what stops a customer disputing a line.',
      fields: [
        [{ k: 'customer', l: 'Customer', options: [...new Set(store.jobs.filter((j) => j.status === 'Delivered' && !j.invoice && j.pod).map((j) => j.customer))].sort() }],
        [{ k: 'discount', l: 'Discount, %', type: 'number', value: '0' },
         { k: 'vat', l: 'VAT, %', type: 'number', value: '15' }],
        [{ k: 'terms', l: 'Payment terms', options: ['30 days', '14 days', '60 days', 'On presentation'] }],
      ],
      onSubmit: (v) => {
        const billable = store.jobs.filter((j) => j.customer === v.customer && j.status === 'Delivered' && !j.invoice && j.pod);
        if (!billable.length) {
          return flash(`Nothing is billable for ${v.customer} — every delivered job is either already invoiced or missing its POD.`,
            { tone: 'warn', title: 'Nothing to bill' });
        }
        const days = { '30 days': 30, '14 days': 14, '60 days': 60, 'On presentation': 0 }[v.terms];
        const ref = 'INV-26-' + Math.floor(7200 + Math.random() * 200);
        const inv = {
          ref, customer: v.customer,
          contact: `accounts@${v.customer.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.co.za`,
          site: billable[0].site, date: shift(0), due: shift(days),
          lines: billable.map((j) => ({
            desc: `${j.ref} · ${j.origin} → ${j.destination} · ${j.cargo}`,
            qty: j.distance, unit: 'km', price: +(j.revenue / j.distance).toFixed(2),
          })),
          discount: +v.discount || 0, vat: +v.vat || 15, payments: [],
          jobs: billable.map((j) => j.ref), status: 'Issued',
        };
        dispatch({ type: 'RAISE_INVOICE', invoice: inv, by: me.name });
        select('invoice', ref);
        store.setView('billing', 'register');
        goTab('billing');
        return flash(`${ref} raised to ${v.customer} — ${billable.length} job(s), ${R(invTotal(inv))} including VAT.`,
          { title: 'Invoice raised' });
      },
    },
    payment: invoice && {
      title: `Receipt a payment against ${invoice.ref}`, submit: 'Receipt it',
      note: `${invoice.customer} owes ${R(invDue(invoice))} of ${R(invTotal(invoice))}.`,
      fields: [
        [{ k: 'amount', l: 'Amount received', type: 'number', value: String(invDue(invoice)), required: true,
          validate: (v) => (+v > 0 ? '' : 'Enter the amount received.') },
         { k: 'method', l: 'Method', options: ['EFT', 'Cheque', 'Card', 'Cash'] }],
      ],
      onSubmit: (v) => {
        const amount = Math.round(+v.amount);
        const payment = { ref: 'RCT-' + Math.floor(20000 + Math.random() * 70000), date: shift(0), amount, method: v.method };
        dispatch({ type: 'RECORD_PAYMENT', ref: invoice.ref, payment, by: me.name });
        const left = Math.max(0, invDue(invoice) - amount);
        flash(left
          ? `${R(amount)} receipted against ${invoice.ref} — ${R(left)} still outstanding.`
          : `${invoice.ref} settled in full.`,
        { tone: left ? 'info' : 'ok', title: 'Payment receipted' });
      },
    },

    /* ══════════════════════════════════════════════════════════
       Documents and cost control
       ══════════════════════════════════════════════════════════ */
    document: {
      title: 'Upload a document', submit: 'Upload',
      note: 'An uploaded document is unverified until somebody checks it against the original. The nightly expiry sweep reads the date on this record, so it has to be the date on the paper.',
      fields: [
        [{ k: 'kind', l: 'Kind', options: DOC_TYPES },
         { k: 'subjectType', l: 'Held against', options: ['Vehicle', 'Person'] }],
        [{ k: 'subject', l: 'Vehicle or person', options: [...vehicles.map((v) => v.plate), ...users.map((u) => u.name)] }],
        [{ k: 'issued', l: 'Issued on', type: 'date' }, { k: 'expires', l: 'Expires on', type: 'date' }],
        [{ k: 'owner', l: 'Owned by', options: ['Compliance officer', 'Human resources', 'Finance', 'Workshop', 'Occupational health'] }],
      ],
      onSubmit: (v) => {
        const isVehicle = vehicles.some((x) => x.plate === v.subject);
        const site = isVehicle
          ? vehicles.find((x) => x.plate === v.subject).site
          : (users.find((x) => x.name === v.subject) || { site: 'HO' }).site;
        const ref = 'DOC-' + Math.floor(9600 + Math.random() * 300);
        dispatch({
          type: 'UPLOAD_DOC', by: me.name,
          doc: {
            ref, kind: v.kind, subject: v.subject,
            subjectType: isVehicle ? 'Vehicle' : 'Person', site,
            issued: v.issued || shift(0), expires: v.expires || null,
            owner: v.owner, file: `${v.kind.toLowerCase().replace(/\s/g, '-')}-${v.subject.replace(/\s/g, '')}.pdf`,
            size: '214 KB', status: 'Unverified',
          },
        });
        select('document', ref);
        goTab('documents');
        flash(`${v.kind} uploaded for ${v.subject}. It stays unverified until it is checked against the original.`,
          { title: 'Document uploaded' });
      },
    },
    budget: {
      title: 'Set a monthly budget', submit: 'Set it',
      note: 'The budget is what the variance on the cost screen is measured against, and a change to it is a change to what the board was told. It is written to the audit trail.',
      fields: [
        [{ k: 'head', l: 'Cost head', options: COST_HEADS.map((h) => h.label) }],
        [{ k: 'amount', l: 'Monthly budget', type: 'number', required: true,
          validate: (v) => (+v > 0 ? '' : 'Enter the budgeted amount.') }],
      ],
      onSubmit: (v) => {
        const head = COST_HEADS.find((h) => h.label === v.head) || COST_HEADS[0];
        dispatch({ type: 'SET_BUDGET', head: head.key, label: head.label, amount: Math.round(+v.amount), by: me.name });
        store.setView('costs', 'budget');
        goTab('costs');
        flash(`${head.label} budget set to ${R(+v.amount)} for the month.`, { title: 'Budget set' });
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
    dispatch: <Dispatch {...props} />,
    fuel: <FuelScreen {...props} />,
    tyres: <TyresScreen {...props} />,
    parts: <PartsScreen {...props} />,
    telematics: <Telematics {...props} />,
    costs: <Costs {...props} />,
    procurement: <Procurement {...props} />,
    billing: <Billing {...props} />,
    incidents: <Incidents {...props} />,
    documents: <Documents {...props} />,
    contracts: <Contracts {...props} />,
    admin: <Admin {...props} />,
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
              {tab === 'dispatch' && <JobPane job={job} run={run} />}
              {tab === 'fuel' && <FuelPane tx={fuelTx} run={run} />}
              {tab === 'tyres' && <TyrePane tyre={tyre} run={run} />}
              {tab === 'parts' && <PartPane part={part} run={run} />}
              {tab === 'procurement' && <POPane po={po} run={run} />}
              {tab === 'incidents' && (
                <IncidentPane incident={incident} run={run}
                  onAction={(ref, index) => dispatch({ type: 'INCIDENT_ACTION', ref, index, by: me.name })} />
              )}
              {tab === 'billing' && <InvoicePane invoice={invoice} run={run} />}
              {tab === 'documents' && <DocumentPane document={doc} run={run} />}
              {(tab === 'contracts' || tab === 'costs') && (
                <VehiclePane vehicle={vehicle} defects={defects} inspections={inspections} run={run} />
              )}
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

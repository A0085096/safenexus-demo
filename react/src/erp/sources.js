/* ══════════════════════════════════════════════════════════════
   The report sources, and the engine that queries them.

   The seventeen report definitions each answer a question somebody
   already knew to ask. This is the other half: a person with a
   question nobody anticipated, who would otherwise be waiting on a
   developer.

   A source is one register, described field by field — a label, a
   type and how to read the value off a record. Everything else in
   the builder falls out of the type: which operators a filter
   offers, how a column aligns, whether it can be summed, and how it
   prints. So adding a queryable register is a data change here, not
   a screen change there.
   ══════════════════════════════════════════════════════════════ */

import { siteName } from '../data.js';
import {
  R, num, until, fmtDate, jobMargin, woCost, vehSpend, vehCpk,
  stockValue, poTotal, invTotal, invPaid, invDue, invState,
} from './seed.js';
import { SHIFT_DEFS } from './workforce.js';

/* ── the types ─────────────────────────────────────────────────
   'money' and 'pct' are numbers that print differently; keeping
   them apart from 'num' is what lets the builder total a column of
   rands without also totalling a column of percentages. */
export const TYPES = {
  text: { num: false, fmt: (v) => (v == null || v === '' ? '—' : String(v)) },
  num: { num: true, fmt: (v) => (v == null ? '—' : num(v)) },
  money: { num: true, fmt: (v) => (v == null ? '—' : R(v)) },
  pct: { num: true, fmt: (v) => (v == null ? '—' : `${(+v).toFixed(1)}%`) },
  rate: { num: true, fmt: (v) => (v == null ? '—' : (+v).toFixed(2)) },
  date: { num: false, fmt: (v) => (v ? fmtDate(v) : '—') },
  days: { num: true, fmt: (v) => (v == null ? '—' : `${v} day${Math.abs(v) === 1 ? '' : 's'}`) },
  bool: { num: false, fmt: (v) => (v ? 'Yes' : 'No') },
};
export const isNum = (t) => !!TYPES[t]?.num;
export const fmtVal = (t, v) => (TYPES[t] || TYPES.text).fmt(v);

/* a field: key, label, type, and an optional reader for anything
   that is derived rather than stored */
const f = (k, l, t = 'text', get = null) => ({ k, l, t, get });

/* Some text fields have an order of their own, and it is not
   alphabetical: a week does not start on Friday. A field that
   declares one is sorted by it instead of by its letters. */
const ordered = (field, order) => ({ ...field, order });
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ══════════════════════════════════════════════════════════════
   The sources.
   ══════════════════════════════════════════════════════════════ */
export const SOURCES = [
  {
    id: 'vehicles', name: 'Fleet', icon: 'truck', of: (s) => s.vehicles,
    desc: 'Every machine on the register, with its meter, its costs and its certificates.',
    fields: [
      f('plate', 'Registration'), f('fleetNo', 'Fleet no'), f('type', 'Type'),
      f('make', 'Make and model'), f('cls', 'Class'), f('year', 'Year', 'num'),
      f('site', 'Site', 'text', (v) => siteName(v.site)), f('status', 'Status'),
      f('driver', 'Operator'), f('sup', 'Supervisor'), f('permit', 'Permit area'),
      f('km', 'Meter', 'num'), f('meterType', 'Meter unit'),
      f('serviceDue', 'Service due at', 'num'),
      f('toService', 'Until service', 'num', (v) => v.serviceDue - v.km),
      f('interval', 'Service interval', 'num'),
      f('targetRate', 'Target consumption', 'rate'), f('rate', 'Achieved consumption', 'rate'),
      f('cofExpiry', 'COF expires', 'date'), f('cofDays', 'COF days left', 'days', (v) => until(v.cofExpiry)),
      f('licenceExpiry', 'Licence expires', 'date'),
      f('insuranceExpiry', 'Insurance expires', 'date'),
      f('spend', 'Spend this month', 'money', (v) => vehSpend(v)),
      f('cpk', 'Cost per unit', 'rate', (v) => +vehCpk(v).toFixed(2)),
      f('fuelSpend', 'Fuel this month', 'money', (v) => v.month?.fuel || 0),
      f('maintSpend', 'Maintenance this month', 'money', (v) => v.month?.maint || 0),
      f('runMonth', 'Run this month', 'num', (v) => v.month?.meter || 0),
      f('util', 'Utilisation', 'pct', (v) => v.month?.util || 0),
      f('hold', 'Held as', 'text', (v) => v.finance?.kind || '—'),
      f('unit', 'Telematics', 'text', (v) => v.telematics?.status || '—'),
      f('openDefects', 'Open defects', 'num',
        (v, s) => s.defects.filter((d) => d.plate === v.plate && d.status !== 'Closed').length),
    ],
    default: ['fleetNo', 'plate', 'type', 'site', 'status', 'km', 'cpk', 'openDefects'],
  },
  {
    id: 'people', name: 'Operators', icon: 'users', of: (s) => s.users,
    desc: 'The workforce: what they may operate, how well they operate it and their hours.',
    fields: [
      f('name', 'Name'), f('empNo', 'Employee no'), f('code', 'Operator code'),
      f('role', 'Role'), f('site', 'Site', 'text', (u) => siteName(u.site)),
      f('status', 'Status'), f('duty', 'Duty'), f('reports', 'Reports to'),
      f('vehicle', 'Assigned machine'), f('licenceCode', 'Licence'),
      f('licenceExpiry', 'Licence expires', 'date'),
      f('licDays', 'Licence days left', 'days', (u) => (u.licenceExpiry ? until(u.licenceExpiry) : null)),
      f('medicalExpiry', 'Medical expires', 'date'),
      f('medDays', 'Medical days left', 'days', (u) => (u.medicalExpiry ? until(u.medicalExpiry) : null)),
      f('insps', 'Sheets captured', 'num'), f('passRate', 'Pass rate', 'pct'),
      f('defects', 'Defects raised', 'num'), f('score', 'Behaviour score', 'num'),
      f('hoursWeek', 'Hours this week', 'num'), f('kmMonth', 'Km this month', 'num'),
      f('jobsMonth', 'Jobs this month', 'num'), f('incidents', 'Incidents', 'num'),
      f('started', 'Started'), f('email', 'Email'), f('phone', 'Telephone'),
    ],
    default: ['name', 'empNo', 'role', 'site', 'status', 'hoursWeek', 'score', 'insps'],
  },
  {
    id: 'inspections', name: 'Inspection sheets', icon: 'clipboard', of: (s) => s.inspections,
    desc: 'Every pre-use sheet captured, its outcome and whether it was signed off.',
    fields: [
      f('ref', 'Sheet'), f('on', 'Date', 'date'), f('date', 'Captured'),
      f('vehicle', 'Machine'), f('op', 'Operator'),
      f('site', 'Site', 'text', (i) => siteName(i.site)), f('shift', 'Shift'),
      f('result', 'Outcome'), f('ok', 'Checks in order', 'num'),
      f('go', 'Go-but raised', 'num'), f('ng', 'No-go raised', 'num'),
      f('signed', 'Signed off', 'bool'), f('signedBy', 'Signed by'),
      f('passed', 'Passed', 'bool', (i) => i.result !== 'no-go'),
      f('items', 'Checks failed', 'num', (i) => (i.failed || []).length),
      f('first', 'First failure', 'text', (i) => (i.failed || [])[0]?.label || '—'),
      ordered(f('weekday', 'Weekday', 'text', (i) => (i.on
        ? ['Sunday', ...WEEKDAYS.slice(0, 6)][new Date(`${i.on}T00:00:00`).getDay()]
        : '—')), WEEKDAYS),
      f('month', 'Month', 'text', (i) => (i.on || '').slice(0, 7)),
    ],
    default: ['ref', 'on', 'vehicle', 'op', 'site', 'shift', 'result', 'signed'],
  },
  {
    id: 'defects', name: 'Defects', icon: 'alert', of: (s) => s.defects,
    desc: 'What the sheets found, how old it is and whether the window has run out.',
    fields: [
      f('id', 'Defect'), f('item', 'Check'), f('section', 'Section'),
      f('plate', 'Machine'), f('site', 'Site', 'text', (d) => siteName(d.site)),
      f('severity', 'Severity'), f('status', 'Status'),
      f('raised', 'Raised'), f('due', 'Due'), f('age', 'Age', 'days'),
      f('raisedBy', 'Raised by'), f('supervisorSigned', 'Concession signed', 'bool'),
      f('workOrder', 'Job card'), f('inspection', 'From sheet'), f('note', 'Note'),
    ],
    default: ['id', 'item', 'plate', 'site', 'severity', 'status', 'age', 'workOrder'],
  },
  {
    id: 'jobs', name: 'Haulage jobs', icon: 'route', of: (s) => s.jobs,
    desc: 'Loads moved or planned, what each earned and what it cost to move.',
    fields: [
      f('ref', 'Job'), f('customer', 'Customer'), f('origin', 'From'), f('destination', 'To'),
      f('route', 'Route'), f('cargo', 'Cargo'), f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'),
      f('driver', 'Operator'), f('site', 'Site', 'text', (j) => siteName(j.site)),
      f('status', 'Status'), f('priority', 'Priority'),
      f('depart', 'Departs', 'date'), f('eta', 'Arrives', 'date'),
      f('distance', 'Distance', 'num'), f('tons', 'Tonnage', 'rate'), f('hours', 'Hours', 'rate'),
      f('revenue', 'Revenue', 'money'), f('cost', 'Cost', 'money'),
      f('margin', 'Margin', 'money', (j) => jobMargin(j)),
      f('marginPct', 'Margin', 'pct', (j) => (j.revenue ? (jobMargin(j) / j.revenue) * 100 : 0)),
      f('perKm', 'Margin per km', 'rate', (j) => (j.distance ? +(jobMargin(j) / j.distance).toFixed(2) : 0)),
      f('rate', 'Rate per km', 'rate', (j) => (j.distance ? +(j.revenue / j.distance).toFixed(2) : 0)),
      f('fuelCost', 'Fuel', 'money'), f('tollCost', 'Tolls', 'money'),
      f('driverCost', 'Operator', 'money'), f('other', 'Other', 'money'),
      f('lateBy', 'Late by', 'num'), f('pod', 'Proof of delivery', 'bool'),
      f('invoice', 'Invoice'),
    ],
    default: ['ref', 'customer', 'origin', 'destination', 'vehicle', 'status', 'revenue', 'margin'],
  },
  {
    id: 'fuel', name: 'Fuel', icon: 'fuel', of: (s) => s.fuel,
    desc: 'Every fill against the model target for that machine, and the exceptions.',
    fields: [
      f('ref', 'Transaction'), f('date', 'Date', 'date'), f('time', 'Time'),
      f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'), f('driver', 'Operator'),
      f('site', 'Site', 'text', (x) => siteName(x.site)), f('station', 'Station'),
      f('card', 'Card'), f('litres', 'Litres', 'num'), f('rate', 'Rate per litre', 'rate'),
      f('amount', 'Amount', 'money'), f('meter', 'Meter', 'num'), f('since', 'Run since last', 'num'),
      f('consumption', 'Achieved', 'rate'), f('unit', 'Unit'),
      f('variance', 'Variance', 'pct'), f('exception', 'Exception'), f('status', 'Status'),
      f('perUnit', 'Cost per unit run', 'rate', (x) => (x.since ? +(x.amount / x.since).toFixed(2) : 0)),
    ],
    default: ['ref', 'date', 'vehicle', 'driver', 'station', 'litres', 'amount', 'variance', 'status'],
  },
  {
    id: 'tyres', name: 'Tyres', icon: 'tyre', of: (s) => s.tyres,
    desc: 'Managed by position, judged on cost per kilometre and on the legal floor.',
    fields: [
      f('serial', 'Serial'), f('brand', 'Brand'), f('size', 'Size'), f('position', 'Position'),
      f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'),
      f('site', 'Site', 'text', (t) => siteName(t.site)), f('status', 'Status'),
      f('fittedOn', 'Fitted', 'date'), f('fittedAt', 'Fitted at meter', 'num'),
      f('currentMeter', 'Meter now', 'num'), f('run', 'Run', 'num'),
      f('tread', 'Tread', 'rate'), f('pressure', 'Pressure', 'num'),
      f('retreads', 'Retreads', 'num'), f('cost', 'Cost', 'money'),
      f('cpk', 'Cost per km', 'rate'),
      f('legal', 'Above the floor', 'bool', (t, s) => t.tread >= s.settings.minTreadMm),
    ],
    default: ['serial', 'brand', 'position', 'vehicle', 'site', 'run', 'tread', 'cpk', 'status'],
  },
  {
    id: 'parts', name: 'Parts', icon: 'part', of: (s) => s.parts,
    desc: 'Stock on hand, months of cover, what is dead and what is short.',
    fields: [
      f('sku', 'Part'), f('desc', 'Description'), f('category', 'Category'),
      f('bin', 'Bin'), f('store', 'Store', 'text', (p) => siteName(p.store)),
      f('qty', 'On hand', 'num'), f('reorder', 'Reorder level', 'num'),
      f('onOrder', 'On order', 'num'), f('unitCost', 'Unit cost', 'money'),
      f('value', 'Stock value', 'money', (p) => stockValue(p)),
      f('supplier', 'Supplier'), f('lead', 'Lead time', 'days'),
      f('usage90', 'Used in 90 days', 'num'), f('lastIssued', 'Last issued', 'date'),
      f('cover', 'Months of cover', 'rate', (p) => (p.usage90 ? +(p.qty / (p.usage90 / 3)).toFixed(1) : 99)),
      f('short', 'Below reorder', 'bool', (p) => p.qty < p.reorder),
      f('dead', 'Dead stock', 'bool', (p) => p.usage90 === 0 && p.qty > 0),
    ],
    default: ['sku', 'desc', 'category', 'store', 'qty', 'reorder', 'value', 'cover'],
  },
  {
    id: 'workOrders', name: 'Job cards', icon: 'tool', of: (s) => s.workOrders,
    desc: 'Workshop jobs, the labour and parts they consumed and what they cost.',
    fields: [
      f('ref', 'Job card'), f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'),
      f('site', 'Site', 'text', (w) => siteName(w.site)), f('type', 'Type'),
      f('status', 'Status'), f('priority', 'Priority'), f('opened', 'Opened'),
      f('closed', 'Closed'), f('technician', 'Technician'), f('assigned', 'Assigned to'),
      f('meter', 'Meter', 'num'), f('labourHours', 'Labour hours', 'rate'),
      f('labourRate', 'Labour rate', 'money'),
      f('labour', 'Labour cost', 'money', (w) => Math.round(w.labourHours * w.labourRate)),
      f('partLines', 'Part lines', 'num', (w) => (w.parts || []).length),
      f('partCost', 'Parts cost', 'money',
        (w) => (w.parts || []).reduce((a, p) => a + p.qty * p.cost, 0)),
      f('cost', 'Total cost', 'money', (w) => woCost(w)),
      f('downtimeDays', 'Downtime', 'days'), f('defect', 'From defect'), f('fault', 'Fault'),
    ],
    default: ['ref', 'vehicle', 'site', 'type', 'status', 'labourHours', 'cost', 'downtimeDays'],
  },
  {
    id: 'shifts', name: 'Shift log', icon: 'clock', of: (s) => s.shifts,
    desc: 'One row per machine per shift: hours scheduled, worked and lost, with a code.',
    fields: [
      f('ref', 'Shift'), f('date', 'Date', 'date'),
      f('shift', 'Shift', 'text', (x) => SHIFT_DEFS[x.shift]?.label || x.shift),
      f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'), f('type', 'Type'),
      f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('operator', 'Operator'), f('supervisor', 'Supervisor'),
      f('meterStart', 'Meter at start', 'rate'), f('meterEnd', 'Meter at end', 'rate'),
      f('ran', 'Meter moved', 'rate', (x) => +(x.meterEnd - x.meterStart).toFixed(1)),
      f('scheduled', 'Scheduled', 'rate'), f('worked', 'Worked', 'rate'), f('lost', 'Lost', 'rate'),
      f('availability', 'Availability', 'pct'), f('utilisation', 'Utilisation', 'pct'),
      f('production', 'Production', 'num'), f('unit', 'Measured in'),
      f('delayCount', 'Delays', 'num', (x) => (x.delays || []).length),
      /* a shift log record carries the reason and the code separately,
         and both are worth grouping on: the reason reads, the code
         is what the workshop files against */
      f('firstDelay', 'First delay', 'text', (x) => (x.delays || [])[0]?.reason || '—'),
      f('delayCode', 'Delay code', 'text', (x) => (x.delays || [])[0]?.code || '—'),
      f('lostMinutes', 'Lost minutes', 'num',
        (x) => (x.delays || []).reduce((a, d) => a + d.minutes, 0)),
      f('signedOff', 'Signed off', 'bool'), f('notes', 'Notes'),
    ],
    default: ['ref', 'date', 'shift', 'vehicle', 'operator', 'worked', 'lost', 'availability'],
  },
  {
    id: 'incidents', name: 'Incidents', icon: 'incident', of: (s) => s.incidents,
    desc: 'Damage, injury and claims, with the investigation actions behind each one.',
    fields: [
      f('ref', 'Incident'), f('type', 'Type'), f('severity', 'Severity'), f('status', 'Status'),
      f('date', 'Date', 'date'), f('vehicle', 'Machine'), f('fleetNo', 'Fleet no'),
      f('driver', 'Operator'), f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('location', 'Location'), f('claim', 'Claim'),
      f('estimate', 'Estimate', 'money'), f('excess', 'Excess', 'money'),
      f('thirdParty', 'Third party', 'bool'), f('injuries', 'Injuries', 'num'),
      f('lostDays', 'Days lost', 'days'), f('reportedBy', 'Reported by'),
      f('workOrder', 'Job card'), f('description', 'Description'),
      f('open', 'Actions outstanding', 'num',
        (x) => (x.actions || []).filter((a) => a.status !== 'Closed').length),
    ],
    default: ['ref', 'type', 'severity', 'date', 'vehicle', 'site', 'estimate', 'status'],
  },
  {
    id: 'invoices', name: 'Sales invoices', icon: 'receipt', of: (s) => s.invoices,
    desc: 'What was billed, what was paid and what is overdue.',
    fields: [
      f('ref', 'Invoice'), f('customer', 'Customer'), f('contact', 'Contact'),
      f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('date', 'Raised', 'date'), f('due', 'Due', 'date'),
      f('age', 'Age', 'days', (x) => -until(x.date)),
      f('overdue', 'Overdue by', 'days', (x) => Math.max(0, -until(x.due))),
      f('lineCount', 'Lines', 'num', (x) => (x.lines || []).length),
      f('jobCount', 'Jobs billed', 'num', (x) => (x.jobs || []).length),
      f('total', 'Total', 'money', (x) => Math.round(invTotal(x))),
      f('paid', 'Paid', 'money', (x) => invPaid(x)),
      f('due2', 'Outstanding', 'money', (x) => invDue(x)),
      f('discount', 'Discount', 'pct'), f('vat', 'VAT', 'pct'),
      f('state', 'State', 'text', (x) => invState(x)),
      f('status', 'Status'),
    ],
    default: ['ref', 'customer', 'date', 'due', 'total', 'paid', 'due2', 'state'],
  },
  {
    id: 'purchaseOrders', name: 'Purchase orders', icon: 'coins', of: (s) => s.purchaseOrders,
    desc: 'Orders out to suppliers, what they commit and where they are.',
    fields: [
      f('ref', 'Order'), f('supplier', 'Supplier'),
      f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('raisedBy', 'Raised by'), f('raised', 'Raised', 'date'), f('expected', 'Expected', 'date'),
      f('lineCount', 'Lines', 'num', (x) => (x.lines || []).length),
      f('total', 'Value', 'money', (x) => poTotal(x)),
      f('overLimit', 'Needs approval', 'bool', (x, s) => poTotal(x) > s.settings.poApprovalLimit),
      f('status', 'Status'), f('workOrder', 'Job card'), f('note', 'Note'),
    ],
    default: ['ref', 'supplier', 'site', 'raised', 'expected', 'total', 'status'],
  },
  {
    id: 'supplierInvoices', name: 'Supplier invoices', icon: 'receipt', of: (s) => s.supplierInvoices,
    desc: 'Invoices in, and whether each one matches the order and the receipt.',
    fields: [
      f('ref', 'Invoice'), f('supplier', 'Supplier'), f('po', 'Against order'),
      f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('date', 'Date', 'date'), f('due', 'Due', 'date'),
      f('overdue', 'Overdue by', 'days', (x) => Math.max(0, -until(x.due))),
      f('amount', 'Amount', 'money'), f('matched', 'Three-way matched', 'bool'),
      f('status', 'Status'), f('note', 'Note'),
    ],
    default: ['ref', 'supplier', 'po', 'date', 'due', 'amount', 'matched', 'status'],
  },
  {
    id: 'documents', name: 'Documents', icon: 'files', of: (s) => s.documents,
    desc: 'Every certificate the operation holds, read as days remaining.',
    fields: [
      f('ref', 'Document'), f('kind', 'Kind'), f('subject', 'Subject'),
      f('subjectType', 'Subject type'), f('site', 'Site', 'text', (x) => siteName(x.site)),
      f('issued', 'Issued', 'date'), f('expires', 'Expires', 'date'),
      f('days', 'Days left', 'days', (x) => until(x.expires)),
      f('owner', 'Owner'), f('file', 'File'), f('size', 'Size'), f('status', 'Status'),
    ],
    default: ['ref', 'kind', 'subject', 'site', 'expires', 'days', 'status'],
  },
];

export const sourceById = (id) => SOURCES.find((s) => s.id === id) || SOURCES[0];
export const fieldOf = (src, k) => src.fields.find((x) => x.k === k);
/* a stored field reads itself; a derived one is handed the store
   too, because "open defects" is a question about two registers */
export const read = (field, row, store) => (field.get ? field.get(row, store) : row[field.k]);

/* ══════════════════════════════════════════════════════════════
   Operators.

   Which ones a filter offers is decided by the field's type, so a
   date never offers "contains" and a boolean never offers ">".
   ══════════════════════════════════════════════════════════════ */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const lower = (v) => String(v ?? '').toLowerCase();
/* compare by a field's declared order when it has one, and fall
   back to letters for anything the order does not name */
const cmpBy = (field, a, b) => {
  if (!field?.order) return cmp(lower(a), lower(b));
  const i = field.order.indexOf(String(a));
  const j = field.order.indexOf(String(b));
  if (i < 0 && j < 0) return cmp(lower(a), lower(b));
  return (i < 0 ? field.order.length : i) - (j < 0 ? field.order.length : j);
};

export const OPS = {
  is: { l: 'is', v: 1, t: ['text', 'num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => lower(a) === lower(b) },
  not: { l: 'is not', v: 1, t: ['text', 'num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => lower(a) !== lower(b) },
  has: { l: 'contains', v: 1, t: ['text'], fn: (a, b) => lower(a).includes(lower(b)) },
  hasnt: { l: 'does not contain', v: 1, t: ['text'], fn: (a, b) => !lower(a).includes(lower(b)) },
  starts: { l: 'starts with', v: 1, t: ['text'], fn: (a, b) => lower(a).startsWith(lower(b)) },
  oneof: { l: 'is one of', v: 1, t: ['text'], hint: 'comma separated',
    fn: (a, b) => String(b).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).includes(lower(a)) },
  empty: { l: 'is empty', v: 0, t: ['text', 'date'], fn: (a) => a == null || a === '' || a === '—' },
  filled: { l: 'is not empty', v: 0, t: ['text', 'date'], fn: (a) => !(a == null || a === '' || a === '—') },
  gt: { l: 'is more than', v: 1, t: ['num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => +a > +b },
  gte: { l: 'is at least', v: 1, t: ['num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => +a >= +b },
  lt: { l: 'is less than', v: 1, t: ['num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => +a < +b },
  lte: { l: 'is at most', v: 1, t: ['num', 'money', 'pct', 'rate', 'days'], fn: (a, b) => +a <= +b },
  btw: { l: 'is between', v: 2, t: ['num', 'money', 'pct', 'rate', 'days'], fn: (a, b, c) => +a >= +b && +a <= +c },
  on: { l: 'is on', v: 1, t: ['date'], date: true, fn: (a, b) => String(a).slice(0, 10) === b },
  before: { l: 'is before', v: 1, t: ['date'], date: true, fn: (a, b) => cmp(String(a).slice(0, 10), b) < 0 },
  after: { l: 'is after', v: 1, t: ['date'], date: true, fn: (a, b) => cmp(String(a).slice(0, 10), b) > 0 },
  span: { l: 'is between', v: 2, t: ['date'], date: true,
    fn: (a, b, c) => cmp(String(a).slice(0, 10), b) >= 0 && cmp(String(a).slice(0, 10), c) <= 0 },
  yes: { l: 'is yes', v: 0, t: ['bool'], fn: (a) => !!a },
  no: { l: 'is no', v: 0, t: ['bool'], fn: (a) => !a },
};
export const opsFor = (type) => Object.entries(OPS).filter(([, o]) => o.t.includes(type)).map(([k, o]) => ({ k, ...o }));

/* ══════════════════════════════════════════════════════════════
   Aggregates. Only over numeric types — a count of registrations
   is meaningful, a sum of them is not.
   ══════════════════════════════════════════════════════════════ */
export const AGGS = {
  count: { l: 'Count', any: true, fn: (xs) => xs.length },
  sum: { l: 'Total', fn: (xs) => xs.reduce((a, x) => a + (+x || 0), 0) },
  avg: { l: 'Average', fn: (xs) => (xs.length ? xs.reduce((a, x) => a + (+x || 0), 0) / xs.length : 0) },
  min: { l: 'Lowest', fn: (xs) => (xs.length ? Math.min(...xs.map(Number)) : 0) },
  max: { l: 'Highest', fn: (xs) => (xs.length ? Math.max(...xs.map(Number)) : 0) },
};

/* ══════════════════════════════════════════════════════════════
   The engine.

   A query is data — source, columns, filters, grouping, sort — so
   it can be saved, re-run against whatever the registers hold at
   the time, and exported. It never holds results.
   ══════════════════════════════════════════════════════════════ */
export const blankQuery = (id = 'vehicles') => {
  const src = sourceById(id);
  return {
    source: id,
    cols: [...src.default],
    filters: [],
    match: 'all',
    group: '',
    aggs: [],
    sort: { f: src.default[0], dir: 'asc' },
    limit: 0,
  };
};

const passes = (row, store, src, q) => {
  const live = q.filters.filter((x) => {
    const field = fieldOf(src, x.f);
    const op = OPS[x.op];
    if (!field || !op) return false;
    return op.v === 0 || (x.v !== '' && x.v != null && (op.v < 2 || (x.v2 !== '' && x.v2 != null)));
  });
  if (!live.length) return true;
  const hit = (x) => OPS[x.op].fn(read(fieldOf(src, x.f), row, store), x.v, x.v2);
  return q.match === 'any' ? live.some(hit) : live.every(hit);
};

export function runQuery(store, q, scope = 'ALL') {
  const src = sourceById(q.source);
  const all = src.of(store) || [];
  let rows = all.filter((r) => passes(r, store, src, q));

  /* The scope selector is the navigation pane's site, and it has to
     mean the same thing here as everywhere else: a register with no
     site field is simply not narrowed by one. */
  if (scope !== 'ALL' && src.fields.some((x) => x.k === 'site' || x.k === 'store')) {
    const key = src.fields.some((x) => x.k === 'site') ? 'site' : 'store';
    rows = rows.filter((r) => siteName(r[key]) === scope || r[key] === scope);
  }

  const cols = q.cols.map((k) => fieldOf(src, k)).filter(Boolean);

  /* ── grouped: one row per distinct value, with the aggregates ── */
  if (q.group) {
    const gf = fieldOf(src, q.group);
    const by = new Map();
    rows.forEach((r) => {
      const key = fmtVal(gf.t, read(gf, r, store));
      if (!by.has(key)) by.set(key, []);
      by.get(key).push(r);
    });
    const aggs = q.aggs.filter((a) => AGGS[a.fn] && (a.fn === 'count' || isNum(fieldOf(src, a.f)?.t)));
    const outCols = [
      { k: '__g', l: gf.l, t: 'text' },
      { k: '__n', l: 'Records', t: 'num' },
      ...aggs.map((a) => ({
        k: `${a.fn}:${a.f}`,
        l: `${AGGS[a.fn].l} ${fieldOf(src, a.f).l.toLowerCase()}`,
        t: a.fn === 'count' ? 'num' : a.fn === 'avg' ? 'rate' : fieldOf(src, a.f).t,
      })),
    ];
    let out = [...by.entries()].map(([key, set]) => [
      key, set.length,
      ...aggs.map((a) => {
        const field = fieldOf(src, a.f);
        const vals = set.map((r) => read(field, r, store)).filter((v) => v != null);
        const v = AGGS[a.fn].fn(vals);
        return a.fn === 'avg' ? +v.toFixed(2) : Math.round(v * 100) / 100;
      }),
    ]);
    const gi = q.sort.f === q.group ? 0 : Math.max(0, outCols.findIndex((c) => c.k === q.sort.f));
    /* sorting on the group column uses that field's own order */
    const rank = gi === 0
      ? (a, b) => cmpBy(gf, a[0], b[0])
      : (a, b) => cmp(a[gi], b[gi]);
    out.sort((a, b) => (q.sort.dir === 'desc' ? -rank(a, b) : rank(a, b)));
    if (q.limit > 0) out = out.slice(0, q.limit);
    return { cols: outCols, rows: out, records: rows.length, grouped: true, groups: by.size, total: all.length };
  }

  /* ── flat: the chosen columns, sorted ─────────────────────────── */
  const sf = fieldOf(src, q.sort.f) || cols[0];
  if (sf) {
    const numeric = isNum(sf.t);
    rows = [...rows].sort((a, b) => {
      const x = read(sf, a, store);
      const y = read(sf, b, store);
      const c = numeric ? (+x || 0) - (+y || 0) : cmpBy(sf, x, y);
      return q.sort.dir === 'desc' ? -c : c;
    });
  }
  let body = rows.map((r) => cols.map((c) => read(c, r, store)));
  if (q.limit > 0) body = body.slice(0, q.limit);

  return { cols, rows: body, records: rows.length, grouped: false, total: all.length };
}

/* The footer totals a numeric column and leaves the rest alone —
   there is no honest total for a column of registrations. */
export function columnTotals(result) {
  return result.cols.map((c, i) => {
    if (!isNum(c.t) || c.t === 'pct' || c.t === 'days') return null;
    const vals = result.rows.map((r) => +r[i]).filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    return { t: c.t, v: vals.reduce((a, x) => a + x, 0) };
  });
}

/* A saved query needs a one-line description of itself for the
   card, and writing it out is also how a person checks the query
   says what they meant. */
export function describe(q) {
  const src = sourceById(q.source);
  const bits = [src.name.toLowerCase()];
  if (q.filters.length) {
    const join = q.match === 'any' ? ' or ' : ' and ';
    bits.push('where ' + q.filters.map((x) => {
      const field = fieldOf(src, x.f);
      const op = OPS[x.op];
      if (!field || !op) return '';
      return `${field.l.toLowerCase()} ${op.l}${op.v === 0 ? '' : ` ${x.v}`}${op.v === 2 ? ` and ${x.v2}` : ''}`;
    }).filter(Boolean).join(join));
  }
  if (q.group) bits.push(`grouped by ${fieldOf(src, q.group)?.l.toLowerCase()}`);
  const sf = fieldOf(src, q.sort.f);
  if (sf && !q.group) bits.push(`by ${sf.l.toLowerCase()}${q.sort.dir === 'desc' ? ', highest first' : ''}`);
  if (q.limit > 0) bits.push(`top ${q.limit}`);
  const s = bits.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

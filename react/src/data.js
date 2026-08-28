import { SERIES, SEQ, OUTCOME } from './theme.js';

export const COMPANIES = [
  { name: 'Acme Mining Corp', init: 'AM', industry: 'Mining', users: 18, vehicles: 24, compliance: 98.2, plan: 'Pro', status: 'Active', date: '12 Mar 2024' },
  { name: 'Grootegeluk Coal', init: 'GC', industry: 'Mining', users: 34, vehicles: 48, compliance: 96.7, plan: 'Enterprise', status: 'Active', date: '5 Jan 2024' },
  { name: 'Zimele Logistics', init: 'ZL', industry: 'Logistics', users: 12, vehicles: 18, compliance: 88.4, plan: 'Starter', status: 'Active', date: '2 Jun 2024' },
  { name: 'BHP Construction', init: 'BC', industry: 'Construction', users: 28, vehicles: 32, compliance: 92.1, plan: 'Pro', status: 'Active', date: '19 Feb 2024' },
  { name: 'Khumalo Agri', init: 'KA', industry: 'Agriculture', users: 8, vehicles: 11, compliance: 84.3, plan: 'Starter', status: 'Trial', date: '10 Jun 2026' },
  { name: 'Matome Transport', init: 'MT', industry: 'Logistics', users: 22, vehicles: 29, compliance: 94.8, plan: 'Pro', status: 'Active', date: '30 Nov 2023' },
];

export const USERS = [
  { name: 'Johan Swart', init: 'JS', role: 'Operator', co: 'Acme Mining Corp', reports: 'P. Dlamini', vehicle: 'CA 123 GP', cof: '14 Dec 2026', insps: 47, status: 'Active', tone: 'gold' },
  { name: 'Priya Dlamini', init: 'PD', role: 'Supervisor', co: 'Acme Mining Corp', reports: 'T. Nkosi', vehicle: 'JHB 456 GP', cof: '30 Jun 2026', insps: 0, status: 'Active', tone: 'blue' },
  { name: 'Thabo Nkosi', init: 'TN', role: 'Safety officer', co: 'Acme Mining Corp', reports: 'K. van der Merwe', vehicle: 'GP 789 DBN', cof: '01 Mar 2027', insps: 0, status: 'Active', tone: 'green' },
  { name: 'Kobus van der Merwe', init: 'KM', role: 'Administrator', co: 'Acme Mining Corp', reports: '—', vehicle: '—', cof: 'N/A', insps: 0, status: 'Active', tone: 'purple' },
  { name: 'Lindiwe Mokoena', init: 'LM', role: 'Operator', co: 'Acme Mining Corp', reports: 'P. Dlamini', vehicle: 'WC 321 CT', cof: '22 Sep 2026', insps: 31, status: 'Active', tone: 'gold' },
  { name: 'B. Pietersen', init: 'BP', role: 'Operator', co: 'Grootegeluk Coal', reports: 'V. Molefe', vehicle: '—', cof: '14 Aug 2026', insps: 58, status: 'Active', tone: 'gold' },
  { name: 'V. Molefe', init: 'VM', role: 'Supervisor', co: 'Grootegeluk Coal', reports: 'S. Mahlangu', vehicle: 'DBN 001 NP', cof: 'N/A', insps: 0, status: 'Active', tone: 'blue' },
  { name: 'M. Dube', init: 'MD', role: 'Operator', co: 'Zimele Logistics', reports: 'C. Langa', vehicle: 'GP 112 ZL', cof: '05 Nov 2026', insps: 22, status: 'Active', tone: 'gold' },
];

export const FLEET = [
  { plate: 'CA 123 GP', make: 'Toyota Hilux', year: 2022, co: 'Acme Mining Corp', driver: 'J. Swart', sup: 'P. Dlamini', lastInsp: 'Today 06:15', km: 69698, status: 'Assigned' },
  { plate: 'JHB 456 GP', make: 'Ford Ranger', year: 2023, co: 'Acme Mining Corp', driver: 'L. Mokoena', sup: 'P. Dlamini', lastInsp: 'Today 07:00', km: 41230, status: 'Assigned' },
  { plate: 'GP 789 DBN', make: 'Isuzu D-Max', year: 2021, co: 'Acme Mining Corp', driver: '—', sup: '—', lastInsp: '17 Jun', km: 88102, status: 'Available' },
  { plate: 'WC 321 CT', make: 'Nissan Navara', year: 2022, co: 'Acme Mining Corp', driver: '—', sup: '—', lastInsp: '17 Jun (No-go)', km: 54772, status: 'Maintenance' },
  { plate: 'DBN 001 NP', make: 'Toyota Land Cruiser', year: 2020, co: 'Grootegeluk Coal', driver: 'B. Pietersen', sup: 'V. Molefe', lastInsp: 'Today 05:50', km: 124300, status: 'Assigned' },
  { plate: 'GP 112 ZL', make: 'Toyota Hilux', year: 2023, co: 'Zimele Logistics', driver: 'M. Dube', sup: 'C. Langa', lastInsp: '17 Jun', km: 18900, status: 'Assigned' },
];

export const INSPECTIONS = [
  { ref: '2120352', date: 'Today 06:15', vehicle: 'CA 123 GP', op: 'J. Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 20, go: 3, ng: 0, result: 'go-but', signed: true },
  { ref: '2120351', date: 'Today 05:50', vehicle: 'DBN 001 NP', op: 'B. Pietersen', co: 'Grootegeluk Coal', shift: 'Day B', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120350', date: 'Today 07:00', vehicle: 'JHB 456 GP', op: 'L. Mokoena', co: 'Acme Mining Corp', shift: 'Day A', ok: 22, go: 1, ng: 0, result: 'go-but', signed: false },
  { ref: '2120349', date: 'Yesterday 13:55', vehicle: 'CA 123 GP', op: 'J. Swart', co: 'Acme Mining Corp', shift: 'Aft A', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120348', date: 'Yesterday 06:08', vehicle: 'CA 123 GP', op: 'J. Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120347', date: 'Yesterday 05:50', vehicle: 'DBN 001 NP', op: 'B. Pietersen', co: 'Grootegeluk Coal', shift: 'Day B', ok: 21, go: 2, ng: 0, result: 'go-but', signed: false },
  { ref: '2120345', date: 'Yesterday 21:30', vehicle: 'WC 321 CT', op: 'L. Mokoena', co: 'Acme Mining Corp', shift: 'Night B', ok: 20, go: 0, ng: 1, result: 'no-go', signed: false },
  { ref: '2120340', date: '16 Jun 06:22', vehicle: 'CA 123 GP', op: 'J. Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 21, go: 2, ng: 0, result: 'go-but', signed: true },
];

export const AUDIT = [
  { type: 'assign', text: '**T. Nkosi** (Safety officer) assigned **CA 123 GP** to operator **J. Swart** under supervisor P. Dlamini', meta: 'Acme Mining Corp · Performed by Thabo Nkosi', time: '09:14' },
  { type: 'user', text: '**Admin** added **L. Mokoena** as operator — invitation sent with auto-generated credentials', meta: 'Acme Mining Corp · Performed by K. van der Merwe', time: '08:55' },
  { type: 'insp', text: '**J. Swart** submitted inspection **#2120352** for CA 123 GP — Go-but (W×3)', meta: 'Acme Mining Corp · Pre-use inspection', time: '06:15' },
  { type: 'unassign', text: '**T. Nkosi** unassigned **WC 321 CT** from operator B. Pietersen — reason: scheduled maintenance', meta: 'Acme Mining Corp · Performed by Thabo Nkosi', time: 'Yesterday 16:40' },
  { type: 'warn', text: '**System** grounded vehicle **WC 321 CT** — no-go defect detected on inspection #2120345', meta: 'Acme Mining Corp · Automatic action', time: 'Yesterday 21:31' },
  { type: 'assign', text: '**T. Nkosi** assigned **JHB 456 GP** to operator **L. Mokoena** under supervisor P. Dlamini', meta: 'Acme Mining Corp · Performed by Thabo Nkosi', time: 'Yesterday 14:22' },
  { type: 'user', text: '**Admin** assigned supervisor **P. Dlamini** under safety officer **T. Nkosi**', meta: 'Acme Mining Corp · Hierarchy change', time: '2 days ago' },
  { type: 'insp', text: '**B. Pietersen** submitted inspection **#2120347** for DBN 001 NP — Go-but (W×2)', meta: 'Grootegeluk Coal · Pre-use inspection', time: 'Yesterday 05:51' },
];

export const NAV_COMPANIES = [
  { key: 'ALL', name: 'All companies', n: 12 },
  { key: 'AM', name: 'Acme Mining Corp', n: 18 },
  { key: 'GC', name: 'Grootegeluk Coal', n: 34 },
  { key: 'ZL', name: 'Zimele Logistics', n: 12 },
  { key: 'BC', name: 'BHP Construction', n: 28 },
  { key: 'KA', name: 'Khumalo Agri', n: 8 },
];

/* ── dashboard series ─────────────────────────────────────────── */
export const MONTHLY = [
  { m: 'Jul', y: 25, total: 742, ok: 631, go: 96, ng: 15 },
  { m: 'Aug', y: 25, total: 768, ok: 655, go: 98, ng: 15 },
  { m: 'Sep', y: 25, total: 803, ok: 690, go: 99, ng: 14 },
  { m: 'Oct', y: 25, total: 795, ok: 679, go: 100, ng: 16 },
  { m: 'Nov', y: 25, total: 826, ok: 712, go: 99, ng: 15 },
  { m: 'Dec', y: 25, total: 690, ok: 592, go: 84, ng: 14 },
  { m: 'Jan', y: 26, total: 820, ok: 703, go: 100, ng: 17 },
  { m: 'Feb', y: 26, total: 910, ok: 786, go: 108, ng: 16 },
  { m: 'Mar', y: 26, total: 870, ok: 748, go: 105, ng: 17 },
  { m: 'Apr', y: 26, total: 1050, ok: 906, go: 125, ng: 19 },
  { m: 'May', y: 26, total: 980, ok: 843, go: 119, ng: 18 },
  { m: 'Jun', y: 26, total: 1247, ok: 1054, go: 168, ng: 25 },
];

export const FLEET_MIX = [
  { k: 'Assigned', v: 134, c: OUTCOME.ok },
  { k: 'Available', v: 43, c: OUTCOME.go },
  { k: 'Maintenance', v: 7, c: OUTCOME.ng },
];

export const ISO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const ISO_DATA = [
  { co: 'Acme Mining', c: SERIES[0], v: [118, 132, 126, 149, 141, 178] },
  { co: 'Grootegeluk', c: SERIES[1], v: [204, 226, 217, 258, 241, 306] },
  { co: 'Matome Trans.', c: SERIES[2], v: [96, 108, 101, 122, 114, 148] },
  { co: 'BHP Const.', c: SERIES[3], v: [131, 146, 139, 167, 156, 199] },
];

export const AGING = [
  { b: '0–7 days', v: 31, c: SEQ[1] },
  { b: '8–14 days', v: 22, c: SEQ[2] },
  { b: '15–21 days', v: 18, c: SEQ[3] },
  { b: '22–30 days', v: 12, c: SEQ[4] },
  { b: 'over 30 days', v: 4, c: '#C33B3B', breach: true },
];

export const AGING_TOP = [
  { item: 'Air conditioner', veh: 'DBN 001 NP', co: 'Grootegeluk Coal', d: 34 },
  { item: 'Reflective tape', veh: 'GP 112 ZL', co: 'Zimele Logistics', d: 32 },
  { item: 'Windows and wipers', veh: 'CA 123 GP', co: 'Acme Mining Corp', d: 28 },
  { item: 'Window washer', veh: 'WC 321 CT', co: 'Acme Mining Corp', d: 26 },
];

export const PERF = [
  { co: 'Grootegeluk Coal', plan: 'Enterprise', users: 34, vehicles: 48, insp: 306, pass: 96.7, ng: 1, trend: [92.4, 93.8, 94.6, 95.2, 96.1, 96.7] },
  { co: 'Acme Mining Corp', plan: 'Pro', users: 18, vehicles: 24, insp: 178, pass: 98.2, ng: 0, trend: [95.1, 95.8, 96.4, 96.9, 97.4, 98.2] },
  { co: 'Matome Transport', plan: 'Pro', users: 22, vehicles: 29, insp: 148, pass: 94.8, ng: 1, trend: [93.9, 94.2, 94.0, 94.4, 94.6, 94.8] },
  { co: 'BHP Construction', plan: 'Pro', users: 28, vehicles: 32, insp: 199, pass: 92.1, ng: 2, trend: [94.8, 94.1, 93.6, 92.9, 92.4, 92.1] },
  { co: 'Zimele Logistics', plan: 'Starter', users: 12, vehicles: 18, insp: 116, pass: 88.4, ng: 2, trend: [91.2, 90.4, 89.8, 89.1, 88.6, 88.4] },
  { co: 'Khumalo Agri', plan: 'Starter', users: 8, vehicles: 11, insp: 74, pass: 84.3, ng: 1, trend: [86.9, 86.1, 85.4, 85.0, 84.6, 84.3] },
];

export const KPIS = [
  { key: 'insp', icon: 'clipboard', lbl: 'Inspections captured', val: '1 247', unit: 'this month', delta: '+27.2%', dir: 'up', note: 'vs 980 in May', series: MONTHLY.slice(6).map((m) => m.total), tone: SERIES[0] },
  { key: 'pass', icon: 'check', lbl: 'Pass rate', val: '98.2', unit: '%', delta: '+1.3 pp', dir: 'up', note: 'target 95%', series: [96.4, 96.9, 96.6, 97.3, 96.9, 98.2], tone: SERIES[1] },
  { key: 'avail', icon: 'truck', lbl: 'Fleet availability', val: '96.2', unit: '%', delta: '−0.8 pp', dir: 'dn', note: '7 of 184 in maintenance', series: [97.8, 97.3, 97.6, 97.0, 97.0, 96.2], tone: SERIES[2] },
  { key: 'nogo', icon: 'alert', lbl: 'Open no-go defects', val: '7', unit: 'vehicles grounded', delta: '+2', dir: 'warn', note: 'oldest open 4 days', series: [4, 5, 5, 6, 5, 7], tone: SERIES[4] },
];

export const ATTENTION = [
  { icon: 'alert', tone: 'red', n: 'WC 321 CT — grounded', s: 'No-go defect on #2120345 · Acme Mining Corp', r: '4 days' },
  { icon: 'cert', tone: 'red', n: 'P. Dlamini — COF expires', s: 'Supervisor · Acme Mining Corp', r: '6 days' },
  { icon: 'tool', tone: 'gold', n: 'DBN 001 NP — service overdue', s: '124 300 km · Grootegeluk Coal', r: '2 200 km' },
  { icon: 'clock', tone: 'gold', n: 'Air conditioner — go-but aging', s: 'DBN 001 NP · B. Pietersen', r: '28 of 30 days' },
  { icon: 'user', tone: 'gold', n: '3 operators without a supervisor', s: 'Acme Mining Corp', r: 'unassigned' },
];

export const HIERARCHY = [
  { name: 'Kobus van der Merwe', role: 'Administrator', sub: 'Fleet Manager', init: 'KM', tone: 'purple', indent: 0 },
  { name: 'Thabo Nkosi', role: 'Safety officer', sub: 'Safety officer', init: 'TN', tone: 'green', indent: 1 },
  { name: 'Priya Dlamini', role: 'Supervisor', sub: 'Supervisor · JHB 456 GP', init: 'PD', tone: 'blue', indent: 2 },
  { name: 'Johan Swart', role: 'Operator', sub: 'Operator · CA 123 GP', init: 'JS', tone: 'gold', indent: 3 },
  { name: 'Lindiwe Mokoena', role: 'Operator', sub: 'Operator · WC 321 CT', init: 'LM', tone: 'gold', indent: 3 },
  { name: 'A. Williams', role: 'Supervisor', sub: 'Supervisor', init: 'AW', tone: 'blue', indent: 2 },
  { name: 'M. Sithole', role: 'Operator', sub: 'Operator · GP 789 DBN', init: 'MS', tone: 'gold', indent: 3 },
];

export const COF = [
  { name: 'P. Dlamini', co: 'Acme Mining Corp', exp: '30 Jun 2026', days: 6 },
  { name: 'J. Govender', co: 'BHP Construction', exp: '30 Jul 2026', days: 36 },
  { name: 'B. Pietersen', co: 'Grootegeluk Coal', exp: '14 Aug 2026', days: 51 },
  { name: 'L. Mokoena', co: 'Acme Mining Corp', exp: '22 Sep 2026', days: 90 },
];

export const MODULES = [
  { icon: 'truck', name: 'Fleet management', desc: 'Vehicle assignment and tracking', on: true },
  { icon: 'clipboard', name: 'Pre-use inspections', desc: 'Digital inspection forms', on: true },
  { icon: 'shield', name: 'Safety compliance', desc: 'COF tracking and compliance', on: true },
  { icon: 'users', name: 'HR management', desc: 'Employee records', on: false },
  { icon: 'tool', name: 'Maintenance', desc: 'Service scheduling', on: false },
  { icon: 'chart', name: 'Analytics', desc: 'Reports and dashboards', on: false },
  { icon: 'pin', name: 'GPS tracking', desc: 'Real-time vehicle location', on: false },
  { icon: 'invoice', name: 'Fuel management', desc: 'Fuel consumption tracking', on: false },
];

export const CATEGORIES = [
  { k: 'Windows and wipers', v: 34 }, { k: 'Reflective tape', v: 21 },
  { k: 'Lights and indicators', v: 17 }, { k: 'Tyres and tread', v: 13 },
  { k: 'Air conditioner', v: 9 }, { k: 'Other', v: 6 },
];

export const REPORTS = [
  { icon: 'clipboard', tone: 'blue', name: 'Inspection report', desc: 'Full inspection history with a pass and fail breakdown' },
  { icon: 'shield', tone: 'green', name: 'Compliance report', desc: 'Company-wide compliance rate per vehicle and operator' },
  { icon: 'truck', tone: 'gold', name: 'Fleet status report', desc: 'Vehicle assignment, odometer and maintenance state' },
  { icon: 'users', tone: 'purple', name: 'User activity report', desc: 'Login history and inspection counts per operator' },
  { icon: 'alert', tone: 'red', name: 'Defect history', desc: 'Every no-go defect, grounding and resolution' },
  { icon: 'cert', tone: 'teal', name: 'COF expiry report', desc: 'Certificate of fitness expiry per operator' },
];

export const RECENT_REPORTS = [
  { name: 'Inspection report', scope: 'Acme Mining Corp · June 2026', by: 'K. van der Merwe', at: 'Today 08:02', fmt: 'PDF' },
  { name: 'COF expiry report', scope: 'All companies · 90-day window', by: 'T. Nkosi', at: 'Today 07:41', fmt: 'PDF' },
  { name: 'Fleet status report', scope: 'Grootegeluk Coal · June 2026', by: 'V. Molefe', at: 'Yesterday 16:20', fmt: 'CSV' },
  { name: 'Defect history', scope: 'All companies · Q2 2026', by: 'K. van der Merwe', at: '16 Jun 11:05', fmt: 'PDF' },
];

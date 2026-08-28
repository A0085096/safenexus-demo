import { SERIES, SEQ, OUTCOME } from './theme.js';

/* The demo carries a sample of a bigger platform; these are the records
   the sample stands in for, so every count derives from one baseline. */
export const BASE = { companies: 6, users: 240, vehicles: 178, inspections: 1239 };
export const FLEET_BASE = { Assigned: 128, Available: 44, Maintenance: 6 };

export const COMPANIES = [
  { name: 'Acme Mining Corp', init: 'AM', industry: 'Mining', users: 18, vehicles: 24, compliance: 98.2, plan: 'Pro', status: 'Active', date: '12 Mar 2024' },
  { name: 'Grootegeluk Coal', init: 'GC', industry: 'Mining', users: 34, vehicles: 48, compliance: 96.7, plan: 'Enterprise', status: 'Active', date: '5 Jan 2024' },
  { name: 'Zimele Logistics', init: 'ZL', industry: 'Logistics', users: 12, vehicles: 18, compliance: 88.4, plan: 'Starter', status: 'Active', date: '2 Jun 2024' },
  { name: 'BHP Construction', init: 'BC', industry: 'Construction', users: 28, vehicles: 32, compliance: 92.1, plan: 'Pro', status: 'Active', date: '19 Feb 2024' },
  { name: 'Khumalo Agri', init: 'KA', industry: 'Agriculture', users: 8, vehicles: 11, compliance: 84.3, plan: 'Starter', status: 'Trial', date: '10 Jun 2026' },
  { name: 'Matome Transport', init: 'MT', industry: 'Logistics', users: 22, vehicles: 29, compliance: 94.8, plan: 'Pro', status: 'Active', date: '30 Nov 2023' },
];

export const USERS = [
  { name: 'Johan Swart', init: 'JS', role: 'Operator', co: 'Acme Mining Corp', reports: 'Priya Dlamini', vehicle: 'CA 123 GP', cof: '14 Dec 2026', insps: 47, status: 'Active', tone: 'gold',
    empNo: 'AM-1042', email: 'johan.swart@acmecorp.co.za', phone: '+27 82 441 0093', site: 'Lephalale open pit',
    started: '03 Feb 2022', licence: 'Code EC · 14 Dec 2026', lastActive: 'Today 06:15', passRate: 97.9, defects: 6 },
  { name: 'Priya Dlamini', init: 'PD', role: 'Supervisor', co: 'Acme Mining Corp', reports: 'Thabo Nkosi', vehicle: 'JHB 456 GP', cof: '30 Jun 2026', insps: 0, status: 'Active', tone: 'blue',
    empNo: 'AM-0881', email: 'priya.dlamini@acmecorp.co.za', phone: '+27 73 118 2204', site: 'Lephalale open pit',
    started: '17 Aug 2020', licence: 'Code EB · 30 Jun 2026', lastActive: 'Today 07:42', passRate: null, defects: 0 },
  { name: 'Thabo Nkosi', init: 'TN', role: 'Safety officer', co: 'Acme Mining Corp', reports: 'Kobus van der Merwe', vehicle: 'GP 789 DBN', cof: '01 Mar 2027', insps: 0, status: 'Active', tone: 'green',
    empNo: 'AM-0344', email: 'thabo.nkosi@acmecorp.co.za', phone: '+27 84 220 7741', site: 'Group — all sites',
    started: '02 Mar 2019', licence: 'Code EB · 01 Mar 2027', lastActive: 'Today 09:14', passRate: null, defects: 0 },
  { name: 'Kobus van der Merwe', init: 'KM', role: 'Administrator', co: 'Acme Mining Corp', reports: '—', vehicle: '—', cof: 'N/A', insps: 0, status: 'Active', tone: 'purple',
    empNo: 'AM-0002', email: 'admin@acmecorp.co.za', phone: '+27 14 763 0100', site: 'Head office, Lephalale',
    started: '15 Feb 2016', licence: 'Code EB · 09 Sep 2028', lastActive: 'Now', passRate: null, defects: 0 },
  { name: 'Lindiwe Mokoena', init: 'LM', role: 'Operator', co: 'Acme Mining Corp', reports: 'Priya Dlamini', vehicle: 'WC 321 CT', cof: '22 Sep 2026', insps: 31, status: 'Active', tone: 'gold',
    empNo: 'AM-1177', email: 'lindiwe.mokoena@acmecorp.co.za', phone: '+27 79 604 3312', site: 'Lephalale open pit',
    started: '11 Jan 2024', licence: 'Code C1 · 22 Sep 2026', lastActive: 'Today 07:00', passRate: 96.8, defects: 4 },
  { name: 'Bennie Pietersen', init: 'BP', role: 'Operator', co: 'Grootegeluk Coal', reports: 'Vusi Molefe', vehicle: '—', cof: '14 Aug 2026', insps: 58, status: 'Active', tone: 'gold',
    empNo: 'GC-2210', email: 'b.pietersen@grootegeluk.co.za', phone: '+27 82 990 1155', site: 'Grootegeluk north',
    started: '05 May 2021', licence: 'Code EC · 14 Aug 2026', lastActive: 'Today 05:50', passRate: 98.3, defects: 3 },
  { name: 'Vusi Molefe', init: 'VM', role: 'Supervisor', co: 'Grootegeluk Coal', reports: 'Sipho Mahlangu', vehicle: 'DBN 001 NP', cof: 'N/A', insps: 0, status: 'Active', tone: 'blue',
    empNo: 'GC-1004', email: 'v.molefe@grootegeluk.co.za', phone: '+27 71 442 8890', site: 'Grootegeluk north',
    started: '23 Jun 2018', licence: 'Code EC · 30 Apr 2027', lastActive: 'Yesterday 16:40', passRate: null, defects: 0 },
  { name: 'Mandla Dube', init: 'MD', role: 'Operator', co: 'Zimele Logistics', reports: 'Cebo Langa', vehicle: 'GP 112 ZL', cof: '05 Nov 2026', insps: 22, status: 'Active', tone: 'gold',
    empNo: 'ZL-0431', email: 'm.dube@zimele.co.za', phone: '+27 60 337 4419', site: 'Zimele depot, Polokwane',
    started: '19 Sep 2023', licence: 'Code C1 · 05 Nov 2026', lastActive: 'Yesterday 17:20', passRate: 94.1, defects: 5 },
];

/* ── learning: courses and the records against each person ─────── */
export const COURSES = [
  { id: 'C-01', name: 'Pre-use inspection competency', cat: 'Safety critical', hours: 4, validity: 24, roles: ['Operator', 'Supervisor'], required: true },
  { id: 'C-02', name: 'Surface mobile machinery induction', cat: 'Induction', hours: 8, validity: 12, roles: ['Operator', 'Supervisor', 'Safety officer'], required: true },
  { id: 'C-03', name: 'Defect reporting and go-but concessions', cat: 'Safety critical', hours: 3, validity: 24, roles: ['Supervisor', 'Safety officer'], required: true },
  { id: 'C-04', name: 'Red permit area awareness', cat: 'Site specific', hours: 2, validity: 12, roles: ['Operator'], required: true },
  { id: 'C-05', name: 'Defensive driving — heavy vehicle', cat: 'Driving', hours: 16, validity: 36, roles: ['Operator'], required: false },
  { id: 'C-06', name: 'Fatigue management', cat: 'Wellbeing', hours: 2, validity: 12, roles: ['Operator', 'Supervisor'], required: false },
  { id: 'C-07', name: 'Incident investigation', cat: 'Safety critical', hours: 12, validity: 36, roles: ['Safety officer', 'Administrator'], required: false },
  { id: 'C-08', name: 'SafeNexus administrator training', cat: 'Platform', hours: 3, validity: 0, roles: ['Administrator'], required: false },
];

export const ENROLMENTS = [
  { user: 'Johan Swart', course: 'C-01', status: 'Valid', done: '12 Mar 2025', expires: '12 Mar 2027', score: 92 },
  { user: 'Johan Swart', course: 'C-02', status: 'Expiring', done: '02 Aug 2025', expires: '02 Aug 2026', score: 88 },
  { user: 'Johan Swart', course: 'C-04', status: 'Valid', done: '19 Jan 2026', expires: '19 Jan 2027', score: 95 },
  { user: 'Johan Swart', course: 'C-05', status: 'In progress', done: null, expires: null, score: null, progress: 62 },
  { user: 'Lindiwe Mokoena', course: 'C-01', status: 'Valid', done: '04 Feb 2026', expires: '04 Feb 2028', score: 90 },
  { user: 'Lindiwe Mokoena', course: 'C-02', status: 'Valid', done: '11 Jan 2026', expires: '11 Jan 2027', score: 84 },
  { user: 'Lindiwe Mokoena', course: 'C-04', status: 'Expired', done: '06 Jun 2024', expires: '06 Jun 2025', score: 79 },
  { user: 'Bennie Pietersen', course: 'C-01', status: 'Valid', done: '22 Sep 2025', expires: '22 Sep 2027', score: 96 },
  { user: 'Bennie Pietersen', course: 'C-02', status: 'Valid', done: '15 Mar 2026', expires: '15 Mar 2027', score: 91 },
  { user: 'Bennie Pietersen', course: 'C-06', status: 'In progress', done: null, expires: null, score: null, progress: 25 },
  { user: 'Mandla Dube', course: 'C-01', status: 'Expiring', done: '30 Jul 2024', expires: '30 Jul 2026', score: 81 },
  { user: 'Mandla Dube', course: 'C-02', status: 'Valid', done: '19 Sep 2025', expires: '19 Sep 2026', score: 87 },
  { user: 'Priya Dlamini', course: 'C-01', status: 'Valid', done: '08 Nov 2025', expires: '08 Nov 2027', score: 94 },
  { user: 'Priya Dlamini', course: 'C-03', status: 'Valid', done: '14 Apr 2026', expires: '14 Apr 2028', score: 89 },
  { user: 'Thabo Nkosi', course: 'C-03', status: 'Valid', done: '02 Feb 2026', expires: '02 Feb 2028', score: 97 },
  { user: 'Thabo Nkosi', course: 'C-07', status: 'Valid', done: '18 Jun 2025', expires: '18 Jun 2028', score: 93 },
  { user: 'Kobus van der Merwe', course: 'C-08', status: 'Valid', done: '20 May 2026', expires: null, score: 100 },
];

export const FLEET = [
  { plate: 'CA 123 GP', fleetNo: 'AM-014', type: 'LDV bakkie', make: 'Toyota Hilux', year: 2022, co: 'Acme Mining Corp', driver: 'Johan Swart', sup: 'Priya Dlamini', lastInsp: 'Today 06:15', km: 69698, status: 'Assigned', cof: '30 Nov 2026', serviceDue: 75000, permit: 'Red permit area' },
  { plate: 'JHB 456 GP', fleetNo: 'AM-021', type: 'LDV bakkie', make: 'Ford Ranger', year: 2023, co: 'Acme Mining Corp', driver: 'Lindiwe Mokoena', sup: 'Priya Dlamini', lastInsp: 'Today 07:00', km: 41230, status: 'Assigned', cof: '14 Feb 2027', serviceDue: 45000, permit: '' },
  { plate: 'GP 789 DBN', fleetNo: 'AM-008', type: 'LDV bakkie', make: 'Isuzu D-Max', year: 2021, co: 'Acme Mining Corp', driver: '—', sup: '—', lastInsp: '17 Jun', km: 88102, status: 'Available', cof: '02 Sep 2026', serviceDue: 90000, permit: '' },
  { plate: 'WC 321 CT', fleetNo: 'AM-003', type: 'Crew bus', make: 'Nissan Navara', year: 2022, co: 'Acme Mining Corp', driver: '—', sup: '—', lastInsp: '17 Jun (No-go)', km: 54772, status: 'Maintenance', cof: '19 Jan 2027', serviceDue: 60000, permit: '' },
  { plate: 'DBN 001 NP', fleetNo: 'GC-002', type: 'Haul truck', make: 'Toyota Land Cruiser', year: 2020, co: 'Grootegeluk Coal', driver: 'Bennie Pietersen', sup: 'Vusi Molefe', lastInsp: 'Today 05:50', km: 124300, status: 'Assigned', cof: '08 Aug 2026', serviceDue: 126000, permit: 'Red permit area' },
  { plate: 'GP 112 ZL', fleetNo: 'ZL-011', type: 'LDV bakkie', make: 'Toyota Hilux', year: 2023, co: 'Zimele Logistics', driver: 'Mandla Dube', sup: 'Cebo Langa', lastInsp: '17 Jun', km: 18900, status: 'Assigned', cof: '21 Mar 2027', serviceDue: 25000, permit: '' },
];

export const INSPECTIONS = [
  { ref: '2120352', date: 'Today 06:15', vehicle: 'CA 123 GP', op: 'Johan Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 20, go: 3, ng: 0, result: 'go-but', signed: true },
  { ref: '2120351', date: 'Today 05:50', vehicle: 'DBN 001 NP', op: 'Bennie Pietersen', co: 'Grootegeluk Coal', shift: 'Day B', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120350', date: 'Today 07:00', vehicle: 'JHB 456 GP', op: 'Lindiwe Mokoena', co: 'Acme Mining Corp', shift: 'Day A', ok: 22, go: 1, ng: 0, result: 'go-but', signed: false },
  { ref: '2120349', date: 'Yesterday 13:55', vehicle: 'CA 123 GP', op: 'Johan Swart', co: 'Acme Mining Corp', shift: 'Aft A', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120348', date: 'Yesterday 06:08', vehicle: 'CA 123 GP', op: 'Johan Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true },
  { ref: '2120347', date: 'Yesterday 05:50', vehicle: 'DBN 001 NP', op: 'Bennie Pietersen', co: 'Grootegeluk Coal', shift: 'Day B', ok: 21, go: 2, ng: 0, result: 'go-but', signed: false },
  { ref: '2120345', date: 'Yesterday 21:30', vehicle: 'WC 321 CT', op: 'Lindiwe Mokoena', co: 'Acme Mining Corp', shift: 'Night B', ok: 20, go: 0, ng: 1, result: 'no-go', signed: false },
  { ref: '2120340', date: '16 Jun 06:22', vehicle: 'CA 123 GP', op: 'Johan Swart', co: 'Acme Mining Corp', shift: 'Day A', ok: 21, go: 2, ng: 0, result: 'go-but', signed: true },
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
  { m: 'Jun', y: 26, total: 1247, ok: 1057, go: 168, ng: 22 },
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

/* A vehicle passes unless it is grounded, so go-but counts as a pass.
   Everything that quotes a pass rate derives it from here. */
export const passRate = (d) => (d.ok + d.go) / d.total * 100;
const PASS_SERIES = MONTHLY.slice(6).map(passRate);
const PASS_NOW = PASS_SERIES[PASS_SERIES.length - 1];
const PASS_PREV = PASS_SERIES[PASS_SERIES.length - 2];
const PASS_DELTA = (PASS_NOW >= PASS_PREV ? '+' : '−') + Math.abs(PASS_NOW - PASS_PREV).toFixed(1) + ' pp';

export const KPIS = [
  { key: 'insp', icon: 'clipboard', lbl: 'Inspections captured', val: '1 247', unit: 'this month', delta: '+27.2%', dir: 'up', note: 'vs 980 in May', series: MONTHLY.slice(6).map((m) => m.total), tone: SERIES[0] },
  { key: 'pass', icon: 'check', lbl: 'Pass rate', val: PASS_NOW.toFixed(1), unit: '%', delta: PASS_DELTA, dir: PASS_DELTA[0] === '+' ? 'up' : 'dn', note: 'not grounded · target 95%', series: PASS_SERIES, tone: SERIES[1] },
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
  { name: 'Anton Williams', role: 'Supervisor', sub: 'Supervisor', init: 'AW', tone: 'blue', indent: 2 },
  { name: 'Musa Sithole', role: 'Operator', sub: 'Operator · GP 789 DBN', init: 'MS', tone: 'gold', indent: 3 },
];

export const COF = [
  { name: 'Priya Dlamini', co: 'Acme Mining Corp', exp: '30 Jun 2026', days: 6 },
  { name: 'Jay Govender', co: 'BHP Construction', exp: '30 Jul 2026', days: 36 },
  { name: 'Bennie Pietersen', co: 'Grootegeluk Coal', exp: '14 Aug 2026', days: 51 },
  { name: 'Lindiwe Mokoena', co: 'Acme Mining Corp', exp: '22 Sep 2026', days: 90 },
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
  { name: 'Inspection report', scope: 'Acme Mining Corp · June 2026', by: 'Kobus van der Merwe', at: 'Today 08:02', fmt: 'PDF' },
  { name: 'COF expiry report', scope: 'All companies · 90-day window', by: 'Thabo Nkosi', at: 'Today 07:41', fmt: 'PDF' },
  { name: 'Fleet status report', scope: 'Grootegeluk Coal · June 2026', by: 'Vusi Molefe', at: 'Yesterday 16:20', fmt: 'CSV' },
  { name: 'Defect history', scope: 'All companies · Q2 2026', by: 'Kobus van der Merwe', at: '16 Jun 11:05', fmt: 'PDF' },
];

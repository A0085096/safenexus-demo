import { SERIES, SEQ, OUTCOME } from './theme.js';

/* ══════════════════════════════════════════════════════════════
   One tenant's workspace.

   SafeNexus is multi-tenant: a company registers and works its own
   fleet inside its own workspace. Everything below belongs to the
   signed-in company — there is no cross-company view, because no
   tenant may see another tenant's operators, vehicles or defects.
   ══════════════════════════════════════════════════════════════ */

export const TENANT = {
  name: 'Acme Mining Corp',
  trading: 'Acme Corp',
  reg: '2018/123456/07',
  vat: '4890123456',
  industry: 'Mining',
  plan: 'Pro',
  seats: '51–200 employees',
  region: 'Limpopo · Gauteng',
  address: '123 Mine Road, Lephalale, Limpopo, 0555',
  phone: '+27 14 763 0100',
  email: 'info@acmecorp.co.za',
  web: 'www.acmecorp.co.za',
  since: '12 Mar 2024',
  admin: 'Kobus van der Merwe',
};

/* the tenant's own sites — the scope selector works on these */
export const SITES = [
  { key: 'ALL', name: 'All sites', short: 'All' },
  { key: 'PIT', name: 'Lephalale open pit', short: 'Open pit' },
  { key: 'STL', name: 'Steelpoort section', short: 'Steelpoort' },
  { key: 'HO', name: 'Head office and workshop', short: 'Head office' },
];
export const siteName = (k) => (SITES.find((s) => s.key === k) || { name: k }).name;

export const USERS = [
  { name: 'Kobus van der Merwe', init: 'KM', role: 'Administrator', site: 'HO', reports: '—', vehicle: '—', cof: 'N/A', insps: 0, status: 'Active', tone: 'purple',
    empNo: 'AM-0002', email: 'admin@acmecorp.co.za', phone: '+27 14 763 0100', started: '15 Feb 2016',
    licence: 'Code EB · 09 Sep 2028', lastActive: 'Now', passRate: null, defects: 0 },
  { name: 'Thabo Nkosi', init: 'TN', role: 'Safety officer', site: 'HO', reports: 'Kobus van der Merwe', vehicle: 'GP 789 DBN', cof: '01 Mar 2027', insps: 0, status: 'Active', tone: 'green',
    empNo: 'AM-0344', email: 'thabo.nkosi@acmecorp.co.za', phone: '+27 84 220 7741', started: '02 Mar 2019',
    licence: 'Code EB · 01 Mar 2027', lastActive: 'Today 09:14', passRate: null, defects: 0 },
  { name: 'Refilwe Sekhukhune', init: 'RS', role: 'Safety officer', site: 'STL', reports: 'Kobus van der Merwe', vehicle: '—', cof: '18 Apr 2027', insps: 0, status: 'Active', tone: 'green',
    empNo: 'AM-0402', email: 'refilwe.s@acmecorp.co.za', phone: '+27 82 771 3390', started: '14 Jul 2021',
    licence: 'Code EB · 18 Apr 2027', lastActive: 'Today 06:48', passRate: null, defects: 0 },
  { name: 'Priya Dlamini', init: 'PD', role: 'Supervisor', site: 'PIT', reports: 'Thabo Nkosi', vehicle: 'JHB 456 GP', cof: '30 Jun 2026', insps: 0, status: 'Active', tone: 'blue',
    empNo: 'AM-0881', email: 'priya.dlamini@acmecorp.co.za', phone: '+27 73 118 2204', started: '17 Aug 2020',
    licence: 'Code EB · 30 Jun 2026', lastActive: 'Today 07:42', passRate: null, defects: 0 },
  { name: 'Anton Williams', init: 'AW', role: 'Supervisor', site: 'STL', reports: 'Refilwe Sekhukhune', vehicle: '—', cof: '11 Nov 2026', insps: 0, status: 'Active', tone: 'blue',
    empNo: 'AM-0917', email: 'anton.williams@acmecorp.co.za', phone: '+27 83 442 1180', started: '01 Oct 2019',
    licence: 'Code EC · 11 Nov 2026', lastActive: 'Today 05:58', passRate: null, defects: 0 },
  { name: 'Johan Swart', init: 'JS', role: 'Operator', site: 'PIT', reports: 'Priya Dlamini', vehicle: 'CA 123 GP', cof: '14 Dec 2026', insps: 47, status: 'Active', tone: 'gold',
    empNo: 'AM-1042', email: 'johan.swart@acmecorp.co.za', phone: '+27 82 441 0093', started: '03 Feb 2022',
    licence: 'Code EC · 14 Dec 2026', lastActive: 'Today 06:15', passRate: 97.9, defects: 6 },
  { name: 'Lindiwe Mokoena', init: 'LM', role: 'Operator', site: 'PIT', reports: 'Priya Dlamini', vehicle: 'WC 321 CT', cof: '22 Sep 2026', insps: 31, status: 'Active', tone: 'gold',
    empNo: 'AM-1177', email: 'lindiwe.mokoena@acmecorp.co.za', phone: '+27 79 604 3312', started: '11 Jan 2024',
    licence: 'Code C1 · 22 Sep 2026', lastActive: 'Today 07:00', passRate: 96.8, defects: 4 },
  { name: 'Musa Sithole', init: 'MS', role: 'Operator', site: 'PIT', reports: 'Priya Dlamini', vehicle: 'LP 908 MP', cof: '05 Nov 2026', insps: 22, status: 'Active', tone: 'gold',
    empNo: 'AM-1204', email: 'musa.sithole@acmecorp.co.za', phone: '+27 60 337 4419', started: '19 Sep 2023',
    licence: 'Code C1 · 05 Nov 2026', lastActive: 'Yesterday 17:20', passRate: 94.1, defects: 5 },
  { name: 'Bennie Pietersen', init: 'BP', role: 'Operator', site: 'STL', reports: 'Anton Williams', vehicle: 'DBN 001 NP', cof: '14 Aug 2026', insps: 58, status: 'Active', tone: 'gold',
    empNo: 'AM-1310', email: 'bennie.pietersen@acmecorp.co.za', phone: '+27 82 990 1155', started: '05 May 2021',
    licence: 'Code EC · 14 Aug 2026', lastActive: 'Today 05:50', passRate: 98.3, defects: 3 },
  { name: 'Naledi Motaung', init: 'NM', role: 'Operator', site: 'STL', reports: 'Anton Williams', vehicle: '—', cof: '02 Feb 2027', insps: 18, status: 'Active', tone: 'gold',
    empNo: 'AM-1355', email: 'naledi.motaung@acmecorp.co.za', phone: '+27 71 208 4471', started: '08 Mar 2025',
    licence: 'Code C1 · 02 Feb 2027', lastActive: 'Yesterday 14:05', passRate: 95.4, defects: 2 },
  { name: 'Sipho Mahlangu', init: 'SM', role: 'Operator', site: 'HO', reports: 'Thabo Nkosi', vehicle: 'GP 112 ZL', cof: '30 Jul 2026', insps: 26, status: 'Active', tone: 'gold',
    empNo: 'AM-1388', email: 'sipho.mahlangu@acmecorp.co.za', phone: '+27 78 551 9902', started: '22 Jun 2022',
    licence: 'Code EB · 30 Jul 2026', lastActive: 'Today 06:32', passRate: 96.1, defects: 4 },
];

export const FLEET = [
  { plate: 'CA 123 GP', fleetNo: 'AM-014', type: 'LDV bakkie', make: 'Toyota Hilux 2.4GD', year: 2022, site: 'PIT', driver: 'Johan Swart', sup: 'Priya Dlamini', lastInsp: 'Today 06:15', km: 69698, status: 'Assigned', cof: '30 Nov 2026', serviceDue: 75000, permit: 'Red permit area' },
  { plate: 'JHB 456 GP', fleetNo: 'AM-021', type: 'LDV bakkie', make: 'Ford Ranger 2.0SiT', year: 2023, site: 'PIT', driver: 'Priya Dlamini', sup: 'Thabo Nkosi', lastInsp: 'Today 07:00', km: 41230, status: 'Assigned', cof: '14 Feb 2027', serviceDue: 45000, permit: '' },
  { plate: 'GP 789 DBN', fleetNo: 'AM-008', type: 'LDV bakkie', make: 'Isuzu D-Max 250', year: 2021, site: 'HO', driver: 'Thabo Nkosi', sup: 'Kobus van der Merwe', lastInsp: '17 Jun', km: 88102, status: 'Assigned', cof: '02 Sep 2026', serviceDue: 90000, permit: '' },
  { plate: 'WC 321 CT', fleetNo: 'AM-003', type: 'Crew bus', make: 'Toyota Quantum 2.8', year: 2022, site: 'PIT', driver: 'Lindiwe Mokoena', sup: 'Priya Dlamini', lastInsp: '17 Jun (No-go)', km: 54772, status: 'Maintenance', cof: '19 Jan 2027', serviceDue: 60000, permit: '' },
  { plate: 'DBN 001 NP', fleetNo: 'AM-031', type: 'Haul truck', make: 'Volvo FH440', year: 2020, site: 'STL', driver: 'Bennie Pietersen', sup: 'Anton Williams', lastInsp: 'Today 05:50', km: 124300, status: 'Assigned', cof: '08 Aug 2026', serviceDue: 126000, permit: 'Red permit area' },
  { plate: 'GP 112 ZL', fleetNo: 'AM-042', type: 'LDV bakkie', make: 'Toyota Hilux 2.4GD', year: 2023, site: 'HO', driver: 'Sipho Mahlangu', sup: 'Thabo Nkosi', lastInsp: '17 Jun', km: 18900, status: 'Assigned', cof: '21 Mar 2027', serviceDue: 25000, permit: '' },
  { plate: 'LP 908 MP', fleetNo: 'AM-055', type: 'Haul truck', make: 'Scania R460', year: 2021, site: 'PIT', driver: 'Musa Sithole', sup: 'Priya Dlamini', lastInsp: 'Yesterday 17:20', km: 98450, status: 'Assigned', cof: '12 Dec 2026', serviceDue: 100000, permit: 'Red permit area' },
  { plate: 'LP 447 MP', fleetNo: 'AM-061', type: 'Excavator', make: 'Komatsu PC300', year: 2019, site: 'STL', driver: '—', sup: '—', lastInsp: '14 Jun', km: 7440, status: 'Available', cof: '30 Apr 2027', serviceDue: 7500, permit: 'Red permit area' },
  { plate: 'GP 664 MP', fleetNo: 'AM-072', type: 'Front-end loader', make: 'CAT 966H', year: 2020, site: 'PIT', driver: '—', sup: '—', lastInsp: '11 Jun', km: 9120, status: 'Available', cof: '17 Oct 2026', serviceDue: 9500, permit: 'Red permit area' },
  { plate: 'LP 220 MP', fleetNo: 'AM-078', type: 'Crew bus', make: 'Iveco Daily 50C', year: 2024, site: 'STL', driver: 'Naledi Motaung', sup: 'Anton Williams', lastInsp: 'Yesterday 14:05', km: 21870, status: 'Assigned', cof: '09 Jun 2027', serviceDue: 25000, permit: '' },
];

export const INSPECTIONS = [
  { ref: '2120352', date: 'Today 06:15', vehicle: 'CA 123 GP', op: 'Johan Swart', site: 'PIT', shift: 'Day A', ok: 20, go: 3, ng: 0, result: 'go-but', signed: true, signedBy: 'Priya Dlamini' },
  { ref: '2120351', date: 'Today 05:50', vehicle: 'DBN 001 NP', op: 'Bennie Pietersen', site: 'STL', shift: 'Day B', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true, signedBy: 'Anton Williams' },
  { ref: '2120350', date: 'Today 07:00', vehicle: 'JHB 456 GP', op: 'Priya Dlamini', site: 'PIT', shift: 'Day A', ok: 22, go: 1, ng: 0, result: 'go-but', signed: false },
  { ref: '2120349', date: 'Today 06:32', vehicle: 'GP 112 ZL', op: 'Sipho Mahlangu', site: 'HO', shift: 'Day A', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true, signedBy: 'Thabo Nkosi' },
  { ref: '2120348', date: 'Yesterday 17:20', vehicle: 'LP 908 MP', op: 'Musa Sithole', site: 'PIT', shift: 'Aft A', ok: 21, go: 2, ng: 0, result: 'go-but', signed: false },
  { ref: '2120347', date: 'Yesterday 14:05', vehicle: 'LP 220 MP', op: 'Naledi Motaung', site: 'STL', shift: 'Day B', ok: 23, go: 0, ng: 0, result: 'in-order', signed: true, signedBy: 'Anton Williams' },
  { ref: '2120345', date: 'Yesterday 21:30', vehicle: 'WC 321 CT', op: 'Lindiwe Mokoena', site: 'PIT', shift: 'Night B', ok: 20, go: 0, ng: 1, result: 'no-go', signed: false },
  { ref: '2120340', date: '16 Jun 06:22', vehicle: 'CA 123 GP', op: 'Johan Swart', site: 'PIT', shift: 'Day A', ok: 21, go: 2, ng: 0, result: 'go-but', signed: true, signedBy: 'Priya Dlamini' },
];

/* Defects carry a rectify-by date, so a concession can lapse — the
   condition the reference calls out as no better than no inspection. */
export const DEFECTS = [
  { id: 'DEF-26-5041', item: 'Air conditioner', section: 'Body', plate: 'DBN 001 NP', site: 'STL', severity: 'Go But', raised: '15 May 2026', due: '14 Jun 2026', age: 34, status: 'Overdue', inspection: '2120290', raisedBy: 'Bennie Pietersen', supervisorSigned: true, workOrder: 'WO-26-3208', note: 'Operating under a go-but concession.' },
  { id: 'DEF-26-5044', item: 'Reflective tape condition', section: 'If intended for a red permit area', plate: 'LP 908 MP', site: 'PIT', severity: 'Go But', raised: '17 May 2026', due: '16 Jun 2026', age: 32, status: 'Overdue', inspection: '2120281', raisedBy: 'Musa Sithole', supervisorSigned: false, workOrder: null, note: 'Concession running without a supervisor signature.' },
  { id: 'DEF-26-5052', item: 'Windows and windscreen wipers', section: 'Body', plate: 'CA 123 GP', site: 'PIT', severity: 'Go But', raised: '21 May 2026', due: '20 Jun 2026', age: 28, status: 'Open', inspection: '2120302', raisedBy: 'Johan Swart', supervisorSigned: true, workOrder: null, note: 'Rectify at the next service under the windows and seats exception.' },
  { id: 'DEF-26-5060', item: 'Window washer', section: 'Body', plate: 'WC 321 CT', site: 'PIT', severity: 'Go But', raised: '23 May 2026', due: '22 Jun 2026', age: 26, status: 'Open', inspection: '2120311', raisedBy: 'Lindiwe Mokoena', supervisorSigned: true, workOrder: 'WO-26-3215', note: 'Operating under a go-but concession.' },
  { id: 'DEF-26-5088', item: 'Brakes', section: 'Vehicle condition', plate: 'WC 321 CT', site: 'PIT', severity: 'No Go', raised: '17 Jun 2026', due: '17 Jun 2026', age: 1, status: 'Open', inspection: '2120345', raisedBy: 'Lindiwe Mokoena', supervisorSigned: true, workOrder: 'WO-26-3221', note: 'Vehicle grounded until the defect is repaired and signed off.' },
  { id: 'DEF-26-5091', item: 'Lights — indicators', section: 'Vehicle condition', plate: 'LP 908 MP', site: 'PIT', severity: 'Go But', raised: '17 Jun 2026', due: '17 Jul 2026', age: 1, status: 'Open', inspection: '2120348', raisedBy: 'Musa Sithole', supervisorSigned: true, workOrder: null, note: 'Operating under a go-but concession.' },
];

export const WORK_ORDERS = [
  { ref: 'WO-26-3208', vehicle: 'DBN 001 NP', site: 'STL', type: 'Auto electrical', status: 'Awaiting parts', opened: '16 May 2026', defect: 'DEF-26-5041', assigned: 'On-site workshop', note: 'Compressor replacement ordered from Volvo Trucks SA.' },
  { ref: 'WO-26-3215', vehicle: 'WC 321 CT', site: 'PIT', type: 'Repair', status: 'In progress', opened: '24 May 2026', defect: 'DEF-26-5060', assigned: 'On-site workshop', note: 'Washer pump and reservoir.' },
  { ref: 'WO-26-3221', vehicle: 'WC 321 CT', site: 'PIT', type: 'Brake overhaul', status: 'Awaiting authorisation', opened: '18 Jun 2026', defect: 'DEF-26-5088', assigned: 'Toyota Lephalale', note: 'Front pads and discs; vehicle grounded until signed off.' },
  { ref: 'WO-26-3199', vehicle: 'GP 664 MP', site: 'PIT', type: 'Scheduled service A', status: 'Completed', opened: '02 Jun 2026', defect: null, assigned: 'On-site workshop', note: '250-hour service, oils and filters.' },
];

export const AUDIT = [
  { type: 'assign', actor: 'Thabo Nkosi', entity: 'CA 123 GP', channel: 'Web', date: '18 Jun 2026', time: '09:14',
    text: '**Thabo Nkosi** (Safety officer) assigned **CA 123 GP** to operator **Johan Swart** under supervisor Priya Dlamini',
    meta: 'Lephalale open pit · Vehicle assignment' },
  { type: 'user', actor: 'Kobus van der Merwe', entity: 'Lindiwe Mokoena', channel: 'Web', date: '18 Jun 2026', time: '08:55',
    text: '**Kobus van der Merwe** added **Lindiwe Mokoena** as operator — invitation sent with auto-generated credentials',
    meta: 'Lephalale open pit · User created' },
  { type: 'insp', actor: 'Johan Swart', entity: '#2120352', channel: 'Mobile app', date: '18 Jun 2026', time: '06:15',
    text: '**Johan Swart** submitted inspection **#2120352** for CA 123 GP — Go-but (W×3)',
    meta: 'Lephalale open pit · Pre-use inspection' },
  { type: 'unassign', actor: 'Thabo Nkosi', entity: 'WC 321 CT', channel: 'Web', date: '17 Jun 2026', time: '16:40',
    text: '**Thabo Nkosi** unassigned **WC 321 CT** from operator Lindiwe Mokoena — reason: scheduled maintenance',
    meta: 'Lephalale open pit · Vehicle assignment' },
  { type: 'warn', actor: 'System', entity: 'WC 321 CT', channel: 'Automatic', date: '17 Jun 2026', time: '21:31',
    text: '**System** grounded vehicle **WC 321 CT** — no-go defect detected on inspection #2120345',
    meta: 'Lephalale open pit · Automatic action' },
  { type: 'assign', actor: 'Thabo Nkosi', entity: 'JHB 456 GP', channel: 'Web', date: '17 Jun 2026', time: '14:22',
    text: '**Thabo Nkosi** assigned **JHB 456 GP** to operator **Priya Dlamini**',
    meta: 'Lephalale open pit · Vehicle assignment' },
  { type: 'warn', actor: 'System', entity: 'DEF-26-5041', channel: 'Automatic', date: '15 Jun 2026', time: '02:00',
    text: '**System** flagged **DEF-26-5041** — the go-but concession on DBN 001 NP lapsed without repair',
    meta: 'Steelpoort section · Concession lapsed' },
  { type: 'insp', actor: 'Bennie Pietersen', entity: '#2120351', channel: 'Mobile app', date: '18 Jun 2026', time: '05:50',
    text: '**Bennie Pietersen** submitted inspection **#2120351** for DBN 001 NP — in order',
    meta: 'Steelpoort section · Pre-use inspection' },
];

/* ── series behind the dashboard ───────────────────────────────── */
export const MONTHLY = [
  { m: 'Jul', y: 25, total: 268, ok: 228, go: 34, ng: 6 },
  { m: 'Aug', y: 25, total: 276, ok: 236, go: 34, ng: 6 },
  { m: 'Sep', y: 25, total: 289, ok: 249, go: 35, ng: 5 },
  { m: 'Oct', y: 25, total: 284, ok: 243, go: 35, ng: 6 },
  { m: 'Nov', y: 25, total: 297, ok: 256, go: 36, ng: 5 },
  { m: 'Dec', y: 25, total: 248, ok: 213, go: 30, ng: 5 },
  { m: 'Jan', y: 26, total: 295, ok: 253, go: 36, ng: 6 },
  { m: 'Feb', y: 26, total: 327, ok: 283, go: 38, ng: 6 },
  { m: 'Mar', y: 26, total: 313, ok: 269, go: 38, ng: 6 },
  { m: 'Apr', y: 26, total: 378, ok: 326, go: 45, ng: 7 },
  { m: 'May', y: 26, total: 353, ok: 304, go: 43, ng: 6 },
  { m: 'Jun', y: 26, total: 449, ok: 381, go: 60, ng: 8 },
];

export const passRate = (d) => (d.ok + d.go) / d.total * 100;
const PASS_SERIES = MONTHLY.slice(6).map(passRate);
const PASS_NOW = PASS_SERIES[PASS_SERIES.length - 1];
const PASS_PREV = PASS_SERIES[PASS_SERIES.length - 2];
const PASS_DELTA = (PASS_NOW >= PASS_PREV ? '+' : '−') + Math.abs(PASS_NOW - PASS_PREV).toFixed(1) + ' pp';

export const KPIS = [
  { key: 'insp', icon: 'clipboard', lbl: 'Inspections captured', val: '449', unit: 'this month', delta: '+27.2%', dir: 'up', note: 'vs 353 in May', series: MONTHLY.slice(6).map((m) => m.total), tone: SERIES[0] },
  { key: 'pass', icon: 'check', lbl: 'Pass rate', val: PASS_NOW.toFixed(1), unit: '%', delta: PASS_DELTA, dir: PASS_DELTA[0] === '+' ? 'up' : 'dn', note: 'not grounded · target 95%', series: PASS_SERIES, tone: SERIES[1] },
  { key: 'avail', icon: 'truck', lbl: 'Fleet availability', val: '90.0', unit: '%', delta: '−10.0 pp', dir: 'dn', note: '1 of 10 in maintenance', series: [100, 100, 90, 100, 90, 90], tone: SERIES[2] },
  { key: 'nogo', icon: 'alert', lbl: 'Open no-go defects', val: '1', unit: 'vehicle grounded', delta: '+1', dir: 'warn', note: 'oldest open 1 day', series: [0, 1, 0, 1, 0, 1], tone: SERIES[4] },
];

/* per-site figures, the tenant's own cut of its operation */
export const SITE_PERF = [
  { site: 'Lephalale open pit', key: 'PIT', users: 5, vehicles: 5, insp: 268, pass: 96.9, ng: 1, trend: [95.1, 95.8, 96.4, 96.9, 96.4, 96.9] },
  { site: 'Steelpoort section', key: 'STL', users: 4, vehicles: 3, insp: 121, pass: 98.3, ng: 0, trend: [96.4, 97.1, 97.6, 97.9, 98.0, 98.3] },
  { site: 'Head office and workshop', key: 'HO', users: 3, vehicles: 2, insp: 60, pass: 93.3, ng: 0, trend: [95.8, 95.1, 94.6, 94.0, 93.6, 93.3] },
];

/* per-site monthly volume — the isometric field and the stacked columns */
export const SITE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const SITE_SERIES = [
  { site: 'Lephalale open pit', key: 'PIT', c: SERIES[0], v: [168, 186, 178, 214, 200, 268] },
  { site: 'Steelpoort section', key: 'STL', c: SERIES[1], v: [86, 96, 92, 111, 104, 121] },
  { site: 'Head office', key: 'HO', c: SERIES[2], v: [41, 45, 43, 53, 49, 60] },
];

export const AGING = [
  { b: '0–7 days', v: 2, c: SEQ[1] },
  { b: '8–14 days', v: 1, c: SEQ[2] },
  { b: '15–21 days', v: 0, c: SEQ[3] },
  { b: '22–30 days', v: 2, c: SEQ[4] },
  { b: 'past the window', v: 2, c: '#C33B3B', breach: true },
];

export const CATEGORIES = [
  { k: 'Windows and wipers', v: 31 }, { k: 'Reflective tape', v: 22 },
  { k: 'Lights and indicators', v: 18 }, { k: 'Tyres and tread', v: 12 },
  { k: 'Air conditioner', v: 10 }, { k: 'Other', v: 7 },
];

export const FLEET_MIX_TONES = OUTCOME;

export const JUMP_TARGETS = null;

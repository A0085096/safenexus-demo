/* ══════════════════════════════════════════════════════════════
   The ERP data set.

   SafeNexus started as a pre-use inspection platform. A mine that
   inspects its fleet every shift already holds the meter readings,
   the defects and the operators — the expensive half of a fleet
   ERP. What follows is the rest of it: the haulage jobs those
   vehicles run, the diesel they burn, the tyres and parts they
   consume, the work orders that repair them, the incidents that
   damage them, the contracts that finance them and the invoices
   that pay for them.

   Everything is seeded from a fixed PRNG, so the demo is the same
   on every load and a figure quoted on the dashboard is the same
   figure the register totals.
   ══════════════════════════════════════════════════════════════ */

import { SITES } from '../data.js';

/* ── the clock ──────────────────────────────────────────────────
   One date for the whole data set. Every "expires in n days" and
   every aging bin is measured from here, so nothing drifts. */
export const TODAY = new Date('2026-06-18T00:00:00');
export const DAY = 86400000;

export const between = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);
export const until = (d) => between(TODAY, d);
export const iso = (d) => new Date(d).toISOString().slice(0, 10);
export const shift = (days) => iso(new Date(TODAY.getTime() + days * DAY));
export const fmtDate = (d) => (d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');
export const fmtShort = (d) => (d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  : '—');

/* ── money ──────────────────────────────────────────────────────
   The tenant trades in rand. One formatter, so a total in a footer
   reads the same as the same total on a tile. */
export const R = (n) => 'R ' + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const R2 = (n) => 'R ' + (n || 0).toFixed(2);
export const num = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* mulberry32 — small, seeded, and good enough that the fleet looks
   like a fleet rather than a grid of averages */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SITE_KEYS = SITES.filter((s) => s.key !== 'ALL').map((s) => s.key);

/* ── reference data ─────────────────────────────────────────────
   An open-cast mine hauling its own product, running its own
   workshop and its own light-vehicle fleet. */

export const VEHICLE_TYPES = [
  { t: 'LDV bakkie', cls: 'Light', meter: 'km', interval: 15000, tank: 80, target: 9.4,
    makes: ['Toyota Hilux 2.4GD', 'Ford Ranger 2.0SiT', 'Isuzu D-Max 250', 'Nissan Navara 2.5DDTi'] },
  { t: 'Crew bus', cls: 'Light', meter: 'km', interval: 15000, tank: 70, target: 8.1,
    makes: ['Toyota Quantum 2.8', 'Iveco Daily 50C', 'Mercedes Sprinter 316'] },
  { t: 'Panel van', cls: 'Light', meter: 'km', interval: 15000, tank: 75, target: 8.6,
    makes: ['VW Crafter 35', 'Hyundai H100', 'Ford Transit 2.2'] },
  { t: 'Haul truck', cls: 'Heavy', meter: 'km', interval: 25000, tank: 600, target: 2.6,
    makes: ['Volvo FH440', 'Scania R460', 'Mercedes Actros 2645', 'MAN TGS 26.440'] },
  { t: 'Tipper 10m³', cls: 'Heavy', meter: 'km', interval: 22000, tank: 400, target: 3.1,
    makes: ['Isuzu FVZ 1600', 'Hino 500 2829', 'Powerstar VX2642'] },
  { t: 'Water tanker', cls: 'Heavy', meter: 'km', interval: 22000, tank: 400, target: 3.3,
    makes: ['Isuzu FTR 850', 'Hino 500 1626'] },
  { t: 'Excavator', cls: 'Plant', meter: 'hours', interval: 500, tank: 500, target: 0,
    makes: ['Komatsu PC300', 'CAT 336D', 'Hitachi ZX350', 'Volvo EC300'] },
  { t: 'Front-end loader', cls: 'Plant', meter: 'hours', interval: 500, tank: 400, target: 0,
    makes: ['CAT 966H', 'Volvo L120H', 'Komatsu WA470'] },
  { t: 'Dozer', cls: 'Plant', meter: 'hours', interval: 500, tank: 450, target: 0,
    makes: ['CAT D8T', 'Komatsu D155A'] },
  { t: 'Grader', cls: 'Plant', meter: 'hours', interval: 500, tank: 350, target: 0,
    makes: ['CAT 140K', 'Volvo G930'] },
  { t: 'Forklift', cls: 'Yard', meter: 'hours', interval: 250, tank: 60, target: 0,
    makes: ['Toyota 8FG25', 'Linde H30D', 'Hyster H2.5FT'] },
];
export const vtype = (t) => VEHICLE_TYPES.find((x) => x.t === t) || VEHICLE_TYPES[0];
export const meterUnit = (v) => (vtype(v.type).meter === 'hours' ? 'h' : 'km');

const FIRST = ['Sipho', 'Thabo', 'Johannes', 'Riaan', 'Musa', 'Andile', 'Pieter', 'Lucky', 'Solomon',
  'Vusi', 'Bongani', 'Elias', 'Kagiso', 'Themba', 'Nkosana', 'Daniel', 'Frans', 'Sizwe', 'Mandla',
  'Tshepo', 'Jabu', 'Karabo', 'Gift', 'Simphiwe', 'Hendrik', 'Zanele', 'Nomsa', 'Precious', 'Lerato',
  'Dineo', 'Palesa', 'Anton', 'Wayne', 'Ridwaan', 'Ashley', 'Devan', 'Yusuf', 'Neo', 'Katlego', 'Sarah'];
const LAST = ['Dlamini', 'Mahlangu', 'Sithole', 'Nkosi', 'Baloyi', 'Moyo', 'Mokoena', 'Khumalo',
  'Zwane', 'Ndlovu', 'Mthethwa', 'Sibiya', 'Radebe', 'Mabaso', 'Ngwenya', 'Motaung', 'Phiri', 'Chauke',
  'Dube', 'Molefe', 'Tshabalala', 'Naidoo', 'Van Wyk', 'Botha', 'Fourie', 'Booysen', 'Pillay', 'Steyn',
  'Mkhize', 'Cele', 'Adams', 'Jacobs', 'Meyer', 'Maree', 'Nyathi', 'Gumede', 'Khoza', 'Zulu', 'Ndaba'];

export const CUSTOMERS = [
  'Highveld Ferrochrome', 'Sasol Secunda Works', 'Transnet Bulk Terminals', 'Richards Bay Minerals',
  'Corobrik Gauteng', 'Lafarge Cement Lichtenburg', 'Glencore Smelter Rustenburg',
  'PPC Aggregates', 'Exxaro Coal Trading', 'Northam Platinum',
];

/* Lanes out of the mine — where the product actually goes. */
export const LANES = [
  ['Lephalale open pit', 'Highveld Ferrochrome, Witbank', 412, 'N11'],
  ['Lephalale open pit', 'Transnet Bulk Terminals, Richards Bay', 780, 'N11 / N2'],
  ['Lephalale open pit', 'Sasol Secunda Works', 386, 'N4 / N17'],
  ['Steelpoort section', 'Glencore Smelter Rustenburg', 344, 'R37 / N4'],
  ['Steelpoort section', 'Northam Platinum', 176, 'R555'],
  ['Steelpoort section', 'Transnet Bulk Terminals, Richards Bay', 690, 'N11 / N2'],
  ['Lephalale open pit', 'Corobrik Gauteng, Springs', 330, 'N1 / R21'],
  ['Head office and workshop', 'Lephalale open pit', 62, 'D1675'],
  ['Steelpoort section', 'Lafarge Cement Lichtenburg', 470, 'N4'],
  ['Lephalale open pit', 'PPC Aggregates, Polokwane', 245, 'N11 / N1'],
  ['Steelpoort section', 'Exxaro Coal Trading, Emalahleni', 298, 'R555 / N4'],
  ['Lephalale open pit', 'Richards Bay Minerals', 812, 'N11 / N2'],
];

export const CARGO = ['Run-of-mine chrome ore', 'Screened chrome concentrate', 'Metallurgical coal',
  'Overburden — external tip', 'Aggregate 19mm', 'Aggregate 26mm', 'Magnetite fines',
  'Silica sand', 'Reject material', 'Plant feed'];

export const WO_TYPES = ['Scheduled service A', 'Scheduled service B', 'Major service C', 'Repair',
  'Breakdown', 'Tyres', 'Bodywork', 'Auto electrical', 'Brake overhaul', 'COF preparation',
  'Hydraulics', 'Undercarriage'];
export const WO_STATUS = ['Awaiting authorisation', 'Awaiting parts', 'In progress', 'Road test', 'Completed'];

export const PART_CATS = ['Filters', 'Brakes', 'Lubricants', 'Electrical', 'Tyres', 'Body',
  'Driveline', 'Hydraulics', 'Undercarriage', 'Consumables'];

export const SUPPLIERS = ['Midas Fleet Parts', 'Bosch Diesel Centre', 'Trentyre Commercial',
  'Volvo Trucks SA', 'Scania Parts Polokwane', 'Barloworld Equipment', 'Bearing Man Group',
  'Engen Fleet Cards', 'Afrit Spares', 'Komatsu SA'];

export const FUEL_SITES = ['Depot bunker — Lephalale', 'Depot bunker — Steelpoort',
  'Engen Lephalale', 'Shell Mokopane', 'Sasol Burgersfort', 'Total Polokwane',
  'BP Marble Hall', 'Astron Groblersdal', 'Mobile bowser — open pit'];

export const FUEL_EXCEPTIONS = [
  'Meter reading lower than the previous fill',
  'Litres exceed the tank capacity',
  'Two fills 26 minutes apart',
  'Consumption 29% below the model target',
  'Fill captured outside the vehicle’s site',
  'Card used while the vehicle was off road',
];

export const TYRE_BRANDS = ['Bridgestone VSJ', 'Michelin XDR3', 'Continental HDR2',
  'Dunlop SP346', 'Goodyear KMAX', 'Bridgestone R249'];
export const TYRE_POS_HEAVY = ['LHF steer', 'RHF steer', 'A2 LH outer', 'A2 LH inner',
  'A2 RH outer', 'A2 RH inner', 'A3 LH outer', 'A3 LH inner', 'A3 RH outer', 'A3 RH inner'];
export const TYRE_POS_PLANT = ['LH front', 'RH front', 'LH rear', 'RH rear'];

export const INCIDENT_TYPES = ['Collision', 'Rollover', 'Load shift', 'Theft of fuel',
  'Tyre failure', 'Breakdown on route', 'Traffic fine', 'Third-party damage', 'Yard damage',
  'Pedestrian near-miss', 'Fire'];

export const DOC_TYPES = ['Licence disc', 'Certificate of fitness', 'Operating card',
  'Insurance schedule', 'Dangerous goods permit', 'Weighbridge certificate', 'Service history',
  'Lease agreement', 'Load test certificate', 'Mine permit'];

export const CONTRACT_KINDS = ['Instalment sale', 'Full maintenance lease', 'Operating lease', 'Owned outright'];
export const FINANCIERS = ['Wesbank Commercial', 'Standard Bank Fleet', 'Absa Vehicle Finance',
  'Barloworld Finance', 'Volvo Financial Services'];

const DIESEL = 24.1;          /* rand per litre, until the card file lands */
const LABOUR_RATE = 465;      /* internal workshop recovery rate */

/* ══════════════════════════════════════════════════════════════
   The fleet.

   The ten hand-written vehicles in data.js stay exactly as they
   are — every existing defect, inspection and work order points at
   them. This adds the ERP fields to those ten and generates the
   rest of the fleet around them.
   ══════════════════════════════════════════════════════════════ */

export function enrichFleet(base, extra = 38) {
  const r = rng(20260618);
  const out = [];

  const erpFields = (v, i) => {
    const vt = vtype(v.type);
    const plant = vt.meter === 'hours';
    const monthMeter = plant ? int(r, 90, 260) : vt.cls === 'Heavy' ? int(r, 3400, 12000) : int(r, 900, 3400);
    const kmpl = vt.target ? +(vt.target * (0.82 + r() * 0.3)).toFixed(2) : 0;
    /* plant burns by the hour, not the kilometre */
    const litres = plant ? Math.round(monthMeter * (vt.cls === 'Plant' ? 18 : 6))
      : kmpl ? Math.round(monthMeter / kmpl) : 0;
    const kind = pick(r, CONTRACT_KINDS);
    const heavy = vt.cls === 'Heavy' || vt.cls === 'Plant';
    return {
      vin: 'AAV' + int(r, 10000000, 99999999),
      cls: vt.cls,
      meterType: vt.meter,
      interval: vt.interval,
      tank: vt.tank,
      targetRate: vt.target,           /* km per litre, 0 for plant */
      rate: kmpl,
      lastService: shift(-int(r, 8, 160)),
      licenceExpiry: shift(int(r, -40, 330)),
      cofExpiry: shift(int(r, -20, 300)),
      insuranceExpiry: shift(int(r, 20, 260)),
      telematics: {
        unit: 'CT-' + int(r, 40000, 49999),
        online: r() > 0.09,
        lastPing: r() > 0.09 ? `18 Jun ${String(int(r, 6, 10)).padStart(2, '0')}:${String(int(r, 10, 58))}` : '15 Jun 17:22',
        lat: -23.6 - r() * 1.8,
        lng: 27.6 + r() * 3.2,
      },
      month: {
        meter: monthMeter,
        litres,
        fuel: Math.round(litres * DIESEL),
        maint: Math.round((heavy ? 6200 : 1900) * (0.4 + r() * 1.8)),
        tyres: Math.round((heavy ? 0.74 : 0.18) * (plant ? monthMeter * 22 : monthMeter)),
        consumables: Math.round((heavy ? 0.14 : 0.05) * (plant ? monthMeter * 22 : monthMeter)),
        jobs: plant ? 0 : int(r, 2, 24),
        idlePct: +(4 + r() * 22).toFixed(1),
        utilPct: v.status === 'Maintenance' ? int(r, 0, 22) : int(r, 41, 96),
      },
      finance: {
        kind,
        financier: kind === 'Owned outright' ? '—' : pick(r, FINANCIERS),
        instalment: kind === 'Owned outright' ? 0
          : Math.round((vt.cls === 'Plant' ? 62000 : heavy ? 34000 : 9200) * (0.7 + r() * 0.7)),
        end: shift(int(r, -120, 900)),
        residual: Math.round((vt.cls === 'Plant' ? 1400000 : heavy ? 620000 : 180000) * (0.4 + r() * 0.6)),
        purchase: Math.round((vt.cls === 'Plant' ? 4200000 : heavy ? 1950000 : 520000) * (0.75 + r() * 0.5)),
      },
      notes: '',
    };
  };

  base.forEach((v, i) => out.push({ ...v, ...erpFields(v, i) }));

  /* the rest of the fleet */
  const prefixes = ['LP', 'GP', 'MP', 'CA', 'DBN', 'NW'];
  for (let i = 0; i < extra; i += 1) {
    const vt = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const plant = vt.meter === 'hours';
    const site = SITE_KEYS[i % SITE_KEYS.length];
    const meter = plant ? int(r, 1800, 14000) : vt.cls === 'Heavy' ? int(r, 60000, 640000) : int(r, 12000, 260000);
    const st = r();
    const status = st < 0.62 ? 'Assigned' : st < 0.88 ? 'Available' : 'Maintenance';
    const v = {
      plate: `${pick(r, prefixes)} ${int(r, 100, 999)} ${['GP', 'MP', 'LP', 'NW'][i % 4]}`,
      fleetNo: 'AM-' + String(100 + i * 3),
      type: vt.t,
      make: pick(r, vt.makes),
      year: int(r, 2016, 2026),
      site,
      driver: '—',
      sup: '—',
      lastInsp: pick(r, ['Today 05:40', 'Today 06:20', 'Today 07:05', 'Yesterday 14:10',
        'Yesterday 17:35', '16 Jun 06:15', '15 Jun 05:55', '14 Jun 13:20']),
      km: meter,
      status,
      cof: fmtDate(shift(int(r, -20, 300))),
      serviceDue: Math.ceil((meter + r() * vt.interval * 0.92) / 500) * 500,
      permit: vt.cls === 'Plant' || r() < 0.3 ? 'Red permit area' : '',
    };
    out.push({ ...v, ...erpFields(v, base.length + i) });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════
   People.

   The eleven named users in data.js are the story — the admin, the
   safety officers, the supervisors, the operators whose sheets the
   defect register already points at. This adds the driver-side ERP
   fields to them and fills the rest of the workforce out.
   ══════════════════════════════════════════════════════════════ */

export function enrichPeople(base, vehicles, extra = 44) {
  const r = rng(4711);
  const codes = ['Code EC (artic)', 'Code EC1 (rigid + trailer)', 'Code C1 (rigid)', 'Code EB (light)'];
  const competency = ['Excavator 360°', 'Front-end loader', 'Dozer', 'Grader', 'Forklift',
    'Dangerous goods', 'First aid', 'Fire fighting', 'Working at heights'];

  const driverFields = (u) => {
    const operator = u.role === 'Operator';
    const speeding = operator ? int(r, 0, 12) : int(r, 0, 3);
    const harsh = operator ? int(r, 0, 20) : int(r, 0, 5);
    const idle = +(4 + r() * 22).toFixed(1);
    return {
      code: 'DRV-' + int(r, 2000, 2999),
      licenceCode: operator ? pick(r, codes) : 'Code EB (light)',
      licenceExpiry: shift(int(r, -30, 700)),
      prdpExpiry: operator ? shift(int(r, -25, 420)) : null,
      medicalExpiry: shift(int(r, -20, 380)),
      dgTraining: r() < 0.34 ? shift(int(r, -15, 400)) : null,
      duty: r() < 0.84 ? 'On duty' : r() < 0.93 ? 'On leave' : 'Standby',
      events: { speeding, harsh, idle, overspeedKm: int(r, 0, 320) },
      score: clamp(Math.round(100 - speeding * 2.6 - harsh * 1.1 - idle * 0.6), 32, 99),
      hoursWeek: +(operator ? 28 + r() * 28 : 38 + r() * 6).toFixed(1),
      kmMonth: operator ? int(r, 1100, 11000) : int(r, 200, 2400),
      jobsMonth: operator ? int(r, 2, 22) : 0,
      incidents: r() < 0.16 ? int(r, 1, 2) : 0,
      competencies: Array.from({ length: int(r, 1, 4) }, () => pick(r, competency))
        .filter((c, i, a) => a.indexOf(c) === i)
        .map((c) => ({ name: c, expires: shift(int(r, -30, 620)) })),
    };
  };

  const out = base.map((u) => ({ ...u, ...driverFields(u) }));

  const free = vehicles.filter((v) => v.driver === '—' && v.status !== 'Maintenance');
  let f = 0;
  for (let i = 0; i < extra; i += 1) {
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    const name = `${first} ${last}`;
    if (out.some((u) => u.name === name)) continue;
    const role = i < 3 ? 'Safety officer' : i < 9 ? 'Supervisor' : 'Operator';
    const site = SITE_KEYS[i % SITE_KEYS.length];
    const sup = out.find((u) => u.role === 'Supervisor' && u.site === site);
    const u = {
      name,
      init: (first[0] + last[0]).toUpperCase(),
      role,
      site,
      reports: role === 'Operator' ? (sup ? sup.name : 'Thabo Nkosi') : 'Kobus van der Merwe',
      vehicle: '—',
      cof: fmtDate(shift(int(r, -20, 400))),
      insps: role === 'Operator' ? int(r, 6, 74) : int(r, 0, 8),
      status: r() < 0.94 ? 'Active' : 'Suspended',
      tone: role === 'Safety officer' ? 'green' : role === 'Supervisor' ? 'blue' : 'gold',
      empNo: 'AM-' + int(r, 1400, 1999),
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@acmecorp.co.za`,
      phone: `+27 ${int(r, 60, 84)} ${int(r, 100, 999)} ${int(r, 1000, 9999)}`,
      started: fmtDate(shift(-int(r, 200, 3400))),
      licence: '—',
      lastActive: pick(r, ['Today 05:48', 'Today 06:32', 'Today 07:14', 'Yesterday 16:40',
        'Yesterday 12:05', '16 Jun 08:20']),
      passRate: role === 'Operator' ? +(92 + r() * 7).toFixed(1) : null,
      defects: role === 'Operator' ? int(r, 0, 8) : 0,
    };
    const d = driverFields(u);
    u.licence = `${d.licenceCode} · ${fmtDate(d.licenceExpiry)}`;
    /* an operator on duty gets a machine, and the machine gets them back */
    if (role === 'Operator' && u.status === 'Active' && d.duty === 'On duty' && free[f]) {
      const v = free[f];
      f += 1;
      u.vehicle = v.plate;
      v.driver = name;
      v.sup = u.reports;
      v.status = 'Assigned';
    }
    out.push({ ...u, ...d });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════
   Dispatch — the haulage jobs the fleet runs.
   ══════════════════════════════════════════════════════════════ */

export function buildJobs(vehicles, people, n = 88) {
  const r = rng(90210);
  const haulers = vehicles.filter((v) => v.cls === 'Heavy');
  const drivers = people.filter((u) => u.role === 'Operator');
  if (!haulers.length || !drivers.length) return [];

  return Array.from({ length: n }, (_, i) => {
    const v = pick(r, haulers);
    const d = drivers.find((x) => x.vehicle === v.plate) || pick(r, drivers);
    const lane = pick(r, LANES);
    const dayOff = int(r, -12, 5);
    const depart = shift(dayOff);
    const hours = Math.max(2, Math.round(lane[2] / 58));
    const status = dayOff < -1 ? (r() < 0.93 ? 'Delivered' : 'Cancelled')
      : dayOff < 0 ? 'In transit'
        : dayOff === 0 ? pick(r, ['Loading', 'In transit', 'Planned'])
          : 'Planned';
    const rate = 24.5 + r() * 8;
    const revenue = Math.round(lane[2] * rate);
    const fuelCost = Math.round((lane[2] / (v.rate || 2.6)) * DIESEL);
    const tollCost = Math.round(lane[2] * (r() < 0.5 ? 0.42 : 0.16));
    const driverCost = Math.round(hours * 128);
    const other = Math.round(lane[2] * 1.7);
    return {
      ref: 'JOB-26-' + String(4100 + i),
      vehicle: v.plate,
      fleetNo: v.fleetNo,
      driver: d.name,
      customer: pick(r, CUSTOMERS),
      origin: lane[0],
      destination: lane[1],
      distance: lane[2],
      route: lane[3],
      cargo: pick(r, CARGO),
      tons: +(14 + r() * 22).toFixed(1),
      depart,
      departTime: `${String(int(r, 4, 17)).padStart(2, '0')}:${r() < 0.5 ? '00' : '30'}`,
      eta: shift(dayOff + Math.ceil(hours / 11)),
      hours,
      status,
      site: v.site,
      revenue,
      fuelCost,
      tollCost,
      driverCost,
      other,
      cost: fuelCost + tollCost + driverCost + other,
      lateBy: status === 'Delivered' && r() < 0.2 ? int(r, 1, 9) : 0,
      pod: status === 'Delivered' ? r() > 0.17 : false,
      priority: r() < 0.16 ? 'Urgent' : 'Standard',
      invoice: null,
    };
  }).sort((a, b) => (a.depart < b.depart ? 1 : -1));
}

export const jobMargin = (j) => j.revenue - j.cost;
export const jobRpk = (j) => (j.distance ? j.revenue / j.distance : 0);

/* ══════════════════════════════════════════════════════════════
   Fuel — the transactions, and the ones that do not add up.
   ══════════════════════════════════════════════════════════════ */

export function buildFuel(vehicles, people, n = 220) {
  const r = rng(2468);
  const burners = vehicles.filter((v) => v.tank > 0);
  const drivers = people.filter((u) => u.role === 'Operator');
  if (!burners.length) return [];

  return Array.from({ length: n }, (_, i) => {
    const v = pick(r, burners);
    const d = drivers.find((x) => x.vehicle === v.plate) || pick(r, drivers) || people[0];
    const litres = Math.round(v.tank * (0.25 + r() * 0.7));
    const rate = +(23.1 + r() * 1.9).toFixed(2);
    const plant = v.meterType === 'hours';
    /* plant is measured in litres per hour, wheels in km per litre */
    const since = plant
      ? Math.round(litres / (14 + r() * 10))
      : Math.round(litres * (v.rate || 3) * (0.8 + r() * 0.45));
    const consumption = plant ? +(litres / Math.max(1, since)).toFixed(2) : +(since / litres).toFixed(2);
    const target = plant ? 18 : v.targetRate;
    const variance = target
      ? +(((consumption - target) / target) * 100 * (plant ? -1 : 1)).toFixed(1)
      : 0;
    const exception = r() < 0.11 ? pick(r, FUEL_EXCEPTIONS) : null;
    return {
      ref: 'FT-26-' + String(60000 + i),
      date: shift(-int(r, 0, 34)),
      time: `${String(int(r, 0, 23)).padStart(2, '0')}:${String(int(r, 0, 59)).padStart(2, '0')}`,
      vehicle: v.plate,
      fleetNo: v.fleetNo,
      driver: d.name,
      site: v.site,
      card: '6011 •••• ' + int(r, 1000, 9999),
      station: pick(r, FUEL_SITES),
      litres,
      rate,
      amount: Math.round(litres * rate),
      meter: v.km - int(r, 0, plant ? 900 : 9000),
      since,
      consumption,
      unit: plant ? 'L/h' : 'km/L',
      variance,
      exception,
      status: exception ? 'Exception' : r() > 0.22 ? 'Verified' : 'Unverified',
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ══════════════════════════════════════════════════════════════
   Tyres — the second-largest consumable after diesel, and the one
   that gets managed by position and by cost per kilometre.
   ══════════════════════════════════════════════════════════════ */

export function buildTyres(vehicles) {
  const r = rng(5150);
  const out = [];
  vehicles.filter((v) => v.cls === 'Heavy' || v.cls === 'Plant').slice(0, 26).forEach((v) => {
    const plant = v.cls === 'Plant';
    const positions = plant ? TYRE_POS_PLANT : TYRE_POS_HEAVY;
    positions.forEach((position, i) => {
      const tread = +(2 + r() * 15).toFixed(1);
      const fittedAt = Math.max(0, v.km - int(r, 8000, plant ? 4000 : 130000));
      const run = v.km - fittedAt;
      const cost = plant ? int(r, 28000, 56000) : int(r, 6200, 10000);
      out.push({
        serial: 'TY' + String(400000 + out.length * 13 + 7),
        brand: TYRE_BRANDS[(i + out.length) % TYRE_BRANDS.length],
        size: plant ? '29.5R25' : '315/80R22.5',
        position,
        vehicle: v.plate,
        fleetNo: v.fleetNo,
        site: v.site,
        fittedAt,
        fittedOn: shift(-int(r, 30, 620)),
        currentMeter: v.km,
        run,
        tread,
        pressure: plant ? int(r, 500, 620) : int(r, 700, 900),
        retreads: r() < 0.3 ? 1 : 0,
        cost,
        cpk: +(cost / Math.max(1000, run)).toFixed(3),
        status: tread < 3 ? 'Scrap' : tread < 5 ? 'Watch' : tread > 13 ? 'New' : 'Running',
      });
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════
   Parts and stores.
   ══════════════════════════════════════════════════════════════ */

const PART_NAMES = {
  Filters: ['Oil filter — Volvo FH', 'Fuel filter — Scania R', 'Air filter element', 'Hydraulic filter — PC300', 'AdBlue filter'],
  Brakes: ['Brake lining kit — heavy', 'Brake drum 420mm', 'Air dryer cartridge', 'Slack adjuster'],
  Lubricants: ['Engine oil 15W-40, 20L', 'Gear oil 80W-90, 20L', 'Hydraulic oil ISO 68, 20L', 'Grease cartridge 400g', 'Coolant premix 20L'],
  Electrical: ['Alternator 24V 110A', 'Starter motor', 'LED work lamp', 'Battery 12V 100Ah', 'Reverse camera unit'],
  Tyres: ['315/80R22.5 steer', '315/80R22.5 drive', '29.5R25 L3 earthmover'],
  Body: ['Mudflap heavy duty', 'Mirror arm bracket', 'Door lock assembly', 'Windscreen — Hilux'],
  Driveline: ['Clutch kit 430mm', 'Propshaft universal joint', 'Wheel bearing kit', 'Diff oil seal'],
  Hydraulics: ['Hydraulic hose 3/4", 2m', 'Ram seal kit — boom', 'Pilot valve assembly'],
  Undercarriage: ['Track chain link — D8T', 'Bottom roller', 'Sprocket segment', 'Cutting edge 2.4m'],
  Consumables: ['Cable tie pack 100', 'Ratchet strap 5t', 'Wheel nut indicator set', 'Rag pack 10kg', 'Barrier tape roll'],
};

export function buildParts() {
  const r = rng(8080);
  const out = [];
  PART_CATS.forEach((category) => {
    PART_NAMES[category].forEach((desc) => {
      const qty = int(r, 0, 42);
      const reorder = int(r, 4, 14);
      out.push({
        sku: 'P-' + String(10000 + out.length * 7 + 3),
        desc,
        category,
        bin: `${['A', 'B', 'C', 'D'][int(r, 0, 3)]}${int(r, 1, 9)}-${int(r, 10, 90)}`,
        store: SITE_KEYS[out.length % SITE_KEYS.length],
        qty,
        reorder,
        onOrder: qty < reorder && r() < 0.55 ? reorder * 2 : 0,
        unitCost: category === 'Tyres' ? int(r, 6200, 48000)
          : category === 'Undercarriage' ? int(r, 4200, 22000)
            : int(r, 90, 6400),
        supplier: pick(r, SUPPLIERS),
        lastIssued: shift(-int(r, 0, 70)),
        usage90: int(r, 0, 30),
        lead: int(r, 2, 21),
      });
    });
  });
  return out;
}

export const stockValue = (p) => p.qty * p.unitCost;
export const stockTone = (p) => (p.qty === 0 ? 'red' : p.qty <= p.reorder ? 'gold' : 'green');

/* ══════════════════════════════════════════════════════════════
   Workshop — the existing work orders, given job-card depth, plus
   the rest of the workshop's book of work.
   ══════════════════════════════════════════════════════════════ */

export function enrichWorkOrders(base, vehicles, parts, extra = 34) {
  const r = rng(1357);
  const priced = (n) => Array.from({ length: n }, () => {
    const p = pick(r, parts);
    return { sku: p.sku, desc: p.desc, qty: int(r, 1, 4), price: p.unitCost };
  });

  const depth = (w, v) => {
    const labourHours = +(1 + r() * 16).toFixed(1);
    return {
      fleetNo: v?.fleetNo || '—',
      priority: w.type === 'Breakdown' ? 'Critical' : r() < 0.3 ? 'High' : 'Normal',
      meter: v ? v.km - int(r, 0, 2500) : 0,
      labourHours,
      labourRate: LABOUR_RATE,
      parts: priced(int(r, 1, 4)),
      technician: pick(r, ['J. Marais', 'S. Ndlovu', 'P. Mokoena', 'A. Khoza', 'W. Botha']),
      downtimeDays: w.status === 'Completed' ? int(r, 1, 5) : int(r, 0, 9),
      fault: w.note || 'Interval reached — oils, filters and a full brake inspection.',
      closed: w.status === 'Completed' ? shift(-int(r, 1, 14)) : null,
    };
  };

  const out = base.map((w) => {
    const v = vehicles.find((x) => x.plate === w.vehicle);
    return { ...w, ...depth(w, v) };
  });

  for (let i = 0; i < extra; i += 1) {
    const v = pick(r, vehicles);
    const type = pick(r, WO_TYPES);
    const done = r() < 0.52;
    const w = {
      ref: 'WO-26-' + String(3100 + i),
      vehicle: v.plate,
      site: v.site,
      type,
      status: done ? 'Completed' : pick(r, WO_STATUS.slice(0, 4)),
      opened: fmtDate(shift(-int(r, 1, 48))),
      defect: null,
      assigned: r() < 0.62 ? 'On-site workshop' : pick(r, SUPPLIERS),
      note: type === 'Breakdown' ? 'Air leak on the service line, stranded on the haul road.'
        : type === 'Repair' ? 'Coolant loss, water pump seal weeping.'
          : type === 'Tyres' ? 'Two steer tyres below the 3 mm legal limit.'
            : type === 'Hydraulics' ? 'Boom ram weeping at the gland.'
              : type === 'Undercarriage' ? 'Track tension out of specification, links worn.'
                : 'Interval reached — oils, filters and a full brake inspection.',
    };
    out.push({ ...w, ...depth(w, v) });
  }
  return out;
}

export const woCost = (w) => Math.round(
  (w.labourHours || 0) * (w.labourRate || LABOUR_RATE)
  + (w.parts || []).reduce((a, p) => a + p.qty * p.price, 0),
);

/* ══════════════════════════════════════════════════════════════
   Incidents and claims.
   ══════════════════════════════════════════════════════════════ */

export function buildIncidents(vehicles, people) {
  const r = rng(31337);
  const drivers = people.filter((u) => u.role === 'Operator');
  const seed = [
    ['Rollover', 'Critical', 'Tipper rolled on the ramp out of the pit while turning with a part load. Operator treated on site and discharged; the load was recovered over two days.', 'Investigating'],
    ['Collision', 'Major', 'Haul truck rear-ended a light vehicle in the queue at the weighbridge. No injuries; the third party is claiming.', 'Investigating'],
    ['Theft of fuel', 'Major', '284 litres unaccounted for between the Steelpoort bunker and the Rustenburg turnaround. Card and telematics data pulled.', 'Investigating'],
    ['Pedestrian near-miss', 'Critical', 'Excavator slewed while a contractor was inside the exclusion zone. Work stopped, exclusion procedure reissued.', 'Open'],
    ['Tyre failure', 'Moderate', 'Drive-axle tyre failed at speed on the N11 near Mokopane. Recovered by roadside assist within two hours.', 'Closed'],
    ['Load shift', 'Major', 'Ore moved on braking; the tailgate and rave rail were damaged. The load restraint procedure is under review.', 'Investigating'],
    ['Fire', 'Critical', 'Engine bay fire on a front-end loader, suppressed by the on-board system. Machine off road pending an insurance assessment.', 'Open'],
    ['Traffic fine', 'Minor', 'Overloading on the second axle at the Mokopane weighbridge. The fine was issued to the operator.', 'Closed'],
    ['Breakdown on route', 'Moderate', 'Air compressor failure outside Marble Hall. Vehicle recovered to the Lephalale workshop.', 'Closed'],
    ['Yard damage', 'Minor', 'Tipper body struck the workshop door frame while reversing without a spotter.', 'Closed'],
    ['Third-party damage', 'Moderate', 'Mirror struck a parked contractor vehicle at the plant gate. The insurer has been notified.', 'Open'],
    ['Collision', 'Moderate', 'Two light vehicles touched in the head-office car park. Both are driveable.', 'Closed'],
  ];
  return seed.map(([type, severity, description, status], i) => {
    const v = pick(r, vehicles);
    const d = drivers.find((x) => x.vehicle === v.plate) || pick(r, drivers) || people[0];
    return {
      ref: 'INC-26-' + String(180 + i),
      type,
      severity,
      description,
      status,
      vehicle: v.plate,
      fleetNo: v.fleetNo,
      driver: d.name,
      site: v.site,
      date: shift(-int(r, 1, 70)),
      location: pick(r, LANES)[3] + ' corridor',
      claim: r() < 0.6 ? 'CLM-26-' + String(4400 + i) : null,
      estimate: int(r, 8000, 420000),
      excess: pick(r, [7500, 15000, 25000]),
      thirdParty: r() < 0.4,
      injuries: severity === 'Critical' ? int(r, 0, 1) : 0,
      lostDays: severity === 'Critical' ? int(r, 0, 14) : 0,
      reportedBy: pick(r, ['Thabo Nkosi', 'Refilwe Sekhukhune', 'Priya Dlamini', 'Anton Williams']),
      workOrder: null,
      actions: [
        { text: 'Scene secured and the operator’s statement taken', done: true },
        { text: 'Telematics and camera footage pulled', done: status !== 'Open' },
        { text: 'Root cause established and coaching booked', done: status === 'Closed' },
        { text: 'Claim lodged with the insurer', done: status === 'Closed' },
      ],
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ══════════════════════════════════════════════════════════════
   Billing — the invoices raised against delivered jobs.
   ══════════════════════════════════════════════════════════════ */

export function buildInvoices(jobs) {
  const r = rng(6161);
  const byCustomer = {};
  jobs.filter((j) => j.status === 'Delivered').forEach((j) => {
    (byCustomer[j.customer] = byCustomer[j.customer] || []).push(j);
  });

  return Object.entries(byCustomer).slice(0, 12).map(([customer, list], i) => {
    const lines = list.slice(0, 6).map((j) => ({
      desc: `${j.ref} · ${j.origin} → ${j.destination} · ${j.cargo}`,
      qty: j.distance,
      unit: 'km',
      price: +(j.revenue / j.distance).toFixed(2),
    }));
    const date = shift(-int(r, 2, 44));
    const net = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const discount = r() < 0.2 ? 5 : 0;
    const gross = net * (1 - discount / 100) * 1.15;
    const roll = r();
    const payments = roll < 0.42
      ? [{ ref: 'RCT-' + int(r, 10000, 99999), date: shift(-int(r, 0, 20)), amount: Math.round(gross), method: 'EFT' }]
      : roll < 0.58
        ? [{ ref: 'RCT-' + int(r, 10000, 99999), date: shift(-int(r, 0, 20)), amount: Math.round(gross * 0.5), method: 'EFT' }]
        : [];
    return {
      ref: 'INV-26-' + String(7100 + i),
      customer,
      contact: `accounts@${customer.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.co.za`,
      site: list[0].site,
      date,
      due: shift(between(TODAY, date) + 30),
      lines,
      discount,
      vat: 15,
      payments,
      jobs: list.slice(0, 6).map((j) => j.ref),
      status: 'Issued',
    };
  });
}

export const invNet = (inv) => inv.lines.reduce((a, l) => a + l.qty * l.price, 0);
export const invTotal = (inv) => invNet(inv) * (1 - (inv.discount || 0) / 100) * (1 + (inv.vat || 0) / 100);
export const invPaid = (inv) => (inv.payments || []).reduce((a, p) => a + p.amount, 0);
export const invDue = (inv) => Math.max(0, Math.round(invTotal(inv) - invPaid(inv)));
export const invState = (inv) => {
  const due = invDue(inv);
  if (due <= 0) return 'Paid';
  if (invPaid(inv) > 0) return 'Part paid';
  return until(inv.due) < 0 ? 'Overdue' : 'Issued';
};

/* ══════════════════════════════════════════════════════════════
   Procurement — orders out, supplier invoices in.
   ══════════════════════════════════════════════════════════════ */

export function buildPurchaseOrders(parts, n = 24) {
  const r = rng(7331);
  return Array.from({ length: n }, (_, i) => {
    const supplier = pick(r, SUPPLIERS);
    const lines = Array.from({ length: int(r, 1, 5) }, () => {
      const p = pick(r, parts);
      return { sku: p.sku, desc: p.desc, qty: int(r, 1, 12), price: p.unitCost };
    });
    const raised = shift(-int(r, 1, 50));
    const roll = r();
    const status = roll < 0.34 ? 'Received' : roll < 0.5 ? 'Part received'
      : roll < 0.72 ? 'Sent' : roll < 0.88 ? 'Awaiting approval' : 'Draft';
    return {
      ref: 'PO-26-' + String(2200 + i),
      supplier,
      site: SITE_KEYS[i % SITE_KEYS.length],
      raisedBy: pick(r, ['Kobus van der Merwe', 'Thabo Nkosi', 'Refilwe Sekhukhune']),
      raised,
      expected: shift(between(TODAY, raised) + int(r, 3, 21)),
      lines,
      status,
      workOrder: r() < 0.35 ? 'WO-26-' + String(3100 + int(r, 0, 33)) : null,
      note: '',
    };
  }).sort((a, b) => (a.raised < b.raised ? 1 : -1));
}

export const poTotal = (po) => Math.round(po.lines.reduce((a, l) => a + l.qty * l.price, 0) * 1.15);

export function buildSupplierInvoices(pos, n = 18) {
  const r = rng(9182);
  const billable = pos.filter((p) => p.status === 'Received' || p.status === 'Part received');
  return Array.from({ length: Math.min(n, billable.length) }, (_, i) => {
    const po = billable[i];
    const amount = poTotal(po) * (po.status === 'Part received' ? 0.6 : 1);
    const date = shift(-int(r, 0, 40));
    const roll = r();
    return {
      ref: 'SIN-' + String(88100 + i),
      supplier: po.supplier,
      po: po.ref,
      date,
      due: shift(between(TODAY, date) + 30),
      amount: Math.round(amount),
      site: po.site,
      status: roll < 0.45 ? 'Paid' : roll < 0.72 ? 'Approved' : roll < 0.9 ? 'Awaiting approval' : 'Query',
      matched: roll > 0.18,
      note: roll < 0.18 ? 'Price on the invoice is above the order — sent back to the supplier.' : '',
    };
  });
}

/* ══════════════════════════════════════════════════════════════
   Documents — everything that expires, in one register.
   ══════════════════════════════════════════════════════════════ */

export function buildDocuments(vehicles, people, workOrders) {
  const r = rng(4242);
  const out = [];
  vehicles.slice(0, 34).forEach((v, i) => {
    out.push({
      ref: 'DOC-' + String(9000 + out.length),
      kind: 'Licence disc',
      subject: v.plate,
      subjectType: 'Vehicle',
      site: v.site,
      issued: shift(-int(r, 40, 330)),
      expires: v.licenceExpiry,
      owner: 'Compliance officer',
      file: `licence-${v.plate.replace(/\s/g, '')}.pdf`,
      size: `${int(r, 90, 480)} KB`,
      status: 'Verified',
    });
    out.push({
      ref: 'DOC-' + String(9000 + out.length),
      kind: 'Certificate of fitness',
      subject: v.plate,
      subjectType: 'Vehicle',
      site: v.site,
      issued: shift(-int(r, 40, 360)),
      expires: v.cofExpiry,
      owner: 'Compliance officer',
      file: `cof-${v.plate.replace(/\s/g, '')}.pdf`,
      size: `${int(r, 90, 480)} KB`,
      status: until(v.cofExpiry) < 0 ? 'Expired' : 'Verified',
    });
    if (i % 3 === 0) {
      out.push({
        ref: 'DOC-' + String(9000 + out.length),
        kind: 'Insurance schedule',
        subject: v.plate,
        subjectType: 'Vehicle',
        site: v.site,
        issued: shift(-int(r, 30, 300)),
        expires: v.insuranceExpiry,
        owner: 'Finance',
        file: `insurance-${v.fleetNo}.pdf`,
        size: `${int(r, 200, 900)} KB`,
        status: 'Verified',
      });
    }
  });
  people.filter((u) => u.role === 'Operator').slice(0, 28).forEach((u) => {
    out.push({
      ref: 'DOC-' + String(9000 + out.length),
      kind: 'Certificate of fitness',
      subject: u.name,
      subjectType: 'Person',
      site: u.site,
      issued: shift(-int(r, 60, 400)),
      expires: u.medicalExpiry,
      owner: 'Occupational health',
      file: `med-${u.empNo}.pdf`,
      size: `${int(r, 60, 260)} KB`,
      status: until(u.medicalExpiry) < 0 ? 'Expired' : 'Verified',
    });
    if (u.prdpExpiry) {
      out.push({
        ref: 'DOC-' + String(9000 + out.length),
        kind: 'Operating card',
        subject: u.name,
        subjectType: 'Person',
        site: u.site,
        issued: shift(-int(r, 60, 400)),
        expires: u.prdpExpiry,
        owner: 'Human resources',
        file: `prdp-${u.empNo}.pdf`,
        size: `${int(r, 60, 260)} KB`,
        status: until(u.prdpExpiry) < 0 ? 'Expired' : 'Verified',
      });
    }
  });
  workOrders.filter((w) => w.status === 'Completed').slice(0, 10).forEach((w) => {
    out.push({
      ref: 'DOC-' + String(9000 + out.length),
      kind: 'Service history',
      subject: w.vehicle,
      subjectType: 'Vehicle',
      site: w.site,
      issued: w.closed || shift(-10),
      expires: null,
      owner: 'Workshop',
      file: `jobcard-${w.ref}.pdf`,
      size: `${int(r, 120, 700)} KB`,
      status: 'Verified',
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════
   Costs — the budget the operation is measured against.
   ══════════════════════════════════════════════════════════════ */

export const COST_HEADS = [
  { key: 'fuel', label: 'Fuel and lubricants' },
  { key: 'maint', label: 'Maintenance and repair' },
  { key: 'tyres', label: 'Tyres' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'finance', label: 'Finance and leases' },
];

export const BUDGET = {
  fuel: 4_600_000,
  maint: 1_450_000,
  tyres: 980_000,
  consumables: 220_000,
  finance: 2_400_000,
};

export const vehSpend = (v) => (v.month?.fuel || 0) + (v.month?.maint || 0)
  + (v.month?.tyres || 0) + (v.month?.consumables || 0) + (v.finance?.instalment || 0);
export const vehCpk = (v) => (v.month?.meter ? vehSpend(v) / v.month.meter : 0);

/* ══════════════════════════════════════════════════════════════
   Telematics.
   ══════════════════════════════════════════════════════════════ */

export function buildTelematics(vehicles, people, n = 60) {
  const r = rng(60606);
  const kinds = [
    ['Harsh braking', 'gold'], ['Harsh acceleration', 'gold'], ['Over-speeding', 'red'],
    ['Excessive idling', 'gold'], ['Geofence exit', 'red'], ['Panic button', 'red'],
    ['Unauthorised movement', 'red'], ['Seatbelt not fastened', 'gold'], ['Cornering', 'gold'],
  ];
  const drivers = people.filter((u) => u.role === 'Operator');
  return Array.from({ length: n }, (_, i) => {
    const v = pick(r, vehicles);
    const d = drivers.find((x) => x.vehicle === v.plate) || pick(r, drivers) || people[0];
    const [kind, tone] = pick(r, kinds);
    return {
      id: 'EVT-' + String(70000 + i),
      kind,
      tone,
      vehicle: v.plate,
      driver: d.name,
      site: v.site,
      date: shift(-int(r, 0, 7)),
      time: `${String(int(r, 0, 23)).padStart(2, '0')}:${String(int(r, 0, 59)).padStart(2, '0')}`,
      where: pick(r, ['Haul road 2', 'Plant gate', 'N11 southbound', 'Pit ramp B', 'Weighbridge',
        'R555 near Burgersfort', 'Workshop apron', 'Tip head']),
      value: kind === 'Over-speeding' ? `${int(r, 62, 94)} km/h in a ${int(r, 40, 60)} zone`
        : kind === 'Excessive idling' ? `${int(r, 12, 74)} minutes`
          : kind === 'Geofence exit' ? 'Left the mine boundary'
            : `${(0.4 + r() * 0.9).toFixed(2)} g`,
      acknowledged: r() > 0.45,
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/* ══════════════════════════════════════════════════════════════
   Administration — the plumbing an ERP is judged on.
   ══════════════════════════════════════════════════════════════ */

export const SCHEDULED_JOBS = [
  ['Telematics position poll', 'Every 2 minutes', '18 Jun 09:58', '18 Jun 10:00', 'Success', 48, 3],
  ['Fuel card import', 'Daily 05:00', '18 Jun 05:00', '19 Jun 05:00', 'Success', 220, 26],
  ['Service due sweep', 'Daily 04:30', '18 Jun 04:30', '19 Jun 04:30', 'Success', 48, 4],
  ['Licence and COF expiry check', 'Daily 06:00', '18 Jun 06:00', '19 Jun 06:00', 'Warning', 48, 5],
  ['Concession lapse check', 'Daily 02:00', '18 Jun 02:00', '19 Jun 02:00', 'Success', 12, 2],
  ['Operator hours compliance run', 'Hourly', '18 Jun 09:00', '18 Jun 10:00', 'Success', 55, 8],
  ['Job profitability rebuild', 'Nightly 01:00', '18 Jun 01:00', '19 Jun 01:00', 'Success', 88, 41],
  ['Toll transaction reconciliation', 'Daily 07:00', '18 Jun 07:00', '19 Jun 07:00', 'Failed', 0, 14],
  ['Parts reorder proposal', 'Weekly, Monday', '15 Jun 06:30', '22 Jun 06:30', 'Success', 44, 6],
  ['Nightly backup', 'Daily 02:00', '18 Jun 02:00', '19 Jun 02:00', 'Success', 1, 96],
].map(([name, schedule, last, next, status, records, seconds]) =>
  ({ name, schedule, last, next, status, records, seconds }));

export const INTEGRATIONS = [
  ['Cartrack telematics', 'Telematics', 'Connected', '18 Jun 09:58', 0, 'Positions, ignition, harsh events and geofences'],
  ['MiX Telematics (legacy)', 'Telematics', 'Degraded', '18 Jun 08:14', 7, 'Older plant units still reporting on the legacy feed'],
  ['Engen fleet cards', 'Fuel', 'Connected', '18 Jun 05:00', 0, 'Daily transaction file with litres, site and meter reading'],
  ['Depot bunker feed', 'Fuel', 'Connected', '18 Jun 05:02', 0, 'Bunker draws per vehicle from the two site tanks'],
  ['SANRAL e-tag', 'Tolls', 'Down', '17 Jun 07:00', 12, 'Toll transactions matched to haulage jobs'],
  ['Natis licence renewals', 'Compliance', 'Manual', '—', 0, 'No API — renewals captured by the compliance officer'],
  ['Wesbank asset finance', 'Finance', 'Connected', '16 Jun 23:10', 0, 'Instalment schedules and settlement values'],
  ['Sage 300 general ledger', 'Finance', 'Connected', '18 Jun 01:20', 0, 'Cost postings by cost centre and site'],
  ['SMS gateway', 'Communications', 'Connected', '18 Jun 09:41', 1, 'Operator and supervisor notifications'],
  ['Mine weighbridge', 'Operations', 'Connected', '18 Jun 09:52', 0, 'Tonnages matched to the haulage job'],
].map(([name, kind, status, lastSync, errors, purpose]) =>
  ({ name, kind, status, lastSync, errors, purpose }));

export const MODULES = ['Fleet', 'Operators', 'Inspections', 'Dispatch', 'Workshop', 'Parts',
  'Fuel', 'Tyres', 'Compliance', 'Telematics', 'Costs', 'Procurement', 'Billing', 'Administration'];

export const ROLES = [
  { name: 'Administrator', scope: 'All sites', seats: 2,
    perms: Object.fromEntries(MODULES.map((m) => [m, 'Full'])) },
  { name: 'Safety officer', scope: 'All sites', seats: 5,
    perms: { Fleet: 'Edit', Operators: 'Edit', Inspections: 'Full', Dispatch: 'Read', Workshop: 'Edit',
      Parts: 'Read', Fuel: 'Read', Tyres: 'Read', Compliance: 'Full', Telematics: 'Read',
      Costs: 'None', Procurement: 'None', Billing: 'None', Administration: 'Read' } },
  { name: 'Supervisor', scope: 'Own site', seats: 9,
    perms: { Fleet: 'Edit', Operators: 'Edit', Inspections: 'Approve', Dispatch: 'Full', Workshop: 'Edit',
      Parts: 'Read', Fuel: 'Read', Tyres: 'Read', Compliance: 'Edit', Telematics: 'Full',
      Costs: 'Read', Procurement: 'None', Billing: 'None', Administration: 'None' } },
  { name: 'Workshop foreman', scope: 'Own site', seats: 3,
    perms: { Fleet: 'Edit', Operators: 'Read', Inspections: 'Read', Dispatch: 'Read', Workshop: 'Full',
      Parts: 'Full', Fuel: 'Read', Tyres: 'Full', Compliance: 'Edit', Telematics: 'Read',
      Costs: 'Read', Procurement: 'Edit', Billing: 'None', Administration: 'None' } },
  { name: 'Fuel administrator', scope: 'All sites', seats: 1,
    perms: { Fleet: 'Read', Operators: 'Read', Inspections: 'None', Dispatch: 'None', Workshop: 'None',
      Parts: 'None', Fuel: 'Full', Tyres: 'None', Compliance: 'None', Telematics: 'Read',
      Costs: 'Read', Procurement: 'None', Billing: 'None', Administration: 'None' } },
  { name: 'Operator', scope: 'Own vehicle', seats: 42,
    perms: { Fleet: 'Read', Operators: 'None', Inspections: 'Capture', Dispatch: 'Read', Workshop: 'None',
      Parts: 'None', Fuel: 'Capture', Tyres: 'None', Compliance: 'None', Telematics: 'None',
      Costs: 'None', Procurement: 'None', Billing: 'None', Administration: 'None' } },
];

export const APPROVALS = [
  { ref: 'APR-26-071', type: 'Work order authorisation', entity: 'WO-26-3221', amount: 184600,
    requestedBy: 'Priya Dlamini', requested: '17 Jun 15:20', status: 'Pending',
    reason: 'Brake overhaul above the R 150 000 workshop limit' },
  { ref: 'APR-26-072', type: 'Vehicle replacement', entity: 'GP 789 DBN', amount: 2140000,
    requestedBy: 'Thabo Nkosi', requested: '17 Jun 16:40', status: 'Pending',
    reason: 'Nine years old and running 41% above the class cost per kilometre' },
  { ref: 'APR-26-073', type: 'Fuel write-off', entity: 'FT-26-60122', amount: 7420,
    requestedBy: 'Refilwe Sekhukhune', requested: '16 Jun 11:05', status: 'Approved',
    reason: 'Bunker meter fault confirmed on site, credit received' },
  { ref: 'APR-26-074', type: 'Rate below floor', entity: 'PPC Aggregates', amount: 19800,
    requestedBy: 'Anton Williams', requested: '18 Jun 08:15', status: 'Pending',
    reason: 'Backhaul at R 21.40 per km against a floor of R 24.00' },
  { ref: 'APR-26-075', type: 'Purchase order', entity: 'PO-26-2209', amount: 386400,
    requestedBy: 'Kobus van der Merwe', requested: '17 Jun 09:32', status: 'Pending',
    reason: 'Undercarriage set for the D8T, above the R 250 000 stores limit' },
  { ref: 'APR-26-076', type: 'Overtime — workshop', entity: 'Lephalale night shift', amount: 38400,
    requestedBy: 'Priya Dlamini', requested: '15 Jun 18:02', status: 'Declined',
    reason: 'The backlog can be cleared inside normal hours' },
];

/* ══════════════════════════════════════════════════════════════
   Assembly. One call, in dependency order, so every reference
   inside the data set points at a record that exists.
   ══════════════════════════════════════════════════════════════ */

export function buildErp({ fleet, users, workOrders }) {
  const vehicles = enrichFleet(fleet);
  const people = enrichPeople(users, vehicles);
  const parts = buildParts();
  const jobs = buildJobs(vehicles, people);
  const fuel = buildFuel(vehicles, people);
  const tyres = buildTyres(vehicles);
  const wos = enrichWorkOrders(workOrders, vehicles, parts);
  const incidents = buildIncidents(vehicles, people);
  const invoices = buildInvoices(jobs);
  const purchaseOrders = buildPurchaseOrders(parts);
  const supplierInvoices = buildSupplierInvoices(purchaseOrders);
  const documents = buildDocuments(vehicles, people, wos);
  const events = buildTelematics(vehicles, people);

  /* an invoiced job knows which invoice carries it */
  invoices.forEach((inv) => inv.jobs.forEach((ref) => {
    const j = jobs.find((x) => x.ref === ref);
    if (j) j.invoice = inv.ref;
  }));

  return {
    vehicles,
    people,
    jobs,
    fuel,
    tyres,
    parts,
    workOrders: wos,
    incidents,
    invoices,
    purchaseOrders,
    supplierInvoices,
    documents,
    events,
    budgets: { ...BUDGET },
    scheduledJobs: SCHEDULED_JOBS,
    integrations: INTEGRATIONS,
    roles: ROLES,
    approvals: APPROVALS,
  };
}

/* ══════════════════════════════════════════════════════════════
   Inspection forms.

   A form is sections of items; a section carries the severity that
   applies to its items, and may be conditional (only shown when the
   operator ticks that condition). Modelled on the mining pre-use
   sheets SafeNexus replaces: No Go grounds the machine, Go But runs
   on a supervisor's concession with a repair clock.
   ══════════════════════════════════════════════════════════════ */

let TID = 0;
const sec = (title, severity, items, condition = null) => {
  const id = 'S' + ++TID;
  return { id, title, severity, condition, items: items.map((label, i) => ({ id: `${id}I${i}`, label })) };
};

export const RESULT_ORDER = ['Go', 'Go But', 'No Go', 'N/A'];
export const resultTone = (r) => ({ Go: 'green', 'Go But': 'gold', 'No Go': 'red', 'N/A': 'grey' }[r] || 'grey');
export const allItems = (tpl) =>
  tpl.sections.flatMap((s) => s.items.map((i) => ({ ...i, severity: s.severity, section: s.title, condition: s.condition })));

export const TEMPLATES = [
  {
    id: 'TPL-001',
    name: 'Pre-use inspection — LDV, crew bus and light vehicle',
    code: 'SN-MIN-328693', revision: 9, status: 'Published',
    owner: 'Engineering department',
    appliesTo: ['LDV bakkie', 'Crew bus', 'Panel van'],
    meterLabel: 'Start km reading', goButMaxDays: 30, requiresSupervisor: true,
    declaration:
      'I declare that I am appropriately authorised, sufficiently rested and alert to operate this vehicle. I declare that I am adhering to any restrictions or conditions on my certificate of fitness. If my health status changes before the expiry of my COF I will inform my supervisor as soon as possible. If the condition of the vehicle deteriorates I will park it safely and report the situation to my supervisor immediately.',
    note: 'Go-But items must be corrected within 30 days, except windows and seats which are corrected at the next service. A supervisor must sign if Go-But is marked.',
    sections: [
      sec('Vehicle condition', 'No Go', [
        'Wheel condition (rims, tyres, nuts)', 'Fire extinguisher', 'Emergency triangle',
        'Seat belts (in use)', 'Hooter', 'Reverse hooter', 'Brakes', 'Lights — brake',
        'Lights — reverse', 'Lights — rear', 'Lights — indicators', 'Lights — head',
        'Mirrors', 'Air conditioner', 'Key control / proxy', 'Stop blocks',
      ]),
      sec('Body', 'Go But', ['Windows and windscreen wipers', 'New bump marks', 'Window washer']),
      sec('If intended for a red permit area', 'No Go', [
        'Proximity detection system', 'Flag', 'Rotating / flashing light',
        'Two-way radio', 'Reflective tape condition',
      ], 'Red permit area'),
      sec('If towing a trailer', 'No Go', [
        'Wheel condition (rims, tyres, nuts)', 'Stop blocks', 'Safety chain or safety pin',
        'Lights — brake', 'Reflective tape condition',
      ], 'Towing a trailer'),
      sec('Weekly inspection — first working day of the week', 'Go But', [
        'Wheel nuts are secured', 'Oil level', 'Coolant level', 'Brake fluid level',
      ], 'Weekly check'),
    ],
    signoffs: ['Operator', 'Supervisor'],
  },
  {
    id: 'TPL-002',
    name: 'Pre-use inspection — haul truck and heavy plant',
    code: 'SN-MIN-019', revision: 3, status: 'Published',
    owner: 'Engineering department',
    appliesTo: ['Haul truck', 'Excavator', 'Front-end loader'],
    meterLabel: 'Machine hours — start of shift', goButMaxDays: 14, requiresSupervisor: true,
    declaration:
      'No Go: the machine may not be used at all until the defect is repaired and signed off. Go But: the machine may still operate, subject to evaluation by the maintenance supervisor.',
    note: 'The maintenance supervisor must record when a Go-But condition will be rectified.',
    sections: [
      sec('Safety critical', 'No Go', [
        'Operator certificate of fitness available and current', 'Major leaks (oil)',
        'Major leaks (diesel)', 'Handheld fire extinguisher', 'Main isolator and isolation lock',
        'All lights working', 'Windscreen condition and wipers', 'Operating controls',
        'Reverse hooter and hooter', 'Safety belts', 'Battery secured and terminals insulated',
      ]),
      sec('Engine and driveline', 'No Go', ['Engine oil level', 'Hydraulic levels', 'Radiator cap', 'Air cleaner indicator']),
      sec('Brakes', 'No Go', ['Service brake test', 'Park brake test', 'Door interlock test']),
      sec('Cab', 'Go But', ['Cleanliness of cab', 'Seats', 'Warning stickers (noise level)']),
    ],
    signoffs: ['Operator', 'Supervisor', 'Artisan'],
  },
];

export const templateFor = (vehicleType) =>
  TEMPLATES.find((t) => t.appliesTo.includes(vehicleType)) || TEMPLATES[0];

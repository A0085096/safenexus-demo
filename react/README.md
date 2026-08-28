# SafeNexus ERP — React

A fleet management ERP for a single mining tenant, as a Vite + React
application. It began as the pre-use inspection platform in
[`../safenexus.html`](../safenexus.html) — same Office-style desktop
shell, same SafeNexus palette — and has grown into the whole operation
around those inspections: the haulage jobs the fleet runs, the diesel it
burns, the tyres and parts it consumes, the workshop that repairs it,
the incidents that damage it, the contracts that finance it and the
invoices that pay for it.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
npm run preview
```

## Signing in

The app opens on the sign-in screen. The demo account is
**admin@acmecorp.co.za** / **safenexus**; any other credentials are
rejected the way the real service would reject them. You can also walk
the four-step company registration, and the forgot-password flow ends at
a working reset screen. Nothing leaves the browser — the verification
code is printed on screen instead of emailed.

## One tenant per workspace

SafeNexus is multi-tenant: a company registers and works its own fleet
inside its own workspace. There is no cross-company view anywhere in the
app. The scope selector in the navigation pane moves between *this
company's sites*, and every register, report and chart is that company's
own. `src/data.js` seeds one tenant, Acme Mining Corp, with three sites.

## Why the inspection platform became an ERP

A mine that inspects every vehicle before every shift already holds the
expensive half of a fleet ERP: the meter readings, the defects, the
operators and the paper trail that proves it. The rest of the modules
are what those records are *for*. So nothing here is a separate system
bolted alongside the inspections — a failed sheet raises a defect, the
defect raises a job card, the job card consumes parts and labour, the
parts come off a purchase order, the cost lands on the vehicle, and the
vehicle's cost per kilometre is what decides whether it gets replaced.

## The modules

Every screen is a working register over live state. Nothing is a static
mock-up, and every action writes its own audit entry.

**Operations**

- **Dispatch** — haulage jobs costed from the lane distance, the
  vehicle's own consumption and the standard operator rate, so the margin
  is real before the job is committed. A plan board across the week, and
  lane profitability ranked by margin per kilometre — because a lane that
  loses money loses it every time it runs.
- **Fleet** — the register the platform hangs off: meter, service
  position, certificate days, utilisation, cost per unit run and open
  defects, per vehicle.
- **Operators** — the people register read the way a fleet reads it:
  what they may legally operate, how well they operate it, their hours
  against the 60-hour ceiling and their behaviour score.
- **Inspections** — the original module, unchanged: sheets, defects and
  the form register, with the go-but concession clock.
- **Workshop** — job cards with labour hours, parts issued and what the
  job actually cost, plus a service planner that forecasts from each
  machine's own running rate rather than a fleet average.
- **Parts** — stores with months of cover, dead-stock detection and
  issuing that moves a part out of the bin and onto the job card, so the
  workshop cost and the stock value cannot disagree.
- **Tyres** — managed by position and judged on cost per kilometre.
  Under 3 mm stops being a cost question and becomes a legal one.
- **Fuel** — every fill measured against the model target for that
  vehicle type. Anything that will not reconcile is an exception until a
  person clears it with a reason, in the trail.
- **Telematics** — units, events and operator behaviour. An offline unit
  takes its vehicle's figures with it, so offline units come first.

**Compliance and risk**

- **Compliance** — three questions, any one of which stops a vehicle:
  is the machine legal, is the person legal, and is anything running on a
  concession that has quietly lapsed.
- **Documents** — every certificate the operation holds, read as days
  remaining rather than as a date.
- **Incidents** — four investigation actions per incident, which must be
  closed before the incident can be. An incident closed with actions
  outstanding is a record, not an investigation.

**Commercial**

- **Costs** — cost per kilometre (or per hour, for plant) against the
  average for the same class, and budget against actual by head.
- **Procurement** — orders out, supplier invoices in, and the three-way
  match between the order, the receipt and the invoice.
- **Billing** — invoices raised from delivered jobs with a proof of
  delivery in, then the aging profile and the collection rate.
- **Contracts** — how each asset is held, and a replacement case scored
  from age, cost against class, and whether the finance term has run out.

**Administration**

- **Reports** — seventeen definitions built from the live store, with a
  column chooser, CSV and JSON export, a print stylesheet, a run history
  and schedules that can be paused and resumed.
- **Analytics**, **Hierarchy**, **Audit log**, **Company**, **Settings** —
  as before, now reading a much larger data set.
- **Admin** — the plumbing an ERP is judged on once it is live: nightly
  jobs and whether they succeeded, integration health, an editable
  permission matrix, and the approvals queue for anything above the
  limit the requester may authorise.

## Rules that actually bite

The demo is worth clicking because the guards are real:

- A pre-use **No Go** grounds the vehicle and raises a defect; a **Go
  But** runs only on a supervisor's signed concession, and a concession
  that passes its date becomes **Overdue** — a vehicle running on a
  lapsed go-but is no better than one running with no inspection.
- A vehicle cannot be returned to service while a no-go defect is open.
- A job cannot be invoiced without a proof of delivery.
- A purchase order cannot be sent before it is approved, and one above
  R 250 000 needs an approval to get there.
- A supplier invoice in query cannot be paid.
- An incident cannot be closed with investigation actions outstanding.
- A part cannot be issued in a quantity the bin does not hold.
- A meter reading cannot go backwards — a fill that says otherwise is
  captured as an exception rather than rejected, because the fill
  happened either way and somebody has to explain it.
- Changing the go-but window on the Settings tab moves the runner, the
  aging bins, the defect filters and the status bar with it.

## The data set

`src/erp/seed.js` assembles everything from a fixed PRNG, in dependency
order, so every cross-reference points at a record that exists and the
demo is identical on every load. One date — 18 June 2026 — anchors every
"expires in n days" and every aging bin, so nothing drifts.

The ten hand-written vehicles and eleven people in `src/data.js` are
untouched: every existing defect, sheet and work order still points at
them. The ERP fields are added to those records, and the rest of the
fleet and workforce is generated around them.

## Layout

```
src/
  theme.js               design tokens + the validated chart palettes
  data.js                the hand-written core (tenant, sites, the named fleet and people)
  erp/seed.js            the ERP data set — builders, derived helpers, the clock, money
  styles.css             the design system — shared verbatim with ../safenexus.html
  shell/
    TitleBar.jsx         quick-access commands, search, account
    Ribbon.jsx           tab strip, contextual tab, command groups
    ribbon.js            the command map: tabs, ribbon groups, queues, status messages
    NavPane.jsx          site scope + the queues that need working, with live counts
    StatusBar.jsx        platform counts, live command message, row density
    Backstage.jsx        the File screen
  components/
    ui.jsx               badges, buttons, panels, list rows, DataGrid, Dialog
    erpUi.jsx            KPI strip, expiry-as-days, money, share bars, breakdowns
    panes.jsx            reading panes: vehicle, operator, sheet, defect, job card, form
    erpPanes.jsx         reading panes: job, fill, tyre, part, order, incident, invoice, document
    Toasts.jsx           the notification stack — tone, title, dismiss and undo
  charts/                recharts wrappers, one hand-rolled isometric field, one tooltip shape
  screens/               one file per module
  auth/AuthShell.jsx     sign in, register, forgot and reset password, lock screen
  inspection/            the forms and the working sheet
  store.jsx              the state every module mutates, plus the audit trail
```

## Colour

`theme.js` holds three palettes, and they do different jobs:

- **Brand / shell** — navy `#0C3D7A` chrome, primary `#1762B5`, surface `#E6F1FB`.
- **Chart series** (`SERIES`) — derived from the brand hues, then checked for
  the lightness band, chroma floor, colour-vision separation and contrast
  against the chart surface. Assign in the given order; never cycle it.
- **Sequential** (`SEQ`) — one hue, light to dark, for ordered bins such as
  defect age and invoice aging. Status colours (`OUTCOME`) stay reserved
  for state.

## About the 3D chart

`Iso3D` is a real isometric projection, not a perspective one: every floor
cell is identical, so a column's height means the same thing wherever it
sits. Columns paint back to front, rows sort tallest-to-the-back so none is
hidden, and each series is direct-labelled at its peak. The same figures are
one click away as 2D columns and as a table — 3D is the view, never the only
way to read the number.

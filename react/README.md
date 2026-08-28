# SafeNexus ERP — React

The SafeNexus fleet-safety admin platform as a Vite + React application.
It is the componentised twin of the single-file build at
[`../safenexus.html`](../safenexus.html): same Office-style desktop shell,
same SafeNexus palette, same data — split into components, with charts
rendered by [recharts](https://recharts.org) and one custom isometric
component.

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
app — no tenant may see another tenant's operators, vehicles, sheets or
defects. The scope selector in the navigation pane moves between *this
company's sites*, and every register, report and chart is that company's
own. `src/data.js` seeds one tenant, Acme Mining Corp, with three sites.

## What actually works

State lives in one store (`src/store.jsx`), and every action that changes
a record writes its own audit entry, so the trail cannot drift from the
data:

- **Inspection forms** — the third view on the Inspections tab is the
  form register: which sheet is in force, at which revision, what it
  asks, its go-but window and its sign-off chain. A draft cannot be used
  to capture until it is published, and publishing or opening a revision
  is audited.
- **Pre-use inspections** — the runner loads the form that applies to the
  vehicle's type. Conditional sections (red permit area, towing, weekly)
  appear when ticked and the vehicle's own permit pre-ticks its section.
  Sections collapse and carry their own progress. The rules the paper
  sheet encodes are enforced: the declaration must be accepted, a failed
  item must carry a note saying what is wrong (and can take photographs),
  the operator must sign, no item may be left unanswered, and the meter
  cannot go backwards. A **No Go** grounds the vehicle and raises a
  defect; a **Go But** runs only on a supervisor's signed concession,
  and without one the sheet counts as a No Go. Forms with delay capture
  ask for the time reported, the time repaired and the reason.
- **Defect register** — every defect carries its section, who raised it,
  a rectify-by date and whether the concession is signed. A concession
  that passes its date becomes **Overdue** — a vehicle running on a
  lapsed go-but is no better than one running with no inspection at all.
  Closing the last open no-go returns the vehicle to service.
- **Workshop** — a defect becomes a work order that keeps the link back
  to it, so a grounded vehicle traces from the sheet that failed it to
  the job that clears it. Work orders move through authorisation, parts,
  progress, road test and completion.
- **Vehicle management** — add, assign, unassign, take off road, return
  to service, update the odometer and book a service, each with its own
  dialog and its own guard: returning a grounded vehicle to service is
  refused while a no-go defect is still open.
- **User management** — a record pane per person (contact, reporting line,
  licence, vehicle, inspection history, competencies), then edit, assign
  and unassign a vehicle, reset password, suspend, reactivate and delete.
  Delete asks for the surname and is undoable from its toast; suspending
  is undoable the same way.
- **Settings that mean something** — the inspection rules page is read by
  the runner, the defect clock, the status bar and every threshold on the
  platform. Change the go-but window to 14 days and the runner, the aging
  bins, the defect filters and the status bar all follow. Edits are
  staged, saved as a set, and written to the audit trail.
- **Reports** — scope and period parameters, seven report definitions
  built from the live store, a column chooser, CSV and JSON export, a
  print stylesheet, a run history that records who generated what, and
  schedules that can be paused and resumed.
- **Analytics** — every figure compared with the previous period, pass
  rate against the configured target, a re-cuttable "where it fails"
  view (company, shift, weekday, item), and insight rows that drill
  through to the register that fixes them.
- **Audit trail** — filter by kind, actor and severity, search the text,
  open any entry for the actor, record, channel, address and session
  behind it, export CSV or JSON, and run an integrity check.
- **Companies** — registering writes through to the register.

## Layout

```
src/
  theme.js               design tokens + the validated chart palettes
  data.js                the mock data set (companies, users, fleet, inspections, audit)
  styles.css             the design system — shared verbatim with ../safenexus.html
  shell/
    TitleBar.jsx         quick-access commands, search, account
    Ribbon.jsx           tab strip, contextual tab, command groups
    ribbon.js            the command map: tabs, ribbon groups, status messages
    NavPane.jsx          company scope + jump-to list, draggable splitter
    StatusBar.jsx        platform counts, live command message, row density
    Backstage.jsx        the File screen
  components/ui.jsx      badges, buttons, panels, list rows, DataGrid, Dialog
  charts/
    VolumeChart.jsx      stacked columns — volume by outcome (recharts)
    FleetDonut.jsx       fleet split (recharts)
    AgingChart.jsx       defect age bins on the sequential ramp (recharts)
    GroupedBars.jsx      the flat reading of the isometric field (recharts)
    Iso3D.jsx            isometric column field (hand-rolled SVG)
    Sparkline.jsx        inline trend marks for KPI tiles and report rows
    tooltip.jsx          one tooltip shape for every chart
  screens/
    Dashboard.jsx        KPI strip, charts, company performance report
    Registers.jsx        companies, users, fleet, inspections, defects, audit log
    Forms.jsx            the inspection form register
    Workshop.jsx         work orders raised from defects
    Reports.jsx          report definitions, the generated document and CSV export
    Misc.jsx             hierarchy, compliance, company profile, analytics, settings
  auth/
    AuthShell.jsx        sign in, register a company, forgot and reset password,
                         email verification, lock screen
  inspection/
    templates.js         the inspection forms, as sections of items with severities
    InspectionRunner.jsx the working sheet — capture, rules, submission
  components/
    panes.jsx            reading panes: vehicle, user, completed sheet, defect,
                         work order, inspection form
    Toasts.jsx           the notification stack — tone, title, dismiss and undo
  store.jsx              the state every module mutates, plus the audit trail
```

## Colour

`theme.js` holds three palettes, and they do different jobs:

- **Brand / shell** — navy `#0C3D7A` chrome, primary `#1762B5`, surface `#E6F1FB`.
- **Chart series** (`SERIES`) — derived from the brand hues, then checked for
  the lightness band, chroma floor, colour-vision separation and contrast
  against the chart surface. Assign in the given order; never cycle it.
- **Sequential** (`SEQ`) — one hue, light to dark, for ordered bins such as
  defect age. Status colours (`OUTCOME`) stay reserved for state.

## About the 3D chart

`Iso3D` is a real isometric projection, not a perspective one: every floor
cell is identical, so a column's height means the same thing wherever it
sits. Columns paint back to front, rows sort tallest-to-the-back so none is
hidden, and each series is direct-labelled at its peak. The same figures are
one click away as 2D columns and as a table — 3D is the view, never the only
way to read the number.

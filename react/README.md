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

## What actually works

State lives in one store (`src/store.jsx`), and every action that changes
a record writes its own audit entry, so the trail cannot drift from the
data:

- **Pre-use inspections** — `Inspect` on a vehicle opens the form that
  applies to its type. Conditional sections (red permit area, towing,
  weekly) appear when ticked, the sheet cannot be submitted with items
  unanswered, and the meter reading cannot go backwards. A **No Go**
  item grounds the vehicle and raises a defect; a **Go But** item needs
  the supervisor's concession, and without it the sheet counts as a
  No Go. Submitting updates the vehicle, the defect register, the
  dashboard and the audit log.
- **Defect register** — the second view on the Inspections tab. Closing
  the last open no-go on a vehicle returns it to service automatically;
  go-but items carry the 30-day repair clock and can be extended.
- **Vehicle management** — add, assign, unassign, take off road, return
  to service, update the odometer and book a service, each with its own
  dialog and its own guard: returning a grounded vehicle to service is
  refused while a no-go defect is still open.
- **User management** — a record pane per person (contact, reporting line,
  licence, vehicle, inspection history, competencies), then edit, assign
  and unassign a vehicle, reset password, suspend, reactivate and delete.
  Delete asks for the surname and is undoable from its toast; suspending
  is undoable the same way.
- **Learning** — courses, per-person records and the gap list: a required
  course that is missing or expired is a gap, and the inspection runner
  warns when the operator's competency has lapsed.
- **Reports** — each report builds from the live store and renders as a
  document with a summary strip and a table, exportable as real CSV.
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
    Learning.jsx         competency records, the course catalogue and the gap list
    Reports.jsx          report definitions, the generated document and CSV export
    Misc.jsx             hierarchy, compliance, company profile, analytics, settings
  auth/
    AuthShell.jsx        sign in, register a company, forgot and reset password,
                         email verification, lock screen
  inspection/
    templates.js         the inspection forms, as sections of items with severities
    InspectionRunner.jsx the working sheet — capture, rules, submission
  components/
    panes.jsx            reading panes: vehicle, user, completed sheet, defect
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

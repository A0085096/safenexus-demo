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
    Registers.jsx        companies, users, fleet, inspections, audit log
    Misc.jsx             hierarchy, compliance, company profile, reports, analytics, settings
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

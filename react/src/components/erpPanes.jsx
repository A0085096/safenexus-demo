import React from 'react';
import {
  Route, Fuel as FuelIcon, CircleDot, Package, ShoppingCart, ShieldAlert, Receipt, Files,
  Truck, User, Wrench, CheckCircle2, XCircle, Play, Printer, Mail, Ruler, Trash2, Send,
  PackageCheck, PackageMinus, Banknote, FileCheck2, AlertTriangle, MapPin, Clock, Coins,
  SlidersHorizontal, BadgeCheck, Download, Radio,
} from 'lucide-react';
import { Btn, Badge, SecHead, KV } from './ui.jsx';
import { Expiry, Money, Signed } from './erpUi.jsx';
import { siteName } from '../data.js';
import {
  R, num, fmtDate, fmtShort, until, jobMargin, poTotal, stockValue,
  invNet, invTotal, invPaid, invDue, invState,
} from '../erp/seed.js';

const Empty = ({ icon: Icon, text }) => (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
    <Icon size={26} strokeWidth={1.4} style={{ marginBottom: 10, opacity: 0.6 }} />
    <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>{text}</div>
  </div>
);

const Head = ({ eyebrow, title, badges }) => (
  <>
    <div style={{ fontSize: 12, color: 'var(--brand-dark)' }}>{eyebrow}</div>
    <div style={{ font: '600 19px var(--num)', letterSpacing: '.4px', margin: '2px 0 8px' }}>{title}</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{badges}</div>
  </>
);

const Acts = ({ children }) => (
  <>
    <SecHead>Actions</SecHead>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
  </>
);

/* ══════════════════════════════════════════════════════════════
   Haulage job
   ══════════════════════════════════════════════════════════════ */
export function JobPane({ job, run }) {
  if (!job) return <Empty icon={Route} text="Select a haulage job to work it." />;
  const j = job;
  const margin = jobMargin(j);
  const pct = j.revenue ? (margin / j.revenue) * 100 : 0;

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${j.customer} · ${j.priority}`} title={j.ref}
        badges={<>
          <Badge tone={{ Delivered: 'green', 'In transit': 'blue', Loading: 'teal', Planned: 'grey', Cancelled: 'red' }[j.status] || 'grey'}>{j.status}</Badge>
          {j.lateBy > 0 && <Badge tone="gold">{j.lateBy}h late</Badge>}
          {j.status === 'Delivered' && !j.pod && <Badge tone="red">No POD</Badge>}
          {j.invoice && <Badge tone="purple">{j.invoice}</Badge>}
        </>} />

      {margin < 0 && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>This job runs at a loss of {R(-margin)}. The lane rate is below what it costs to move the load.</span>
        </div>
      )}

      <SecHead>The load</SecHead>
      <KV k="From" v={j.origin} />
      <KV k="To" v={j.destination} />
      <KV k="Route" v={`${j.route} · ${num(j.distance)} km · about ${j.hours} hours`} />
      <KV k="Cargo" v={`${j.cargo} · ${j.tons} t`} />
      <KV k="Departs" v={`${fmtDate(j.depart)} at ${j.departTime}`} />
      <KV k="Expected" v={fmtDate(j.eta)} />

      <SecHead>Resources</SecHead>
      <KV k="Vehicle" v={<button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openJobVehicle')}>{j.vehicle}</button>} />
      <KV k="Fleet number" v={j.fleetNo} />
      <KV k="Operator" v={<button className="link" onClick={() => run('openJobDriver')}>{j.driver}</button>} />
      <KV k="Site" v={siteName(j.site)} />

      <SecHead note="revenue less the cost of moving it">Commercials</SecHead>
      <KV k="Revenue" v={<Money v={j.revenue} bold />} />
      <KV k="Fuel" v={R(j.fuelCost)} />
      <KV k="Tolls" v={R(j.tollCost)} />
      <KV k="Operator time" v={R(j.driverCost)} />
      <KV k="Other running cost" v={R(j.other)} />
      <KV k="Margin" v={<span><Signed v={margin} /> <span style={{ color: 'var(--text3)', fontSize: 11.5 }}>({pct.toFixed(1)}%)</span></span>} />
      <KV k="Rate per kilometre" v={`R ${(j.revenue / j.distance).toFixed(2)}`} />

      <Acts>
        {j.status === 'Planned' && <Btn small primary icon={Play} onClick={() => run('jobStatus:Loading')}>Start loading</Btn>}
        {j.status === 'Loading' && <Btn small primary icon={Play} onClick={() => run('jobStatus:In transit')}>Dispatch</Btn>}
        {j.status === 'In transit' && <Btn small primary icon={CheckCircle2} onClick={() => run('jobStatus:Delivered')}>Mark delivered</Btn>}
        {j.status === 'Delivered' && !j.pod && <Btn small primary icon={FileCheck2} onClick={() => run('recordPod')}>Capture the POD</Btn>}
        {j.status === 'Delivered' && j.pod && !j.invoice && <Btn small primary icon={Receipt} onClick={() => run('raiseInvoice')}>Raise an invoice</Btn>}
        {j.status !== 'Delivered' && j.status !== 'Cancelled' && <Btn small danger icon={XCircle} onClick={() => run('jobStatus:Cancelled')}>Cancel</Btn>}
        <Btn small icon={Radio} onClick={() => run('goto:telematics')}>Track</Btn>
        <Btn small icon={Printer} onClick={() => run('print')}>Run sheet</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Fuel transaction
   ══════════════════════════════════════════════════════════════ */
export function FuelPane({ tx, run }) {
  if (!tx) return <Empty icon={FuelIcon} text="Select a transaction to check it." />;
  const f = tx;
  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${f.station} · ${f.card}`} title={f.ref}
        badges={<>
          <Badge tone={f.status === 'Verified' ? 'green' : f.status === 'Exception' ? 'red' : 'gold'}>{f.status}</Badge>
          <Badge tone="grey">{num(f.litres)} L</Badge>
        </>} />

      {f.exception && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>{f.exception}. Nothing is posted against this vehicle’s cost until somebody clears it with a reason.</span>
        </div>
      )}

      <SecHead>The fill</SecHead>
      <KV k="When" v={`${fmtDate(f.date)} at ${f.time}`} />
      <KV k="Vehicle" v={<button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openFuelVehicle')}>{f.vehicle}</button>} />
      <KV k="Operator" v={f.driver} />
      <KV k="Site" v={siteName(f.site)} />
      <KV k="Litres" v={`${num(f.litres)} L at R ${f.rate.toFixed(2)}`} />
      <KV k="Amount" v={<Money v={f.amount} bold />} />

      <SecHead note="what the fill bought, against the model">Consumption</SecHead>
      <KV k="Meter reading" v={num(f.meter)} />
      <KV k="Distance since the last fill" v={num(f.since)} />
      <KV k="Achieved" v={`${f.consumption} ${f.unit}`} />
      <KV k="Against target" v={f.variance
        ? <span style={{ fontWeight: 600, color: Math.abs(f.variance) > 12 ? 'var(--red)' : 'var(--text)' }}>
            {f.variance > 0 ? '+' : ''}{f.variance}%
          </span>
        : '—'} />
      {f.clearedReason && <KV k="Exception cleared" v={f.clearedReason} />}

      <Acts>
        {f.exception
          ? <Btn small primary icon={CheckCircle2} onClick={() => run('clearException')}>Clear the exception</Btn>
          : f.status !== 'Verified'
            ? <Btn small primary icon={CheckCircle2} onClick={() => run('verifyFuel')}>Verify</Btn>
            : <Btn small icon={Truck} onClick={() => run('openFuelVehicle')}>Open the vehicle</Btn>}
        <Btn small icon={Printer} onClick={() => run('print')}>Print</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Tyre
   ══════════════════════════════════════════════════════════════ */
export function TyrePane({ tyre, run }) {
  if (!tyre) return <Empty icon={CircleDot} text="Select a tyre to manage it." />;
  const t = tyre;
  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${t.brand} · ${t.size}`} title={t.serial}
        badges={<>
          <Badge tone={{ New: 'green', Running: 'blue', Watch: 'gold', Scrap: 'red', Scrapped: 'grey' }[t.status]}>{t.status}</Badge>
          <Badge tone="grey">{t.position}</Badge>
          {t.retreads > 0 && <Badge tone="purple">retread ×{t.retreads}</Badge>}
        </>} />

      {t.tread < 3 && t.status !== 'Scrapped' && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>
            {t.tread} mm is below the 3 mm legal tread depth. {t.vehicle} may not be operated on it, and the
            pre-use sheet will fail on wheel condition until it is replaced.
          </span>
        </div>
      )}

      <SecHead>Fitment</SecHead>
      <KV k="Vehicle" v={<button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openTyreVehicle')}>{t.vehicle}</button>} />
      <KV k="Fleet number" v={t.fleetNo} />
      <KV k="Position" v={t.position} />
      <KV k="Site" v={siteName(t.site)} />
      <KV k="Fitted" v={`${fmtDate(t.fittedOn)} at ${num(t.fittedAt)}`} />

      <SecHead>Condition</SecHead>
      <KV k="Tread depth" v={<span style={{ fontWeight: 600, color: t.tread < 3 ? 'var(--red)' : t.tread < 5 ? 'var(--gold)' : 'var(--green)' }}>{t.tread} mm</span>} />
      <KV k="Pressure" v={`${t.pressure} kPa`} />
      <KV k="Distance run" v={num(t.run)} />

      <SecHead note="the only fair way to compare tyres">Cost</SecHead>
      <KV k="Fitted cost" v={<Money v={t.cost} />} />
      <KV k="Cost per kilometre" v={<span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>R {t.cpk.toFixed(3)}</span>} />
      {t.scrapped && <KV k="Scrapped" v={`${t.scrapped} — ${t.scrapReason}`} />}

      <Acts>
        <Btn small primary icon={Ruler} onClick={() => run('logTread')}>Record tread</Btn>
        {t.status !== 'Scrapped' && <Btn small danger icon={Trash2} onClick={() => run('scrapTyre')}>Scrap</Btn>}
        <Btn small icon={Wrench} onClick={() => run('raiseWO')}>Work order</Btn>
        <Btn small icon={Truck} onClick={() => run('openTyreVehicle')}>Open the vehicle</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Part
   ══════════════════════════════════════════════════════════════ */
export function PartPane({ part, run }) {
  if (!part) return <Empty icon={Package} text="Select a part to issue or order it." />;
  const p = part;
  const monthly = p.usage90 / 3;
  const cover = monthly ? p.qty / monthly : null;

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${p.category} · ${p.sku}`} title={p.desc}
        badges={<>
          <Badge tone={p.qty === 0 ? 'red' : p.qty <= p.reorder ? 'gold' : 'green'}>
            {p.qty === 0 ? 'Out of stock' : p.qty <= p.reorder ? 'Below reorder' : 'In stock'}
          </Badge>
          <Badge tone="grey">bin {p.bin}</Badge>
          {p.onOrder > 0 && <Badge tone="blue">{p.onOrder} on order</Badge>}
        </>} />

      {p.qty === 0 && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>
            Nothing on the shelf. A job card needing this part waits {p.lead} days for the supplier
            {p.onOrder ? ', and an order is already out' : ' — and nothing is on order'}.
          </span>
        </div>
      )}

      <SecHead>Stock</SecHead>
      <KV k="On hand" v={<span style={{ fontWeight: 600 }}>{p.qty}</span>} />
      <KV k="Reorder level" v={p.reorder} />
      <KV k="On order" v={p.onOrder || '—'} />
      <KV k="Store" v={`${siteName(p.store)} · bin ${p.bin}`} />
      <KV k="Cover" v={cover == null ? 'no movement in ninety days' : `${cover.toFixed(1)} months at the current rate`} />

      <SecHead>Movement and value</SecHead>
      <KV k="Used, last 90 days" v={`${p.usage90} (${monthly.toFixed(1)} a month)`} />
      <KV k="Last issued" v={fmtDate(p.lastIssued)} />
      <KV k="Unit cost" v={<Money v={p.unitCost} />} />
      <KV k="Stock value" v={<Money v={stockValue(p)} bold />} />

      <SecHead>Supply</SecHead>
      <KV k="Supplier" v={p.supplier} />
      <KV k="Lead time" v={`${p.lead} days`} />

      <Acts>
        <Btn small primary icon={PackageMinus} onClick={() => run('issuePart')}>Issue to a job card</Btn>
        <Btn small icon={ShoppingCart} onClick={() => run('orderPart')}>Raise an order</Btn>
        <Btn small icon={SlidersHorizontal} onClick={() => run('adjustStock')}>Adjust</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Purchase order
   ══════════════════════════════════════════════════════════════ */
export function POPane({ po, run }) {
  if (!po) return <Empty icon={ShoppingCart} text="Select a purchase order to work it." />;
  const p = po;
  const net = p.lines.reduce((a, l) => a + l.qty * l.price, 0);

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={p.supplier} title={p.ref}
        badges={<>
          <Badge tone={{ Draft: 'grey', 'Awaiting approval': 'gold', Sent: 'blue', 'Part received': 'teal', Received: 'green' }[p.status]}>{p.status}</Badge>
          {p.workOrder && <Badge tone="purple">{p.workOrder}</Badge>}
          {p.status !== 'Received' && until(p.expected) < 0 && <Badge tone="red">{-until(p.expected)}d late</Badge>}
        </>} />

      <SecHead>The order</SecHead>
      <KV k="Supplier" v={p.supplier} />
      <KV k="Raised by" v={`${p.raisedBy} on ${fmtDate(p.raised)}`} />
      <KV k="Expected" v={p.status === 'Received' ? 'received' : <Expiry date={p.expected} />} />
      <KV k="Delivering to" v={siteName(p.site)} />
      <KV k="Against" v={p.workOrder
        ? <button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openWO:' + p.workOrder)}>{p.workOrder}</button>
        : 'stock replenishment'} />

      <SecHead note={`${p.lines.length} line${p.lines.length === 1 ? '' : 's'}`}>Lines</SecHead>
      {p.lines.map((l, i) => (
        <div key={i} className="sheet-row">
          <span className="s">{l.desc}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text3)', fontFamily: 'var(--num)' }}>{l.qty} × {R(l.price)}</span>
          <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{R(l.qty * l.price)}</span>
        </div>
      ))}
      <KV k="Net" v={R(net)} />
      <KV k="VAT at 15%" v={R(net * 0.15)} />
      <KV k="Total" v={<Money v={poTotal(p)} bold />} />

      <Acts>
        {p.status === 'Draft' && <Btn small primary icon={CheckCircle2} onClick={() => run('poStatus:Awaiting approval')}>Submit for approval</Btn>}
        {p.status === 'Awaiting approval' && <Btn small primary icon={Send} onClick={() => run('poStatus:Sent')}>Approve and send</Btn>}
        {(p.status === 'Sent' || p.status === 'Part received') && <Btn small primary icon={PackageCheck} onClick={() => run('poStatus:Received')}>Receive into stock</Btn>}
        <Btn small icon={Printer} onClick={() => run('print')}>Print</Btn>
        <Btn small icon={Mail} onClick={() => run('email')}>Email the supplier</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Incident
   ══════════════════════════════════════════════════════════════ */
export function IncidentPane({ incident, run, onAction }) {
  if (!incident) return <Empty icon={ShieldAlert} text="Select an incident to investigate it." />;
  const i = incident;
  const done = i.actions.filter((a) => a.done).length;

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${i.type} · ${fmtDate(i.date)}`} title={i.ref}
        badges={<>
          <Badge tone={{ Critical: 'red', Major: 'gold', Moderate: 'blue', Minor: 'grey' }[i.severity]}>{i.severity}</Badge>
          <Badge tone={{ Open: 'red', Investigating: 'gold', Closed: 'green' }[i.status]}>{i.status}</Badge>
          {i.injuries > 0 && <Badge tone="red">{i.injuries} injured</Badge>}
          {i.thirdParty && <Badge tone="purple">Third party</Badge>}
        </>} />

      {i.status === 'Closed' && done < i.actions.length && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>Closed with {i.actions.length - done} action(s) outstanding. An incident closed this way is a record, not an investigation.</span>
        </div>
      )}

      <SecHead>What happened</SecHead>
      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text2)', padding: '2px 0 8px' }}>{i.description}</div>
      <KV k="Where" v={i.location} />
      <KV k="Site" v={siteName(i.site)} />
      <KV k="Vehicle" v={<button className="link" style={{ fontFamily: 'var(--num)' }} onClick={() => run('openIncidentVehicle')}>{i.vehicle}</button>} />
      <KV k="Operator" v={<button className="link" onClick={() => run('openIncidentDriver')}>{i.driver}</button>} />
      <KV k="Reported by" v={i.reportedBy} />

      <SecHead note={`${done} of ${i.actions.length} done`}>Investigation</SecHead>
      {i.actions.map((a, n) => (
        <div key={n} className="sheet-row" style={{ cursor: 'pointer' }} onClick={() => onAction(i.ref, n)}>
          {a.done
            ? <CheckCircle2 size={15} strokeWidth={1.9} color="var(--green)" />
            : <XCircle size={15} strokeWidth={1.9} color="var(--text3)" />}
          <span className="s" style={{ color: a.done ? 'var(--text2)' : 'var(--text)' }}>{a.text}</span>
        </div>
      ))}

      <SecHead>Cost and claim</SecHead>
      <KV k="Estimated cost" v={<Money v={i.estimate} bold />} />
      <KV k="Policy excess" v={R(i.excess)} />
      <KV k="Claim" v={i.claim || <span style={{ color: 'var(--text3)' }}>not lodged</span>} />
      <KV k="Lost days" v={i.lostDays || '—'} />

      <Acts>
        {i.status === 'Open' && <Btn small primary icon={Play} onClick={() => run('incidentStatus:Investigating')}>Start investigating</Btn>}
        {!i.claim && <Btn small primary icon={FileCheck2} onClick={() => run('lodgeClaim')}>Lodge a claim</Btn>}
        <Btn small icon={Wrench} onClick={() => run('raiseWOFromIncident')}>Raise a work order</Btn>
        {i.status !== 'Closed' && <Btn small icon={CheckCircle2} onClick={() => run('incidentStatus:Closed')}>Close</Btn>}
        <Btn small icon={Printer} onClick={() => run('print')}>Print the file</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Customer invoice
   ══════════════════════════════════════════════════════════════ */
export function InvoicePane({ invoice, run }) {
  if (!invoice) return <Empty icon={Receipt} text="Select an invoice to work it." />;
  const inv = invoice;
  const state = invState(inv);
  const late = -until(inv.due);

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={inv.customer} title={inv.ref}
        badges={<>
          <Badge tone={{ Paid: 'green', 'Part paid': 'teal', Issued: 'blue', Overdue: 'red' }[state]}>{state}</Badge>
          <Badge tone="grey">{inv.jobs.length} job{inv.jobs.length === 1 ? '' : 's'}</Badge>
        </>} />

      {state === 'Overdue' && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <Clock size={15} />
          <span>{R(invDue(inv))} is {late} days past its due date. Beyond ninety it becomes a provision rather than a collection.</span>
        </div>
      )}

      <SecHead>Header</SecHead>
      <KV k="Customer" v={inv.customer} />
      <KV k="Accounts contact" v={inv.contact} />
      <KV k="Dated" v={fmtDate(inv.date)} />
      <KV k="Due" v={<Expiry date={inv.due} />} />
      <KV k="Raised at" v={siteName(inv.site)} />

      <SecHead note={`${inv.lines.length} line${inv.lines.length === 1 ? '' : 's'}`}>Lines</SecHead>
      {inv.lines.map((l, i) => (
        <div key={i} className="sheet-row">
          <span className="s" style={{ fontSize: 11.5 }}>{l.desc}</span>
          <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{R(l.qty * l.price)}</span>
        </div>
      ))}

      <SecHead>Totals</SecHead>
      <KV k="Net" v={R(invNet(inv))} />
      {inv.discount > 0 && <KV k={`Discount at ${inv.discount}%`} v={'−' + R(invNet(inv) * inv.discount / 100)} />}
      <KV k={`VAT at ${inv.vat}%`} v={R(invNet(inv) * (1 - inv.discount / 100) * inv.vat / 100)} />
      <KV k="Total" v={<Money v={invTotal(inv)} bold />} />
      <KV k="Received" v={invPaid(inv) ? <Money v={invPaid(inv)} tone="good" /> : '—'} />
      <KV k="Outstanding" v={invDue(inv) ? <Money v={invDue(inv)} tone="bad" bold /> : <span style={{ color: 'var(--green)', fontWeight: 600 }}>settled</span>} />

      {inv.payments.length > 0 && (
        <>
          <SecHead>Receipts</SecHead>
          {inv.payments.map((p) => (
            <div key={p.ref} className="sheet-row">
              <span className="s" style={{ fontFamily: 'var(--num)' }}>{p.ref}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{fmtShort(p.date)} · {p.method}</span>
              <span style={{ fontFamily: 'var(--num)', fontWeight: 600 }}>{R(p.amount)}</span>
            </div>
          ))}
        </>
      )}

      <Acts>
        {invDue(inv) > 0 && <Btn small primary icon={Banknote} onClick={() => run('recordPayment')}>Receipt a payment</Btn>}
        <Btn small icon={Route} onClick={() => run('openInvoiceJob')}>Open the jobs</Btn>
        <Btn small icon={Printer} onClick={() => run('print')}>Print</Btn>
        <Btn small icon={Mail} onClick={() => run('email')}>Email the customer</Btn>
      </Acts>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Document
   ══════════════════════════════════════════════════════════════ */
export function DocumentPane({ document: doc, run }) {
  if (!doc) return <Empty icon={Files} text="Select a document to check it." />;
  const d = doc;
  const days = d.expires ? until(d.expires) : null;

  return (
    <div style={{ padding: 14 }}>
      <Head eyebrow={`${d.kind} · ${d.subjectType}`} title={d.subject}
        badges={<>
          <Badge tone={d.status === 'Verified' ? 'green' : d.status === 'Expired' ? 'red' : 'gold'}>{d.status}</Badge>
          {days != null && <Badge tone={days < 0 ? 'red' : days < 30 ? 'gold' : 'blue'}>
            {days < 0 ? `${-days} days over` : `${days} days left`}
          </Badge>}
        </>} />

      {days != null && days < 0 && (
        <div className="auth-err" style={{ marginTop: 12 }}>
          <AlertTriangle size={15} />
          <span>
            {d.kind} for {d.subject} lapsed {-days} days ago.
            {d.subjectType === 'Vehicle'
              ? ' The vehicle may not be dispatched until it is renewed.'
              : ' The operator may not be rostered until it is renewed.'}
          </span>
        </div>
      )}

      <SecHead>The document</SecHead>
      <KV k="Reference" v={d.ref} />
      <KV k="Kind" v={d.kind} />
      <KV k="Held against" v={d.subject} />
      <KV k="Site" v={siteName(d.site)} />
      <KV k="Owned by" v={d.owner} />

      <SecHead>Validity</SecHead>
      <KV k="Issued" v={fmtDate(d.issued)} />
      <KV k="Expires" v={d.expires ? fmtDate(d.expires) : 'does not expire'} />

      <SecHead>File</SecHead>
      <KV k="Filename" v={d.file} />
      <KV k="Size" v={d.size} />

      <Acts>
        {d.status !== 'Verified' && <Btn small primary icon={BadgeCheck} onClick={() => run('verifyDoc')}>Verify</Btn>}
        <Btn small icon={Download} onClick={() => run('download')}>Download</Btn>
        <Btn small icon={Mail} onClick={() => run('email')}>Notify the holder</Btn>
        <Btn small icon={Printer} onClick={() => run('print')}>Print</Btn>
      </Acts>
    </div>
  );
}

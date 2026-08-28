import React, { useRef, useState } from 'react';
import {
  ShieldCheck, ClipboardCheck, Truck, AlertCircle, CircleCheck, Eye, EyeOff,
  ArrowLeft, Mail, Lock, Building2,
} from 'lucide-react';
import { Btn } from '../components/ui.jsx';
import './auth.css';

/* ══════════════════════════════════════════════════════════════
   Sign in · register a company · forgot and reset password ·
   email verification · lock screen.

   A prototype, so nothing leaves the browser: the demo account is
   accepted, any other address is rejected the way the real service
   would, and the verification code is shown on screen instead of
   being emailed.
   ══════════════════════════════════════════════════════════════ */

export const DEMO = { email: 'admin@acmecorp.co.za', password: 'safenexus' };

const Logo = ({ size = 22 }) => (
  <svg viewBox="0 0 90 90" width={size} height={size} fill="none" aria-hidden="true">
    <polygon points="8,80 36,10 52,10 36,46" fill="#fff" opacity=".9" />
    <polygon points="82,80 52,46 52,10 95,80" fill="#93C5FD" opacity=".95" />
    <polygon points="36,46 52,10 44,28" fill="#CFE4FA" />
  </svg>
);

const Brand = () => (
  <div className="auth-brand">
    <div className="auth-logo">
      <div className="mark"><Logo /></div>
      <div className="wm">SafeNexus<span>FLEET SAFETY ERP</span></div>
    </div>
    <div className="auth-pitch">
      <h1>Every vehicle checked,<br />every shift, on record.</h1>
      <p>
        Pre-use inspections, certificates of fitness and defect concessions for mining and
        logistics fleets — with an audit trail that stands up to an inspector.
      </p>
      <div className="auth-points">
        <div className="auth-point"><ClipboardCheck size={17} strokeWidth={1.8} />
          <div><b>Pre-use inspections</b><span>No-go items ground the vehicle automatically.</span></div></div>
        <div className="auth-point"><Truck size={17} strokeWidth={1.8} />
          <div><b>Fleet and assignment</b><span>Operators, supervisors and vehicles kept in one hierarchy.</span></div></div>
        <div className="auth-point"><ShieldCheck size={17} strokeWidth={1.8} />
          <div><b>Compliance evidence</b><span>COF expiry, go-but aging and an append-only audit log.</span></div></div>
      </div>
    </div>
    <div className="auth-foot">© 2026 SafeNexus · POPIA compliant · Data resident in South Africa</div>
  </div>
);

const Err = ({ children }) => <div className="auth-err"><AlertCircle size={15} />{children}</div>;
const Ok = ({ children }) => <div className="auth-ok"><CircleCheck size={15} />{children}</div>;

function Password({ value, onChange, placeholder, invalid, id }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input id={id} className={'inp' + (invalid ? ' field-err' : '')} type={show ? 'text' : 'password'}
        value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ paddingRight: 34 }} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
        style={{ position: 'absolute', right: 8, top: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

const strength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(3, Math.ceil(s * 3 / 5));
};
const StrengthMeter = ({ value }) => {
  const s = value ? strength(value) : 0;
  const label = ['', 'Weak — add length and a symbol', 'Fair — add a symbol or a number', 'Strong'][s];
  return (
    <>
      <div className="pw-meter">{[1, 2, 3].map((i) => <i key={i} className={s >= i ? 'on' + s : ''} />)}</div>
      <div className="pw-note">{value ? label : 'At least 8 characters, with a number and a capital.'}</div>
    </>
  );
};

/* one-time code, six boxes that advance as you type */
function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const set = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = (value + '      ').slice(0, 6).split('');
    next[i] = d || ' ';
    onChange(next.join('').trimEnd());
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="otp">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1}
          value={(value[i] || '').trim()} onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !value[i] && i) refs.current[i - 1]?.focus(); }}
          aria-label={`Digit ${i + 1}`} />
      ))}
    </div>
  );
}

/* ── sign in ──────────────────────────────────────────────────── */
function SignIn({ go, onSignedIn }) {
  const [email, setEmail] = useState(DEMO.email);
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Enter a valid email address.');
    if (!pw) return setErr('Enter your password.');
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (email.toLowerCase() !== DEMO.email || pw !== DEMO.password) {
        setErr('That email and password do not match an account. Two attempts left before the account locks.');
        return;
      }
      onSignedIn({ remember });
    }, 420);
  };

  return (
    <form className="auth-card" onSubmit={submit}>
      <h2>Sign in</h2>
      <div className="sub">Use your work email. Sessions end after 8 hours of inactivity.</div>
      <hr className="auth-sep" />
      {err && <Err>{err}</Err>}
      <div className="field">
        <div className="field-lbl">Email address</div>
        <input className={'inp' + (err && !email ? ' field-err' : '')} type="email" value={email}
          autoComplete="username" onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.za" />
      </div>
      <div className="field">
        <div className="auth-row between" style={{ marginBottom: 3 }}>
          <div className="field-lbl" style={{ marginBottom: 0 }}>Password</div>
          <button type="button" className="link" onClick={() => go('forgot')}>Forgot password?</button>
        </div>
        <Password value={pw} onChange={setPw} placeholder="Your password" invalid={!!err && !pw} />
      </div>
      <label className="auth-row" style={{ margin: '2px 0 16px' }}>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Keep me signed in on this device
      </label>
      <Btn primary onClick={submit}><span className="auth-full">{busy ? 'Signing in…' : 'Sign in'}</span></Btn>
      <div className="auth-hint" style={{ marginTop: 16 }}>
        Demo account — email <code>{DEMO.email}</code>, password <code>{DEMO.password}</code>
      </div>
      <div className="auth-alt">
        No account yet? <button type="button" className="link" onClick={() => go('register')}>Register your company</button>
      </div>
    </form>
  );
}

/* ── forgot password ──────────────────────────────────────────── */
function Forgot({ go }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e) => {
    e?.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Enter a valid email address.');
    setErr(''); setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-card">
        <h2>Check your inbox</h2>
        <div className="sub">
          If <strong>{email}</strong> belongs to a SafeNexus account, a reset link is on its way.
          The link expires in 30 minutes and can be used once.
        </div>
        <hr className="auth-sep" />
        <div className="auth-hint">Prototype: no email is sent. Continue to the reset screen to set a new password.</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Btn primary onClick={() => go('reset')}>Open the reset link</Btn>
          <Btn onClick={() => setSent(false)}>Use another address</Btn>
        </div>
        <div className="auth-alt">
          <button type="button" className="link" onClick={() => go('signin')}>Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <button type="button" className="link" onClick={() => go('signin')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={13} /> Back to sign in
      </button>
      <h2>Reset your password</h2>
      <div className="sub">Enter the email on your account and we will send a single-use reset link.</div>
      <hr className="auth-sep" />
      {err && <Err>{err}</Err>}
      <div className="field">
        <div className="field-lbl">Email address</div>
        <input className={'inp' + (err ? ' field-err' : '')} type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@company.co.za" />
      </div>
      <Btn primary onClick={submit}><span className="auth-full"><Mail size={15} /> Send reset link</span></Btn>
    </form>
  );
}

/* ── reset password ───────────────────────────────────────────── */
function Reset({ go, flash }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e?.preventDefault();
    if (strength(pw) < 2) return setErr('Choose a stronger password — at least 8 characters, with a number and a capital.');
    if (pw !== confirm) return setErr('The two passwords do not match.');
    setErr('');
    flash('Password changed. Every session on other devices was signed out.');
    go('signin');
  };

  return (
    <form className="auth-card" onSubmit={submit}>
      <h2>Choose a new password</h2>
      <div className="sub">Your last five passwords cannot be reused, and the change is written to the audit trail.</div>
      <hr className="auth-sep" />
      {err && <Err>{err}</Err>}
      <div className="field">
        <div className="field-lbl">New password</div>
        <Password value={pw} onChange={setPw} placeholder="New password" invalid={!!err} />
        <StrengthMeter value={pw} />
      </div>
      <div className="field">
        <div className="field-lbl">Confirm new password</div>
        <Password value={confirm} onChange={setConfirm} placeholder="Repeat the password" invalid={!!err && pw !== confirm} />
      </div>
      <Btn primary onClick={submit}><span className="auth-full"><Lock size={15} /> Set password and sign in</span></Btn>
    </form>
  );
}

/* ── register a company ───────────────────────────────────────── */
const STEPS = ['Company', 'Administrator', 'Plan', 'Verify'];

function Register({ go, onRegistered, flash }) {
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [code] = useState(() => String(Math.floor(100000 + Math.random() * 899999)));
  const [otp, setOtp] = useState('');
  const [f, setF] = useState({
    name: '', reg: '', industry: 'Mining', size: '51–200', region: 'Limpopo',
    first: '', last: '', email: '', phone: '', pw: '', confirm: '',
    plan: 'Pro', modules: ['Fleet management', 'Pre-use inspections', 'Safety compliance'],
    terms: false,
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (step === 0) {
      if (f.name.trim().length < 2) return 'Enter the registered company name.';
      if (!/^\d{4}\/\d{6}\/\d{2}$/.test(f.reg.trim())) return 'Registration number must look like 2018/123456/07.';
    }
    if (step === 1) {
      if (!f.first.trim() || !f.last.trim()) return 'Enter the administrator’s first and last name.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return 'Enter a valid work email address.';
      if (strength(f.pw) < 2) return 'Choose a stronger password — at least 8 characters, with a number and a capital.';
      if (f.pw !== f.confirm) return 'The two passwords do not match.';
    }
    if (step === 2 && !f.terms) return 'Accept the terms and the POPIA processing agreement to continue.';
    if (step === 3 && otp !== code) return 'That code does not match the one we sent.';
    return '';
  };

  const next = () => {
    const e = validate();
    if (e) return setErr(e);
    setErr('');
    if (step < 3) return setStep(step + 1);
    onRegistered({
      name: f.name.trim(), init: f.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
      industry: f.industry, users: 1, vehicles: 0, compliance: 0, plan: f.plan,
      status: 'Trial', date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      admin: `${f.first.trim()} ${f.last.trim()}`, email: f.email,
    });
  };

  const toggleModule = (m) =>
    setF((s) => ({ ...s, modules: s.modules.includes(m) ? s.modules.filter((x) => x !== m) : [...s.modules, m] }));

  return (
    <div className="auth-card wide">
      <button type="button" className="link" onClick={() => (step ? setStep(step - 1) : go('signin'))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={13} /> {step ? 'Back' : 'Back to sign in'}
      </button>
      <h2>Register your company</h2>
      <div className="sub">Thirty-day trial on any plan. No card needed, and you can add operators once you are inside.</div>
      <hr className="auth-sep" />

      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={'step' + (i === step ? ' on' : i < step ? ' done' : '')}>
            <div className="bar" /><div className="t">{i + 1}. {s}</div>
          </div>
        ))}
      </div>

      {err && <Err>{err}</Err>}

      {step === 0 && (
        <>
          <div className="field">
            <div className="field-lbl">Registered company name</div>
            <input className="inp" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="Acme Mining Corp" />
          </div>
          <div className="row-2">
            <div className="field">
              <div className="field-lbl">Registration number</div>
              <input className="inp" value={f.reg} onChange={(e) => set('reg')(e.target.value)} placeholder="2018/123456/07" />
            </div>
            <div className="field">
              <div className="field-lbl">Industry</div>
              <select className="inp" value={f.industry} onChange={(e) => set('industry')(e.target.value)}>
                {['Mining', 'Logistics', 'Construction', 'Agriculture', 'Municipal'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="row-2">
            <div className="field">
              <div className="field-lbl">Employees</div>
              <select className="inp" value={f.size} onChange={(e) => set('size')(e.target.value)}>
                {['1–10', '11–50', '51–200', '201–1000', 'over 1000'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-lbl">Operating region</div>
              <select className="inp" value={f.region} onChange={(e) => set('region')(e.target.value)}>
                {['Limpopo', 'Gauteng', 'Mpumalanga', 'North West', 'KwaZulu-Natal', 'Western Cape', 'Northern Cape'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="row-2">
            <div className="field"><div className="field-lbl">First name</div>
              <input className="inp" value={f.first} onChange={(e) => set('first')(e.target.value)} placeholder="Kobus" /></div>
            <div className="field"><div className="field-lbl">Last name</div>
              <input className="inp" value={f.last} onChange={(e) => set('last')(e.target.value)} placeholder="van der Merwe" /></div>
          </div>
          <div className="row-2">
            <div className="field"><div className="field-lbl">Work email</div>
              <input className="inp" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="admin@acmecorp.co.za" /></div>
            <div className="field"><div className="field-lbl">Mobile number</div>
              <input className="inp" value={f.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+27 82 000 0000" /></div>
          </div>
          <div className="field">
            <div className="field-lbl">Password</div>
            <Password value={f.pw} onChange={set('pw')} placeholder="Choose a password" />
            <StrengthMeter value={f.pw} />
          </div>
          <div className="field">
            <div className="field-lbl">Confirm password</div>
            <Password value={f.confirm} onChange={set('confirm')} placeholder="Repeat the password" />
          </div>
          <div className="auth-hint">This account becomes the company administrator: it can add users, assign vehicles and sign off inspections.</div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field-lbl" style={{ marginBottom: 7 }}>Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginBottom: 16 }}>
            {[['Starter', 'R 899', 'Up to 15 vehicles'], ['Pro', 'R 2 499', 'Up to 60 vehicles'], ['Enterprise', 'R 5 900', 'Unlimited, SSO, API']].map(([p, price, note]) => (
              <button type="button" key={p} onClick={() => set('plan')(p)}
                className={'modcard' + (f.plan === p ? ' on' : '')} style={{ textAlign: 'left' }}>
                <div className="mn">{p}</div>
                <div style={{ font: '600 17px var(--num)', margin: '4px 0 2px' }}>{price}<span style={{ font: '400 11px var(--ui)', color: 'var(--text3)' }}> / month</span></div>
                <div className="md">{note}</div>
              </button>
            ))}
          </div>
          <div className="field-lbl" style={{ marginBottom: 7 }}>Modules to switch on</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, marginBottom: 16 }}>
            {['Fleet management', 'Pre-use inspections', 'Safety compliance', 'HR management', 'Maintenance', 'Analytics'].map((m) => (
              <label key={m} className="auth-row" style={{ border: '1px solid var(--stroke)', borderRadius: 4, padding: '7px 10px' }}>
                <input type="checkbox" checked={f.modules.includes(m)} onChange={() => toggleModule(m)} />{m}
              </label>
            ))}
          </div>
          <label className="auth-row" style={{ alignItems: 'flex-start', lineHeight: 1.55 }}>
            <input type="checkbox" checked={f.terms} onChange={(e) => set('terms')(e.target.checked)} style={{ marginTop: 2 }} />
            <span>I accept the terms of service and the POPIA processing agreement, and confirm I may bind {f.name || 'this company'}.</span>
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <div className="sub" style={{ marginBottom: 12 }}>
            We sent a six-digit code to <strong>{f.email}</strong>. Enter it to finish setting up {f.name}.
          </div>
          <OtpInput value={otp} onChange={setOtp} />
          <div className="auth-hint" style={{ marginTop: 12 }}>
            Prototype: no email is sent. Your code is <code>{code}</code>.
          </div>
          <button type="button" className="link" style={{ marginTop: 12 }} onClick={() => flash('A new code was sent.')}>
            Send the code again
          </button>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <Btn primary onClick={next}>
          {step === 3 ? <><Building2 size={15} /> Create the account</> : 'Continue'}
        </Btn>
        {step > 0 && <Btn onClick={() => setStep(step - 1)}>Back</Btn>}
      </div>
    </div>
  );
}

/* ── lock screen ──────────────────────────────────────────────── */
export function LockScreen({ me, onSignIn }) {
  return (
    <div className="lock">
      <div className="lock-card">
        <div className="lock-av">{me.initials}</div>
        <div style={{ fontSize: 17, fontWeight: 600 }}>{me.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 3 }}>{me.email}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text2)', margin: '18px 0', lineHeight: 1.7 }}>
          You have been signed out. The session ended and the audit trail recorded it.
        </div>
        <Btn primary onClick={onSignIn}>Sign back in</Btn>
      </div>
    </div>
  );
}

/* ── shell ────────────────────────────────────────────────────── */
export default function AuthShell({ onSignedIn, onRegistered, flash, initial = 'signin' }) {
  const [view, setView] = useState(initial);
  return (
    <div className="auth">
      <Brand />
      <div className="auth-panel">
        {view === 'signin' && <SignIn go={setView} onSignedIn={onSignedIn} />}
        {view === 'forgot' && <Forgot go={setView} />}
        {view === 'reset' && <Reset go={setView} flash={flash} />}
        {view === 'register' && <Register go={setView} flash={flash} onRegistered={onRegistered} />}
      </div>
    </div>
  );
}

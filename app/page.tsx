"use client";
// ------------------------------------------------------------
// BtechBuddy — "Academic Register" design
// ------------------------------------------------------------
// Drop this in as app/page.jsx (or wherever your root page is) in
// a Next.js project that already has:
//   - lib/supabaseClient.js
//   - lib/btechbuddy-api.js
//   - .env.local with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//   - supabase-schema.sql already run in your Supabase project
// ------------------------------------------------------------
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, FileText, Video, Upload, Shield, User, LogOut, Plus,
  Edit2, Trash2, Link as LinkIcon, GraduationCap, Zap, Clock,
  AlertTriangle, Search, X, Check, Lock, Mail,
  Play, Cpu, Radio, ArrowLeft, KeyRound, FolderOpen, Loader2
} from "lucide-react";
import {
  studentSignUp, studentSignIn, adminSignIn, signOut, getCurrentSession, getMyProfile,
  fetchResources, fetchAllResources, addResource as apiAddResource,
  updateResourceTitle, replaceResourceLink, deleteResource as apiDeleteResource,
  subscribeToResources,
} from "./lib/btechbuddy-api"; // adjust path to match your project structure

/* ---------------- Design tokens — "Academic Register" ----------------
   Paper background, navy ink, one restrained accent (seal red) used
   only where it means something: urgency and destructive actions.
------------------------------------------------------------------- */
const PAPER = "#F0EEE6";
const INK = "#1C2333";
const INK_MUTED = "rgba(28,35,51,0.62)";
const INK_FAINT = "rgba(28,35,51,0.42)";
const NAVY = "#1B2A4A";
const SEAL = "#9A3324";
const RULE = "rgba(28,35,51,0.16)";
const LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/9/98/Dr._A.P.J._Abdul_Kalam_Technical_University_logo.png";

const CATEGORIES = [
  { id: "notes", label: "Notes", icon: FileText, color: NAVY },
  { id: "pyq", label: "PYQs", icon: FolderOpen, color: NAVY },
  { id: "short", label: "Short Notes", icon: Zap, color: NAVY },
  { id: "plan30", label: "30-Day Plan", icon: Clock, color: NAVY },
  { id: "plan7", label: "7-Day Plan", icon: Radio, color: NAVY },
  { id: "panic", label: "1-Day Panic Sheet", icon: AlertTriangle, color: SEAL },
  { id: "video", label: "One-Shot Videos", icon: Video, color: NAVY },
];
const BRANCHES = ["CSE", "IT", "ECE", "ME", "CE", "EEE"];
const YEARS = [1, 2, 3, 4];
const SEMS = [1, 2, 3, 4, 5, 6, 7, 8];

function getVideoId(url = "") {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function BtechBuddy() {
  const [view, setView] = useState("landing");
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          const p = await getMyProfile();
          setProfile(p);
          setView(p?.role === "admin" ? "admin-app" : "student-app");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setProfile(null);
    setView("landing");
  };

  if (booting) return <BootScreen />;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: PAPER, minHeight: "100vh", color: INK, position: "relative" }}>
      <GlobalStyle />
      <MeshBackground />
      {toast && <Toast text={toast} />}

      {view === "landing" && <Landing goTo={setView} />}
      {view === "student-login" && (
        <StudentAuth mode="login" onBack={() => setView("landing")} onSwitch={() => setView("student-signup")}
          onSuccess={(p) => { setProfile(p); setView("student-app"); showToast(`Welcome back, ${(p.full_name || "Student").split(" ")[0]}`); }} />
      )}
      {view === "student-signup" && (
        <StudentAuth mode="signup" onBack={() => setView("landing")} onSwitch={() => setView("student-login")}
          onSuccess={(p) => { setProfile(p); setView("student-app"); showToast(`Account created — welcome, ${(p.full_name || "Student").split(" ")[0]}`); }} />
      )}
      {view === "admin-login" && (
        <AdminAuth onBack={() => setView("landing")}
          onSuccess={(p) => { setProfile(p); setView("admin-app"); showToast("Admin session started"); }} />
      )}
      {view === "student-app" && profile && (
        <StudentApp profile={profile} onLogout={handleLogout} showToast={showToast} />
      )}
      {view === "admin-app" && profile && (
        <AdminApp profile={profile} onLogout={handleLogout} showToast={showToast} />
      )}
    </div>
  );
}

function BootScreen() {
  return (
    <div style={{ background: PAPER, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: INK }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Loader2 size={20} className="spin" color={NAVY} />
        <span>Loading BtechBuddy…</span>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---------------- Global style ---------------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
      * { box-sizing: border-box; }
      .font-display { font-family: 'Archivo', sans-serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; }
      .card { background: #FFFFFF; border: 1px solid ${RULE}; }
      .hover-lift { transition: border-color .15s ease; }
      .hover-lift:hover { border-color: ${NAVY}; }
      .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: rgba(27,42,74,0.3); border-radius: 8px; }
      input, select { outline: none; }
      input::placeholder { color: ${INK_FAINT}; }
      button { cursor: pointer; font-family: inherit; }
      a { text-decoration: none; }
    `}</style>
  );
}

function MeshBackground() {
  // A quiet ruled-paper texture — the one restrained visual signature,
  // in place of decorative glow or gradient.
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: "linear-gradient(rgba(28,35,51,0.05) 1px, transparent 1px)",
      backgroundSize: "100% 36px",
    }} />
  );
}

function Toast({ text }) {
  return (
    <div className="card" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, padding: "10px 18px", borderRadius: 6, fontSize: 14, display: "flex", alignItems: "center", gap: 8, borderLeft: `3px solid ${NAVY}`, color: INK, boxShadow: "0 2px 10px rgba(28,35,51,0.08)" }}>
      <Check size={16} color={NAVY} /> {text}
    </div>
  );
}

/* ---------------------------- Landing ---------------------------- */
function Landing({ goTo }) {
  const registerItems = [
    { icon: FileText, title: "Notes", desc: "Unit-wise notes for every subject, organized by semester." },
    { icon: FolderOpen, title: "Previous Year Papers", desc: "Solved and unsolved question papers from past exams." },
    { icon: Zap, title: "Short Notes", desc: "Condensed, quick-reference material for revision." },
    { icon: Clock, title: "30-Day & 7-Day Plans", desc: "Structured timelines that map the syllabus to a countdown." },
    { icon: AlertTriangle, title: "1-Day Panic Sheet", desc: "Formulas and the ten most likely questions, for the night before.", seal: true },
    { icon: Video, title: "One-Shot Videos", desc: "A linked video walkthrough for every subject." },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 6%", borderBottom: `1px solid ${RULE}`, background: "#FFFFFF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="AKTU" style={{ height: 36, width: 36, objectFit: "contain" }} />
          <div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.1 }}>BtechBuddy</div>
            <div style={{ fontSize: 11, color: INK_MUTED }}>Student Resource Register</div>
          </div>
        </div>
        <button onClick={() => goTo("admin-login")} style={{ background: "none", border: "none", color: INK_MUTED, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={14} /> Admin login
        </button>
      </header>

      <section style={{ maxWidth: 680, margin: "0 auto", padding: "76px 6% 48px" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(32px,5vw,46px)", lineHeight: 1.18, fontWeight: 800, color: INK, marginBottom: 18 }}>
          Every note, PYQ and revision plan, kept in one register.
        </h1>
        <p style={{ color: INK_MUTED, fontSize: 16.5, lineHeight: 1.6, marginBottom: 32, maxWidth: 540 }}>
          Branch-wise notes, previous year papers and exam-night revision sheets — added and kept current by your admins through the semester.
        </p>
        <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => goTo("student-signup")} style={{ background: NAVY, color: "#FFFFFF", fontWeight: 600, padding: "13px 24px", borderRadius: 6, border: "none", fontSize: 15 }}>
            Create your account
          </button>
          <button onClick={() => goTo("student-login")} style={{ background: "none", color: NAVY, fontWeight: 600, padding: "13px 0", border: "none", fontSize: 15, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            I already have an account
          </button>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "0 6% 70px" }}>
        <div style={{ borderTop: `1px solid ${RULE}`, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {registerItems.map((f, i) => (
            <div key={i} style={{ padding: "22px 18px", borderBottom: `1px solid ${RULE}`, display: "flex", gap: 14 }}>
              <f.icon size={19} color={f.seal ? SEAL : NAVY} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: INK_MUTED, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", padding: "28px 6% 48px", color: INK_FAINT, fontSize: 12, borderTop: `1px solid ${RULE}` }}>
        BtechBuddy — maintained by student volunteers.
      </div>
    </div>
  );
}

/* -------------------------- Student Auth (REAL) -------------------------- */
function StudentAuth({ mode, onBack, onSwitch, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        await studentSignUp({ email, password, fullName: name, branch, year });
        const session = await getCurrentSession();
        if (!session) {
          setError("Account created — check your email to confirm, then log in.");
          setLoading(false);
          return;
        }
        onSuccess(await getMyProfile());
      } else {
        await studentSignIn({ email, password });
        onSuccess(await getMyProfile());
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={submit} className="card" style={{ width: 400, maxWidth: "100%", borderRadius: 8, padding: 32 }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: INK_MUTED, display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <User size={19} color={NAVY} />
          <h2 className="font-display" style={{ fontSize: 21, fontWeight: 800, color: INK }}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        </div>
        <p style={{ fontSize: 13, color: INK_MUTED, marginBottom: 24 }}>
          {mode === "login" ? "Log in to reach your resource hub." : "Set up your branch and year to personalize your feed."}
        </p>

        {mode === "signup" && (
          <Field icon={User} label="Full Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aditya Sharma" style={inputStyle} required />
          </Field>
        )}
        <Field icon={Mail} label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" style={inputStyle} required />
        </Field>
        <Field icon={Lock} label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} required minLength={6} />
        </Field>

        {mode === "signup" && (
          <div style={{ display: "flex", gap: 10 }}>
            <Field icon={GraduationCap} label="Branch">
              <select value={branch} onChange={(e) => setBranch(e.target.value)} style={inputStyle}>
                {BRANCHES.map((b) => <option key={b} value={b} style={{ background: "#FFFFFF" }}>{b}</option>)}
              </select>
            </Field>
            <Field icon={BookOpen} label="Year">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
                {YEARS.map((y) => <option key={y} value={y} style={{ background: "#FFFFFF" }}>Year {y}</option>)}
              </select>
            </Field>
          </div>
        )}

        {error && <div style={{ color: SEAL, fontSize: 12.5, margin: "6px 0 14px", display: "flex", gap: 6 }}><X size={13} /> {error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 8, background: NAVY, color: "#FFFFFF", fontWeight: 600, padding: "13px", borderRadius: 6, border: "none", fontSize: 15, opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading && <Loader2 size={15} className="spin" />}
          {mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: INK_MUTED }}>
          {mode === "login" ? "New here? " : "Already registered? "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: NAVY, fontWeight: 600, textDecoration: "underline" }}>
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div style={{ marginBottom: 16, flex: 1 }}>
      <label style={{ fontSize: 12, color: INK_MUTED, display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#FFFFFF", border: `1px solid ${RULE}`,
  borderRadius: 6, padding: "11px 13px", color: INK, fontSize: 14,
};

/* --------------------------- Admin Auth (REAL — email+password) --------------------------- */
function AdminAuth({ onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { profile } = await adminSignIn({ email, password });
      onSuccess(profile);
    } catch (err) {
      setError(err.message || "Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={submit} className="card" style={{ width: 420, maxWidth: "100%", borderRadius: 8, padding: 32, borderTop: `3px solid ${NAVY}` }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: INK_MUTED, display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Shield size={22} color={NAVY} />
          <div>
            <h2 className="font-display" style={{ fontSize: 19, fontWeight: 800, color: INK }}>Admin Console</h2>
            <div className="font-mono" style={{ fontSize: 11, color: INK_FAINT }}>/admin/login</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: INK_MUTED, margin: "18px 0 20px" }}>
          Sign in with an account that has admin role in the database. Role is enforced by Postgres RLS, not the UI.
        </p>
        <Field icon={Mail} label="Admin Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@btechbuddy.app" style={inputStyle} required />
        </Field>
        <Field icon={KeyRound} label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} required />
        </Field>
        {error && <div style={{ color: SEAL, fontSize: 12.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><X size={13} /> {error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", background: NAVY, color: "#FFFFFF", fontWeight: 600, padding: "13px", borderRadius: 6, border: "none", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={15} className="spin" /> : <Lock size={15} />} Log In
        </button>
      </form>
    </div>
  );
}

/* ============================ STUDENT APP (REAL) ============================ */
function StudentApp({ profile, onLogout, showToast }) {
  const [branch, setBranch] = useState(profile.branch || "CSE");
  const [year, setYear] = useState(profile.year || 1);
  const [activeCat, setActiveCat] = useState("notes");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchResources({ branch, year, category: activeCat });
      setResources(data);
    } catch (e) {
      showToast("Could not load resources");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branch, year, activeCat]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeToResources(() => load());
    return unsubscribe;
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return resources;
    const q = search.toLowerCase();
    return resources.filter((r) => r.title.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q));
  }, [resources, search]);

  const activeMeta = CATEGORIES.find((c) => c.id === activeCat);
  const isPanic = activeCat === "panic";

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <TopBar
        title={<><img src={LOGO_URL} alt="AKTU" style={{ height: 26, width: 26, objectFit: "contain" }} /><span className="font-display" style={{ fontWeight: 800, fontSize: 17, color: INK }}>BtechBuddy</span></>}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 12.5, color: INK_MUTED }}>{profile.full_name}, {branch} Year {year}</div>
            <button onClick={onLogout} style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${RULE}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: INK, background: "#FFFFFF" }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        }
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 6% 70px" }}>
        <div className="card" style={{ borderRadius: 8, padding: 18, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <MiniSelect label="Branch" value={branch} onChange={setBranch} options={BRANCHES} />
          <MiniSelect label="Year" value={year} onChange={(v) => setYear(Number(v))} options={YEARS} render={(y) => `Year ${y}`} />
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: INK_FAINT }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or topic…" style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 22, overflowX: "auto", borderBottom: `1px solid ${RULE}`, marginBottom: 26 }}>
          {CATEGORIES.map((c) => {
            const isActive = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: "10px 2px 12px", marginBottom: -1,
                background: "none", border: "none", borderBottom: `2px solid ${isActive ? c.color : "transparent"}`,
                color: isActive ? c.color : INK_MUTED, fontSize: 13.5, fontWeight: isActive ? 600 : 500,
              }}>
                <c.icon size={15} /> {c.label}
              </button>
            );
          })}
        </div>

        {isPanic && (
          <div style={{ borderRadius: 8, padding: "14px 18px", marginBottom: 22, background: "#FFFFFF", border: `1px solid ${SEAL}33`, borderLeft: `3px solid ${SEAL}`, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={19} color={SEAL} />
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 14.5, color: SEAL }}>Panic Mode</div>
              <div style={{ fontSize: 12.5, color: INK_MUTED }}>Formulas, rapid-fire notes and the ten most likely questions.</div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingGrid />
        ) : filtered.length === 0 ? (
          <EmptyState label={activeMeta.label} branch={branch} year={year} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map((r) => <ResourceCard key={r.id} r={r} accent={activeMeta.color} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ borderRadius: 8, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={20} className="spin" color={INK_FAINT} />
        </div>
      ))}
    </div>
  );
}

function TopBar({ title, right }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 6%", background: "#FFFFFF", borderBottom: `1px solid ${RULE}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{title}</div>
      {right}
    </div>
  );
}

function MiniSelect({ label, value, onChange, options, render }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: INK_MUTED, marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, width: 130 }}>
        {options.map((o) => <option key={o} value={o} style={{ background: "#FFFFFF" }}>{render ? render(o) : o}</option>)}
      </select>
    </div>
  );
}

function ResourceCard({ r, accent }) {
  const ytId = r.type === "Video" ? getVideoId(r.link) : null;
  return (
    <div className="card hover-lift" style={{ borderRadius: 8, overflow: "hidden" }}>
      {ytId && (
        <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
          <img src={`https://img.Video.com/vi/${ytId}/hqdefault.jpg`} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(28,35,51,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={17} color="#fff" fill="#fff" />
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div className="font-mono" style={{ fontSize: 10.5, color: INK_MUTED, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>{r.code}</span><span>SEM {r.sem}</span>
        </div>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3, color: INK }}>{r.title}</div>
        <div style={{ fontSize: 12.5, color: INK_MUTED, marginBottom: 14 }}>{r.subject}</div>
        <a href={r.link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 6, background: "none", color: accent, fontSize: 13, fontWeight: 600, border: `1px solid ${accent}` }}>
          {r.type === "Video" ? <><Video size={14} /> Watch One-Shot</> : <><FileText size={14} /> Open PDF</>}
        </a>
      </div>
    </div>
  );
}

function EmptyState({ label, branch, year }) {
  return (
    <div className="card" style={{ borderRadius: 8, padding: "60px 20px", textAlign: "center" }}>
      <FolderOpen size={32} color={INK_FAINT} style={{ marginBottom: 14 }} />
      <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: INK }}>Nothing here yet</div>
      <div style={{ fontSize: 13, color: INK_MUTED }}>No {label.toLowerCase()} uploaded for {branch}, Year {year} yet.</div>
    </div>
  );
}

/* ============================= ADMIN APP (REAL) ============================= */
function AdminApp({ profile, onLogout, showToast }) {
  const [tab, setTab] = useState("upload");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResources(await fetchAllResources());
    } catch (e) {
      showToast("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (formData) => {
    try {
      await apiAddResource(formData);
      showToast("Resource uploaded successfully");
      load();
    } catch (e) {
      showToast(e.message || "Upload failed");
    }
  };
  const handleUpdateTitle = async (id, title) => {
    try { await updateResourceTitle(id, title); showToast("Title updated"); load(); }
    catch (e) { showToast(e.message || "Update failed"); }
  };
  const handleReplaceLink = async (id, payload) => {
    try { await replaceResourceLink(id, payload); showToast("Link replaced"); load(); }
    catch (e) { showToast(e.message || "Replace failed"); }
  };
  const handleDelete = async (id, filePath) => {
    try { await apiDeleteResource(id, filePath); showToast("Resource deleted"); load(); }
    catch (e) { showToast(e.message || "Delete failed"); }
  };

  const stats = [
    { label: "Total Resources", value: resources.length, color: NAVY },
    { label: "PDFs", value: resources.filter((r) => r.type === "pdf").length, color: NAVY },
    { label: "Videos", value: resources.filter((r) => r.type === "Video").length, color: NAVY },
    { label: "Panic Sheets", value: resources.filter((r) => r.category === "panic").length, color: SEAL },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <TopBar
        title={
          <>
            <img src={LOGO_URL} alt="AKTU" style={{ height: 28, width: 28, objectFit: "contain" }} />
            <div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 15, color: INK }}>Admin Console</div>
              <div style={{ fontSize: 10.5, color: INK_MUTED }}>{profile.full_name}</div>
            </div>
          </>
        }
        right={
          <button onClick={onLogout} style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${RULE}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: INK, background: "#FFFFFF" }}>
            <LogOut size={13} /> End Session
          </button>
        }
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 6% 70px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} className="card" style={{ borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11.5, color: INK_MUTED, marginBottom: 8 }}>{s.label}</div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginBottom: 22, borderBottom: `1px solid ${RULE}` }}>
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")} icon={Upload} label="Upload Content" />
          <TabButton active={tab === "manage"} onClick={() => setTab("manage")} icon={Cpu} label="Manage Resources" />
        </div>

        {tab === "upload" ? (
          <UploadForm onAdd={handleAdd} />
        ) : loading ? (
          <div className="card" style={{ borderRadius: 8, padding: 50, textAlign: "center" }}><Loader2 size={20} className="spin" /></div>
        ) : (
          <ManageTable resources={resources} onUpdateTitle={handleUpdateTitle} onReplaceLink={handleReplaceLink} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 4px 12px", marginRight: 26, marginBottom: -1,
      background: "none", border: "none", borderBottom: `2px solid ${active ? NAVY : "transparent"}`,
      color: active ? NAVY : INK_MUTED, fontSize: 13.5, fontWeight: active ? 600 : 500,
    }}>
      <Icon size={15} /> {label}
    </button>
  );
}

function UploadForm({ onAdd }) {
  const [type, setType] = useState("pdf");
  const [category, setCategory] = useState("notes");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState(1);
  const [sem, setSem] = useState(1);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [code, setCode] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [ytLink, setYtLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject || !topic) return;
    if (type === "pdf" && !pdfFile) return;
    if (type === "Video" && !ytLink) return;

    setSubmitting(true);
    try {
      await onAdd({
        title: topic, subject, code: code || "SUB101", category, branch, year, sem, type,
        pdfFile: type === "pdf" ? pdfFile : null,
        VideoUrl: type === "Video" ? ytLink : null,
      });
      setSubject(""); setTopic(""); setCode(""); setPdfFile(null); setYtLink("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ borderRadius: 8, padding: 26, maxWidth: 720 }}>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 17, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, color: INK }}>
        <Upload size={17} color={NAVY} /> Upload New Resource
      </div>
      <p style={{ fontSize: 12.5, color: INK_MUTED, marginBottom: 22 }}>The file goes to storage directly; the entry is added the moment the upload finishes.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <TypeToggle active={type === "pdf"} onClick={() => setType("pdf")} icon={FileText} label="PDF Upload" />
        <TypeToggle active={type === "Video"} onClick={() => setType("Video")} icon={Video} label="Video Link" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
        <Field icon={FolderOpen} label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.filter((c) => c.id !== "video" || type === "Video").map((c) => <option key={c.id} value={c.id} style={{ background: "#FFFFFF" }}>{c.label}</option>)}
          </select>
        </Field>
        <Field icon={GraduationCap} label="Branch">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} style={inputStyle}>
            {BRANCHES.map((b) => <option key={b} value={b} style={{ background: "#FFFFFF" }}>{b}</option>)}
          </select>
        </Field>
        <Field icon={BookOpen} label="Year">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
            {YEARS.map((y) => <option key={y} value={y} style={{ background: "#FFFFFF" }}>Year {y}</option>)}
          </select>
        </Field>
        <Field icon={Clock} label="Semester">
          <select value={sem} onChange={(e) => setSem(Number(e.target.value))} style={inputStyle}>
            {SEMS.map((s) => <option key={s} value={s} style={{ background: "#FFFFFF" }}>Sem {s}</option>)}
          </select>
        </Field>
        <Field icon={BookOpen} label="Subject Name">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Data Structures" style={inputStyle} required />
        </Field>
        <Field icon={FileText} label="Subject Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS301" style={inputStyle} />
        </Field>
      </div>

      <Field icon={FileText} label="Topic / Resource Title">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Trees & Graphs — Unit 3 Notes" style={inputStyle} required />
      </Field>

      {type === "pdf" ? (
        <Field icon={Upload} label="PDF File">
          <label className="hover-lift" style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: pdfFile ? NAVY : INK_FAINT }}>
            <Upload size={15} />
            {pdfFile ? pdfFile.name : "Click to choose a PDF file…"}
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
          </label>
        </Field>
      ) : (
        <Field icon={LinkIcon} label="Video URL">
          <input value={ytLink} onChange={(e) => setYtLink(e.target.value)} placeholder="https://Video.com/watch?v=…" style={inputStyle} required />
        </Field>
      )}

      <button type="submit" disabled={submitting} style={{ marginTop: 10, width: "100%", background: NAVY, color: "#FFFFFF", fontWeight: 700, padding: "13px", borderRadius: 6, border: "none", fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}>
        {submitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
        {submitting ? "Uploading…" : "Publish to Student Portal"}
      </button>
    </form>
  );
}

function TypeToggle({ active, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 6,
      border: `1px solid ${active ? NAVY : RULE}`,
      background: active ? NAVY : "#FFFFFF",
      color: active ? "#FFFFFF" : INK_MUTED, fontSize: 13, fontWeight: 600,
    }}>
      <Icon size={15} /> {label}
    </button>
  );
}

function ManageTable({ resources, onUpdateTitle, onReplaceLink, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [linkEditId, setLinkEditId] = useState(null);
  const [linkValue, setLinkValue] = useState("");
  const [linkFile, setLinkFile] = useState(null);

  if (resources.length === 0) {
    return (
      <div className="card" style={{ borderRadius: 8, padding: 50, textAlign: "center", color: INK_MUTED }}>
        No resources yet — upload your first one from the "Upload Content" tab.
      </div>
    );
  }

  return (
    <div className="card" style={{ borderRadius: 8, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 780 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${RULE}`, textAlign: "left" }}>
              {["Title", "Subject", "Category", "Branch / Yr / Sem", "Type", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 11, color: INK_MUTED, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const meta = CATEGORIES.find((c) => c.id === r.category);
              const isEditing = editId === r.id;
              const isLinkEditing = linkEditId === r.id;
              return (
                <tr key={r.id} style={{ borderTop: `1px solid ${RULE}` }}>
                  <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12.5 }} autoFocus />
                        <IconBtn icon={Check} color={NAVY} onClick={() => { onUpdateTitle(r.id, editTitle); setEditId(null); }} />
                        <IconBtn icon={X} color={SEAL} onClick={() => setEditId(null)} />
                      </div>
                    ) : (
                      <span className="font-display" style={{ fontWeight: 600, color: INK }}>{r.title}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: INK_MUTED }}>{r.subject}<div className="font-mono" style={{ fontSize: 10, color: INK_FAINT }}>{r.code}</div></td>
                  <td style={{ padding: "12px 16px", color: meta?.color, fontWeight: 600, fontSize: 12.5 }}>{meta?.label}</td>
                  <td style={{ padding: "12px 16px", color: INK_MUTED }} className="font-mono">{r.branch} / Y{r.year} / S{r.sem}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.type === "Video" ? <Video size={15} color={INK_MUTED} /> : <FileText size={15} color={INK_MUTED} />}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isLinkEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
                        {r.type === "Video" ? (
                          <input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="New Video URL" style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }} autoFocus />
                        ) : (
                          <label style={{ ...inputStyle, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>
                            {linkFile ? linkFile.name : "Choose replacement PDF…"}
                            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setLinkFile(e.target.files?.[0] || null)} />
                          </label>
                        )}
                        <div style={{ display: "flex", gap: 6 }}>
                          <IconBtn icon={Check} color={NAVY} onClick={() => {
                            onReplaceLink(r.id, { newLink: linkValue, newPdfFile: linkFile, oldFilePath: r.file_path });
                            setLinkEditId(null); setLinkFile(null); setLinkValue("");
                          }} />
                          <IconBtn icon={X} color={SEAL} onClick={() => { setLinkEditId(null); setLinkFile(null); }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn icon={Edit2} color={NAVY} title="Edit title" onClick={() => { setEditId(r.id); setEditTitle(r.title); }} />
                        <IconBtn icon={LinkIcon} color={NAVY} title="Replace link" onClick={() => { setLinkEditId(r.id); setLinkValue(r.link); }} />
                        <IconBtn icon={Trash2} color={SEAL} title="Delete" onClick={() => onDelete(r.id, r.file_path)} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconBtn({ icon: Icon, color, onClick, title }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{ width: 28, height: 28, borderRadius: 6, background: "#FFFFFF", border: `1px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={13} color={color} />
    </button>
  );
}

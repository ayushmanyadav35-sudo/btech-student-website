"use client";
// ------------------------------------------------------------
// BtechBuddy — SUPABASE-WIRED VERSION
// ------------------------------------------------------------
// Drop this in as app/page.jsx (or wherever your root page is) in
// a Next.js project that already has:
//   - lib/supabaseClient.js
//   - lib/btechbuddy-api.js
//   - .env.local with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//   - supabase-schema.sql already run in your Supabase project
//
// This file will NOT render a live preview in this chat — it needs
// your real Supabase project URL/keys, which only exist in your
// own environment. Take it into your Next.js app to run it.
// ------------------------------------------------------------
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, FileText, Video, Upload, Shield, User, LogOut, Plus,
  Edit2, Trash2, Link as LinkIcon, GraduationCap, Zap, Clock,
  AlertTriangle, ChevronRight, Search, X, Check, Lock, Mail,
  LayoutDashboard, Play, Sparkles, Cpu, Radio, ArrowLeft, KeyRound,
  FolderOpen, CircuitBoard, Loader2
} from "lucide-react";
import {
  studentSignUp, studentSignIn, adminSignIn, signOut, getCurrentSession, getMyProfile,
  fetchResources, fetchAllResources, addResource as apiAddResource,
  updateResourceTitle, replaceResourceLink, deleteResource as apiDeleteResource,
  subscribeToResources,
} from "./lib/btechbuddy-api"; // adjust path to match your project structure

const CATEGORIES = [
  { id: "notes", label: "Notes", icon: FileText, color: "#22d3ee" },
  { id: "pyq", label: "PYQs", icon: FolderOpen, color: "#a855f7" },
  { id: "short", label: "Short Notes", icon: Zap, color: "#ff3ec9" },
  { id: "plan30", label: "30-Day Plan", icon: Clock, color: "#22d3ee" },
  { id: "plan7", label: "7-Day Plan", icon: Radio, color: "#a855f7" },
  { id: "panic", label: "1-Day Panic Sheet", icon: AlertTriangle, color: "#fbbf24" },
  { id: "Video", label: "One-Shot Videos", icon: Video, color: "#ff3ec9" },
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

  // Restore session on load
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
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#05010f", minHeight: "100vh", color: "#f1f0ff", position: "relative", overflow: "hidden" }}>
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
    <div style={{ background: "#05010f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f1f0ff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Loader2 size={20} className="spin" color="#22d3ee" />
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
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
      * { box-sizing: border-box; }
      .font-display { font-family: 'Space Grotesk', system-ui, sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      .glass { background: rgba(20,12,40,0.5); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.08); }
      .glass-strong { background: rgba(20,12,40,0.72); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); }
      .neon-border-cyan { border: 1px solid rgba(34,211,238,0.4); box-shadow: 0 0 24px rgba(34,211,238,0.12); }
      .neon-border-magenta { border: 1px solid rgba(255,62,201,0.4); box-shadow: 0 0 24px rgba(255,62,201,0.12); }
      .neon-border-amber { border: 1px solid rgba(251,191,36,0.45); box-shadow: 0 0 26px rgba(251,191,36,0.16); }
      .hover-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
      .hover-lift:hover { transform: translateY(-4px); }
      @keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,-40px) scale(1.15); } }
      @keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-70px,50px) scale(1.1); } }
      @keyframes drift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,60px) scale(1.2); } }
      @keyframes pulseGlow { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      @keyframes ledBlink { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
      .led { animation: ledBlink 2.2s ease-in-out infinite; }
      .glow-text { animation: pulseGlow 3.5s ease-in-out infinite; }
      .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.35); border-radius: 8px; }
      input, select { outline: none; }
      input::placeholder { color: rgba(241,240,255,0.35); }
      button { cursor: pointer; font-family: inherit; }
      a { text-decoration: none; }
    `}</style>
  );
}

function MeshBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", width: 520, height: 520, top: "-10%", left: "-8%", background: "radial-gradient(circle, rgba(34,211,238,0.28) 0%, transparent 70%)", filter: "blur(40px)", animation: "drift1 16s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 560, height: 560, top: "30%", right: "-12%", background: "radial-gradient(circle, rgba(255,62,201,0.24) 0%, transparent 70%)", filter: "blur(50px)", animation: "drift2 18s ease-in-out infinite" }} />
      <div style={{ position: "absolute", width: 480, height: 480, bottom: "-15%", left: "20%", background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)", filter: "blur(45px)", animation: "drift3 20s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    </div>
  );
}

function Toast({ text }) {
  return (
    <div className="glass-strong neon-border-cyan" style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 100, padding: "10px 20px", borderRadius: 12, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <Check size={16} color="#22d3ee" /> {text}
    </div>
  );
}

/* ---------------------------- Landing ---------------------------- */
function Landing({ goTo }) {
  const features = [
    { icon: FileText, title: "Notes & PYQs", desc: "Branch-wise, semester-wise materials curated for every subject.", color: "#22d3ee" },
    { icon: Clock, title: "30 & 7-Day Plans", desc: "Structured timelines that map the full syllabus into a countdown.", color: "#a855f7" },
    { icon: AlertTriangle, title: "1-Day Panic Sheet", desc: "Rapid-fire formulas and the top 10 guaranteed questions.", color: "#fbbf24" },
    { icon: Video, title: "One-Shot Videos", desc: "Every subject's best Video one-shot, linked in one place.", color: "#ff3ec9" },
  ];
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 6%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CircuitBoard size={26} color="#22d3ee" />
          <span className="font-display" style={{ fontSize: 21, fontWeight: 700 }}>Btech<span style={{ color: "#22d3ee" }}>Buddy</span></span>
        </div>
        <button onClick={() => goTo("admin-login")} className="font-mono" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,240,255,0.55)", fontSize: 12, padding: "8px 14px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={13} /> Admin Access
        </button>
      </nav>
      <section style={{ maxWidth: 980, margin: "0 auto", textAlign: "center", padding: "72px 6% 40px" }}>
        <div className="font-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ff3ec9", border: "1px solid rgba(255,62,201,0.35)", padding: "6px 14px", borderRadius: 999, marginBottom: 26 }}>
          <Sparkles size={13} /> BUILT FOR B.TECH SURVIVAL MODE
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(38px,6vw,64px)", lineHeight: 1.08, fontWeight: 700, marginBottom: 22 }}>
          Every Note, PYQ &amp; One-Shot —<br />
          <span className="glow-text" style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7,#ff3ec9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>wired into one dashboard.</span>
        </h1>
        <p style={{ color: "rgba(241,240,255,0.6)", fontSize: 17, maxWidth: 560, margin: "0 auto 34px" }}>
          Branch-wise notes, previous year papers and exam-night panic sheets — updated by admins in real time.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => goTo("student-signup")} className="hover-lift" style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)", color: "#05010f", fontWeight: 600, padding: "13px 26px", borderRadius: 12, border: "none", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={18} /> Get Started — It's Free
          </button>
          <button onClick={() => goTo("student-login")} className="glass hover-lift" style={{ color: "#f1f0ff", padding: "13px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", fontSize: 15 }}>
            I already have an account
          </button>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: "50px auto 0", padding: "0 6%", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
        {features.map((f, i) => (
          <div key={i} className="glass hover-lift" style={{ borderRadius: 18, padding: 22, borderColor: `${f.color}33` }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${f.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <f.icon size={20} color={f.color} />
            </div>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 13.5, color: "rgba(241,240,255,0.55)", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </section>
      <div style={{ textAlign: "center", padding: "60px 6% 40px", color: "rgba(241,240,255,0.3)", fontSize: 12 }} className="font-mono">
        © 2026 BtechBuddy — notes for every branch, panic mode included.
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
        // Supabase may require email confirmation depending on your project's
        // Auth settings. If confirmations are ON, there is no session yet —
        // tell the user to check their inbox instead of logging them in.
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
      <form onSubmit={submit} className="glass-strong neon-border-cyan" style={{ width: 400, maxWidth: "100%", borderRadius: 22, padding: 32 }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "rgba(241,240,255,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <User size={20} color="#22d3ee" />
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        </div>
        <p style={{ fontSize: 13, color: "rgba(241,240,255,0.5)", marginBottom: 24 }}>
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
                {BRANCHES.map((b) => <option key={b} value={b} style={{ background: "#0e0620" }}>{b}</option>)}
              </select>
            </Field>
            <Field icon={BookOpen} label="Year">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
                {YEARS.map((y) => <option key={y} value={y} style={{ background: "#0e0620" }}>Year {y}</option>)}
              </select>
            </Field>
          </div>
        )}

        {error && <div style={{ color: "#fb7185", fontSize: 12.5, margin: "6px 0 14px", display: "flex", gap: 6 }}><X size={13} /> {error}</div>}

        <button type="submit" disabled={loading} className="hover-lift" style={{ width: "100%", marginTop: 8, background: "linear-gradient(90deg,#22d3ee,#a855f7)", color: "#05010f", fontWeight: 600, padding: "13px", borderRadius: 12, border: "none", fontSize: 15, opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading && <Loader2 size={15} className="spin" />}
          {mode === "login" ? "Log In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "rgba(241,240,255,0.5)" }}>
          {mode === "login" ? "New here? " : "Already registered? "}
          <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#22d3ee", fontWeight: 600 }}>
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
      <label style={{ fontSize: 11.5, color: "rgba(241,240,255,0.5)", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }} className="font-mono">
        <Icon size={12} /> {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "11px 13px", color: "#f1f0ff", fontSize: 14,
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
      <form onSubmit={submit} className="glass-strong neon-border-magenta" style={{ width: 420, maxWidth: "100%", borderRadius: 22, padding: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#ff3ec9,transparent)" }} />
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "rgba(241,240,255,0.5)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,62,201,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#ff3ec9" />
          </div>
          <div>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>Admin Console</h2>
            <div className="font-mono" style={{ fontSize: 11, color: "rgba(241,240,255,0.4)" }}>/admin/login — restricted</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(241,240,255,0.5)", margin: "18px 0 20px" }}>
          Sign in with an account that has admin role in the database. Role is enforced by Postgres RLS, not the UI.
        </p>
        <Field icon={Mail} label="Admin Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@btechbuddy.app" style={inputStyle} required />
        </Field>
        <Field icon={KeyRound} label="Password">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} required />
        </Field>
        {error && <div style={{ color: "#fb7185", fontSize: 12.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><X size={13} /> {error}</div>}
        <button type="submit" disabled={loading} className="hover-lift" style={{ width: "100%", background: "linear-gradient(90deg,#ff3ec9,#a855f7)", color: "#05010f", fontWeight: 600, padding: "13px", borderRadius: 12, border: "none", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={15} className="spin" /> : <Lock size={15} />} Unlock Admin Panel
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

  // Live updates — the moment an admin publishes something matching
  // this filter, it shows up here without a manual refresh.
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
        title={<><CircuitBoard size={22} color="#22d3ee" /><span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Btech<span style={{ color: "#22d3ee" }}>Buddy</span></span></>}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="font-mono" style={{ fontSize: 12, color: "rgba(241,240,255,0.55)" }}>{profile.full_name} · {branch} Y{year}</div>
            <button onClick={onLogout} className="glass hover-lift" style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#f1f0ff" }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        }
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 6% 70px" }}>
        <div className="glass" style={{ borderRadius: 16, padding: 18, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <MiniSelect label="Branch" value={branch} onChange={setBranch} options={BRANCHES} />
          <MiniSelect label="Year" value={year} onChange={(v) => setYear(Number(v))} options={YEARS} render={(y) => `Year ${y}`} />
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: "rgba(241,240,255,0.4)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or topic…" style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 26 }}>
          {CATEGORIES.map((c) => {
            const isActive = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)} className="hover-lift" style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12,
                border: `1px solid ${isActive ? c.color : "rgba(255,255,255,0.1)"}`,
                background: isActive ? `${c.color}1f` : "rgba(255,255,255,0.03)",
                color: isActive ? c.color : "rgba(241,240,255,0.65)", fontSize: 13.5, fontWeight: 500,
              }}>
                <c.icon size={15} /> {c.label}
              </button>
            );
          })}
        </div>

        {isPanic && (
          <div className="neon-border-amber" style={{ borderRadius: 14, padding: "14px 18px", marginBottom: 22, background: "rgba(251,191,36,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} color="#fbbf24" className="led" />
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24" }}>Panic Mode Active</div>
              <div style={{ fontSize: 12.5, color: "rgba(241,240,255,0.6)" }}>Formulas, rapid-fire notes and the top 10 guaranteed questions.</div>
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
        <div key={i} className="glass" style={{ borderRadius: 16, height: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={20} className="spin" color="rgba(241,240,255,0.3)" />
        </div>
      ))}
    </div>
  );
}

function TopBar({ title, right }) {
  return (
    <div className="glass" style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 6%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{title}</div>
      {right}
    </div>
  );
}

function MiniSelect({ label, value, onChange, options, render }) {
  return (
    <div>
      <div className="font-mono" style={{ fontSize: 10.5, color: "rgba(241,240,255,0.45)", marginBottom: 6 }}>{label.toUpperCase()}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, width: 130 }}>
        {options.map((o) => <option key={o} value={o} style={{ background: "#0e0620" }}>{render ? render(o) : o}</option>)}
      </select>
    </div>
  );
}

function ResourceCard({ r, accent }) {
  const ytId = r.type === "Video" ? getVideoId(r.link) : null;
  return (
    <div className="glass hover-lift" style={{ borderRadius: 16, overflow: "hidden", borderColor: `${accent}33` }}>
      {ytId && (
        <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
          <img src={`https://img.Video.com/vi/${ytId}/hqdefault.jpg`} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,62,201,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={18} color="#fff" fill="#fff" />
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div className="font-mono" style={{ fontSize: 10.5, color: accent, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>{r.code}</span><span>SEM {r.sem}</span>
        </div>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{r.title}</div>
        <div style={{ fontSize: 12.5, color: "rgba(241,240,255,0.5)", marginBottom: 14 }}>{r.subject}</div>
        <a href={r.link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", borderRadius: 9, background: `${accent}1a`, color: accent, fontSize: 13, fontWeight: 600, border: `1px solid ${accent}44` }}>
          {r.type === "Video" ? <><Video size={14} /> Watch One-Shot</> : <><FileText size={14} /> Open PDF</>} <ChevronRight size={13} />
        </a>
      </div>
    </div>
  );
}

function EmptyState({ label, branch, year }) {
  return (
    <div className="glass" style={{ borderRadius: 18, padding: "60px 20px", textAlign: "center" }}>
      <FolderOpen size={34} color="rgba(241,240,255,0.25)" style={{ marginBottom: 14 }} />
      <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Nothing here yet</div>
      <div style={{ fontSize: 13, color: "rgba(241,240,255,0.5)" }}>No {label.toLowerCase()} uploaded for {branch} · Year {year} yet.</div>
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
    { label: "Total Resources", value: resources.length, color: "#22d3ee" },
    { label: "PDFs", value: resources.filter((r) => r.type === "pdf").length, color: "#a855f7" },
    { label: "Videos", value: resources.filter((r) => r.type === "Video").length, color: "#ff3ec9" },
    { label: "Panic Sheets", value: resources.filter((r) => r.category === "panic").length, color: "#fbbf24" },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <TopBar
        title={
          <>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,62,201,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutDashboard size={17} color="#ff3ec9" />
            </div>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 16 }}>Admin Dashboard</div>
              <div className="font-mono" style={{ fontSize: 10.5, color: "rgba(241,240,255,0.4)" }}>{profile.full_name}</div>
            </div>
          </>
        }
        right={
          <button onClick={onLogout} className="glass hover-lift" style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#f1f0ff" }}>
            <LogOut size={13} /> End Session
          </button>
        }
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 6% 70px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} className="glass" style={{ borderRadius: 14, padding: 16, borderColor: `${s.color}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div className="led" style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                <div className="font-mono" style={{ fontSize: 10.5, color: "rgba(241,240,255,0.5)" }}>{s.label.toUpperCase()}</div>
              </div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")} icon={Upload} label="Upload Content" />
          <TabButton active={tab === "manage"} onClick={() => setTab("manage")} icon={Cpu} label="Manage Resources" />
        </div>

        {tab === "upload" ? (
          <UploadForm onAdd={handleAdd} />
        ) : loading ? (
          <div className="glass" style={{ borderRadius: 16, padding: 50, textAlign: "center" }}><Loader2 size={20} className="spin" /></div>
        ) : (
          <ManageTable resources={resources} onUpdateTitle={handleUpdateTitle} onReplaceLink={handleReplaceLink} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className="hover-lift" style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11,
      border: `1px solid ${active ? "#ff3ec9" : "rgba(255,255,255,0.1)"}`,
      background: active ? "rgba(255,62,201,0.12)" : "rgba(255,255,255,0.03)",
      color: active ? "#ff3ec9" : "rgba(241,240,255,0.6)", fontSize: 13.5, fontWeight: 600,
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
    <form onSubmit={submit} className="glass neon-border-cyan" style={{ borderRadius: 18, padding: 26, maxWidth: 720 }}>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <Upload size={18} color="#22d3ee" /> Upload New Resource
      </div>
      <p style={{ fontSize: 12.5, color: "rgba(241,240,255,0.5)", marginBottom: 22 }}>File goes straight to Supabase Storage; the row is inserted the moment upload finishes.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <TypeToggle active={type === "pdf"} onClick={() => setType("pdf")} icon={FileText} label="PDF Upload" />
        <TypeToggle active={type === "Video"} onClick={() => setType("Video")} icon={Video} label="Video Link" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
        <Field icon={FolderOpen} label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.filter((c) => c.id !== "Video" || type === "Video").map((c) => <option key={c.id} value={c.id} style={{ background: "#0e0620" }}>{c.label}</option>)}
          </select>
        </Field>
        <Field icon={GraduationCap} label="Branch">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} style={inputStyle}>
            {BRANCHES.map((b) => <option key={b} value={b} style={{ background: "#0e0620" }}>{b}</option>)}
          </select>
        </Field>
        <Field icon={BookOpen} label="Year">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={inputStyle}>
            {YEARS.map((y) => <option key={y} value={y} style={{ background: "#0e0620" }}>Year {y}</option>)}
          </select>
        </Field>
        <Field icon={Clock} label="Semester">
          <select value={sem} onChange={(e) => setSem(Number(e.target.value))} style={inputStyle}>
            {SEMS.map((s) => <option key={s} value={s} style={{ background: "#0e0620" }}>Sem {s}</option>)}
          </select>
        </Field>
        <Field icon={BookOpen} label="Subject Name">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Data Structures" style={inputStyle} required />
        </Field>
        <Field icon={FileText} label="Subject Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS301" style={inputStyle} />
        </Field>
      </div>

      <Field icon={Sparkles} label="Topic / Resource Title">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Trees & Graphs — Unit 3 Notes" style={inputStyle} required />
      </Field>

      {type === "pdf" ? (
        <Field icon={Upload} label="PDF File">
          <label className="hover-lift" style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: pdfFile ? "#22d3ee" : "rgba(241,240,255,0.4)" }}>
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

      <button type="submit" disabled={submitting} className="hover-lift" style={{ marginTop: 10, width: "100%", background: "linear-gradient(90deg,#22d3ee,#a855f7)", color: "#05010f", fontWeight: 700, padding: "13px", borderRadius: 12, border: "none", fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}>
        {submitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
        {submitting ? "Uploading…" : "Publish to Student Portal"}
      </button>
    </form>
  );
}

function TypeToggle({ active, onClick, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 10,
      border: `1px solid ${active ? "#22d3ee" : "rgba(255,255,255,0.1)"}`,
      background: active ? "rgba(34,211,238,0.1)" : "transparent",
      color: active ? "#22d3ee" : "rgba(241,240,255,0.5)", fontSize: 13, fontWeight: 600,
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
      <div className="glass" style={{ borderRadius: 16, padding: 50, textAlign: "center", color: "rgba(241,240,255,0.5)" }}>
        No resources yet — upload your first one from the "Upload Content" tab.
      </div>
    );
  }

  return (
    <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 780 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", textAlign: "left" }} className="font-mono">
              {["Status", "Title", "Subject", "Category", "Branch/Yr/Sem", "Type", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", fontSize: 10.5, color: "rgba(241,240,255,0.5)", fontWeight: 600 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => {
              const meta = CATEGORIES.find((c) => c.id === r.category);
              const isEditing = editId === r.id;
              const isLinkEditing = linkEditId === r.id;
              return (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="led" style={{ width: 8, height: 8, borderRadius: "50%", background: meta?.color, boxShadow: `0 0 8px ${meta?.color}` }} />
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12.5 }} autoFocus />
                        <IconBtn icon={Check} color="#22d3ee" onClick={() => { onUpdateTitle(r.id, editTitle); setEditId(null); }} />
                        <IconBtn icon={X} color="#fb7185" onClick={() => setEditId(null)} />
                      </div>
                    ) : (
                      <span className="font-display" style={{ fontWeight: 600 }}>{r.title}</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(241,240,255,0.6)" }}>{r.subject}<div className="font-mono" style={{ fontSize: 10, color: "rgba(241,240,255,0.35)" }}>{r.code}</div></td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, padding: "4px 9px", borderRadius: 7, background: `${meta?.color}1a`, color: meta?.color }}>{meta?.label}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "rgba(241,240,255,0.6)" }} className="font-mono">{r.branch} / Y{r.year} / S{r.sem}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {r.type === "Video" ? <Video size={15} color="#ff3ec9" /> : <FileText size={15} color="#22d3ee" />}
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
                          <IconBtn icon={Check} color="#22d3ee" onClick={() => {
                            onReplaceLink(r.id, { newLink: linkValue, newPdfFile: linkFile, oldFilePath: r.file_path });
                            setLinkEditId(null); setLinkFile(null); setLinkValue("");
                          }} />
                          <IconBtn icon={X} color="#fb7185" onClick={() => { setLinkEditId(null); setLinkFile(null); }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn icon={Edit2} color="#22d3ee" title="Edit title" onClick={() => { setEditId(r.id); setEditTitle(r.title); }} />
                        <IconBtn icon={LinkIcon} color="#a855f7" title="Replace link" onClick={() => { setLinkEditId(r.id); setLinkValue(r.link); }} />
                        <IconBtn icon={Trash2} color="#fb7185" title="Delete" onClick={() => onDelete(r.id, r.file_path)} />
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
    <button type="button" title={title} onClick={onClick} className="hover-lift" style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={13} color={color} />
    </button>
  );
}

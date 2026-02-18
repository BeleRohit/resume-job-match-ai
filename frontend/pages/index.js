"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const BACKEND = "https://resume-job-match-ai.onrender.com";

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (injected once via <style>)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #080b10;
    --bg2:      #0d1117;
    --border:   rgba(255,255,255,0.07);
    --gold:     #c9a84c;
    --gold-dim: rgba(201,168,76,0.15);
    --text:     #e8e4d9;
    --muted:    #5a5f6b;
    --danger:   #e05a5a;
    --success:  #4caf89;
    --blue:     #3b82f6;
  }

  html, body { background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', monospace; }

  ::selection { background: var(--gold-dim); color: var(--gold); }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 10px rgba(201,168,76,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0  rgba(201,168,76,0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .fade-up { animation: fadeUp 0.6s ease both; }
  .fade-up-2 { animation: fadeUp 0.6s 0.15s ease both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.30s ease both; }
  .fade-up-4 { animation: fadeUp 0.6s 0.45s ease both; }

  .gold-text {
    background: linear-gradient(90deg, #c9a84c, #f0d080, #c9a84c);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  /* grid texture overlay */
  .grid-bg::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  input, textarea, select {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  textarea:focus, input:focus {
    outline: none;
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
  }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
    border-radius: 2px; cursor: pointer;
    transition: all 0.25s;
    position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: var(--gold); opacity: 0; transition: opacity 0.25s;
  }
  .btn-primary:hover::before { opacity: 0.1; }
  .btn-primary:hover { box-shadow: 0 0 20px rgba(201,168,76,0.2); }
  .btn-primary:disabled {
    border-color: var(--muted); color: var(--muted); cursor: not-allowed;
  }
  .btn-primary:disabled::before { display: none; }
  .btn-primary:disabled:hover { box-shadow: none; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 2px; cursor: pointer;
    transition: all 0.2s;
  }
  .btn-ghost:hover { border-color: var(--muted); color: var(--text); }

  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 32px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.12); }

  .label {
    display: block;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 10px;
  }

  .score-ring {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid var(--gold);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    animation: pulse-ring 2.5s infinite;
    flex-shrink: 0;
  }
  .score-ring .val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300; color: var(--gold); line-height: 1;
  }
  .score-ring .lbl {
    font-size: 8px; letter-spacing: 0.1em; color: var(--muted); margin-top: 2px;
  }

  .skill-pill {
    display: inline-block;
    padding: 4px 12px;
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 2px;
    font-size: 11px; color: var(--gold);
    background: rgba(201,168,76,0.05);
    margin: 3px;
  }

  .history-row {
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
    display: grid; grid-template-columns: 1fr auto;
    gap: 12px; align-items: start;
  }
  .history-row:last-child { border-bottom: none; padding-bottom: 0; }

  .status-select {
    background: var(--bg); border: 1px solid var(--border);
    color: var(--muted); padding: 6px 10px; border-radius: 2px;
    font-size: 11px; letter-spacing: 0.08em;
    cursor: pointer; transition: border-color 0.2s;
  }
  .status-select:hover { border-color: var(--gold); color: var(--text); }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(201,168,76,0.3);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; letter-spacing: 0.02em;
    color: var(--text); margin-bottom: 24px;
  }

  .tag {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px;
    border: 1px solid var(--border);
    border-radius: 2px; font-size: 11px; color: var(--muted);
  }
  .tag .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--success); }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Home() {
  const [user, setUser]         = useState(null);
  const [email, setEmail]       = useState("");
  const [history, setHistory]   = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [jd, setJd]             = useState("");
  const [file, setFile]         = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");

  async function loadHistory() {
    const session = await supabase.auth.getSession();
    const token = session.data.session.access_token;
    const res = await fetch(`${BACKEND}/my-history`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setHistory(data.history || []);
  }

  async function loadSkillGaps() {
    const session = await supabase.auth.getSession();
    const token = session.data.session.access_token;
    const res = await fetch(`${BACKEND}/skill-gaps`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setSkillGaps(data.top_missing_skills || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) { loadHistory(); loadSkillGaps(); }
    });
  }, []);

  async function uploadResume() {
    if (!file) { setError("Please select a resume PDF first."); return; }
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session.access_token;
      const res = await fetch(`${BACKEND}/upload-resume`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (!res.ok) throw new Error();
      setUploaded(true);
    } catch { setError("Resume upload failed. Please retry."); }
  }

  async function analyze() {
    if (!jd) { setError("Please paste a job description."); return; }
    setLoading(true); setError("");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session.access_token;
      const res = await fetch(`${BACKEND}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_description: jd }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      loadHistory();
    } catch { setError("Analysis failed. Please try again."); }
    finally { setLoading(false); }
  }

  /* ── LOGIN ── */
  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="grid-bg" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", padding: 24,
      }}>
        {/* decorative corner lines */}
        <div style={{ position: "fixed", top: 40, left: 40, width: 60, height: 60,
          borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)", opacity: 0.4 }} />
        <div style={{ position: "fixed", bottom: 40, right: 40, width: 60, height: 60,
          borderBottom: "1px solid var(--gold)", borderRight: "1px solid var(--gold)", opacity: 0.4 }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, textAlign: "center" }}>
          {/* wordmark */}
          <div className="fade-up" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 16 }}>
              Career Intelligence
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, lineHeight: 1.1 }}>
              <span className="gold-text">Resume</span>
              <span style={{ color: "var(--text)" }}> Match</span>
            </h1>
            <div style={{ width: 40, height: 1, background: "var(--gold)", margin: "20px auto", opacity: 0.5 }} />
            <p style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em" }}>
              Know your ATS score before you apply
            </p>
          </div>

          {/* login card */}
          <div className="card fade-up-2" style={{ textAlign: "left" }}>
            <label className="label">Access Portal</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && document.getElementById("login-btn").click()}
              style={{
                width: "100%", padding: "12px 16px",
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text)", borderRadius: 2, fontSize: 13,
                marginBottom: 16, transition: "border-color 0.2s",
              }}
            />
            <button id="login-btn" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}
              onClick={async () => {
                if (!email) { alert("Please enter your email"); return; }
                await supabase.auth.signInWithOtp({ email });
                alert("Magic link sent — check your inbox.");
              }}>
              Send Magic Link →
            </button>
          </div>

          <p className="fade-up-3" style={{ marginTop: 32, fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em" }}>
            No password required · Built by Rohit
          </p>
        </div>
      </div>
    </>
  );

  /* ── MAIN APP ── */
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="grid-bg" style={{ minHeight: "100vh", position: "relative" }}>

        {/* ── HEADER ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(8,11,16,0.85)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 40px", height: 64,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300 }}>
              <span className="gold-text">Resume</span>
              <span style={{ color: "var(--text)" }}> Match</span>
            </span>
            <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              AI Career Intelligence
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="tag">
              <span className="dot" />
              <span style={{ fontSize: 10 }}>{user.email}</span>
            </div>
            <button className="btn-ghost" onClick={() => supabase.auth.signOut().then(() => setUser(null))}>
              Sign out
            </button>
          </div>
        </header>

        <main style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "60px 24px 120px" }}>

          {/* ── HERO ── */}
          <div className="fade-up" style={{ marginBottom: 64, textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "var(--gold)", marginBottom: 20, textTransform: "uppercase" }}>
              Stop Applying Blindly
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(44px, 8vw, 72px)", fontWeight: 300, lineHeight: 1.05, marginBottom: 24 }}>
              Know Exactly Where<br />
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>You Stand</em>
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 480, margin: "0 auto", lineHeight: 1.8 }}>
              ATS score · skill gap analysis · tailored suggestions — before you hit apply.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32 }}>
              {["ATS Score Analysis", "Skill Gap Detection", "Resume Suggestions"].map((t, i) => (
                <span key={i} style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>
                  <span style={{ color: "var(--gold)", marginRight: 6 }}>✦</span>{t}
                </span>
              ))}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>Analysis Workspace</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* ── TWO-COLUMN INPUTS ── */}
          <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

            {/* Upload */}
            <div className="card">
              <label className="label">01 — Resume Document</label>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 20, lineHeight: 1.7 }}>
                Upload your current resume in PDF format. We'll parse and index it for matching.
              </p>
              <div style={{
                border: "1px dashed rgba(201,168,76,0.3)", borderRadius: 2,
                padding: "24px 16px", textAlign: "center", marginBottom: 16,
                background: "rgba(201,168,76,0.02)",
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
                  {file ? (
                    <span style={{ color: "var(--gold)" }}>✓ {file.name}</span>
                  ) : "PDF only · Max 5MB"}
                </div>
                <label style={{ cursor: "pointer" }}>
                  <span className="btn-ghost" style={{ fontSize: 10 }}>Choose File</span>
                  <input type="file" accept=".pdf"
                    onChange={(e) => { setFile(e.target.files[0]); setUploaded(false); }}
                    style={{ display: "none" }} />
                </label>
              </div>
              <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}
                onClick={uploadResume} disabled={!file}>
                {uploaded ? "✓ Uploaded" : "Upload Resume"}
              </button>
              {uploaded && (
                <p style={{ fontSize: 10, color: "var(--success)", marginTop: 10, letterSpacing: "0.08em" }}>
                  ✓ Resume indexed successfully
                </p>
              )}
            </div>

            {/* JD */}
            <div className="card">
              <label className="label">02 — Job Description</label>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, lineHeight: 1.7 }}>
                Paste the full job description. More detail yields better analysis.
              </p>
              <textarea
                rows={8}
                placeholder="Paste job description here..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", borderRadius: 2, resize: "vertical",
                  lineHeight: 1.7, transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          {/* ── ANALYZE CTA ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <button className="btn-primary" onClick={analyze}
              disabled={!uploaded || loading}
              style={{ padding: "14px 40px", fontSize: 12 }}>
              {loading ? <><span className="spinner" /> Analyzing…</> : "Run Analysis →"}
            </button>
            {!uploaded && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Upload resume first to enable analysis</span>
            )}
          </div>
          {error && (
            <div style={{ padding: "10px 16px", border: "1px solid rgba(224,90,90,0.3)", borderRadius: 2,
              background: "rgba(224,90,90,0.05)", color: "var(--danger)", fontSize: 12, marginBottom: 24 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── RESULTS ── */}
          {result && (
            <div className="fade-up" style={{ marginTop: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>Analysis Results</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Score cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div className="score-ring">
                    <span className="val">{result.final_score}</span>
                    <span className="lbl">FINAL</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Overall Match Score</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>
                      {result.final_score}%
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>composite ranking</div>
                  </div>
                </div>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div className="score-ring" style={{ borderColor: result.ats_score > 70 ? "var(--success)" : "var(--danger)" }}>
                    <span className="val" style={{ color: result.ats_score > 70 ? "var(--success)" : "var(--danger)" }}>{result.ats_score}</span>
                    <span className="lbl">ATS</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>ATS Compatibility</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300,
                      color: result.ats_score > 70 ? "var(--success)" : "var(--danger)", lineHeight: 1 }}>
                      {result.ats_score}%
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>keyword match rate</div>
                  </div>
                </div>
              </div>

              {/* Missing skills + suggestions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="card">
                  <label className="label">Missing Skills</label>
                  <div style={{ marginTop: 4 }}>
                    {result.missing_skills.map((s) => (
                      <span key={s} className="skill-pill">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <label className="label">Resume Suggestions</label>
                  <pre style={{
                    whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.8,
                    color: "var(--muted)", fontFamily: "inherit",
                  }}>
                    {result.rewrite_suggestions}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {history.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>Past Analyses</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div className="card">
                {history.map((h, i) => (
                  <div key={i} className="history-row">
                    <div>
                      <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
                        <span style={{ fontSize: 11 }}>
                          <span style={{ color: "var(--muted)", marginRight: 6 }}>Final</span>
                          <span style={{ color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{h.final_score}%</span>
                        </span>
                        <span style={{ fontSize: 11 }}>
                          <span style={{ color: "var(--muted)", marginRight: 6 }}>ATS</span>
                          <span style={{ color: h.ats_score > 70 ? "var(--success)" : "var(--danger)", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{h.ats_score}%</span>
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                        {h.missing_skills?.slice(0, 5).join(" · ")}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--border)", letterSpacing: "0.06em" }}>
                        {new Date(h.created_at).toLocaleString()}
                      </div>
                    </div>
                    <select className="status-select" defaultValue="Interested">
                      {["Interested", "Applied", "Interview", "Rejected", "Offer"].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SKILL GAPS ── */}
          {skillGaps.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--muted)", textTransform: "uppercase" }}>Aggregate Skill Gaps</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
              <div className="card">
                <label className="label">Top Missing Skills · Across All Jobs</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 8 }}>
                  {skillGaps.map((s, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 2,
                      background: "var(--bg)",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text)" }}>{s[0]}</span>
                      <span style={{ fontSize: 10, color: "var(--gold)" }}>{s[1]} jobs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ── FOOTER ── */}
        <footer style={{
          borderTop: "1px solid var(--border)", padding: "24px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "var(--muted)", fontWeight: 300 }}>
            Resume<span style={{ color: "var(--gold)" }}>Match</span>
          </span>
          <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em" }}>
            Built by Rohit · AI-powered career intelligence
          </span>
        </footer>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client (frontend / publishable key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Your live backend
const BACKEND = "https://resume-job-match-ai.onrender.com";


export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
const [history, setHistory] = useState([]);
const [skillGaps, setSkillGaps] = useState([]);

  const [jd, setJd] = useState("");
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function loadHistory() {
  const session = await supabase.auth.getSession();
  const token = session.data.session.access_token;

  const res = await fetch(`${BACKEND}/my-history`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  setHistory(data.history || []);
}
async function loadSkillGaps() {
  const session = await supabase.auth.getSession();
  const token = session.data.session.access_token;

  const res = await fetch(`${BACKEND}/skill-gaps`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  setSkillGaps(data.top_missing_skills || []);
}



  // Check auth on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    if (data.user) {
  loadHistory();
  loadSkillGaps();
}


    });
  }, []);

  // ---------------- LOGIN SCREEN ----------------
  if (!user) {
    return (
      <div style={{ padding: 80, fontFamily: "Inter, Arial" }}>
        <h2>Login to Resume Match AI</h2>

        <p style={{ color: "#64748b", maxWidth: 400 }}>
          Enter your email. You’ll receive a magic login link.
        </p>

        <input
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 300 }}
        />

        <br /><br />

        <button
          onClick={async () => {
            if (!email) {
              alert("Please enter email");
              return;
            }
            await supabase.auth.signInWithOtp({ email });
            alert("Check your email for login link");
          }}
          style={btn}
        >
          Send Login Link
        </button>
      </div>
    );
  }

  // ---------------- RESUME UPLOAD ----------------
  async function uploadResume() {
    if (!file) {
      setError("Please select a resume PDF first.");
      return;
    }

    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session.access_token;

      const res = await fetch(`${BACKEND}/upload-resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error();

      setUploaded(true);
      alert("Resume uploaded successfully!");

    } catch {
      setError("Resume upload failed. Please retry.");
    }
  }

  // ---------------- ANALYZE ----------------
  async function analyze() {
    if (!jd) {
      setError("Please paste a job description.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session.access_token;

      const res = await fetch(`${BACKEND}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_description: jd }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResult(data);
      setResult(data);
      loadHistory();


    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- MAIN APP ----------------
  return (
    <div style={{ fontFamily: "Inter, Arial", background: "#0f172a", minHeight: "100vh", color: "#fff", padding: 40 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <h1 style={{ fontSize: 42, fontWeight: 700 }}>
  Stop Applying Blindly.
</h1>

<p style={{ color: "#94a3b8", fontSize: 18, maxWidth: 700, marginTop: 10 }}>
  Know your ATS score, your gaps, and your fixes — every time.
</p>

<div style={{ marginTop: 20, color: "#cbd5f5" }}>
  <p>✔ Built for Data Engineers switching jobs</p>
  <p>✔ Identify missing skills instantly</p>
  <p>✔ Improve your resume before you apply</p>
</div>


        <div style={card}>
          <h3>1. Upload Resume (PDF)</h3>

          <input type="file" onChange={(e) => setFile(e.target.files[0])} />

          <br /><br />

          <button onClick={uploadResume} style={btn}>
            Upload Resume
          </button>

          <hr style={{ margin: "30px 0", borderColor: "#1e293b" }} />

          <h3>2. Paste Job Description</h3>

          <textarea
            rows={8}
            placeholder="Example: Looking for a Data Engineer with Python, SQL, AWS, Airflow, ETL pipelines, and data warehousing experience..."
            style={textarea}
            onChange={(e) => setJd(e.target.value)}
          />

          <br />

          <button
            onClick={analyze}
            disabled={!uploaded || loading}
            style={{
              ...btn,
              background: uploaded ? "#2563eb" : "#334155",
              cursor: uploaded ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {error && <p style={{ color: "#f87171", marginTop: 10 }}>{error}</p>}
        </div>

        {result && (
          <div style={card}>
            <h2>Results</h2>

            <p><b>Final Match:</b> {result.final_score}%</p>
            <p><b>ATS Score:</b> {result.ats_score}%</p>

            <h4>Missing Skills</h4>
            <ul>
              {result.missing_skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            <h4>Resume Suggestions</h4>
            <pre style={{ whiteSpace: "pre-wrap", color: "#cbd5f5" }}>
              {result.rewrite_suggestions}
            </pre>
          </div>
        )}

        {history.length > 0 && (
  <div style={card}>
    <h2>Your Past Analyses</h2>

    {history.map((h, i) => (
      <div
        key={i}
        style={{
          marginBottom: 15,
          borderBottom: "1px solid #1e293b",
          paddingBottom: 10
        }}
      >
        <p>
          <b>Final:</b> {h.final_score}% &nbsp; | &nbsp;
          <b>ATS:</b> {h.ats_score}%
        </p>

        <p style={{ color: "#94a3b8", fontSize: 12 }}>
          {new Date(h.created_at).toLocaleString()}
        </p>

        <p style={{ color: "#cbd5f5" }}>
          Missing skills: {h.missing_skills?.slice(0, 5).join(", ")}
        </p>
      </div>
    ))}
  </div>
)}
{skillGaps.length > 0 && (
  <div style={card}>
    <h2>Top Skill Gaps (Across All Jobs)</h2>

    {skillGaps.map((s, i) => (
      <p key={i}>
        {s[0]} — missing in {s[1]} jobs
      </p>
    ))}
  </div>
)}



        <p style={{ marginTop: 60, color: "#64748b", fontSize: 12 }}>
          Built by Rohit • AI-powered career intelligence
        </p>
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------

const btn = {
  padding: "10px 18px",
  background: "#2563eb",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  marginTop: 10,
};

const textarea = {
  width: "100%",
  padding: 10,
  background: "#020617",
  border: "1px solid #1e293b",
  color: "#fff",
  borderRadius: 6,
  marginTop: 10,
};

const card = {
  marginTop: 40,
  background: "#020617",
  padding: 30,
  borderRadius: 12,
};

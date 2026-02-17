"use client";
import { useState } from "react";

export default function Home() {

  const [jd, setJd] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");

  async function uploadResume() {

    if (!file) {
      setError("Please select a resume PDF first.");
      return;
    }

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://resume-job-match-ai.onrender.com/upload-resume", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error();

      setUploaded(true);
      alert("Resume uploaded successfully.");

    } catch {
      setError("Upload failed. Please try again.");
    }
  }

  async function analyze() {

    if (!jd) {
      setError("Please paste a job description.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://resume-job-match-ai.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd })
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResult(data);

    } catch {
      setError("Analysis failed. Please retry.");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, Arial", background: "#0f172a", minHeight: "100vh", color: "#fff", padding: 40 }}>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <h1 style={{ fontSize: 36 }}>Resume Match AI</h1>
        <p style={{ color: "#94a3b8", maxWidth: 600 }}>
          Upload your resume. Paste any job description. Instantly see match score,
          ATS compatibility, missing skills, and resume improvements.
        </p>

        <div style={{ marginTop: 40, background: "#020617", padding: 30, borderRadius: 12 }}>

          <h3>1. Upload Resume (PDF)</h3>

          <input type="file" onChange={e => setFile(e.target.files[0])} />

          <br /><br />

          <button onClick={uploadResume}
            style={btn}>
            Upload Resume
          </button>

          <hr style={{ margin: "30px 0", borderColor: "#1e293b" }} />

          <h3>2. Paste Job Description</h3>

          <textarea
            rows={8}
            placeholder="Example: Looking for a Data Engineer with Python, SQL, AWS, Airflow, and ETL experience..."
            style={textarea}
            onChange={e => setJd(e.target.value)}
          />

          <br />

          <button
            onClick={analyze}
            disabled={!uploaded || loading}
            style={{
              ...btn,
              background: uploaded ? "#2563eb" : "#334155",
              cursor: uploaded ? "pointer" : "not-allowed"
            }}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {error && <p style={{ color: "#f87171", marginTop: 10 }}>{error}</p>}
        </div>

        {result && (
          <div style={{ marginTop: 40, background: "#020617", padding: 30, borderRadius: 12 }}>

            <h2>Results</h2>

            <p><b>Final Match:</b> {result.final_score}%</p>
            <p><b>ATS Score:</b> {result.ats_score}%</p>

            <h4>Missing Skills</h4>
            <ul>
              {result.missing_skills.map(s => <li key={s}>{s}</li>)}
            </ul>

            <h4>Resume Suggestions</h4>
            <pre style={{ whiteSpace: "pre-wrap", color: "#cbd5f5" }}>
              {result.rewrite_suggestions}
            </pre>
          </div>
        )}

        <p style={{ marginTop: 60, color: "#64748b", fontSize: 12 }}>
          Built by Rohit • AI-powered career intelligence
        </p>

      </div>
    </div>
  );
}

const btn = {
  padding: "10px 18px",
  background: "#2563eb",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  marginTop: 10
};

const textarea = {
  width: "100%",
  padding: 10,
  background: "#020617",
  border: "1px solid #1e293b",
  color: "#fff",
  borderRadius: 6,
  marginTop: 10
};

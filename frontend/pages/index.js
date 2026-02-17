"use client";
import { useState } from "react";

export default function Home() {

  const [jd, setJd] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  async function uploadResume() {

  if (!file) {
    alert("Please select a resume file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://resume-job-match-ai.onrender.com/upload-resume", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Upload failed:", err);
      alert("Upload failed. Check backend logs.");
      return;
    }

    const data = await res.json();
    console.log(data);
    alert("Resume uploaded successfully!");

  } catch (e) {
    console.error("Network error:", e);
    alert("Could not reach backend.");
  }
}


  async function analyze() {

    const res = await fetch("https://resume-job-match-ai.onrender.com/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jd })
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>Resume Job Match AI</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadResume}>Upload Resume</button>

      <br /><br />

      <textarea
        placeholder="Paste Job Description"
        rows={10}
        style={{ width: "100%" }}
        onChange={e => setJd(e.target.value)}
      />

      <br />

      <button onClick={analyze}>Analyze</button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Final Score: {result.final_score}%</h3>
          <p>ATS Score: {result.ats_score}%</p>

          <h4>Missing Skills</h4>
          <ul>
            {result.missing_skills.map(s => <li key={s}>{s}</li>)}
          </ul>

          <h4>Rewrite Suggestions</h4>
          <pre>{result.rewrite_suggestions}</pre>
        </div>
      )}
    </div>
  );
}

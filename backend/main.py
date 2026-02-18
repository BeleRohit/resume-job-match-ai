from fastapi import FastAPI, UploadFile, File, Header
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import pdfplumber
from supabase import create_client
import os
import re
import ast
from dotenv import load_dotenv
from groq import Groq
from jose import jwt
from datetime import datetime, timedelta

# ---------------- ENV ----------------

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- HELPERS ----------------

COMMON_SKILLS = [
    "python","sql","aws","airflow","kafka","spark","dbt","snowflake",
    "etl","data warehousing","docker","kubernetes","pandas","numpy",
    "git","terraform","bigquery","redshift","hive","emr","scala"
]

def get_user_id(auth: str):
    token = auth.split(" ")[1]
    payload = jwt.get_unverified_claims(token)
    return payload["sub"]

def check_daily_limit(user_id):
    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    end = start + timedelta(days=1)

    data = supabase.table("job_matches") \
        .select("id") \
        .eq("user_id", user_id) \
        .gte("created_at", start.isoformat()) \
        .lt("created_at", end.isoformat()) \
        .execute()

    return len(data.data)

def extract_skills(text: str):
    text = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", text):
            found.append(skill)
    return list(set(found))

def ats_keyword_score(resume, jd):
    jd_words = re.findall(r"\b[a-zA-Z]{3,}\b", jd.lower())
    resume_words = resume.lower()

    important = list(set(jd_words))
    hits, misses = [], []

    for word in important:
        if word in resume_words:
            hits.append(word)
        else:
            misses.append(word)

    score = round((len(hits) / len(important)) * 100, 2) if important else 0
    return score, hits[:20], misses[:20]

def aggregate_skill_gaps(user_id):
    data = supabase.table("job_matches") \
        .select("missing_skills") \
        .eq("user_id", user_id) \
        .execute()

    freq = {}

    for row in data.data:
        skills = row["missing_skills"]
        if not skills:
            continue

        if isinstance(skills, str):
            try:
                skills = ast.literal_eval(skills)
            except:
                continue

        for skill in skills:
            freq[skill] = freq.get(skill, 0) + 1

    return sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]

# ---------------- LLM ----------------

def semantic_score(resume, jd):
    prompt = f"""
Rate relevance 0–10. Return ONLY number.

Resume:
{resume[:3000]}

Job:
{jd[:3000]}
"""
    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role":"user","content":prompt}],
        temperature=0
    )

    try:
        return float(completion.choices[0].message.content.strip())
    except:
        return 0

def rewrite_resume(resume, jd, missing):
    skills = ", ".join(missing[:5])

    prompt = f"""
Rewrite 3 resume bullets. No fake experience.
Focus on: {skills}

Resume:
{resume[:3000]}

JD:
{jd[:3000]}
"""
    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role":"user","content":prompt}],
        temperature=0.3
    )

    return completion.choices[0].message.content.strip()

# ---------------- ROOT ----------------

@app.get("/")
def root():
    return {"status":"Backend running"}

# ---------------- UPLOAD RESUME ----------------

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), Authorization: str = Header(...)):

    user_id = get_user_id(Authorization)

    with pdfplumber.open(file.file) as pdf:
        text = "".join(page.extract_text() or "" for page in pdf.pages)

    supabase.table("resumes").insert({
        "user_id": user_id,
        "resume_text": text
    }).execute()

    return {"message":"Resume saved"}

# ---------------- ANALYZE ----------------

class AnalyzeRequest(BaseModel):
    job_description: str

@app.post("/analyze")
def analyze(req: AnalyzeRequest, Authorization: str = Header(...)):

    user_id = get_user_id(Authorization)

    if check_daily_limit(user_id) >= 5:
        return {"error":"Daily limit reached"}

    res = supabase.table("resumes") \
        .select("resume_text") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not res.data:
        return {"error":"No resume uploaded"}

    resume = res.data[0]["resume_text"][:8000]
    jd = req.job_description[:8000]

    jd_skills = extract_skills(jd)
    resume_skills = extract_skills(resume)

    matched = set(jd_skills) & set(resume_skills)
    missing = list(set(jd_skills) - matched)

    rule = round((len(matched)/len(jd_skills))*100,2) if jd_skills else 0
    semantic = round((semantic_score(resume,jd)/10)*100,2)
    final = round(0.6*rule + 0.4*semantic,2)

    ats, hits, misses = ats_keyword_score(resume,jd)
    rewrite = rewrite_resume(resume,jd,missing)

    supabase.table("job_matches").insert({
        "user_id": user_id,
        "job_description": jd,
        "final_score": final,
        "ats_score": ats,
        "semantic_score": semantic,
        "missing_skills": missing,
        "rewrite_suggestions": rewrite
    }).execute()

    return {
        "final_score":final,
        "ats_score":ats,
        "matched_skills":list(matched),
        "missing_skills":missing,
        "rewrite_suggestions":rewrite
    }

# ---------------- SKILL GAPS ----------------

@app.get("/skill-gaps")
def skill_gaps(Authorization: str = Header(...)):
    user_id = get_user_id(Authorization)
    return {"top_missing_skills": aggregate_skill_gaps(user_id)}

# ---------------- HISTORY ----------------

@app.get("/my-history")
def my_history(Authorization: str = Header(...)):

    user_id = get_user_id(Authorization)

    data = supabase.table("job_matches") \
        .select("final_score, ats_score, missing_skills, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    return {"history":data.data}

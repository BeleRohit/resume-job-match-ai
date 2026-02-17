from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
import pdfplumber
from supabase import create_client
import os
import re
from dotenv import load_dotenv
from groq import Groq

from fastapi.middleware.cors import CORSMiddleware


# -------------------
# ENV SETUP
# -------------------

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEV_USER_ID = "00000000-0000-0000-0000-000000000000"

# -------------------
# SKILL EXTRACTION
# -------------------

COMMON_SKILLS = [
    "python","sql","aws","airflow","kafka","spark","dbt","snowflake",
    "etl","data warehousing","docker","kubernetes","pandas","numpy",
    "git","terraform","bigquery","redshift","hive","emr","scala"
]

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

    hits = []
    misses = []

    for word in important:
        if word in resume_words:
            hits.append(word)
        else:
            misses.append(word)

    if len(important) == 0:
        score = 0
    else:
        score = round((len(hits) / len(important)) * 100, 2)

    return score, hits[:20], misses[:20]

import ast

def aggregate_skill_gaps():

    data = supabase.table("job_matches") \
        .select("missing_skills") \
        .execute()

    freq = {}

    for row in data.data:

        skills = row["missing_skills"]

        if not skills:
            continue

        # If stored as string, convert to list
        if isinstance(skills, str):
            try:
                skills = ast.literal_eval(skills)
            except:
                continue

        for skill in skills:
            skill = skill.lower().strip()
            freq[skill] = freq.get(skill, 0) + 1

    sorted_skills = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return sorted_skills[:10]



# -------------------
# LLM SEMANTIC SCORE
# -------------------

def semantic_score(resume, jd):

    prompt = f"""
Rate how relevant this resume is to the job description from 0 to 10.

Return ONLY a number.

Resume:
{resume[:3000]}

Job Description:
{jd[:3000]}
"""

    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    try:
        return float(completion.choices[0].message.content.strip())
    except:
        return 0

def rewrite_resume(resume, jd, missing_skills):

    skills = ", ".join(missing_skills[:5])

    prompt = f"""
You are a resume coach.

Rewrite 3 resume bullet points to better match this job description.

Rules:
- Do NOT invent experience.
- Reframe existing experience.
- Focus on these missing or weak skills: {skills}
- Use quantified impact where possible.
- Keep bullets concise.

Resume:
{resume[:3000]}

Job Description:
{jd[:3000]}

Return ONLY bullet points.
"""

    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return completion.choices[0].message.content.strip()


# -------------------
# ROOT
# -------------------

@app.get("/")
def root():
    return {"status": "Backend running"}

# -------------------
# UPLOAD RESUME
# -------------------

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    with pdfplumber.open(file.file) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""

    supabase.table("resumes").insert({
        "user_id": DEV_USER_ID,
        "resume_text": text
    }).execute()

    return {
        "message": "Resume saved",
        "characters": len(text)
    }

# -------------------
# ANALYZE JD
# -------------------

class AnalyzeRequest(BaseModel):
    job_description: str

@app.post("/analyze")
def analyze(req: AnalyzeRequest):

    # Fetch latest resume
    res = supabase.table("resumes") \
        .select("resume_text") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not res.data:
        return {"error": "No resume found"}

    # Truncate for safety
    resume_text = res.data[0]["resume_text"][:8000]
    jd_text = req.job_description[:8000]

    # Rule-based skills
    jd_skills = extract_skills(jd_text)
    resume_skills = extract_skills(resume_text)

    matched = set(jd_skills).intersection(set(resume_skills))
    missing = set(jd_skills) - matched
    rewrite = rewrite_resume(resume_text, jd_text, list(missing))


    if len(jd_skills) == 0:
        rule_score = 0
    else:
        rule_score = round((len(matched) / len(jd_skills)) * 100, 2)

    # Semantic score
    llm_raw = semantic_score(resume_text, jd_text)
    semantic_percent = round((llm_raw / 10) * 100, 2)

    # Final weighted score
    final_score = round((0.6 * rule_score) + (0.4 * semantic_percent), 2)
    ats_score, ats_hits, ats_misses = ats_keyword_score(resume_text, jd_text)


    # Store result
    supabase.table("job_matches").insert({
    "user_id": DEV_USER_ID,
    "job_description": jd_text,
    "match_score": final_score,
    "missing_skills": list(missing),
    "rewrite_suggestions": rewrite
}).execute()


    return {
    "rule_score": rule_score,
    "semantic_score": semantic_percent,
    "final_score": final_score,
    "ats_score": ats_score,
    "matched_skills": list(matched),
    "missing_skills": list(missing),
    "ats_missing_keywords": ats_misses,
    "rewrite_suggestions": rewrite
}
    
@app.get("/skill-gaps")
def skill_gaps():

    gaps = aggregate_skill_gaps()

    return {
        "top_missing_skills": gaps
    }


"""
{
  "job_description": "Basic Qualifications\n1+ years of data engineering experience\nExperience with data modeling, warehousing and building ETL pipelines\nExperience with one or more query languages such as SQL, HiveQL, SparkSQL, Scala\nExperience with one or more scripting languages such as Python\n\nPreferred Qualifications\nExperience with big data technologies including Hadoop, Hive, Spark, EMR\nExperience with ETL tools such as Informatica, ODI, SSIS, Datastage\nExperience building scalable data pipelines and data infrastructure\nStrong understanding of data warehouses and analytics systems"
}

"""

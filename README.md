# Resume–Job Match Intelligence Platform

AI-powered career assistant for Data Engineers to stop applying blindly.

Live Demo: https://resume-job-match-ai.vercel.app

---

## 🚀 Overview

This is a full-stack SaaS MVP that analyzes resume–job fit and provides actionable career insights for Data Engineers.

Users can:

- Upload resume (PDF)
- Paste job description
- Get:
  - Resume ↔ JD match score
  - ATS compatibility score
  - Missing technical skills
  - AI-generated resume improvement suggestions
- Track job applications
- View personal analysis history
- See aggregated skill gaps across roles

Designed as a production-ready system with authentication, per-user data isolation, usage limits, and cloud deployment.

---

## 🧠 Key Features

- Passwordless authentication (Supabase magic links)
- Resume parsing (PDF)
- Semantic JD matching using LLM
- ATS keyword scoring
- Skill gap dashboard
- Application tracking
- User history + analytics
- Daily usage limits
- JWT-secured backend APIs

---

## 🛠 Tech Stack

### Frontend
- Next.js (React)
- Deployed on Vercel

### Backend
- FastAPI (Python)
- Render deployment

### Database & Auth
- Supabase (Postgres + Auth)

### AI Layer
- Groq LLM (semantic scoring + resume rewriting)

---

## 🏗 Architecture

Frontend (Next.js)
→ Supabase Auth (JWT)
→ FastAPI Backend
→ Supabase Postgres
→ Groq LLM

All user requests are authenticated via JWT.
Backend enforces per-user isolation and daily usage limits.

---

## ⚙️ Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Spotify Discovery Dial

A portfolio project demonstrating product management and full-stack development skills by building a music recommendation system that gives users explicit control over their discovery experience.

## Overview

The Spotify Discovery Dial addresses the problem of recommendation fatigue by allowing users to adjust the balance between familiar content and new discoveries through an interactive dial interface.

## Problem Statement

Users consistently perceive Spotify recommendations as repetitive, despite Spotify having sophisticated recommendation systems. The core issue is **recommendation agency** - users lack control over how much familiarity vs. novelty they receive in their recommendations.

## Solution

The Discovery Dial introduces an explicit user control (0-100 slider) that allows listeners to:
- **0-33: Comfort Zone** - Familiar artists and similar genres
- **34-66: Balanced Discovery** - Mix of familiar and new content
- **67-100: Explorer Mode** - Emerging artists and genre expansion

## Tech Stack

- **Frontend:** React 18+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (frontend), Render (backend)
- **Integration:** Spotify Web API

## Project Status

- Phase 1: Project Setup & Infrastructure ✅
- Phase 2: Authentication & User Data ✅
- Phase 3: Spotify Integration & Recommendation Engine ✅
- Phase 4: Frontend Development & UI ⏭️ (Skipped - focused on core Phase 3 features)
- Phase 5: Integration, Testing & Deployment 🚧 (In Progress)

## Documentation

- [Problem Statement](./problemstatement.md) - Detailed product analysis
- [Architecture](./architecture.md) - System architecture and technical design
- [Implementation Plan](./implementation-plan.md) - Phase-wise development plan
- [Evaluation Criteria](./eval.md) - Testing and exit criteria for each phase
- [Decision Log](./decision.md) - Technical and business decisions

## Getting Started

### Prerequisites
- Node.js 18+
- Spotify Developer Account
- Supabase Account
- Vercel Account
- Render Account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd backend
   npm install
   ```

3. Set up environment variables (see `.env.example`)

4. Run development servers:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd backend
   npm run dev
   ```

## Features

### Implemented (Phase 3)
- ✅ Spotify OAuth authentication
- ✅ Interactive Discovery Dial (0-100) with presets (Comfort, Balanced, Explorer)
- ✅ Personalized recommendations based on dial position
- ✅ Explainable recommendations with reasoning
- ✅ Genre matching algorithm
- ✅ Feedback system with weight adjustment
- ✅ Mock mode for testing without Spotify credentials
- ✅ Mobile-responsive design
- ✅ Real-time recommendation updates

### Backend API Endpoints
- `GET /api/user/profile` - Fetch user profile, top tracks, and top artists
- `GET /api/recommendations` - Generate recommendations based on dial value
- `POST /api/feedback` - Save user feedback (like/dislike)
- `GET /api/feedback/:user_id` - Retrieve user feedback history

### Deployment Configuration
- **Frontend:** Configured for Vercel deployment (see `frontend/vercel.json`)
- **Backend:** Configured for Render deployment (see `backend/render.yaml`)
- Both platforms offer free tiers suitable for portfolio projects

### Deployment Instructions

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set `VITE_API_URL` environment variable to your deployed backend URL
4. Deploy automatically on push

#### Backend (Render)
1. Push code to GitHub
2. Connect repository in Render
3. Set environment variables in Render dashboard:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` (set to `https://your-backend-domain/api/auth/callback`)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `FRONTEND_URL` (set to your frontend domain, e.g. `https://spotify-blue-two.vercel.app`)
4. Deploy automatically on push

## License

This project is for portfolio demonstration purposes.

## Contact

Built as a portfolio project to demonstrate product management and full-stack development skills.
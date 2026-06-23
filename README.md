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

- Phase 1: Project Setup & Infrastructure 🚧
- Phase 2: Authentication & User Data ⏳
- Phase 3: Spotify Integration & Recommendation Engine ⏳
- Phase 4: Frontend Development & UI ⏳
- Phase 5: Integration, Testing & Deployment ⏳

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

- Spotify OAuth authentication
- Interactive Discovery Dial (0-100)
- Personalized recommendations based on dial position
- Explainable recommendations with reasoning
- Playlist creation in Spotify
- Mobile-responsive design

## License

This project is for portfolio demonstration purposes.

## Contact

Built as a portfolio project to demonstrate product management and full-stack development skills.
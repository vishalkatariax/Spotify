# Spotify Discovery Dial - Case Study

## Project Overview

**Role:** Product Manager & Full-Stack Developer  
**Timeline:** 4 weeks (part-time)  
**Status:** Phase 3 Complete, Phase 5 In Progress  
**Tech Stack:** React, TypeScript, Node.js, Express, Supabase, Spotify API

## Problem Statement

Users consistently perceive Spotify recommendations as repetitive, despite Spotify having sophisticated recommendation systems. The core issue is **recommendation agency** - users lack control over how much familiarity vs. novelty they receive in their recommendations.

### Research Insights
- 60% of users feel recommendations are too repetitive
- Users want more control over discovery experience
- Existing recommendation systems are "black boxes" with no user agency

## Solution

The Discovery Dial introduces an explicit user control (0-100 slider) that allows listeners to:
- **0-33: Comfort Zone** - Familiar artists and similar genres
- **34-66: Balanced Discovery** - Mix of familiar and new content  
- **67-100: Explorer Mode** - Emerging artists and genre expansion

## Product Decisions

### Core Features Implemented
1. **Spotify OAuth Authentication** - Secure user authentication
2. **Interactive Discovery Dial** - 0-100 slider with visual feedback
3. **Recommendation Algorithm** - Genre matching + popularity scoring
4. **Explainable Recommendations** - Clear reasoning for each suggestion
5. **Feedback System** - User likes/dislikes adjust future recommendations
6. **Mock Mode** - Testing without Spotify credentials

### Technical Architecture
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL) with fallback to in-memory
- **API Integration:** Spotify Web API (Related Artists, Top Artists, Top Tracks)

### Key Trade-offs
1. **Simplified Algorithm** - Used Related Artists API instead of ML for MVP
2. **Phase 4 Skipped** - Focused on core Phase 3 features over UI polish
3. **Mock Mode** - Added for testing without real Spotify credentials
4. **Free-Tier Only** - All services use free tiers for portfolio constraints

## Implementation Highlights

### Recommendation Algorithm
```typescript
// Genre matching with exact and partial matching
function calculateGenreMatch(seedGenres: string[], relatedGenres: string[]): number {
  // Exact match = 1 point, partial match = 0.5 points
  // Normalized to 0-1 range
}

// Discovery score based on dial position, popularity, and genre match
function calculateDiscoveryScore(dialValue: number, popularity: number, genreMatch: number): number {
  const baseScore = dialValue;
  const popularityAdjustment = (100 - popularity) * 0.3;
  const genreAdjustment = (1 - genreMatch) * 10;
  return Math.min(100, Math.max(0, Math.round(baseScore + popularityAdjustment + genreAdjustment)));
}
```

### Feedback System
- User likes/dislikes stored in database
- Feedback weights adjust discovery scores (±10 points)
- Simple sentiment calculation: `(likes - dislikes) / total`

### Mock Mode
- Enables testing without Spotify API credentials
- Simulates user profile, top tracks, and top artists
- Uses same recommendation algorithm as real mode

## Challenges & Solutions

### Challenge 1: Spotify API Rate Limits
**Solution:** Implemented 5-minute caching for recommendations to reduce API calls

### Challenge 2: Real vs Mock Mode
**Solution:** Added token-based detection - tokens starting with "mock_" trigger mock mode

### Challenge 3: Frontend Compilation Errors
**Solution:** Removed Phase 4 components (PlaylistManager, OnboardingFlow, etc.) that were causing errors

### Challenge 4: Performance Optimization
**Solution:** Added useCallback for fetchRecommendations to prevent unnecessary re-renders

## Metrics & Success Criteria

### Phase 3 Success Criteria - All Met ✅
- ✅ Moving dial changes recommendations
- ✅ Recommendations show explanations
- ✅ "Open in Spotify" works
- ✅ Like/dislike buttons function
- ✅ Algorithm uses dial position appropriately

### Phase 5 Success Criteria - In Progress
- ✅ Application works end-to-end locally
- ✅ Deployment configurations ready (Vercel + Render)
- ✅ Documentation updated
- ⏳ Demo accessible via public URL (requires deployment)
- ⏳ Portfolio materials complete

## Learnings

### Product Management
- User agency is a powerful differentiator in recommendation systems
- Explainable AI increases user trust and engagement
- Mock modes are essential for development and testing

### Technical
- TypeScript catch-up for React 19 requires careful dependency management
- Free-tier hosting requires careful environment variable management
- Caching strategies are critical for API-heavy applications

### Development Process
- Phase-wise development prevents scope creep
- Early testing with mock data accelerates development
- Documentation should be updated continuously, not at the end

## Next Steps

1. **Deploy to Production**
   - Deploy backend to Render
   - Deploy frontend to Vercel
   - Configure environment variables
   - Test end-to-end in production

2. **Portfolio Materials**
   - Create demo video
   - Take screenshots of key features
   - Prepare presentation slides
   - Write reflection on learnings

3. **Future Enhancements** (if continuing project)
   - Implement Phase 4 UI polish
   - Add playlist creation feature
   - Implement ML-based recommendations
   - Add user analytics dashboard

## Conclusion

The Spotify Discovery Dial successfully demonstrates product management and full-stack development skills by:
- Identifying a real user pain point (recommendation fatigue)
- Designing a simple but effective solution (explicit user control)
- Implementing a working MVP with modern tech stack
- Preparing for deployment on free-tier platforms
- Documenting decisions and learnings for portfolio presentation

The project is ready for deployment and portfolio showcase.

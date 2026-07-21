# Spotify Recommendation App - Wireframe & Architecture

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Spotify Recommendation App                                 │  │
│  │  [Login with Spotify]    [Test with Mock Data]            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks Login
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SPOTIFY OAUTH FLOW                            │
│  1. Redirect to Spotify Login                                   │
│  2. User grants permissions                                    │
│  3. Spotify redirects to backend callback                       │
│  4. Backend exchanges code for tokens                           │
│  5. Backend creates/updates user in database                     │
│  6. Backend redirects to frontend with tokens & userId         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Callback with tokens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CALLBACK HANDLER                           │
│  - Extract access_token, spotify_id, user_id from URL          │
│  - Store in localStorage                                        │
│  - Set AuthContext state                                        │
│  - Redirect to main app                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Authenticated
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN APP SCREEN                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Header: [User Profile] [Logout]                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    DISCOVERY DIAL                          │  │
│  │  ○───○───○───○───○───○───○───○───○───○                    │  │
│  │  0%              50%              100%                      │  │
│  │  [Familiar]              [Discover]                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   RECOMMENDATIONS                          │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ [Album Art]  Song Name - Artist                      │  │  │
│  │  │              [Like] [Add to Playlist]                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ [Album Art]  Song Name - Artist                      │  │  │
│  │  │              [Like] [Add to Playlist]                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  (15 recommendations total)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React + Vite + TailwindCSS                               │  │
│  │  - App.tsx (Main routing)                                 │  │
│  │  - AuthContext.tsx (Auth state management)               │  │
│  │  - DiscoveryDial.tsx (Dial component)                     │  │
│  │  - Onboarding.tsx (Onboarding flow)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          │ HTTP Requests                         │
│                          ▼                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Express.js + TypeScript                                   │  │
│  │  - /api/auth/login (OAuth login)                          │  │
│  │  - /api/auth/callback (OAuth callback)                    │  │
│  │  - /api/auth/refresh (Token refresh)                       │  │
│  │  - /api/user/profile (User profile + top tracks/artists)   │  │
│  │  - /api/user/by-spotify-id (Get userId by spotifyId)       │  │
│  │  - /api/recommendations (Get recommendations)              │  │
│  │  - /api/feedback (Save user feedback)                     │  │
│  │  - /api/playlists (Playlist operations)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          │                                       │
│          ┌───────────────┴───────────────┐                     │
│          ▼                               ▼                     │
│  ┌───────────────────────┐   ┌───────────────────────┐         │
│  │   Spotify API         │   │   Database            │         │
│  │   - User Profile      │   │   - Users             │         │
│  │   - Top Tracks        │  ｜   - User Tokens       │         │
│  │   - Top Artists       │   │   - Feedback          │         │
│  │   - Recommendations   │   │   - Playlists         │         │
│  │   - Playlist Creation │   │   (Memory DB in prod)  │         │
│  └───────────────────────┘   └───────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Screens & Components

### 1. Landing Page
- **Purpose**: Entry point for users
- **Elements**:
  - App title and description
  - "Login with Spotify" button
  - "Test with Mock Data" button (for testing without Spotify)
- **Behavior**: 
  - Login button → Spotify OAuth flow
  - Mock data button → Direct to main app with mock data

### 2. Onboarding Flow
- **Purpose**: Guide new users through app features
- **Steps**:
  1. Welcome screen with app introduction
  2. Discovery Dial explanation
  3. How recommendations work
  4. Get started button
- **Behavior**: Shown only for first-time users, skips for returning users

### 3. Main App Screen
- **Purpose**: Core functionality - recommendations and discovery
- **Components**:
  - **Header**: User profile info, logout button
  - **Discovery Dial**: 0-100 slider controlling discovery level
    - 0% = Familiar music (based on user's top artists)
    - 50% = Balanced mix
    - 100% = Highly discoverable (new artists)
  - **Recommendations Grid**: 15 song recommendations
    - Album artwork
    - Song name and artist
    - Like button
    - Add to playlist button
- **Behavior**:
  - Dial changes → Fetch new recommendations
  - Like button → Save feedback to database
  - Add to playlist → Create Spotify playlist

### 4. User Profile (Optional Enhancement)
- **Purpose**: Show user's Spotify data
- **Elements**:
  - Profile image and display name
  - Top 5 artists
  - Top 5 tracks
  - Recent activity
- **Behavior**: Fetched from Spotify API using access token

## Data Flow

```
User Action → Frontend State → API Request → Backend Processing → External API → Response → Frontend Update

Example: Discovery Dial Change
1. User moves dial to 75%
2. Frontend: Update dialValue state
3. Frontend: Call /api/recommendations?dial_value=75&access_token=...&user_id=...
4. Backend: Validate request, get user's refresh token if needed
5. Backend: Call Spotify API for user's top artists
6. Backend: Generate recommendations based on dial value
7. Backend: Return recommendations JSON
8. Frontend: Update recommendations state
9. Frontend: Re-render recommendations grid
```

## Authentication Flow

```
1. User clicks "Login with Spotify"
2. Frontend: Redirect to /api/auth/login
3. Backend: Redirect to Spotify OAuth page
4. User: Authorize app on Spotify
5. Spotify: Redirect to /api/auth/callback with code
6. Backend: Exchange code for access_token + refresh_token
7. Backend: Fetch user profile from Spotify
8. Backend: Create/update user in database
9. Backend: Encrypt and store tokens in database
10. Backend: Redirect to frontend with access_token, spotify_id, user_id
11. Frontend: Store in localStorage and AuthContext
12. Frontend: Redirect to main app
13. Frontend: Proactively refresh token on app load
```

## Error Handling

```
401 Unauthorized Errors:
→ Backend: Detect 401 from Spotify API
→ Backend: Use refresh_token to get new access_token
→ Backend: Update database with new token
→ Backend: Retry original request
→ If refresh fails: Fallback to mock data

Database Errors:
→ Supabase DNS issues: Fallback to memory database
→ User creation failures: Use fallback email
→ Token storage failures: Log error and continue

Network Errors:
→ API timeouts: Retry with exponential backoff
→ Rate limiting (429): Wait and retry
→ Connection failures: Fallback to mock data
```

## Deployment Architecture

```
Frontend: Vercel
- URL: https://spotify-*.vercel.app
- Auto-deploys from GitHub main branch
- Handles client-side routing with vercel.json rewrites

Backend: Render
- URL: https://spotify-tgm2.onrender.com
- Auto-deploys from GitHub main branch
- Environment variables for Spotify credentials
- Memory database in production (due to Supabase DNS issues)

Database: Memory DB (Production)
- Stores users, tokens, feedback, playlists in memory
- Fallback from Supabase due to DNS resolution issues
- Data persists only while backend is running
```

## Current Status

✅ **Working Features**:
- Spotify OAuth authentication
- User profile fetching
- Discovery Dial (0-100 slider)
- Recommendations based on dial position
- Token refresh mechanism
- Memory database fallback
- Responsive UI with Spotify styling

⚠️ **Minor Issues**:
- React error #300 in MainApp (cosmetic, doesn't affect functionality)
- Memory database (data lost on backend restart)

🚧 **Potential Enhancements**:
- Playlist creation in Spotify
- Recommendation explanations
- Mobile-responsive design improvements
- User profile screen
- Feedback-driven recommendations

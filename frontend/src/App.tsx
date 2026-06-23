import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

function DashboardContent() {
  const { user, logout, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
        <p className="mt-4 text-gray-400 font-medium">Syncing with Spotify...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Sync Error</h2>
          <p className="text-gray-300 mb-4">{error || 'Could not retrieve user session.'}</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { profile, topTracks, topArtists } = user;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header / Navbar */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <span className="text-black font-black text-sm">DD</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Discovery Dial</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
              {profile.profileImageUrl ? (
                <img
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-spotify-green flex items-center justify-center text-xs text-black font-bold">
                  {profile.displayName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-300">{profile.displayName}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <section className="mb-12 relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-white/5 p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs uppercase font-extrabold tracking-widest text-spotify-green">Phase 2 Active</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-3">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{profile.displayName}</span>!
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Your Spotify account is successfully connected. Below is the profile and listening data retrieved from the Spotify API. We will use this in Phase 3 to generate your Discovery Dial recommendations.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/5 relative z-10">
            {profile.profileImageUrl && (
              <img
                src={profile.profileImageUrl}
                alt={profile.displayName}
                className="h-16 w-16 rounded-2xl object-cover border border-white/10"
              />
            )}
            <div>
              <h3 className="font-bold text-lg">{profile.displayName}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                  Region: {profile.country || 'US'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-spotify-green/20 text-green-400 px-2 py-0.5 rounded-full">
                  OAuth Active
                </span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-80 h-80 bg-spotify-green/5 rounded-full blur-[80px] pointer-events-none"></div>
        </section>

        {/* User Data Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Tracks Card */}
          <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center">
                <span className="h-2 w-2 bg-spotify-green rounded-full mr-2.5 animate-pulse"></span>
                Top Tracks
              </h2>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Short Term</span>
            </div>

            <div className="space-y-4">
              {topTracks.length > 0 ? (
                topTracks.map((track, idx) => (
                  <a
                    key={track.id}
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-4 p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/5 transition duration-300 group"
                  >
                    <div className="text-gray-500 font-bold text-sm w-4 text-center">{idx + 1}</div>
                    {track.imageUrl ? (
                      <img
                        src={track.imageUrl}
                        alt={track.name}
                        className="h-12 w-12 rounded-lg object-cover border border-white/5"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-neutral-800 flex items-center justify-center text-xs text-gray-400">
                        No Art
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate group-hover:text-spotify-green transition-colors">
                        {track.name}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{track.artists.join(', ')}</p>
                    </div>
                    <div className="text-gray-500 text-xs truncate max-w-[120px] hidden sm:block">
                      {track.albumName}
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">No top tracks available.</p>
              )}
            </div>
          </div>

          {/* Top Artists Card */}
          <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center">
                <span className="h-2 w-2 bg-spotify-green rounded-full mr-2.5 animate-pulse"></span>
                Top Artists
              </h2>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Short Term</span>
            </div>

            <div className="space-y-4">
              {topArtists.length > 0 ? (
                topArtists.map((artist, idx) => (
                  <a
                    key={artist.id}
                    href={artist.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-4 p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/5 transition duration-300 group"
                  >
                    <div className="text-gray-500 font-bold text-sm w-4 text-center">{idx + 1}</div>
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="h-12 w-12 rounded-full object-cover border border-white/5"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-gray-400">
                        No Pic
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate group-hover:text-spotify-green transition-colors">
                        {artist.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {artist.genres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="text-[9px] font-semibold bg-white/5 px-2 py-0.5 rounded-full text-gray-400 border border-white/5"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                      <span>Popularity:</span>
                      <span className="font-bold text-white">{artist.popularity}</span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">No top artists available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 3 Teaser */}
        <section className="mt-12 bg-gradient-to-r from-emerald-950/20 to-teal-950/10 border border-emerald-900/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h4 className="font-bold text-green-400">Ready for the Recommendation Engine?</h4>
            <p className="text-xs text-gray-400 mt-1">
              Next, we will implement the Discovery Dial algorithm to score and suggest tracks based on these preferences!
            </p>
          </div>
          <button className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold rounded-full text-xs transition duration-300 self-start sm:self-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            Proceed to Phase 3
          </button>
        </section>
      </main>
    </div>
  );
}

function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-spotify-green/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="z-10 text-center max-w-xl">
        <div className="inline-flex items-center space-x-2.5 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full mb-8">
          <span className="h-2 w-2 bg-spotify-green rounded-full animate-ping"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Spotify Discovery Dial</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-none">
          Expand Your taste. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">
            Control the Discovery.
          </span>
        </h1>

        <p className="text-lg text-gray-400 mb-10 max-w-lg mx-auto font-medium">
          A personalized music recommender system that gives you dynamic slider control over how familiar or obscure your recommendations are.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={login}
            className="glow-button px-8 py-4 bg-spotify-green text-black font-extrabold rounded-full flex items-center justify-center space-x-3 hover:scale-105 active:scale-95 transition w-full sm:w-auto"
          >
            {/* Spotify SVG Icon */}
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.076-.67-.135-.746-.472-.076-.336.136-.67.472-.746 3.848-.879 7.144-.505 9.82 1.13.295.18.387.563.207.863zm1.224-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.11-1.073-.52-.125-.413.11-.847.52-1.073 3.67-1.114 8.24-.57 11.35 1.344.366.226.486.707.26 1.074zm.105-2.82c-3.26-1.937-8.65-2.115-11.75-1.173-.5.152-1.025-.133-1.176-.633-.15-.5.133-1.026.634-1.177 3.582-1.087 9.522-.88 13.284 1.353.45.267.6.845.333 1.295-.267.453-.846.602-1.297.334z" />
            </svg>
            <span>Connect with Spotify</span>
          </button>
        </div>

        <div className="mt-14 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed border-t border-white/5 pt-6">
          <p className="font-semibold text-gray-400">Developer Testing Mode Available</p>
          <p className="mt-1">
            If API keys are not configured in the backend, clicking connect will launch a mock developer dashboard with simulated data.
          </p>
        </div>
      </div>
    </div>
  );
}

function CallbackHandler() {
  const { setSession } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const accessToken = params.get('access_token');
    const spotifyId = params.get('spotify_id');
    const userId = params.get('user_id');

    if (status === 'success' && accessToken && spotifyId && userId) {
      // Save details to Context/LocalStorage
      setSession(accessToken, spotifyId, userId);
      // Redirect to main page without query parameters
      window.location.href = '/';
    } else {
      const errorMsg = params.get('error') || 'Authentication Callback failed.';
      window.location.href = `/?error=${encodeURIComponent(errorMsg)}`;
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      <p className="mt-4 text-gray-400 font-medium">Authorizing with Spotify...</p>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const path = window.location.pathname;

  // Simple SPA client router
  if (path === '/callback') {
    return <CallbackHandler />;
  }

  return isAuthenticated ? <DashboardContent /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

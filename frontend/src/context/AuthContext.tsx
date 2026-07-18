import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profileImageUrl?: string;
  country?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  albumName: string;
  imageUrl?: string;
  spotifyUrl: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  imageUrl?: string;
  popularity: number;
  spotifyUrl: string;
}

export interface FullUserProfile {
  profile: UserProfile;
  topTracks: SpotifyTrack[];
  topArtists: SpotifyArtist[];
}

interface AuthContextType {
  user: FullUserProfile | null;
  accessToken: string | null;
  userId: string | null;
  spotifyId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  setSession: (token: string, spotifyId: string, userId: string) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_API_URL;

// Log backend URL for debugging
console.log('AuthContext: BACKEND_URL:', BACKEND_URL || 'NOT CONFIGURED');

function createMockUserProfile(): FullUserProfile {
  return {
    profile: {
      id: 'mock_user_123',
      displayName: 'Jane Doe (Mock)',
      email: 'jane.doe@example.com',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      country: 'US',
    },
    topTracks: [
      {
        id: '1',
        name: 'Blinding Lights',
        artists: ['The Weeknd'],
        albumName: 'After Hours',
        imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZM70CmZ7eVJ1',
      },
      {
        id: '2',
        name: 'Get Lucky',
        artists: ['Daft Punk', 'Pharrell Williams'],
        albumName: 'Random Access Memories',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/698eCG4v436OI86ISg6DQ6',
      },
    ],
    topArtists: [
      {
        id: 'a1',
        name: 'The Weeknd',
        genres: ['pop', 'r&b', 'synthpop'],
        imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 96,
        spotifyUrl: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatg05jW',
      },
      {
        id: 'a2',
        name: 'Daft Punk',
        genres: ['electro', 'house', 'filter house'],
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 85,
        spotifyUrl: 'https://open.spotify.com/artist/4tZ12r23ttYn26kTTse3rC',
      },
    ],
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FullUserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));
  const [spotifyId, setSpotifyId] = useState<string | null>(localStorage.getItem('spotify_id'));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!localStorage.getItem('spotify_access_token'));

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const loadUserProfile = async () => {
      setLoading(true);
      setError(null);

      // For mock tokens, use mock profile
      if (accessToken.startsWith('mock_')) {
        if (!isCancelled) {
          setUser(createMockUserProfile());
          setLoading(false);
        }
        return;
      }

      // Require backend URL for production
      if (!BACKEND_URL) {
        if (!isCancelled) {
          setError('Backend URL not configured. Please set VITE_API_URL environment variable.');
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // If userId is missing, force re-login to get proper session
      if (!userId) {
        console.warn('[AuthContext] userId missing, forcing re-login to establish proper session');
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_id');
        localStorage.removeItem('user_id');
        setAccessToken(null);
        setUserId(null);
        setSpotifyId(null);
        setUser(null);
        setError('Session expired. Please log in again to continue.');
        setLoading(false);
        return;
      }

      // Proactively refresh token if userId is available
      if (userId && BACKEND_URL) {
        try {
          console.log('[AuthContext] Attempting proactive token refresh for user:', userId);
          const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('[AuthContext] Token refreshed successfully');
            localStorage.setItem('spotify_access_token', refreshData.access_token);
            setAccessToken(refreshData.access_token);
          } else {
            console.warn('[AuthContext] Token refresh failed, continuing with current token');
          }
        } catch (refreshError) {
          console.warn('[AuthContext] Token refresh error:', refreshError);
        }
      }

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);
        const profileUrl = userId
          ? `${BACKEND_URL}/api/user/profile?user_id=${userId}`
          : `${BACKEND_URL}/api/user/profile`;
        const response = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.statusText}`);
        }

        const profile = await response.json();
        if (!isCancelled) {
          setUser(profile);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load user profile');
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadUserProfile();

    return () => {
      isCancelled = true;
    };
  }, [accessToken, BACKEND_URL]);

  const login = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login?return_to=${encodeURIComponent(window.location.origin)}`;
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('spotify_id');
    setAccessToken(null);
    setUserId(null);
    setSpotifyId(null);
    setUser(null);
    setError(null);
    window.location.href = '/';
  };

  const setSession = (token: string, sId: string, uId: string) => {
    localStorage.setItem('spotify_access_token', token);
    localStorage.setItem('spotify_id', sId);
    localStorage.setItem('user_id', uId);
    setAccessToken(token);
    setSpotifyId(sId);
    setUserId(uId);
    setUser(token.startsWith('mock_') ? createMockUserProfile() : null);
    setLoading(!token.startsWith('mock_'));
    setError(null);
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        userId,
        spotifyId,
        loading,
        isAuthenticated,
        login,
        logout,
        setSession,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

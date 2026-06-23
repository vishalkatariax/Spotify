import React, { createContext, useContext, useState, useEffect } from 'react';

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

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FullUserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));
  const [spotifyId, setSpotifyId] = useState<string | null>(localStorage.getItem('spotify_id'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const login = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login`;
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
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
          }
          throw new Error('Failed to load user profile');
        }

        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to sync with Spotify');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken]);

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

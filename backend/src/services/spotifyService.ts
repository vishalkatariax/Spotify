import path from 'path';
import dotenv from 'dotenv';
import { db } from '../config/db';
import { decrypt, encrypt } from '../utils/tokenManager';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.BACKEND_PORT || 3001}`;
export const DEFAULT_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${BACKEND_URL}/api/auth/callback`;

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SpotifyProfile {
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
  previewUrl?: string;
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

// Check if we are running in Mock Mode (no valid keys configured or forced)
const FORCE_MOCK_MODE = process.env.FORCE_MOCK_MODE === 'true';
export const isMockMode = FORCE_MOCK_MODE || !CLIENT_ID || CLIENT_ID === 'your_spotify_client_id' || !CLIENT_SECRET || CLIENT_SECRET === 'your_spotify_client_secret';

if (isMockMode) {
  console.log('Spotify Service: RUNNING IN MOCK MODE.');
  if (FORCE_MOCK_MODE) {
    console.log('Spotify Service: Mock mode forced via FORCE_MOCK_MODE=true environment variable.');
  } else {
    console.log('Spotify Service: No valid Spotify API credentials found in environment.');
  }
} else {
  console.log('Spotify Service: Configured for real Spotify API.');
  console.log('Spotify Service: If you see repeated 403 errors, your Spotify credentials may be invalid or expired.');
  console.log('Spotify Service: To force mock mode, set FORCE_MOCK_MODE=true environment variable.');
}

/**
 * Helper utility to wrap fetch requests with automatic retry on 429 Rate Limiting and 401 Token Refresh
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, userId?: string): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    const retryAfter = response.headers.get('Retry-After');
    // Spotify's Retry-After header is in seconds
    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
    console.warn(`[Spotify API] Rate limit hit (429). Retrying in ${waitTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return fetchWithRetry(url, options, retries - 1, userId);
  }

  // Handle 401 Unauthorized - try to refresh token if userId is provided
  if (response.status === 401 && userId && retries > 0) {
    console.warn(`[Spotify API] 401 Unauthorized. Attempting token refresh for user ${userId}...`);
    try {
      const tokenRecord = await db.getTokensByUserId(userId);
      if (tokenRecord) {
        const decryptedRefreshToken = decrypt(tokenRecord.refresh_token_encrypted);
        const refreshed = await refreshAccessToken(decryptedRefreshToken);

        const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
        await db.saveTokens({
          ...tokenRecord,
          access_token_encrypted: encrypt(refreshed.accessToken),
          token_expires_at: expiresAt,
        });

        // Retry the original request with new token
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${refreshed.accessToken}`,
          },
        };
        console.log(`[Spotify API] Token refreshed successfully. Retrying request...`);
        return fetchWithRetry(url, newOptions, retries - 1, userId);
      }
    } catch (refreshError) {
      console.error(`[Spotify API] Failed to refresh token:`, refreshError);
    }
  }

  // Log 403 errors for debugging
  if (response.status === 403) {
    console.error(`[Spotify API] 403 Forbidden error for URL: ${url}`);
    console.error(`[Spotify API] Client ID configured: ${CLIENT_ID ? 'Yes' : 'No'}`);
    console.error(`[Spotify API] Client Secret configured: ${CLIENT_SECRET ? 'Yes' : 'No'}`);
    if (CLIENT_ID) {
      console.error(`[Spotify API] Client ID starts with: ${CLIENT_ID.substring(0, 8)}...`);
    }
  }

  return response;
}

/**
 * Exchange authorization code for Spotify tokens.
 */
export async function exchangeCodeForTokens(code: string, redirectUri?: string): Promise<SpotifyTokens> {
  if (isMockMode) {
    return {
      accessToken: 'mock_access_token_' + Math.random().toString(36).substring(7),
      refreshToken: 'mock_refresh_token_' + Math.random().toString(36).substring(7),
      expiresIn: 3600,
    };
  }

  const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri || DEFAULT_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange code: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh access token using refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  if (isMockMode || refreshToken.startsWith('mock_')) {
    return {
      accessToken: 'mock_access_token_' + Math.random().toString(36).substring(7),
      expiresIn: 3600,
    };
  }

  const response = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh token: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Fetch Spotify Profile details.
 */
export async function fetchSpotifyProfile(accessToken: string, userId?: string): Promise<SpotifyProfile> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    return {
      id: 'mock_user_123',
      displayName: 'Jane Doe (Mock)',
      email: 'jane.doe@example.com',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      country: 'US',
    };
  }

  const response = await fetchWithRetry('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }, 3, userId);

  if (!response.ok) {
    console.error(`Spotify API error (${response.status}): ${response.statusText}`);
    // Fallback to mock profile if Spotify API fails
    console.warn('Falling back to mock profile due to Spotify API error');
    return {
      id: 'mock_user_123',
      displayName: 'User (Fallback)',
      email: 'user@example.com',
      profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      country: 'US',
    };
  }

  const data = await response.json() as {
    id: string;
    display_name: string;
    email: string;
    images?: Array<{ url: string }>;
    country?: string;
  };

  return {
    id: data.id,
    displayName: data.display_name,
    email: data.email,
    profileImageUrl: data.images && data.images.length > 0 ? data.images[0].url : undefined,
    country: data.country,
  };
}

/**
 * Fetch user's top tracks.
 */
export async function fetchTopTracks(accessToken: string, limit = 10, userId?: string): Promise<SpotifyTrack[]> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    return [
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
        name: 'Starboy',
        artists: ['The Weeknd', 'Daft Punk'],
        albumName: 'Starboy',
        imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/7MXVkk9rm5ObjIJv4120PR',
      },
      {
        id: '3',
        name: 'Get Lucky',
        artists: ['Daft Punk', 'Pharrell Williams'],
        albumName: 'Random Access Memories',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/698eCG4v436OI86ISg6DQ6',
      },
      {
        id: '4',
        name: 'Nightcall',
        artists: ['Kavinsky'],
        albumName: 'Outrun',
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/0U01AXKW4h78j4564357',
      },
    ].slice(0, limit);
  }

  const response = await fetchWithRetry(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=short_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }, 3, userId);

  if (!response.ok) {
    console.error(`Spotify API error (${response.status}): ${response.statusText}`);
    // Fallback to mock data if Spotify API fails
    console.warn('Falling back to mock top tracks due to Spotify API error');
    return [
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
        name: 'Starboy',
        artists: ['The Weeknd', 'Daft Punk'],
        albumName: 'Starboy',
        imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=256&h=256&q=80',
        spotifyUrl: 'https://open.spotify.com/track/7MXVkk9rm5ObjIJv4120PR',
      },
    ].slice(0, limit);
  }

  const data = await response.json() as {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images?: Array<{ url: string }>;
      };
      preview_url?: string;
      external_urls: { spotify: string };
    }>;
  };

  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    artists: item.artists.map((a) => a.name),
    albumName: item.album.name,
    imageUrl: item.album.images && item.album.images.length > 0 ? item.album.images[0].url : undefined,
    previewUrl: item.preview_url || undefined,
    spotifyUrl: item.external_urls.spotify,
  }));
}

/**
 * Fetch user's top artists.
 */
export async function fetchTopArtists(accessToken: string, limit = 10, userId?: string): Promise<SpotifyArtist[]> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    return [
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
      {
        id: 'a3',
        name: 'Kavinsky',
        genres: ['synthwave', 'electro house'],
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=256&h=256&q=80',
        popularity: 65,
        spotifyUrl: 'https://open.spotify.com/artist/0N3W5ChK0mTJn5oGugqo7j',
      },
    ].slice(0, limit);
  }

  const response = await fetchWithRetry(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=short_term`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }, 3, userId);

  if (!response.ok) {
    console.error(`Spotify API error (${response.status}): ${response.statusText}`);
    // Fallback to mock data if Spotify API fails
    console.warn('Falling back to mock top artists due to Spotify API error');
    return [
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
    ].slice(0, limit);
  }

  const data = await response.json() as {
    items: Array<{
      id: string;
      name: string;
      genres: string[];
      images?: Array<{ url: string }>;
      popularity: number;
      external_urls: { spotify: string };
    }>;
  };

  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    genres: item.genres,
    imageUrl: item.images && item.images.length > 0 ? item.images[0].url : undefined,
    popularity: item.popularity,
    spotifyUrl: item.external_urls.spotify,
  }));
}

import { isMockMode, SpotifyTrack, fetchSpotifyProfile } from './spotifyService';
import { db } from '../config/db';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  trackCount: number;
  spotifyUrl: string;
  createdAt?: string;
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  trackIds: string[];
  accessToken: string;
  userId?: string;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(accessToken: string, userId?: string | null): Promise<Playlist[]> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    // Return mock playlists
    return [
      {
        id: 'playlist1',
        name: 'Discover Weekly',
        description: 'Your weekly mixtape of fresh music.',
        trackCount: 30,
        spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'playlist2',
        name: 'Daily Mix 1',
        description: 'Made for you',
        trackCount: 50,
        spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Use database for real playlists
  if (!userId) {
    // In production, extract user ID from token
    return [];
  }

  try {
    const dbPlaylists = await db.getUserPlaylists(userId);
    return dbPlaylists.map((p) => ({
      id: p.id!,
      name: p.name,
      description: p.description,
      trackCount: p.track_count,
      spotifyUrl: p.spotify_url,
      createdAt: p.created_at,
    }));
  } catch (error) {
    console.error('Error getting user playlists:', error);
    return [];
  }
}

/**
 * Create a new playlist in Spotify
 */
export async function createPlaylist({
  name,
  description,
  trackIds,
  accessToken,
  userId = 'mock_user_123',
}: CreatePlaylistRequest): Promise<Playlist> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    // Create mock playlist
    return {
      id: `playlist_${Date.now()}`,
      name,
      description: description || 'Created with Discovery Dial',
      trackCount: trackIds.length,
      spotifyUrl: `https://open.spotify.com/playlist/mock_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }

  if (!userId) {
    throw new Error('User ID required for playlist creation');
  }

  try {
    // Get user's Spotify profile to get their Spotify user ID
    const userProfile = await fetchSpotifyProfile(accessToken, userId);
    const spotifyUserId = userProfile.id;

    // Create playlist in Spotify
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        description: description || 'Created with Discovery Dial',
        public: false,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Spotify API error creating playlist:', errorText);
      throw new Error(`Failed to create playlist: ${createResponse.status}`);
    }

    const spotifyPlaylist = await createResponse.json() as SpotifyPlaylistResponse;

    // Add tracks to the newly created playlist
    if (trackIds.length > 0) {
      const trackUris = trackIds.map((id) => `spotify:track:${id}`);

      // Spotify API allows max 100 tracks per request, chunk if needed
      const chunkSize = 100;
      for (let i = 0; i < trackUris.length; i += chunkSize) {
        const chunk = trackUris.slice(i, i + chunkSize);

        const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylist.id}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: chunk,
          }),
        });

        if (!addResponse.ok) {
          console.error('Failed to add tracks to playlist:', await addResponse.text());
          // Continue anyway, playlist was created successfully
        }
      }
    }

    // Store playlist in database
    const dbPlaylist = await db.createPlaylist({
      user_id: userId,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      track_count: trackIds.length,
      spotify_id: spotifyPlaylist.id,
      spotify_url: spotifyPlaylist.external_urls.spotify,
    });

    // Convert to playlist object
    return {
      id: dbPlaylist.id!,
      name: dbPlaylist.name,
      description: dbPlaylist.description,
      trackCount: dbPlaylist.track_count,
      spotifyUrl: dbPlaylist.spotify_url,
      createdAt: dbPlaylist.created_at,
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

/**
 * Add tracks to existing Spotify playlist
 */
export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<boolean> {
  if (isMockMode || accessToken.startsWith('mock_')) {
    // Mock implementation - just confirm success
    return true;
  }

  try {
    // Spotify API allows max 100 tracks per request, chunk if needed
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);

      const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      });

      if (!addResponse.ok) {
        const errorText = await addResponse.text();
        console.error('Failed to add tracks to playlist:', errorText);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    return false;
  }
}

/**
 * Get track URIs for Spotify playlist creation
 */
export function getTrackUris(trackIds: string[]): string[] {
  return trackIds.map((id) => `spotify:track:${id}`);
}

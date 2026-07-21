import { Router } from 'express';
import { getUserPlaylists, createPlaylist, addTracksToPlaylist, getTrackUris } from '../services/playlistService';
import { db } from '../config/db';

const router = Router();

/**
 * Helper to extract user ID from access token (mock implementation)
 * In production, this would decode a JWT token
 */
function getUserIdFromToken(accessToken: string): string | undefined {
  if (accessToken.startsWith('mock_')) {
    // For mock mode, return a mock user ID
    return 'mock_user_123';
  }
  
  // In real implementation, decode JWT or fetch from Spotify
  // For now, return undefined to use mock playlists
  return undefined;
}

/**
 * GET /api/playlists
 * Get user's playlists from Spotify or database
 */
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const userId = getUserIdFromToken(accessToken);
    
    const playlists = await getUserPlaylists(accessToken, userId);

    res.json({
      count: playlists.length,
      playlists,
    });
  } catch (error: any) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch playlists' });
  }
});

/**
 * POST /api/playlists
 * Create a new playlist with selected tracks
 * Body params:
 * - name: string (required)
 * - description?: string (optional)
 * - trackIds: string[] (required)
 * Query params:
 * - user_id: string (optional, for database operations)
 */
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  const { name, description, trackIds } = req.body;
  const userId = req.query.user_id as string;

  // Validate required parameters
  if (!name) {
    return res.status(400).json({ error: 'Missing required parameter: name' });
  }

  if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid parameter: trackIds (must be non-empty array)' });
  }

  // Get user ID from token or query parameter
  const finalUserId = userId || (accessToken.startsWith('mock_') ? 'mock_user_123' : undefined);

  try {
    console.log('[Playlist] Creating playlist:', {
      name,
      trackCount: trackIds.length,
      hasUserId: !!finalUserId,
      userId: finalUserId || 'NOT PROVIDED'
    });

    // Create playlist
    const playlist = await createPlaylist({
      name,
      description,
      trackIds,
      accessToken,
      userId: finalUserId,
    });

    console.log('[Playlist] Playlist created successfully:', {
      playlistId: playlist.id,
      spotifyUrl: playlist.spotifyUrl,
      trackCount: playlist.trackCount
    });

    res.status(201).json({
      success: true,
      playlist,
      tracksAdded: trackIds.length,
    });
  } catch (error: any) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: error.message || 'Failed to create playlist' });
  }
});

export default router;

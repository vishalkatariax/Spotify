import { Router } from 'express';
import { fetchSpotifyProfile, fetchTopTracks, fetchTopArtists } from '../services/spotifyService';
import { db } from '../config/db';

const router = Router();

/**
 * GET /api/user/by-spotify-id
 * Retrieves user_id by spotify_id
 * Query params: spotify_id (required)
 */
router.get('/by-spotify-id', async (req, res) => {
  const { spotify_id } = req.query;

  if (!spotify_id) {
    return res.status(400).json({ error: 'Missing spotify_id parameter' });
  }

  try {
    const user = await db.getUserBySpotifyId(spotify_id as string);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user_id: user.id });
  } catch (error: any) {
    console.error('Error fetching user by spotify_id:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

/**
 * GET /api/user/profile
 * Retrieves user profile info, top tracks, and top artists from Spotify Web API
 * Expects headers: Authorization: Bearer <access_token>
 * Query params: user_id (optional, for token refresh)
 */
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  const userId = req.query.user_id as string;

  console.log('[User Profile] Fetching profile with userId:', userId || 'NOT PROVIDED');

  try {
    const profile = await fetchSpotifyProfile(accessToken, userId);
    const topTracks = await fetchTopTracks(accessToken, 5, userId); // MVP shows top 5 tracks
    const topArtists = await fetchTopArtists(accessToken, 5, userId); // MVP shows top 5 artists

    res.json({
      profile,
      topTracks,
      topArtists,
    });
  } catch (error: any) {
    console.error('Error fetching user profile data:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch Spotify user data',
    });
  }
});

export default router;

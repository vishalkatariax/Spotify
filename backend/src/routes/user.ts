import { Router } from 'express';
import { fetchSpotifyProfile, fetchTopTracks, fetchTopArtists } from '../services/spotifyService';

const router = Router();

/**
 * GET /api/user/profile
 * Retrieves user profile info, top tracks, and top artists from Spotify Web API
 * Expects headers: Authorization: Bearer <access_token>
 */
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const profile = await fetchSpotifyProfile(accessToken);
    const topTracks = await fetchTopTracks(accessToken, 5); // MVP shows top 5 tracks
    const topArtists = await fetchTopArtists(accessToken, 5); // MVP shows top 5 artists

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

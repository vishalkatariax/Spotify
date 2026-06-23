import { Router } from 'express';
import { exchangeCodeForTokens, refreshAccessToken, fetchSpotifyProfile, isMockMode } from '../services/spotifyService';
import { db } from '../config/db';
import { encrypt, decrypt } from '../utils/tokenManager';

const router = Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback';
const SCOPES = process.env.SPOTIFY_SCOPES || 'user-top-read,user-read-recently-played,playlist-modify-public,playlist-modify-private';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

/**
 * GET /api/auth/login
 * Redirects the user to Spotify Authorization or immediately mock logs in
 */
router.get('/login', (req, res) => {
  if (isMockMode) {
    // In mock mode, redirect immediately back to the callback page with a mock code
    const redirectUrl = `${FRONTEND_URL}/callback?code=mock_authorization_code_12345`;
    return res.redirect(redirectUrl);
  }

  const state = Math.random().toString(36).substring(2, 15);
  const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID || '',
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: state,
  }).toString()}`;

  res.redirect(authorizeUrl);
});

/**
 * GET /api/auth/callback
 * Handles Spotify redirect, exchanges code, registers/updates user, and redirects to frontend callback
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/?error=no_code_provided`);
  }

  try {
    // 1. Exchange code for Spotify tokens
    const tokens = await exchangeCodeForTokens(code);

    // 2. Fetch user profile from Spotify
    const spotifyProfile = await fetchSpotifyProfile(tokens.accessToken);

    // 3. Check if user already exists in DB, otherwise create
    let user = await db.getUserBySpotifyId(spotifyProfile.id);

    const userData = {
      spotify_id: spotifyProfile.id,
      display_name: spotifyProfile.displayName,
      email: spotifyProfile.email,
      profile_image_url: spotifyProfile.profileImageUrl,
      country: spotifyProfile.country,
    };

    if (user) {
      user = await db.updateUser(user.id, userData);
    } else {
      user = await db.createUser(userData);
    }

    // 4. Encrypt and save tokens in DB
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
    await db.saveTokens({
      user_id: user.id,
      access_token_encrypted: encrypt(tokens.accessToken),
      refresh_token_encrypted: encrypt(tokens.refreshToken),
      token_expires_at: expiresAt,
      scope: SCOPES,
    });

    // 5. Redirect back to frontend callback page with tokens to initialize state
    // For local MVP ease of use, we pass user ID and access token directly in query parameters
    const redirectUrl = `${FRONTEND_URL}/callback?${new URLSearchParams({
      status: 'success',
      access_token: tokens.accessToken,
      spotify_id: spotifyProfile.id,
      user_id: user.id,
    }).toString()}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(error.message || 'auth_failed')}`);
  }
});

/**
 * POST /api/auth/refresh
 * Refreshes the Spotify access token for a given user ID
 */
router.post('/refresh', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  try {
    const tokenRecord = await db.getTokensByUserId(user_id);
    if (!tokenRecord) {
      return res.status(404).json({ error: 'No tokens found for this user' });
    }

    const decryptedRefreshToken = decrypt(tokenRecord.refresh_token_encrypted);
    const refreshed = await refreshAccessToken(decryptedRefreshToken);

    const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
    
    // Update the database record with the new access token
    await db.saveTokens({
      ...tokenRecord,
      access_token_encrypted: encrypt(refreshed.accessToken),
      token_expires_at: expiresAt,
    });

    res.json({
      access_token: refreshed.accessToken,
      expires_in: refreshed.expiresIn,
    });
  } catch (error: any) {
    console.error('Token Refresh Error:', error);
    res.status(500).json({ error: error.message || 'Failed to refresh token' });
  }
});

export default router;

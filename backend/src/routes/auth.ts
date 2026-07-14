import { Router, type Request } from 'express';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchSpotifyProfile,
  isMockMode,
} from '../services/spotifyService';
import { db } from '../config/db';
import { encrypt, decrypt } from '../utils/tokenManager';

const router = Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;

// Render is separate from Vercel; keep frontend URL clean.
// If not set in env, fall back to localhost for dev.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const SCOPES =
  process.env.SPOTIFY_SCOPES ||
  'user-read-email,user-top-read,user-read-recently-played,playlist-modify-public,playlist-modify-private';

function getBackendRedirectUri(req: Request) {
  // Prefer explicit env var in production; Spotify requires an exact match.
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI;
  }

  // Local/dev fallback: derive from current request.
  const defaultRedirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback`;
  return defaultRedirectUri;
}

/**
 * GET /api/auth/login
 * Redirects the user to Spotify Authorization or immediately mock logs in
 */
router.get('/login', (req, res) => {
  const returnTo = req.query.return_to as string;
  let frontendUrl = FRONTEND_URL;
  if (returnTo && (returnTo.endsWith('.vercel.app') || returnTo === 'http://localhost:5173')) {
    frontendUrl = returnTo;
  }

  if (isMockMode) {
    // In mock mode, redirect immediately back to the callback page with a mock code
    const redirectUrl = `${frontendUrl}/callback?code=mock_authorization_code_12345`;
    return res.redirect(redirectUrl);
  }

  const stateObj = {
    nonce: Math.random().toString(36).substring(2, 15),
    returnTo: frontendUrl
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
  
  const redirectUri = getBackendRedirectUri(req);
  const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID || '',
    scope: SCOPES,
    redirect_uri: redirectUri,
    state: state,
  }).toString()}`;
  console.log('Spotify login redirect_uri:', redirectUri);

  res.redirect(authorizeUrl);
});

/**
 * GET /api/auth/callback
 * Handles Spotify redirect, exchanges code, registers/updates user, and redirects to frontend callback
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  let frontendUrl = FRONTEND_URL;
  if (state) {
    try {
      const stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      if (stateObj.returnTo && (stateObj.returnTo.endsWith('.vercel.app') || stateObj.returnTo === 'http://localhost:5173')) {
        frontendUrl = stateObj.returnTo;
      }
    } catch (e) {
      console.error('Failed to parse state:', e);
    }
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/?error=no_code_provided`);
  }

  try {
    const redirectUri = getBackendRedirectUri(req);
    console.log('Spotify callback exchange redirect_uri:', redirectUri);
    // 1. Exchange code for Spotify tokens
    const tokens = await exchangeCodeForTokens(code);

    // 2. Fetch user profile from Spotify (no userId yet, will fallback to mock on 401)
    const spotifyProfile = await fetchSpotifyProfile(tokens.accessToken);

    // 3. Check if user already exists in DB, otherwise create
    let user = await db.getUserBySpotifyId(spotifyProfile.id);

    const fallbackEmail = `spotify_${spotifyProfile.id}@spotify.local`;

    const emailRaw = (spotifyProfile as any)?.email as unknown;
    const computedEmailRaw = typeof emailRaw === 'string' ? emailRaw : null;

    // Supabase column `users.email` is NOT NULL, so force a non-empty string.
    const computedEmail =
      computedEmailRaw && computedEmailRaw.trim().length > 0
        ? computedEmailRaw.trim()
        : fallbackEmail;

    // Absolute last resort: never allow null/blank.
    const safeEmail =
      typeof computedEmail === 'string' && computedEmail.trim().length > 0
        ? computedEmail
        : fallbackEmail;

    const userData = {
      spotify_id: spotifyProfile.id,
      display_name: spotifyProfile.displayName,
      // DB column `public.users.email` is NOT NULL, so always provide a value.
      email: safeEmail,
      profile_image_url: spotifyProfile.profileImageUrl,
      country: spotifyProfile.country,
    };

    // Diagnostics: confirm what we are actually sending to Supabase
    console.log('Spotify callback: computed user email', {
      spotifyEmailRaw: (spotifyProfile as any).email,
      computedEmail,
      safeEmail,
      fallbackEmail,
      spotifyId: spotifyProfile.id,
      emailType: typeof (spotifyProfile as any).email,
      safeEmailIsNull: safeEmail == null,
      safeEmailIsEmpty: typeof safeEmail === 'string' && safeEmail.trim().length === 0,
    });

    if (!userData.email || (typeof userData.email === 'string' && userData.email.trim().length === 0)) {
      console.warn('Spotify callback: computed email invalid; forcing fallback.', {
        spotifyProfile: {
          id: spotifyProfile.id,
          displayName: spotifyProfile.displayName,
          emailRaw: (spotifyProfile as any).email,
        },
        fallbackEmail,
      });
      userData.email = fallbackEmail;
    }

    try {
      if (user) {
        // db.updateUser signature: (id: string, user: Partial<Omit<DBUser,'id'>>)
        user = await db.updateUser(user.id, userData);
      } else {
        // db.createUser signature: (user: Omit<DBUser,'id'>)
        user = await db.createUser(userData);
      }
    } catch (dbError: any) {

      console.error('DB create/update user failed:', {
        message: dbError?.message,
        code: dbError?.code,
        details: dbError?.details,
        hint: dbError?.hint,
        // best-effort: many postgres/supabase errors include these
        table: dbError?.table,
        constraint: dbError?.constraint,
      });
      throw dbError;
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
    const redirectUrl = `${frontendUrl}/callback?${new URLSearchParams({
      status: 'success',
      access_token: tokens.accessToken,
      spotify_id: spotifyProfile.id,
      user_id: user.id,
    }).toString()}`;

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${frontendUrl}/?error=${encodeURIComponent(error.message || 'auth_failed')}`);
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

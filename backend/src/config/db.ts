import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export interface DBUser {
  id: string;
  spotify_id: string;
  display_name: string;
  email: string;
  profile_image_url?: string;
  country?: string;
  default_dial_value?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBUserToken {
  id?: string;
  user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
}

export interface DBFeedback {
  id?: string;
  user_id: string;
  track_id: string;
  track_name: string;
  artists: string[];
  dial_value: number;
  discovery_score: number;
  is_liked: boolean;
  created_at?: string;
}

export interface DBPlaylist {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  track_count: number;
  spotify_id: string;
  spotify_url: string;
  created_at?: string;
}

// Memory db fallback for local development without Supabase setup
class MemoryDB {
  private users: Map<string, DBUser> = new Map();
  private tokens: Map<string, DBUserToken> = new Map();
  private feedback: Map<string, DBFeedback> = new Map();
  private playlists: Map<string, DBPlaylist[]> = new Map();

  async getUserBySpotifyId(spotifyId: string): Promise<DBUser | null> {
    for (const user of this.users.values()) {
      if (user.spotify_id === spotifyId) {
        return user;
      }
    }
    return null;
  }

  async createUser(user: Omit<DBUser, 'id'>): Promise<DBUser> {
    const id = Math.random().toString(36).substring(2, 15);
    const newUser = {
      ...user,
      id,
      default_dial_value: user.default_dial_value ?? 50,
      created_at: new Date().toISOString()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<Omit<DBUser, 'id'>>): Promise<DBUser> {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    const updated = { ...existing, ...user, updated_at: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async getTokensByUserId(userId: string): Promise<DBUserToken | null> {
    for (const token of this.tokens.values()) {
      if (token.user_id === userId) {
        return token;
      }
    }
    return null;
  }

  async saveTokens(tokenData: DBUserToken): Promise<DBUserToken> {
    // Delete existing token if exists
    for (const [key, val] of this.tokens.entries()) {
      if (val.user_id === tokenData.user_id) {
        this.tokens.delete(key);
      }
    }
    const id = Math.random().toString(36).substring(2, 15);
    const newToken = { ...tokenData, id, created_at: new Date().toISOString() };
    this.tokens.set(id, newToken);
    return newToken;
  }

  async saveFeedback(feedback: Omit<DBFeedback, 'id'>): Promise<DBFeedback> {
    const id = Math.random().toString(36).substring(2, 15);
    const newFeedback = { ...feedback, id, created_at: new Date().toISOString() };
    this.feedback.set(id, newFeedback);
    return newFeedback;
  }

  async getFeedbackByUserId(userId: string): Promise<DBFeedback[]> {
    const userFeedback: DBFeedback[] = [];
    for (const fb of this.feedback.values()) {
      if (fb.user_id === userId) {
        userFeedback.push(fb);
      }
    }
    return userFeedback;
  }

  // Playlist methods for MemoryDB
  async getUserPlaylists(userId: string): Promise<DBPlaylist[]> {
    return this.playlists.get(userId) || [];
  }

  async createPlaylist(playlist: Omit<DBPlaylist, 'id' | 'created_at'>): Promise<DBPlaylist> {
    const id = Math.random().toString(36).substring(2, 15);
    const newPlaylist: DBPlaylist = {
      ...playlist,
      id,
      created_at: new Date().toISOString()
    };
    
    const userPlaylists = this.playlists.get(playlist.user_id) || [];
    userPlaylists.push(newPlaylist);
    this.playlists.set(playlist.user_id, userPlaylists);
    return newPlaylist;
  }
}

class SupabaseDB {
  private client: SupabaseClient;
  private fallbackMode: boolean = false;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  private checkFallback(error: any): boolean {
    // Check if error indicates table doesn't exist
    if (error && (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('table'))) {
      if (!this.fallbackMode) {
        console.warn('Supabase table not found, falling back to memory database');
        this.fallbackMode = true;
      }
      return true;
    }
    return false;
  }

  async getUserBySpotifyId(spotifyId: string): Promise<DBUser | null> {
    if (this.fallbackMode) return null;
    
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('spotify_id', spotifyId)
        .single();
      
      if (error && !this.checkFallback(error)) {
        console.error('Error fetching user from Supabase:', error.message);
      }
      return data || null;
    } catch (error) {
      this.checkFallback(error);
      return null;
    }
  }

  async createUser(user: Omit<DBUser, 'id'>): Promise<DBUser> {
    if (this.fallbackMode) {
      const id = Math.random().toString(36).substring(2, 15);

      const fallbackEmail = `spotify_${user.spotify_id}@spotify.local`;
      const emailRaw = (user as any)?.email as unknown;
      const computedEmailRaw = typeof emailRaw === 'string' ? emailRaw : null;
      const safeEmail =
        computedEmailRaw && computedEmailRaw.trim().length > 0
          ? computedEmailRaw.trim()
          : fallbackEmail;

      return {
        ...user,
        email: safeEmail,
        id,
        default_dial_value: user.default_dial_value ?? 50,
        created_at: new Date().toISOString(),
      };
    }

    try {
      const fallbackEmail = `spotify_${user.spotify_id}@spotify.local`;

      // Hard guarantee: never allow null/undefined/blank to reach NOT NULL column.
      const rawEmail: any = (user as any).email;
      const computedEmail =
        typeof rawEmail === 'string' && rawEmail.trim().length > 0 ? rawEmail.trim() : fallbackEmail;

      const safeEmail =
        typeof computedEmail === 'string' && computedEmail.trim().length > 0
          ? computedEmail
          : 'spotify_unknown@spotify.local';

      const userData = {
        ...user,
        email: safeEmail,
        default_dial_value: user.default_dial_value ?? 50,
      };

      console.log('Supabase createUser payload email safety check', {
        spotify_id: user.spotify_id,
        rawEmailType: typeof (user as any)?.email,
        rawEmail: (user as any)?.email,
        emailFinal: (userData as any)?.email,
        emailIsNull: (userData as any)?.email == null,
        emailIsBlank:
          typeof (userData as any)?.email === 'string' &&
          (userData as any).email.trim().length === 0,
      });

      const { data, error } = await this.client
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        if (this.checkFallback(error)) {
          return this.createUser(user);
        }
        console.error('Error creating user in Supabase:', error.message);
        throw error;
      }
      return data;
    } catch (error) {
      if (this.checkFallback(error)) {
        return this.createUser(user);
      }
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<Omit<DBUser, 'id'>>): Promise<DBUser> {
    if (this.fallbackMode) throw new Error('Fallback mode not supported for updateUser');

    try {
      // Ensure NOT NULL email on updates too.
      const payload: any = { ...user };

      if (payload.email == null || (typeof payload.email === 'string' && payload.email.trim().length === 0)) {
        const spotifyId = payload.spotify_id ?? '';
        const fallback = spotifyId
          ? `spotify_${spotifyId}@spotify.local`
          : 'spotify_unknown@spotify.local';
        payload.email = fallback;
      } else if (typeof payload.email === 'string') {
        payload.email = payload.email.trim();
      }

      // Absolute last resort: never allow undefined/null email.
      if (payload.email == null || typeof payload.email !== 'string' || payload.email.trim().length === 0) {
        payload.email = 'spotify_unknown@spotify.local';
      }

      const { data, error } = await this.client
        .from('users')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (this.checkFallback(error)) {
          throw new Error('Fallback mode');
        }
        console.error('Error updating user in Supabase:', error.message);
        throw error;
      }
      return data;
    } catch (error) {
      if (this.checkFallback(error)) {
        throw new Error('Fallback mode');
      }
      throw error;
    }
  }

  async getTokensByUserId(userId: string): Promise<DBUserToken | null> {
    if (this.fallbackMode) return null;
    
    try {
      const { data, error } = await this.client
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (!this.checkFallback(error)) {
          console.error('Error fetching tokens from Supabase:', error.message);
        }
      }
      return data || null;
    } catch (error) {
      this.checkFallback(error);
      return null;
    }
  }

  async saveTokens(tokenData: DBUserToken): Promise<DBUserToken> {
    if (this.fallbackMode) {
      const id = Math.random().toString(36).substring(2, 15);
      return { ...tokenData, id, created_at: new Date().toISOString() };
    }

    try {
      // Check if tokens exist first
      const existing = await this.getTokensByUserId(tokenData.user_id);
      if (existing && existing.id) {
        const { data, error } = await this.client
          .from('user_tokens')
          .update(tokenData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) {
          if (this.checkFallback(error)) {
            return this.saveTokens(tokenData);
          }
          throw error;
        }
        return data;
      } else {
        const { data, error } = await this.client
          .from('user_tokens')
          .insert([tokenData])
          .select()
          .single();
        if (error) {
          if (this.checkFallback(error)) {
            return this.saveTokens(tokenData);
          }
          throw error;
        }
        return data;
      }
    } catch (error) {
      if (this.checkFallback(error)) {
        return this.saveTokens(tokenData);
      }
      throw error;
    }
  }

  async saveFeedback(feedback: Omit<DBFeedback, 'id'>): Promise<DBFeedback> {
    if (this.fallbackMode) {
      const id = Math.random().toString(36).substring(2, 15);
      return { ...feedback, id, created_at: new Date().toISOString() };
    }

    try {
      const { data, error } = await this.client
        .from('feedback')
        .insert([feedback])
        .select()
        .single();
      
      if (error) {
        if (this.checkFallback(error)) {
          return this.saveFeedback(feedback);
        }
        console.error('Error saving feedback to Supabase:', error.message);
        throw error;
      }
      return data;
    } catch (error) {
      if (this.checkFallback(error)) {
        return this.saveFeedback(feedback);
      }
      throw error;
    }
  }

  async getFeedbackByUserId(userId: string): Promise<DBFeedback[]> {
    if (this.fallbackMode) return [];
    
    try {
      const { data, error } = await this.client
        .from('feedback')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        if (!this.checkFallback(error)) {
          console.error('Error fetching feedback from Supabase:', error.message);
        }
        return [];
      }
      return data || [];
    } catch (error) {
      this.checkFallback(error);
      return [];
    }
  }

  // Playlist methods for SupabaseDB
  async getUserPlaylists(userId: string): Promise<DBPlaylist[]> {
    if (this.fallbackMode) return [];
    
    try {
      const { data, error } = await this.client
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (!this.checkFallback(error)) {
          console.error('Error fetching playlists from Supabase:', error.message);
        }
        return [];
      }
      return data || [];
    } catch (error) {
      this.checkFallback(error);
      return [];
    }
  }

  async createPlaylist(playlist: Omit<DBPlaylist, 'id' | 'created_at'>): Promise<DBPlaylist> {
    if (this.fallbackMode) {
      const id = Math.random().toString(36).substring(2, 15);
      return { ...playlist, id, created_at: new Date().toISOString() };
    }

    try {
      const { data, error } = await this.client
        .from('playlists')
        .insert([playlist])
        .select()
        .single();

      if (error) {
        if (this.checkFallback(error)) {
          return this.createPlaylist(playlist);
        }
        console.error('Error creating playlist in Supabase:', error.message);
        throw error;
      }
      return data;
    } catch (error) {
      if (this.checkFallback(error)) {
        return this.createPlaylist(playlist);
      }
      throw error;
    }
  }
}

export let db: MemoryDB | SupabaseDB;

const DB_EMAIL_SAFETY_PATCH_VERSION = 'email-non-null-v1';

console.log(`Database: initializing (patch=${DB_EMAIL_SAFETY_PATCH_VERSION})`);

// Force memory database in production due to Supabase DNS issues
const FORCE_MEMORY_DB = process.env.FORCE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'production';

if (FORCE_MEMORY_DB) {
  console.log('Database: FORCE_MEMORY_DB enabled, using local memory database');
  db = new MemoryDB();
} else if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url') {
  console.log('Database: Using Supabase connection');
  db = new SupabaseDB(supabaseUrl, supabaseAnonKey);
} else {
  console.log('Database: Supabase keys not set, falling back to local memory database');
  db = new MemoryDB();
}

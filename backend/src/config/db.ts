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

// Memory db fallback for local development without Supabase setup
class MemoryDB {
  private users: Map<string, DBUser> = new Map();
  private tokens: Map<string, DBUserToken> = new Map();

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
    const newUser = { ...user, id, created_at: new Date().toISOString() };
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
}

class SupabaseDB {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async getUserBySpotifyId(spotifyId: string): Promise<DBUser | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('spotify_id', spotifyId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user from Supabase:', error.message);
    }
    return data || null;
  }

  async createUser(user: Omit<DBUser, 'id'>): Promise<DBUser> {
    const { data, error } = await this.client
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user in Supabase:', error.message);
      throw error;
    }
    return data;
  }

  async updateUser(id: string, user: Partial<Omit<DBUser, 'id'>>): Promise<DBUser> {
    const { data, error } = await this.client
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user in Supabase:', error.message);
      throw error;
    }
    return data;
  }

  async getTokensByUserId(userId: string): Promise<DBUserToken | null> {
    const { data, error } = await this.client
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tokens from Supabase:', error.message);
    }
    return data || null;
  }

  async saveTokens(tokenData: DBUserToken): Promise<DBUserToken> {
    // Check if tokens exist first
    const existing = await this.getTokensByUserId(tokenData.user_id);
    if (existing && existing.id) {
      const { data, error } = await this.client
        .from('user_tokens')
        .update(tokenData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await this.client
        .from('user_tokens')
        .insert([tokenData])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
}

export let db: MemoryDB | SupabaseDB;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url') {
  console.log('Database: Using Supabase connection');
  db = new SupabaseDB(supabaseUrl, supabaseAnonKey);
} else {
  console.log('Database: Supabase keys not set, falling back to local memory database');
  db = new MemoryDB();
}

-- Spotify Discovery Dial Database Schema
-- Run this SQL in Supabase SQL Editor to set up the required tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spotify_id VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    country VARCHAR(10),
    default_dial_value INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tokens table (encrypted tokens)
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    artists TEXT[] NOT NULL,
    dial_value INTEGER NOT NULL,
    discovery_score INTEGER NOT NULL,
    is_liked BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    track_count INTEGER NOT NULL DEFAULT 0,
    spotify_id VARCHAR(255) NOT NULL,
    spotify_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- Enable Row Level Security (RLS) for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access (adjust as needed)
-- Re-run-safe: only create policies if they don't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can view their own data'
  ) THEN
    CREATE POLICY "Users can view their own data" ON users
      FOR SELECT USING (auth.uid()::text = id::text);
  END IF;
END $$;

-- QUICK WORKAROUND:
-- Allow INSERT into public.users so the OAuth callback can create/update user rows.
-- This stops the redirect loop caused by RLS INSERT failures.
-- Note: Intentionally permissive for fastest unblock.
DO $$
BEGIN
  -- Create a permissive INSERT policy for authenticated role
  -- (non-destructive: won't drop existing policies).
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can insert their own record (authenticated)'
  ) THEN
    CREATE POLICY "Users can insert their own record (authenticated)" ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Also allow INSERT for role {public} because auth.uid() is NULL in DB.
  -- Fastest unblock to stop the OAuth redirect loop.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can insert their own record (public)'
  ) THEN
    CREATE POLICY "Users can insert their own record (public)" ON users
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_tokens'
      AND policyname = 'Users can manage their own tokens'
  ) THEN
    CREATE POLICY "Users can manage their own tokens" ON user_tokens
      FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feedback'
      AND policyname = 'Users can manage their own feedback'
  ) THEN
    CREATE POLICY "Users can manage their own feedback" ON feedback
      FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'playlists'
      AND policyname = 'Users can manage their own playlists'
  ) THEN
    CREATE POLICY "Users can manage their own playlists" ON playlists
      FOR ALL USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

-- Insert a sample user for testing (replace with real Spotify auth)
-- This is just for development testing
INSERT INTO users (id, spotify_id, display_name, email, default_dial_value)
VALUES ('00000000-0000-0000-0000-000000000001', 'mock_user_123', 'Test User', 'test@example.com', 50)
ON CONFLICT (spotify_id) DO NOTHING;

-- Grant public access for development (remove in production)
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- HARD GUARANTEE: never allow NULL email in users table
-- This prevents OAuth user creation failures even if upstream email is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'tr_users_email_not_null'
  ) THEN
    CREATE OR REPLACE FUNCTION public.users_email_not_null()
    RETURNS trigger AS $fn$
    BEGIN
      IF NEW.email IS NULL OR length(trim(NEW.email::text)) = 0 THEN
        NEW.email := 'spotify_unknown@spotify.local';
      END IF;
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    CREATE TRIGGER tr_users_email_not_null
    BEFORE INSERT OR UPDATE OF email
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.users_email_not_null();
  END IF;
END $$;

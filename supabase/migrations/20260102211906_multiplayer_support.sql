-- Add multiplayer support columns to games table
ALTER TABLE games ADD COLUMN game_code TEXT UNIQUE;
ALTER TABLE games ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE games ADD COLUMN max_players INTEGER DEFAULT 1;

-- Create index for faster game code lookups
CREATE INDEX games_game_code_idx ON games(game_code);

-- Function to generate unique game code (6 characters, alphanumeric, no confusing chars)
CREATE OR REPLACE FUNCTION generate_game_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique game code that doesn't exist yet
CREATE OR REPLACE FUNCTION generate_unique_game_code() RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := generate_game_code();
        SELECT EXISTS(SELECT 1 FROM games WHERE game_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Security definer functions to bypass RLS and avoid infinite recursion
-- These MUST be created before the policies that use them

-- Check if user is a player in a game (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_player_in_game(check_game_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.players
    WHERE game_id = check_game_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is the creator of a game (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_game_creator(check_game_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.games
    WHERE id = check_game_id
    AND creator_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update existing RLS policies to allow players to read games they're part of
DROP POLICY IF EXISTS "Users can read their own games" ON public.games;
DROP POLICY IF EXISTS "Users can read their own or joined games" ON public.games;
DROP POLICY IF EXISTS "Anyone can check game exists by code" ON public.games;

CREATE POLICY "Users can read their own or joined games"
  ON public.games FOR SELECT
  USING (
    auth.uid() = creator_id 
    OR public.is_player_in_game(id, auth.uid())
    OR game_code IS NOT NULL  -- Allow reading games with game codes (for join flow)
  );

-- Update players policies to allow reading all players in games user is part of
DROP POLICY IF EXISTS "Users can read players in their games" ON public.players;

CREATE POLICY "Users can read players in their games"
  ON public.players FOR SELECT
  USING (
    -- User is a player in this game (uses security definer function to avoid recursion)
    public.is_player_in_game(game_id, auth.uid())
    -- OR user is the game creator (uses security definer function to avoid recursion)
    OR public.is_game_creator(game_id, auth.uid())
  );

-- Add policy for deleting players (for kick functionality - creator only)
DROP POLICY IF EXISTS "Game creator can kick players" ON public.players;

CREATE POLICY "Game creator can kick players"
  ON public.players FOR DELETE
  USING (
    public.is_game_creator(game_id, auth.uid())
  );

-- Add unique constraint on (game_id, role) to prevent TOCTOU race conditions
-- This ensures each role can only be assigned once per game, preventing two players
-- from simultaneously joining with the same role
ALTER TABLE public.players ADD CONSTRAINT players_game_role_unique UNIQUE (game_id, role);

COMMENT ON CONSTRAINT players_game_role_unique ON public.players IS 
  'Prevents duplicate roles within a game - fixes TOCTOU race condition in join endpoint';

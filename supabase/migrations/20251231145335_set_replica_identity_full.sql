-- Set REPLICA IDENTITY FULL on game_points table
-- This ensures that Realtime broadcasts include the OLD values, not just NEW values
-- Without this, payload.old may be empty in the frontend Realtime subscription

ALTER TABLE game_points REPLICA IDENTITY FULL;

-- Also set it on other tables that might use Realtime
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;

COMMENT ON TABLE game_points IS 'REPLICA IDENTITY FULL: Realtime broadcasts include old and new values';

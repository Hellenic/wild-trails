-- Enable Realtime replication for game tables
-- This allows the frontend to receive live updates when game data changes
-- 
-- Critical for waypoint/goal proximity detection to work!
-- When a player gets close to a waypoint, the server updates game_points.status
-- to "visited", and Realtime broadcasts this change to the frontend.

-- Enable Realtime for game_points (CRITICAL - waypoint triggers depend on this)
ALTER PUBLICATION supabase_realtime ADD TABLE game_points;

-- Enable Realtime for games (helpful for game status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Enable Realtime for players (future multiplayer support)
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Add comments for documentation
COMMENT ON TABLE game_points IS 'Realtime enabled: Frontend listens for status changes from unvisited → visited to trigger waypoint discoveries';
COMMENT ON TABLE games IS 'Realtime enabled: Frontend can track game status changes (starting, completing, etc.)';
COMMENT ON TABLE players IS 'Realtime enabled: Multiplayer player status updates (Phase 2+)';


-- Add gave_up field to games table
-- This field tracks whether a player gave up and revealed the goal location

ALTER TABLE games ADD COLUMN IF NOT EXISTS gave_up BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN games.gave_up IS 'Indicates whether the player gave up and revealed the goal location';

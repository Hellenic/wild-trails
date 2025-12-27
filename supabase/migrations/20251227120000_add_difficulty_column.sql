-- Add difficulty enum and column to games table
-- This allows players to select Easy/Medium/Hard difficulty when creating games
-- which affects corridor width and path complexity during point generation

-- Create the difficulty enum type
CREATE TYPE game_difficulty_type AS ENUM ('easy', 'medium', 'hard');

-- Add difficulty column to games table with default 'easy'
ALTER TABLE games
ADD COLUMN difficulty game_difficulty_type NOT NULL DEFAULT 'easy';

-- Add comment for documentation
COMMENT ON COLUMN games.difficulty IS 'Game difficulty level: easy (narrow path, direct route), medium (wider corridor, some detours), hard (very wide area, zig-zag path)';


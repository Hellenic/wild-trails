-- Add fields for tracking game processing and retry logic
ALTER TABLE games
ADD COLUMN processing_started_at TIMESTAMPTZ,
ADD COLUMN processing_attempts INTEGER DEFAULT 0,
ADD COLUMN last_processing_error TEXT;

-- Add 'failed' status to game_status_type enum
ALTER TYPE game_status_type ADD VALUE 'failed';

-- Create index for efficient querying of games ready for processing
CREATE INDEX idx_games_processing_status 
ON games(status, processing_attempts, processing_started_at)
WHERE game_master = 'ai';

-- Add comment for documentation
COMMENT ON COLUMN games.processing_started_at IS 'Timestamp when background processing started (to prevent duplicate processing)';
COMMENT ON COLUMN games.processing_attempts IS 'Number of times processing has been attempted (for exponential backoff)';
COMMENT ON COLUMN games.last_processing_error IS 'Last error message if processing failed (for debugging)';


-- Add missing address column to ads table
-- This column stores the optional physical address provided by the user

ALTER TABLE ads ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN ads.address IS 'Optional physical address provided by the ad poster';

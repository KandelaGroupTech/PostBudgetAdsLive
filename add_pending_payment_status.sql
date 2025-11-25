-- Add pending_payment status to ads table
-- This status is used for ads that have been created but payment hasn't been completed yet

-- First, check the current constraint
-- The status column likely has a check constraint that needs to be updated

-- Drop the existing check constraint (if it exists)
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;

-- Add new check constraint with pending_payment status
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'pending_payment'));

-- Optional: Add a comment to explain the new status
COMMENT ON COLUMN ads.status IS 'Ad status: pending_payment (awaiting payment), pending (awaiting moderation), approved (live), rejected (denied)';

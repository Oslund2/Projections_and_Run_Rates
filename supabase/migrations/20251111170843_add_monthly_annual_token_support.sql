/*
  # Add Monthly and Annual Token Usage Support

  ## Overview
  Enhances the token_usage table to support both monthly and annual token tracking,
  similar to the platform_costs table. This allows users to enter token data in
  either monthly or annual terms with automatic conversion.

  ## Changes Made

  ### 1. New Columns Added to `token_usage`
    - `token_period` (text) - Tracks whether data was entered as 'monthly' or 'annual'
    - `monthly_token_count` (bigint) - Token count per month
    - `annual_token_count` (bigint) - Token count per year (monthly × 12)
    - `monthly_cost` (numeric) - Cost per month
    - `annual_cost` (numeric) - Cost per year (monthly × 12)

  ## Migration Strategy
  - Add new columns with default values
  - Backfill existing records (treating current data as monthly)
  - Maintain backward compatibility with existing token_count and cost columns

  ## Notes
  - Existing token_count and cost columns are preserved for backward compatibility
  - New columns allow dual monthly/annual data entry like platform costs
  - Enables better cost analysis across different time horizons
*/

-- Add new columns to token_usage table
DO $$
BEGIN
  -- Add token_period column (default to monthly)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'token_period'
  ) THEN
    ALTER TABLE token_usage ADD COLUMN token_period text DEFAULT 'monthly';
  END IF;

  -- Add monthly_token_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'monthly_token_count'
  ) THEN
    ALTER TABLE token_usage ADD COLUMN monthly_token_count bigint DEFAULT 0;
  END IF;

  -- Add annual_token_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'annual_token_count'
  ) THEN
    ALTER TABLE token_usage ADD COLUMN annual_token_count bigint DEFAULT 0;
  END IF;

  -- Add monthly_cost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'monthly_cost'
  ) THEN
    ALTER TABLE token_usage ADD COLUMN monthly_cost numeric DEFAULT 0;
  END IF;

  -- Add annual_cost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_usage' AND column_name = 'annual_cost'
  ) THEN
    ALTER TABLE token_usage ADD COLUMN annual_cost numeric DEFAULT 0;
  END IF;
END $$;

-- Backfill existing records (treat current data as monthly)
UPDATE token_usage
SET 
  token_period = 'monthly',
  monthly_token_count = token_count,
  annual_token_count = token_count * 12,
  monthly_cost = cost,
  annual_cost = cost * 12
WHERE monthly_token_count = 0 AND annual_token_count = 0;

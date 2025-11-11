/*
  # Add Monthly and Annual Cost Support to Platform Costs

  ## Overview
  This migration enhances the platform_costs table to support both monthly and annual cost entry
  with automatic conversion between the two. This ensures consistency with agent projections and
  run rates that use annualized figures.

  ## Changes to Existing Tables

  ### `platform_costs`
  Added fields to support flexible cost entry:
  - `cost_period` (text) - Indicates whether user entered 'monthly' or 'annual'
  - `monthly_amount` (numeric) - Monthly cost amount
  - `annual_amount` (numeric) - Annual cost amount (monthly_amount * 12)

  ## Data Migration
  - Existing `amount` field data will be treated as monthly amounts
  - Calculate annual_amount as amount * 12 for existing records
  - Set cost_period to 'monthly' for existing records
  - Keep the original `amount` field for backward compatibility

  ## Important Notes
  1. Both monthly_amount and annual_amount are always populated regardless of entry method
  2. If user enters monthly, annual = monthly * 12
  3. If user enters annual, monthly = annual / 12
  4. Annualized figures should be used for ROI and profit/loss calculations
  5. All monetary values stored as numeric for precision
*/

-- Add new columns to platform_costs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_costs' AND column_name = 'cost_period'
  ) THEN
    ALTER TABLE platform_costs ADD COLUMN cost_period text DEFAULT 'monthly';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_costs' AND column_name = 'monthly_amount'
  ) THEN
    ALTER TABLE platform_costs ADD COLUMN monthly_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_costs' AND column_name = 'annual_amount'
  ) THEN
    ALTER TABLE platform_costs ADD COLUMN annual_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Migrate existing data: treat existing amounts as monthly costs
UPDATE platform_costs
SET 
  monthly_amount = amount,
  annual_amount = amount * 12,
  cost_period = 'monthly'
WHERE monthly_amount = 0 AND annual_amount = 0;

-- Add check constraint to ensure at least one amount is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'platform_costs_amount_check'
  ) THEN
    ALTER TABLE platform_costs 
    ADD CONSTRAINT platform_costs_amount_check 
    CHECK (monthly_amount > 0 OR annual_amount > 0);
  END IF;
END $$;

-- Create index for cost_period queries
CREATE INDEX IF NOT EXISTS idx_platform_costs_period ON platform_costs(cost_period);

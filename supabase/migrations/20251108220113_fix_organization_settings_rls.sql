/*
  # Fix Organization Settings RLS Policies for Public Access

  ## Overview
  This migration updates the RLS policies on organization_settings to allow
  public access (not just authenticated users) for insert, update, and delete
  operations, matching the pattern used in other tables in this application.

  ## Changes
  - Drop existing restrictive RLS policies that require authentication
  - Create new policies that allow public access for all operations
  - Maintains view access for everyone

  ## Security Note
  This app is designed for internal use without authentication. All tables
  use public access patterns. For production deployment with authentication,
  these policies should be updated to restrict access appropriately.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert organization settings" ON organization_settings;
DROP POLICY IF EXISTS "Authenticated users can update organization settings" ON organization_settings;
DROP POLICY IF EXISTS "Authenticated users can delete organization settings" ON organization_settings;

-- Create public access policies matching the pattern from other tables
CREATE POLICY "Anyone can insert organization settings"
  ON organization_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update organization settings"
  ON organization_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete organization settings"
  ON organization_settings FOR DELETE
  USING (true);

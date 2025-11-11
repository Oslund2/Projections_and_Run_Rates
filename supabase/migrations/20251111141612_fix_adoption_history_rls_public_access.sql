/*
  # Fix RLS Policies for Adoption History - Public Access

  1. Changes
    - Update adoption_history RLS policies to allow public access
    - This enables unauthenticated users to insert/update adoption history records
    - Maintains same level of access as other tables in the system (agents, studies, etc.)
  
  2. Security Notes
    - Consistent with existing public access pattern used throughout the application
    - All users can insert, update, and delete adoption history records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert adoption history" ON adoption_history;
DROP POLICY IF EXISTS "Authenticated users can update adoption history" ON adoption_history;
DROP POLICY IF EXISTS "Authenticated users can delete adoption history" ON adoption_history;

-- Create new public access policies
CREATE POLICY "Anyone can insert adoption history"
  ON adoption_history
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update adoption history"
  ON adoption_history
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete adoption history"
  ON adoption_history
  FOR DELETE
  TO public
  USING (true);

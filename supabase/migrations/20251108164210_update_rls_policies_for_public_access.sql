/*
  # Update RLS Policies for Public Access

  ## Overview
  This migration updates Row Level Security policies to allow public access
  for all CRUD operations. This is necessary for applications without authentication.

  ## Changes Made

  ### RLS Policy Updates
  
  #### `agents` table:
  - Replaced "Authenticated users can insert agents" with public insert policy
  - Replaced "Authenticated users can update agents" with public update policy
  - Replaced "Authenticated users can delete agents" with public delete policy

  #### `time_motion_studies` table:
  - Replaced "Authenticated users can insert studies" with public insert policy
  - Replaced "Authenticated users can update studies" with public update policy
  - Replaced "Authenticated users can delete studies" with public delete policy

  #### `study_variables` table:
  - Replaced "Authenticated users can insert variables" with public insert policy
  - Replaced "Authenticated users can update variables" with public update policy
  - Replaced "Authenticated users can delete variables" with public delete policy

  #### `agent_summaries` table:
  - Replaced "Authenticated users can insert summaries" with public insert policy
  - Replaced "Authenticated users can update summaries" with public update policy

  ## Important Notes
  1. This allows unrestricted access to all tables
  2. Suitable for internal tools or development environments
  3. For production with sensitive data, implement proper authentication
*/

-- Drop existing restrictive policies and create public access policies for agents table
DROP POLICY IF EXISTS "Authenticated users can insert agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can update agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can delete agents" ON agents;

CREATE POLICY "Anyone can insert agents"
  ON agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update agents"
  ON agents FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete agents"
  ON agents FOR DELETE
  USING (true);

-- Drop existing restrictive policies and create public access policies for time_motion_studies table
DROP POLICY IF EXISTS "Authenticated users can insert studies" ON time_motion_studies;
DROP POLICY IF EXISTS "Authenticated users can update studies" ON time_motion_studies;
DROP POLICY IF EXISTS "Authenticated users can delete studies" ON time_motion_studies;

CREATE POLICY "Anyone can insert studies"
  ON time_motion_studies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update studies"
  ON time_motion_studies FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete studies"
  ON time_motion_studies FOR DELETE
  USING (true);

-- Drop existing restrictive policies and create public access policies for study_variables table
DROP POLICY IF EXISTS "Authenticated users can insert variables" ON study_variables;
DROP POLICY IF EXISTS "Authenticated users can update variables" ON study_variables;
DROP POLICY IF EXISTS "Authenticated users can delete variables" ON study_variables;

CREATE POLICY "Anyone can insert variables"
  ON study_variables FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update variables"
  ON study_variables FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete variables"
  ON study_variables FOR DELETE
  USING (true);

-- Drop existing restrictive policies and create public access policies for agent_summaries table
DROP POLICY IF EXISTS "Authenticated users can insert summaries" ON agent_summaries;
DROP POLICY IF EXISTS "Authenticated users can update summaries" ON agent_summaries;

CREATE POLICY "Anyone can insert summaries"
  ON agent_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update summaries"
  ON agent_summaries FOR UPDATE
  USING (true)
  WITH CHECK (true);
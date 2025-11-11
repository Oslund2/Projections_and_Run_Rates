/*
  # Create AI Quotes Table for McKinsey Insights Rotator

  ## Purpose
  This migration creates a table to store AI insights and quotes from McKinsey 2025 research
  that will be displayed as rotating footnotes across the analytics, dashboard, and TV display pages.

  ## Tables Created
  1. `ai_quotes`
     - `id` (uuid, primary key) - Unique identifier for each quote
     - `quote_text` (text, required) - The full quote text with attribution
     - `source` (text, optional) - Source reference (e.g., "McKinsey 2025")
     - `category` (text, optional) - Category for filtering (e.g., "adoption", "innovation")
     - `is_active` (boolean, default true) - Whether the quote should be displayed
     - `display_order` (integer, optional) - Optional ordering for non-random display
     - `created_at` (timestamptz) - Timestamp when quote was added

  ## Security
  - Enable RLS on `ai_quotes` table
  - Add policy for public read access (quotes are public content)
  - No write policies needed (managed through admin/migrations)

  ## Data
  Seeds the table with 30 McKinsey 2025 AI insights from the provided list
*/

-- Create the ai_quotes table
CREATE TABLE IF NOT EXISTS ai_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_text text NOT NULL,
  source text DEFAULT 'McKinsey (2025)',
  category text,
  is_active boolean DEFAULT true,
  display_order integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_quotes ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to active quotes"
  ON ai_quotes
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create index for efficient random selection
CREATE INDEX IF NOT EXISTS idx_ai_quotes_active ON ai_quotes(is_active) WHERE is_active = true;

-- Seed the table with McKinsey 2025 AI insights
INSERT INTO ai_quotes (quote_text, category) VALUES
  ('Sixty-two percent of companies are already experimenting with AI agents. — McKinsey (2025)', 'adoption'),
  ('Technology, media, and telecommunications lead in AI agent adoption. — McKinsey (2025)', 'adoption'),
  ('Eighty-eight percent of companies now use AI in at least one business function. — McKinsey (2025)', 'adoption'),
  ('Sixty-four percent of respondents say AI is enabling innovation. — McKinsey (2025)', 'innovation'),
  ('Nearly half of companies report improved customer satisfaction from AI use. — McKinsey (2025)', 'impact'),
  ('AI is spreading to every industry—from media to healthcare to manufacturing. — McKinsey (2025)', 'adoption'),
  ('High performers see AI as a catalyst for innovation and growth. — McKinsey (2025)', 'innovation'),
  ('AI high performers are 3× more likely to redesign workflows fundamentally. — McKinsey (2025)', 'transformation'),
  ('The most successful AI organizations reimagine their workflows to capture new forms of value. — McKinsey (2025)', 'transformation'),
  ('Transformative AI ambitions differentiate high performers from the rest. — McKinsey (2025)', 'strategy'),
  ('Companies that combine AI with human judgment create ''hybrid intelligence.'' — McKinsey (2025)', 'innovation'),
  ('AI leaders align strategy, talent, and technology for maximum impact. — McKinsey (2025)', 'strategy'),
  ('AI efficiency objectives are common, but growth and innovation drive more value. — McKinsey (2025)', 'strategy'),
  ('Innovation-focused AI use leads to greater competitive differentiation. — McKinsey (2025)', 'innovation'),
  ('Respondents report cost and speed benefits from AI in software engineering and IT. — McKinsey (2025)', 'impact'),
  ('AI enables new forms of creativity, efficiency, and audience engagement. — McKinsey (2025)', 'innovation'),
  ('AI high performers are nearly five times more likely to scale AI across the enterprise. — McKinsey (2025)', 'transformation'),
  ('AI leaders actively upskill employees with targeted learning journeys. — McKinsey (2025)', 'talent'),
  ('Larger companies using AI at scale are capturing measurable competitive advantage. — McKinsey (2025)', 'impact'),
  ('Defined ''human-in-the-loop'' processes are a hallmark of AI leaders. — McKinsey (2025)', 'strategy'),
  ('Reusable data products accelerate AI deployment and innovation. — McKinsey (2025)', 'innovation'),
  ('Rapid iteration and learning cycles strengthen AI impact. — McKinsey (2025)', 'strategy'),
  ('Clear alignment between AI strategy and business value is key to success. — McKinsey (2025)', 'strategy'),
  ('High performers invest more than 20 percent of their digital budgets in AI. — McKinsey (2025)', 'investment'),
  ('AI high performers tend to have senior leaders who champion transformation. — McKinsey (2025)', 'leadership'),
  ('Leadership engagement and vision amplify AI''s cultural impact. — McKinsey (2025)', 'leadership'),
  ('Companies that rewire processes around AI outperform those that don''t. — McKinsey (2025)', 'transformation'),
  ('AI''s promise lies in driving creativity, innovation, and transformation. — McKinsey (2025)', 'innovation'),
  ('The future belongs to organizations that use AI to tell a transformational story. — McKinsey (2025)', 'strategy'),
  ('AI''s true value emerges when it transforms organizations, not just optimizes them. — McKinsey (2025)', 'transformation')
ON CONFLICT (id) DO NOTHING;
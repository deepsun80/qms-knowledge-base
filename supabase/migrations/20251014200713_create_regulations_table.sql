-- Create regulations table for storing ISO 13485 and 21 CFR 820 requirements
CREATE TABLE regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic regulation info (from scraper)
  standard TEXT NOT NULL,              -- "21 CFR 820" or "ISO 13485:2016"
  section_number TEXT NOT NULL,        -- "820.1" or "4.1"
  title TEXT NOT NULL,                 -- "Scope" or "General requirements"
  content TEXT NOT NULL,               -- Full regulatory text
  subpart TEXT,                        -- "Subpart A" (optional, for organization)
  
  -- AI-enhanced fields (added later in Week 2)
  audit_questions JSONB,               -- Array of questions auditors should ask
  expected_evidence JSONB,             -- Array of evidence types needed
  evidence_types JSONB,                -- Array of document types (QM, SOP, etc)
  keywords JSONB,                      -- Array of searchable keywords
  actionable_checklist JSONB,          -- Array of specific audit steps
  
  -- Status tracking
  ai_enhanced BOOLEAN DEFAULT false,   -- Has AI processing been completed?
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique regulations (no duplicates)
  UNIQUE(standard, section_number)
);

-- Create indexes for fast searching
CREATE INDEX idx_regulations_standard ON regulations(standard);
CREATE INDEX idx_regulations_section ON regulations(section_number);
CREATE INDEX idx_regulations_keywords ON regulations USING GIN (keywords);

-- Add comment explaining table purpose
COMMENT ON TABLE regulations IS 'Stores regulatory requirements from ISO 13485 and 21 CFR 820 with AI-enhanced audit intelligence';
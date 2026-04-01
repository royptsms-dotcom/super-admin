-- Create wa_group_mappings table
CREATE TABLE IF NOT EXISTS wa_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  wa_group_id TEXT NOT NULL UNIQUE,
  group_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wa_group_mappings_job_id ON wa_group_mappings(job_id);
CREATE INDEX IF NOT EXISTS idx_wa_group_mappings_wa_group_id ON wa_group_mappings(wa_group_id);

-- Enable RLS
ALTER TABLE wa_group_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only
CREATE POLICY "Admin can view wa_group_mappings"
  ON wa_group_mappings FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert wa_group_mappings"
  ON wa_group_mappings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can update wa_group_mappings"
  ON wa_group_mappings FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can delete wa_group_mappings"
  ON wa_group_mappings FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT ALL ON wa_group_mappings TO authenticated;

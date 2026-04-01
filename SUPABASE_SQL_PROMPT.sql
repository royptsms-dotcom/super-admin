-- =====================================
-- COPY-PASTE INI KE SUPABASE SQL EDITOR
-- =====================================

-- 1. Buat Tabel wa_group_mappings (FIXED: job_id as BIGINT to match jobs.id)
CREATE TABLE IF NOT EXISTS wa_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  wa_group_id TEXT NOT NULL UNIQUE,
  group_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 2. Buat Index untuk performa
CREATE INDEX IF NOT EXISTS idx_wa_group_mappings_job_id ON wa_group_mappings(job_id);
CREATE INDEX IF NOT EXISTS idx_wa_group_mappings_wa_group_id ON wa_group_mappings(wa_group_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE wa_group_mappings ENABLE ROW LEVEL SECURITY;

-- 4. Hapus policies lama jika ada (opsional)
DROP POLICY IF EXISTS "Admin can view wa_group_mappings" ON wa_group_mappings;
DROP POLICY IF EXISTS "Admin can insert wa_group_mappings" ON wa_group_mappings;
DROP POLICY IF EXISTS "Admin can update wa_group_mappings" ON wa_group_mappings;
DROP POLICY IF EXISTS "Admin can delete wa_group_mappings" ON wa_group_mappings;

-- 5. Buat RLS Policies (hanya Admin yang bisa akses)

-- Policy: SELECT
CREATE POLICY "Admin can view wa_group_mappings"
  ON wa_group_mappings FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' 
    OR auth.uid()::text = (SELECT id::text FROM users WHERE role = 'admin' LIMIT 1)
  );

-- Policy: INSERT
CREATE POLICY "Admin can insert wa_group_mappings"
  ON wa_group_mappings FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid()::text = (SELECT id::text FROM users WHERE role = 'admin' LIMIT 1)
  );

-- Policy: UPDATE
CREATE POLICY "Admin can update wa_group_mappings"
  ON wa_group_mappings FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid()::text = (SELECT id::text FROM users WHERE role = 'admin' LIMIT 1)
  );

-- Policy: DELETE
CREATE POLICY "Admin can delete wa_group_mappings"
  ON wa_group_mappings FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid()::text = (SELECT id::text FROM users WHERE role = 'admin' LIMIT 1)
  );

-- 6. Grant permissions
GRANT ALL ON wa_group_mappings TO authenticated;

-- =====================================
-- SELESAI! Tabel sudah siap digunakan.
-- =====================================

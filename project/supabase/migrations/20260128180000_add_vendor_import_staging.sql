-- Migration: Add vendor import staging table
-- Description: Creates staging table for vendor data imports

CREATE TABLE IF NOT EXISTS import_vendors_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_row_json jsonb,

  -- Mapped fields
  vendor_code text,
  name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  payment_terms text,
  tax_id text,
  external_vendor_id text,
  notes text,

  -- Validation
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'error')),
  validation_errors jsonb DEFAULT '[]',

  -- Result tracking
  imported_vendor_id uuid REFERENCES vendors(id),

  created_at timestamptz DEFAULT now()
);

-- Add index for batch lookups
CREATE INDEX IF NOT EXISTS idx_import_vendors_staging_batch ON import_vendors_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_vendors_staging_validation ON import_vendors_staging(import_batch_id, validation_status);

-- Add RLS policies
ALTER TABLE import_vendors_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import_vendors_staging"
  ON import_vendors_staging FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert import_vendors_staging"
  ON import_vendors_staging FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update import_vendors_staging"
  ON import_vendors_staging FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete import_vendors_staging"
  ON import_vendors_staging FOR DELETE
  TO authenticated
  USING (true);

-- Add import_batch_id column to vendors table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'import_batch_id'
  ) THEN
    ALTER TABLE vendors ADD COLUMN import_batch_id uuid REFERENCES import_batches(id);
    CREATE INDEX idx_vendors_import_batch ON vendors(import_batch_id);
  END IF;
END $$;

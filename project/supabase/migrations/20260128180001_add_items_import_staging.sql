-- Migration: Add items/parts import staging table
-- Description: Creates staging table for items/parts data imports

CREATE TABLE IF NOT EXISTS import_items_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_row_json jsonb,

  -- Mapped fields
  sku text,
  name text,
  description text,
  category text,
  unit_cost numeric(12,2),
  unit_price numeric(12,2),
  quantity_on_hand integer DEFAULT 0,
  reorder_point integer,
  vendor_code text,
  external_item_id text,

  -- Validation
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'error')),
  validation_errors jsonb DEFAULT '[]',

  -- Result tracking
  imported_part_id uuid REFERENCES parts(id),
  matched_vendor_id uuid REFERENCES vendors(id),

  created_at timestamptz DEFAULT now()
);

-- Add index for batch lookups
CREATE INDEX IF NOT EXISTS idx_import_items_staging_batch ON import_items_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_items_staging_validation ON import_items_staging(import_batch_id, validation_status);

-- Add RLS policies
ALTER TABLE import_items_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import_items_staging"
  ON import_items_staging FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert import_items_staging"
  ON import_items_staging FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update import_items_staging"
  ON import_items_staging FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete import_items_staging"
  ON import_items_staging FOR DELETE
  TO authenticated
  USING (true);

-- Add import_batch_id column to parts table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parts' AND column_name = 'import_batch_id'
  ) THEN
    ALTER TABLE parts ADD COLUMN import_batch_id uuid REFERENCES import_batches(id);
    CREATE INDEX idx_parts_import_batch ON parts(import_batch_id);
  END IF;
END $$;

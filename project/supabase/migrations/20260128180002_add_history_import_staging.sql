-- Migration: Add historical data import staging table
-- Description: Creates staging table for historical invoices, payments, and tickets imports

CREATE TABLE IF NOT EXISTS import_history_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_row_json jsonb,

  -- Record type: 'invoice', 'payment', 'ticket'
  record_type text NOT NULL CHECK (record_type IN ('invoice', 'payment', 'ticket')),

  -- Common mapped fields
  external_customer_id text,
  document_number text,
  document_date date,
  amount numeric(12,2),
  description text,
  status text,
  external_id text,

  -- Invoice-specific fields
  due_date date,
  paid_date date,
  paid_amount numeric(12,2),

  -- Payment-specific fields
  payment_method text,
  reference_number text,

  -- Ticket-specific fields
  ticket_type text,
  priority text,
  completed_date date,

  -- Validation
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'error')),
  validation_errors jsonb DEFAULT '[]',

  -- Result tracking
  matched_customer_id uuid REFERENCES customers(id),
  imported_invoice_id uuid REFERENCES invoices(id),
  imported_payment_id uuid,
  imported_ticket_id uuid REFERENCES tickets(id),

  created_at timestamptz DEFAULT now()
);

-- Add index for batch lookups
CREATE INDEX IF NOT EXISTS idx_import_history_staging_batch ON import_history_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_history_staging_validation ON import_history_staging(import_batch_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_import_history_staging_type ON import_history_staging(import_batch_id, record_type);

-- Add RLS policies
ALTER TABLE import_history_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import_history_staging"
  ON import_history_staging FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert import_history_staging"
  ON import_history_staging FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update import_history_staging"
  ON import_history_staging FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete import_history_staging"
  ON import_history_staging FOR DELETE
  TO authenticated
  USING (true);

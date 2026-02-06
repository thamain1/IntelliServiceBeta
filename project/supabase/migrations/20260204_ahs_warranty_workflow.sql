/*
  # AHS Warranty Workflow Schema

  ## Overview
  Implements American Home Shield (AHS) warranty workflows for IntelliService,
  enabling tracking of warranty dispatches, diagnosis fees, split estimates,
  and dual-invoice billing.

  ## IMPORTANT: Run in TWO parts
  Part 1 (enum additions) must be committed before Part 2 can run.

  ## Changes

  ### Enum Additions
  - Add 'WARRANTY_AHS' to ticket_type enum
  - Add 'awaiting_ahs_authorization' to ticket_status enum
  - Create new 'payer_type' enum (AHS, CUSTOMER)

  ### Tickets Table Additions
  - ahs_dispatch_number: Text field for AHS dispatch tracking
  - ahs_portal_submission_date: When submitted to AHS portal
  - ahs_authorization_date: When AHS authorized the work
  - ahs_covered_amount: Amount AHS will cover
  - ahs_diagnosis_fee_amount: Diagnosis fee for this ticket
  - ahs_labor_rate_per_hour: Labor rate for AHS work

  ### Line Item Additions
  - Add payer_type to invoice_line_items
  - Add payer_type to estimate_line_items

  ### New Tables
  - ticket_fees: Idempotent fee tracking with UNIQUE constraint
  - ahs_audit_log: Audit trail for AHS-specific actions
  - notifications: In-app notification system

  ### Settings
  - Add AHS-specific settings to accounting_settings

  ## Security
  - RLS enabled on new tables
  - Admins and dispatchers have full access
  - Technicians can view notifications for themselves
*/

-- =====================================================
-- PART 1: ENUM ADDITIONS (Run this first, then commit)
-- =====================================================

ALTER TYPE ticket_type ADD VALUE IF NOT EXISTS 'WARRANTY_AHS';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'awaiting_ahs_authorization';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payer_type') THEN
    CREATE TYPE payer_type AS ENUM ('AHS', 'CUSTOMER');
  END IF;
END $$;

-- =====================================================
-- PART 2: Everything below (Run after Part 1 is committed)
-- =====================================================

-- TICKETS TABLE ADDITIONS

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_dispatch_number'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_dispatch_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_portal_submission_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_portal_submission_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_authorization_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_authorization_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_covered_amount'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_covered_amount numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_diagnosis_fee_amount'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_diagnosis_fee_amount numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'ahs_labor_rate_per_hour'
  ) THEN
    ALTER TABLE tickets ADD COLUMN ahs_labor_rate_per_hour numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_ahs_dispatch ON tickets(ahs_dispatch_number) WHERE ahs_dispatch_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_ahs ON tickets(ticket_type) WHERE ticket_type = 'WARRANTY_AHS';

COMMENT ON COLUMN tickets.ahs_dispatch_number IS 'AHS dispatch number from warranty portal';
COMMENT ON COLUMN tickets.ahs_portal_submission_date IS 'When diagnosis was submitted to AHS portal';
COMMENT ON COLUMN tickets.ahs_authorization_date IS 'When AHS authorized the work';
COMMENT ON COLUMN tickets.ahs_covered_amount IS 'Amount AHS will cover for this ticket';
COMMENT ON COLUMN tickets.ahs_diagnosis_fee_amount IS 'Diagnosis fee override for this ticket';
COMMENT ON COLUMN tickets.ahs_labor_rate_per_hour IS 'Labor rate override for this AHS ticket';

-- LINE ITEM PAYER TAGGING

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_line_items' AND column_name = 'payer_type'
  ) THEN
    ALTER TABLE invoice_line_items ADD COLUMN payer_type payer_type DEFAULT 'CUSTOMER';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estimate_line_items' AND column_name = 'payer_type'
  ) THEN
    ALTER TABLE estimate_line_items ADD COLUMN payer_type payer_type DEFAULT 'CUSTOMER';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_payer ON invoice_line_items(payer_type);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_payer ON estimate_line_items(payer_type);

COMMENT ON COLUMN invoice_line_items.payer_type IS 'Who pays for this line item: AHS or CUSTOMER';
COMMENT ON COLUMN estimate_line_items.payer_type IS 'Who pays for this line item: AHS or CUSTOMER';

-- TICKET FEES TABLE

CREATE TABLE IF NOT EXISTS ticket_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  fee_type text NOT NULL,
  amount numeric NOT NULL,
  description text,
  payer_type payer_type DEFAULT 'AHS',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  UNIQUE(ticket_id, fee_type)
);

CREATE INDEX IF NOT EXISTS idx_ticket_fees_ticket_id ON ticket_fees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_fees_fee_type ON ticket_fees(fee_type);

COMMENT ON TABLE ticket_fees IS 'Tracks fees associated with tickets, with idempotency guard to prevent duplicates';
COMMENT ON COLUMN ticket_fees.fee_type IS 'Type of fee: ahs_diagnosis, service_call, etc.';

-- AHS AUDIT LOG

CREATE TABLE IF NOT EXISTS ahs_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid REFERENCES profiles(id),
  performed_at timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_ahs_audit_log_entity ON ahs_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ahs_audit_log_action ON ahs_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_ahs_audit_log_performed_at ON ahs_audit_log(performed_at);

COMMENT ON TABLE ahs_audit_log IS 'Audit trail for AHS-specific workflow actions';

-- NOTIFICATIONS TABLE

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.user_id IS 'Target user; NULL means broadcast to all admin/dispatcher users';

-- AHS SETTINGS

INSERT INTO accounting_settings (setting_key, setting_value, setting_type, category, display_name, description, is_editable, display_order)
VALUES
  ('ahs_default_diagnosis_fee', '94.00', 'number', 'AHS Warranty', 'Default AHS Diagnosis Fee', 'Default diagnosis fee for AHS warranty tickets', true, 100),
  ('ahs_default_labor_rate', '94.00', 'number', 'AHS Warranty', 'Default AHS Labor Rate/Hour', 'Default hourly labor rate for AHS warranty work', true, 101),
  ('ahs_bill_to_customer_id', '', 'text', 'AHS Warranty', 'AHS Bill-To Customer', 'Customer account used for AHS invoicing (leave empty to select)', true, 102)
ON CONFLICT (setting_key) DO NOTHING;

-- PURCHASE ORDER SOURCE FIELD

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'po_source'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN po_source text DEFAULT 'LOCAL_VENDOR';
  END IF;
END $$;

COMMENT ON COLUMN purchase_orders.po_source IS 'Source of PO: AHS_PORTAL or LOCAL_VENDOR';

-- RLS POLICIES

ALTER TABLE ticket_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ahs_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and dispatchers can view all ticket fees" ON ticket_fees;
CREATE POLICY "Admins and dispatchers can view all ticket fees"
  ON ticket_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "Technicians can view fees for their tickets" ON ticket_fees;
CREATE POLICY "Technicians can view fees for their tickets"
  ON ticket_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_fees.ticket_id
      AND tickets.assigned_to = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and dispatchers can insert ticket fees" ON ticket_fees;
CREATE POLICY "Admins and dispatchers can insert ticket fees"
  ON ticket_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "Admins and dispatchers can update ticket fees" ON ticket_fees;
CREATE POLICY "Admins and dispatchers can update ticket fees"
  ON ticket_fees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "Admins can delete ticket fees" ON ticket_fees;
CREATE POLICY "Admins can delete ticket fees"
  ON ticket_fees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all AHS audit logs" ON ahs_audit_log;
CREATE POLICY "Admins can view all AHS audit logs"
  ON ahs_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins and dispatchers can insert AHS audit logs" ON ahs_audit_log;
CREATE POLICY "Admins and dispatchers can insert AHS audit logs"
  ON ahs_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON notifications;
CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher')
    )
  );

-- HELPER FUNCTIONS

CREATE OR REPLACE FUNCTION fn_add_ahs_diagnosis_fee(
  p_ticket_id uuid,
  p_user_id uuid
)
RETURNS TABLE(success boolean, already_exists boolean, fee_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fee_id uuid;
  v_fee_amount numeric;
  v_ticket_fee_override numeric;
BEGIN
  SELECT tf.id INTO v_fee_id
  FROM ticket_fees tf
  WHERE tf.ticket_id = p_ticket_id
  AND tf.fee_type = 'ahs_diagnosis';

  IF v_fee_id IS NOT NULL THEN
    RETURN QUERY SELECT true, true, v_fee_id;
    RETURN;
  END IF;

  SELECT t.ahs_diagnosis_fee_amount INTO v_ticket_fee_override
  FROM tickets t
  WHERE t.id = p_ticket_id;

  IF v_ticket_fee_override IS NOT NULL THEN
    v_fee_amount := v_ticket_fee_override;
  ELSE
    SELECT COALESCE(setting_value::numeric, 94.00) INTO v_fee_amount
    FROM accounting_settings
    WHERE setting_key = 'ahs_default_diagnosis_fee';
  END IF;

  INSERT INTO ticket_fees (ticket_id, fee_type, amount, description, payer_type, created_by)
  VALUES (p_ticket_id, 'ahs_diagnosis', v_fee_amount, 'AHS Diagnosis Fee', 'AHS', p_user_id)
  RETURNING id INTO v_fee_id;

  INSERT INTO ahs_audit_log (entity_type, entity_id, action, new_value, performed_by)
  VALUES ('ticket', p_ticket_id, 'diagnosis_fee_added', jsonb_build_object('amount', v_fee_amount), p_user_id);

  RETURN QUERY SELECT true, false, v_fee_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_submit_to_ahs_portal(
  p_ticket_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status text;
BEGIN
  SELECT status::text INTO v_old_status
  FROM tickets
  WHERE id = p_ticket_id;

  UPDATE tickets
  SET
    ahs_portal_submission_date = now(),
    status = 'awaiting_ahs_authorization'
  WHERE id = p_ticket_id;

  INSERT INTO ahs_audit_log (entity_type, entity_id, action, old_value, new_value, performed_by)
  VALUES (
    'ticket',
    p_ticket_id,
    'portal_submitted',
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', 'awaiting_ahs_authorization', 'submission_date', now()),
    p_user_id
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION fn_record_ahs_authorization(
  p_ticket_id uuid,
  p_covered_amount numeric,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tickets
  SET
    ahs_authorization_date = now(),
    ahs_covered_amount = p_covered_amount,
    status = 'scheduled'
  WHERE id = p_ticket_id;

  INSERT INTO ahs_audit_log (entity_type, entity_id, action, new_value, performed_by)
  VALUES (
    'ticket',
    p_ticket_id,
    'authorization_received',
    jsonb_build_object('covered_amount', p_covered_amount, 'authorization_date', now()),
    p_user_id
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION fn_get_ahs_billing_breakdown(p_ticket_id uuid)
RETURNS TABLE(
  ahs_total numeric,
  customer_total numeric,
  diagnosis_fee numeric,
  ahs_labor numeric,
  ahs_parts numeric,
  customer_labor numeric,
  customer_parts numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_diagnosis_fee numeric;
BEGIN
  SELECT COALESCE(tf.amount, 0) INTO v_diagnosis_fee
  FROM ticket_fees tf
  WHERE tf.ticket_id = p_ticket_id
  AND tf.fee_type = 'ahs_diagnosis';

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN ili.payer_type = 'AHS' THEN ili.line_total ELSE 0 END), 0) + COALESCE(v_diagnosis_fee, 0),
    COALESCE(SUM(CASE WHEN ili.payer_type = 'CUSTOMER' THEN ili.line_total ELSE 0 END), 0),
    COALESCE(v_diagnosis_fee, 0),
    COALESCE(SUM(CASE WHEN ili.payer_type = 'AHS' AND ili.item_type = 'labor' THEN ili.line_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ili.payer_type = 'AHS' AND ili.item_type = 'part' THEN ili.line_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ili.payer_type = 'CUSTOMER' AND ili.item_type = 'labor' THEN ili.line_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN ili.payer_type = 'CUSTOMER' AND ili.item_type = 'part' THEN ili.line_total ELSE 0 END), 0)
  FROM invoices i
  LEFT JOIN invoice_line_items ili ON ili.invoice_id = i.id
  WHERE i.ticket_id = p_ticket_id OR i.source_ticket_id = p_ticket_id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_add_ahs_diagnosis_fee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_submit_to_ahs_portal(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_record_ahs_authorization(uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_get_ahs_billing_breakdown(uuid) TO authenticated;

COMMENT ON FUNCTION fn_add_ahs_diagnosis_fee IS 'Adds AHS diagnosis fee idempotently - returns existing if already added';
COMMENT ON FUNCTION fn_submit_to_ahs_portal IS 'Marks ticket as submitted to AHS portal';
COMMENT ON FUNCTION fn_record_ahs_authorization IS 'Records AHS authorization with covered amount';
COMMENT ON FUNCTION fn_get_ahs_billing_breakdown IS 'Returns billing breakdown between AHS and customer';

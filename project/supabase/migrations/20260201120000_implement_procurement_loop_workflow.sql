/*
  # Procurement Loop Workflow Implementation

  ## Overview
  This migration implements the "Hold for Parts" procurement loop workflow that links:
  - Ticket parts requests → Purchase Orders → Receiving → Ticket status updates

  ## Changes
  1. Add linking columns to purchase_order_lines for ticket/request tracking
  2. Create view for Parts Request Queue (purchasing dashboard)
  3. Create function to auto-update ticket when parts are received
  4. Add po_id tracking to ticket_parts_requests

  ## Workflow
  1. Tech requests parts → ticket_parts_requests created
  2. Purchasing creates PO with linked_ticket_id and linked_request_id
  3. Warehouse receives PO → system auto-flips ticket status to PARTS_READY
*/

-- =====================================================
-- STEP 1: Add linking columns to purchase_order_lines
-- =====================================================

-- Add linked_ticket_id to track which ticket a PO line is for
ALTER TABLE purchase_order_lines
ADD COLUMN IF NOT EXISTS linked_ticket_id uuid REFERENCES tickets(id);

-- Add linked_request_id to track which parts request this fulfills
ALTER TABLE purchase_order_lines
ADD COLUMN IF NOT EXISTS linked_request_id uuid REFERENCES ticket_parts_requests(id);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_po_lines_linked_ticket
ON purchase_order_lines(linked_ticket_id) WHERE linked_ticket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_po_lines_linked_request
ON purchase_order_lines(linked_request_id) WHERE linked_request_id IS NOT NULL;

-- =====================================================
-- STEP 2: Add po_id tracking to ticket_parts_requests
-- =====================================================

-- Track which PO(s) are fulfilling this request
ALTER TABLE ticket_parts_requests
ADD COLUMN IF NOT EXISTS po_id uuid REFERENCES purchase_orders(id);

-- Add index
CREATE INDEX IF NOT EXISTS idx_parts_requests_po
ON ticket_parts_requests(po_id) WHERE po_id IS NOT NULL;

-- =====================================================
-- STEP 3: Create Parts Request Queue View
-- =====================================================

CREATE OR REPLACE VIEW vw_parts_request_queue AS
SELECT
  tpr.id AS request_id,
  tpr.ticket_id,
  t.ticket_number,
  t.title AS ticket_title,
  t.priority AS ticket_priority,
  c.name AS customer_name,
  c.phone AS customer_phone,
  tpr.urgency,
  tpr.status AS request_status,
  tpr.notes AS request_notes,
  tpr.po_id,
  po.po_number,
  tpr.created_at AS requested_at,
  tpr.created_by AS requested_by,
  p.full_name AS requested_by_name,
  -- Calculate days waiting
  EXTRACT(DAY FROM (now() - tpr.created_at))::integer AS days_waiting,
  -- Aggregate parts needed
  (
    SELECT jsonb_agg(jsonb_build_object(
      'line_id', tprl.id,
      'part_id', tprl.part_id,
      'part_number', parts.part_number,
      'part_name', parts.name,
      'quantity_requested', tprl.quantity_requested,
      'quantity_fulfilled', COALESCE(tprl.quantity_fulfilled, 0),
      'notes', tprl.notes
    ))
    FROM ticket_parts_request_lines tprl
    JOIN parts ON parts.id = tprl.part_id
    WHERE tprl.request_id = tpr.id
  ) AS parts_requested,
  -- Count of parts
  (
    SELECT COUNT(*)
    FROM ticket_parts_request_lines tprl
    WHERE tprl.request_id = tpr.id
  ) AS parts_count,
  -- Total quantity requested
  (
    SELECT COALESCE(SUM(quantity_requested), 0)
    FROM ticket_parts_request_lines tprl
    WHERE tprl.request_id = tpr.id
  ) AS total_quantity_requested
FROM ticket_parts_requests tpr
JOIN tickets t ON t.id = tpr.ticket_id
LEFT JOIN customers c ON c.id = t.customer_id
LEFT JOIN profiles p ON p.id = tpr.created_by
LEFT JOIN purchase_orders po ON po.id = tpr.po_id
WHERE tpr.status IN ('open', 'ordered')
ORDER BY
  CASE tpr.urgency
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  tpr.created_at ASC;

COMMENT ON VIEW vw_parts_request_queue IS 'Queue of pending parts requests for purchasing manager';

-- =====================================================
-- STEP 4: Create function to link PO to parts request
-- =====================================================

CREATE OR REPLACE FUNCTION fn_link_po_to_parts_request(
  p_po_id uuid,
  p_request_id uuid,
  p_line_mappings jsonb  -- Array of {po_line_id, request_line_id}
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_mapping jsonb;
  v_ticket_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get ticket ID from request
  SELECT ticket_id INTO v_ticket_id
  FROM ticket_parts_requests
  WHERE id = p_request_id;

  IF v_ticket_id IS NULL THEN
    RAISE EXCEPTION 'Parts request not found';
  END IF;

  -- Update the parts request with PO reference
  UPDATE ticket_parts_requests
  SET
    po_id = p_po_id,
    status = 'ordered'
  WHERE id = p_request_id;

  -- Link each PO line to the ticket and request
  FOR v_mapping IN SELECT * FROM jsonb_array_elements(p_line_mappings)
  LOOP
    UPDATE purchase_order_lines
    SET
      linked_ticket_id = v_ticket_id,
      linked_request_id = p_request_id
    WHERE id = (v_mapping->>'po_line_id')::uuid;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'po_id', p_po_id,
    'request_id', p_request_id,
    'ticket_id', v_ticket_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_link_po_to_parts_request TO authenticated;

-- =====================================================
-- STEP 5: Create function to handle parts receiving
-- =====================================================

CREATE OR REPLACE FUNCTION fn_process_received_parts_for_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_linked_ticket_id uuid;
  v_linked_request_id uuid;
  v_all_parts_received boolean;
  v_po_status text;
BEGIN
  -- Only process when quantity_received is updated
  IF NEW.quantity_received IS DISTINCT FROM OLD.quantity_received THEN
    -- Check if this line is linked to a ticket
    v_linked_ticket_id := NEW.linked_ticket_id;
    v_linked_request_id := NEW.linked_request_id;

    IF v_linked_ticket_id IS NOT NULL THEN
      -- Get the PO status
      SELECT status INTO v_po_status
      FROM purchase_orders
      WHERE id = NEW.po_id;

      -- Check if all parts for this ticket/request have been received
      SELECT
        NOT EXISTS (
          SELECT 1
          FROM purchase_order_lines pol
          WHERE pol.linked_request_id = v_linked_request_id
          AND COALESCE(pol.quantity_received, 0) < pol.quantity_ordered
        )
      INTO v_all_parts_received;

      IF v_all_parts_received THEN
        -- Update the parts request status to 'received'
        UPDATE ticket_parts_requests
        SET
          status = 'received',
          fulfilled_at = now()
        WHERE id = v_linked_request_id
        AND status = 'ordered';

        -- Update ticket: change from HOLD_PARTS to PARTS_READY (status = 'scheduled')
        -- Also set a flag indicating parts are ready
        UPDATE tickets
        SET
          hold_active = false,
          hold_type = NULL,
          revisit_required = true,
          -- Add note about parts being ready
          updated_at = now()
        WHERE id = v_linked_ticket_id
        AND hold_active = true
        AND hold_type = 'parts';

        -- Resolve the hold
        UPDATE ticket_holds
        SET
          status = 'resolved',
          resolved_at = now(),
          metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'resolved_reason', 'parts_received',
            'po_id', NEW.po_id,
            'po_line_id', NEW.id
          )
        WHERE ticket_id = v_linked_ticket_id
        AND hold_type = 'parts'
        AND status = 'active';

        -- Create a ticket update to notify about parts arrival
        INSERT INTO ticket_updates (
          ticket_id,
          technician_id,
          update_type,
          notes,
          status
        ) VALUES (
          v_linked_ticket_id,
          auth.uid(),
          'parts_received',
          'Parts have been received and are ready for installation. Ticket is now ready for scheduling.',
          'scheduled'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on purchase_order_lines for receiving
DROP TRIGGER IF EXISTS trg_process_received_parts ON purchase_order_lines;
CREATE TRIGGER trg_process_received_parts
AFTER UPDATE ON purchase_order_lines
FOR EACH ROW
EXECUTE FUNCTION fn_process_received_parts_for_tickets();

-- =====================================================
-- STEP 6: Create view for procurement analytics
-- =====================================================

CREATE OR REPLACE VIEW vw_procurement_metrics AS
SELECT
  -- Overall stats
  (SELECT COUNT(*) FROM ticket_parts_requests WHERE status = 'open') AS pending_requests,
  (SELECT COUNT(*) FROM ticket_parts_requests WHERE status = 'ordered') AS ordered_requests,
  (SELECT COUNT(*) FROM ticket_parts_requests WHERE status = 'received' AND fulfilled_at > now() - interval '7 days') AS received_this_week,

  -- Average days to fulfill
  (
    SELECT ROUND(AVG(EXTRACT(DAY FROM (fulfilled_at - created_at)))::numeric, 1)
    FROM ticket_parts_requests
    WHERE status = 'received'
    AND fulfilled_at IS NOT NULL
    AND fulfilled_at > now() - interval '30 days'
  ) AS avg_days_to_fulfill,

  -- SLA breaches (requests open > 5 days)
  (
    SELECT COUNT(*)
    FROM ticket_parts_requests
    WHERE status IN ('open', 'ordered')
    AND created_at < now() - interval '5 days'
  ) AS sla_breaches,

  -- Urgency breakdown
  (
    SELECT jsonb_object_agg(urgency, cnt)
    FROM (
      SELECT urgency, COUNT(*) as cnt
      FROM ticket_parts_requests
      WHERE status IN ('open', 'ordered')
      GROUP BY urgency
    ) sub
  ) AS requests_by_urgency;

COMMENT ON VIEW vw_procurement_metrics IS 'Key metrics for procurement loop performance';

-- =====================================================
-- STEP 7: Grant permissions
-- =====================================================

GRANT SELECT ON vw_parts_request_queue TO authenticated;
GRANT SELECT ON vw_procurement_metrics TO authenticated;

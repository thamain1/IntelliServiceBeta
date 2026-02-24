-- Migration: Auto-update ticket status based on assignment, scheduling, and work state
-- Problem: Tickets assigned/scheduled via Ticket Detail Modal did not auto-update status.
--          Only the Dispatch Board drag-drop path set status='scheduled'.
--          This trigger makes status promotion consistent regardless of which UI path is used.
--
-- Status promotion rules (only ever moves forward, never demotes):
--   open      → scheduled   when assigned_to IS NOT NULL AND scheduled_date IS NOT NULL
--   open      → in_progress when work_started_at OR arrived_onsite_at IS NOT NULL
--   scheduled → in_progress when work_started_at OR arrived_onsite_at IS NOT NULL
--
-- Statuses NOT touched by this trigger:
--   in_progress, completed, ready_to_invoice, closed_billed,
--   closed_no_charge, cancelled, awaiting_ahs_authorization

-- ============================================================
-- 1. Trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION fn_auto_update_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on statuses that can be promoted forward
  IF NEW.status NOT IN ('open', 'scheduled') THEN
    RETURN NEW;
  END IF;

  -- Highest priority: work has physically started → in_progress
  IF NEW.work_started_at IS NOT NULL OR NEW.arrived_onsite_at IS NOT NULL THEN
    NEW.status := 'in_progress';
    RETURN NEW;
  END IF;

  -- Next: assigned to someone with a scheduled date → scheduled
  IF NEW.assigned_to IS NOT NULL
     AND NEW.scheduled_date IS NOT NULL
     AND NEW.status = 'open'
  THEN
    NEW.status := 'scheduled';
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Attach trigger (drop first to make migration idempotent)
-- ============================================================

DROP TRIGGER IF EXISTS trg_auto_update_ticket_status ON tickets;

CREATE TRIGGER trg_auto_update_ticket_status
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_update_ticket_status();

-- ============================================================
-- 3. Backfill: fix existing tickets stuck in wrong status
-- ============================================================

-- open → in_progress (work already started but status never moved)
UPDATE tickets
SET status = 'in_progress'
WHERE status IN ('open', 'scheduled')
  AND (work_started_at IS NOT NULL OR arrived_onsite_at IS NOT NULL);

-- open → scheduled (assigned + scheduled but status never moved)
UPDATE tickets
SET status = 'scheduled'
WHERE status = 'open'
  AND assigned_to IS NOT NULL
  AND scheduled_date IS NOT NULL
  AND work_started_at IS NULL
  AND arrived_onsite_at IS NULL;

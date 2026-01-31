/*
  # Fix Ticket Timer vs Time Clock Separation

  ## Problem
  The current design only allows ONE open time_log entry per user, which causes:
  - Clocking out of a ticket also clocks out of the Time Clock entirely
  - Cannot have main clock running while working on a ticket

  ## Solution
  - Allow separate entries for main Time Clock (ticket_id IS NULL) and ticket timers (ticket_id IS NOT NULL)
  - Main clock tracks overall work hours + location sharing
  - Ticket timers track time spent on specific tickets

  ## Changes
  1. Drop old unique index that prevents multiple open entries
  2. Create two separate indexes:
     - One for main clock entries (only one per user)
     - One for ticket timer entries (only one per user)
  3. Update fn_start_ticket_work to only check for existing TICKET timers
  4. Update fn_end_ticket_work to only close TICKET timers
  5. Update fn_get_active_timer to only return TICKET timers (for TechnicianTicketView)
  6. Add new fn_get_main_clock_status for TimeClockView
*/

-- =====================================================
-- STEP 1: Update unique indexes
-- =====================================================

-- Drop the old index that prevents having both main clock and ticket timer
DROP INDEX IF EXISTS idx_time_logs_one_open_per_user;

-- Create index for main clock entries (only one main clock entry per user)
-- Main clock = ticket_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_logs_one_main_clock_per_user
ON time_logs(user_id)
WHERE clock_out_time IS NULL AND ticket_id IS NULL;

-- Create index for ticket timer entries (only one ticket timer per user at a time)
-- Ticket timer = ticket_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_logs_one_ticket_timer_per_user
ON time_logs(user_id)
WHERE clock_out_time IS NULL AND ticket_id IS NOT NULL;

-- =====================================================
-- STEP 2: Update fn_start_ticket_work
-- Only check for existing TICKET timers, not main clock
-- =====================================================

CREATE OR REPLACE FUNCTION fn_start_ticket_work(
  p_tech_id uuid,
  p_ticket_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_ticket_log record;
  v_new_log_id uuid;
  v_ticket record;
BEGIN
  -- Check for existing open TICKET time entry (NOT main clock)
  SELECT tl.id, tl.ticket_id, t.ticket_number
  INTO v_existing_ticket_log
  FROM time_logs tl
  LEFT JOIN tickets t ON t.id = tl.ticket_id
  WHERE tl.user_id = p_tech_id
    AND tl.clock_out_time IS NULL
    AND tl.ticket_id IS NOT NULL  -- Only check for ticket timers
  LIMIT 1;

  IF v_existing_ticket_log IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_timing',
      'message', format('You are currently timing Ticket %s. End or complete it before starting another.',
                       COALESCE(v_existing_ticket_log.ticket_number, 'Unknown')),
      'existing_ticket_id', v_existing_ticket_log.ticket_id
    );
  END IF;

  -- Verify ticket exists and is assigned
  SELECT id, ticket_number, status, assigned_to
  INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id;

  IF v_ticket IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ticket_not_found',
      'message', 'Ticket not found'
    );
  END IF;

  -- Create new time log entry for this ticket
  INSERT INTO time_logs (
    user_id,
    ticket_id,
    clock_in_time,
    time_type,
    status
  ) VALUES (
    p_tech_id,
    p_ticket_id,
    NOW(),
    'on_site',
    'active'
  )
  RETURNING id INTO v_new_log_id;

  -- Update ticket arrived_onsite_at if not already set
  UPDATE tickets
  SET arrived_onsite_at = COALESCE(arrived_onsite_at, NOW()),
      work_started_at = COALESCE(work_started_at, NOW()),
      status = CASE WHEN status IN ('open', 'scheduled') THEN 'in_progress' ELSE status END,
      updated_at = NOW()
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'success', true,
    'time_log_id', v_new_log_id,
    'ticket_id', p_ticket_id,
    'message', 'Timer started successfully'
  );
END;
$$;

-- =====================================================
-- STEP 3: Update fn_end_ticket_work
-- Only close TICKET timer entries, not main clock
-- =====================================================

CREATE OR REPLACE FUNCTION fn_end_ticket_work(
  p_tech_id uuid,
  p_ticket_id uuid DEFAULT NULL,
  p_mark_for_revisit boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log record;
  v_total_hours numeric;
BEGIN
  -- Find active TICKET time log (NOT main clock)
  SELECT id, clock_in_time, ticket_id
  INTO v_log
  FROM time_logs
  WHERE user_id = p_tech_id
    AND clock_out_time IS NULL
    AND ticket_id IS NOT NULL  -- Only look for ticket timers
    AND (p_ticket_id IS NULL OR ticket_id = p_ticket_id)
  LIMIT 1;

  IF v_log IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_active_timer',
      'message', 'No active ticket timer found'
    );
  END IF;

  -- Calculate total hours
  v_total_hours := EXTRACT(EPOCH FROM (NOW() - v_log.clock_in_time)) / 3600;

  -- Close the time log
  UPDATE time_logs
  SET clock_out_time = NOW(),
      total_hours = v_total_hours,
      status = 'completed',
      updated_at = NOW()
  WHERE id = v_log.id;

  -- Update ticket hours if applicable
  IF v_log.ticket_id IS NOT NULL THEN
    UPDATE tickets
    SET hours_onsite = COALESCE(hours_onsite, 0) + v_total_hours,
        actual_duration_minutes = COALESCE(actual_duration_minutes, 0) + (v_total_hours * 60),
        updated_at = NOW()
    WHERE id = v_log.ticket_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'time_log_id', v_log.id,
    'ticket_id', v_log.ticket_id,
    'total_hours', ROUND(v_total_hours, 2),
    'message', 'Ticket timer stopped successfully'
  );
END;
$$;

-- =====================================================
-- STEP 4: Update fn_get_active_timer
-- Only return TICKET timers (for TechnicianTicketView)
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_active_timer(p_tech_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log record;
BEGIN
  -- Only return TICKET timer, not main clock
  SELECT tl.id, tl.ticket_id, tl.clock_in_time, t.ticket_number
  INTO v_log
  FROM time_logs tl
  LEFT JOIN tickets t ON t.id = tl.ticket_id
  WHERE tl.user_id = p_tech_id
    AND tl.clock_out_time IS NULL
    AND tl.ticket_id IS NOT NULL  -- Only ticket timers
  LIMIT 1;

  IF v_log IS NULL THEN
    RETURN jsonb_build_object(
      'has_active_timer', false
    );
  END IF;

  RETURN jsonb_build_object(
    'has_active_timer', true,
    'time_log_id', v_log.id,
    'ticket_id', v_log.ticket_id,
    'ticket_number', v_log.ticket_number,
    'started_at', v_log.clock_in_time,
    'elapsed_minutes', EXTRACT(EPOCH FROM (NOW() - v_log.clock_in_time)) / 60
  );
END;
$$;

-- =====================================================
-- STEP 5: Update vw_active_technicians
-- Show techs who are clocked in (main clock) OR have a ticket timer
-- =====================================================

CREATE OR REPLACE VIEW vw_active_technicians AS
SELECT DISTINCT
  tl.user_id as tech_user_id,
  p.full_name,
  p.email,
  MIN(tl.clock_in_time) as clock_in_time,
  -- Get the current ticket they're working on (if any)
  (SELECT ticket_id FROM time_logs tl2
   WHERE tl2.user_id = tl.user_id
     AND tl2.clock_out_time IS NULL
     AND tl2.ticket_id IS NOT NULL
   LIMIT 1) as current_ticket_id,
  (SELECT t.ticket_number FROM time_logs tl3
   JOIN tickets t ON t.id = tl3.ticket_id
   WHERE tl3.user_id = tl.user_id
     AND tl3.clock_out_time IS NULL
     AND tl3.ticket_id IS NOT NULL
   LIMIT 1) as current_ticket_number
FROM time_logs tl
JOIN profiles p ON p.id = tl.user_id
WHERE tl.clock_out_time IS NULL
  AND p.role = 'technician'
  AND p.is_active = true
GROUP BY tl.user_id, p.full_name, p.email;

GRANT SELECT ON vw_active_technicians TO authenticated;

-- =====================================================
-- STEP 6: Add comment for documentation
-- =====================================================

COMMENT ON INDEX idx_time_logs_one_main_clock_per_user IS
'Ensures only one main clock entry (no ticket_id) per user can be open at a time. Main clock tracks overall work hours.';

COMMENT ON INDEX idx_time_logs_one_ticket_timer_per_user IS
'Ensures only one ticket timer (with ticket_id) per user can be open at a time. Ticket timers track time on specific jobs.';

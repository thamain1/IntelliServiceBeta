-- ticket_parts_used was created manually in this DB before the migration was written.
-- CREATE TABLE IF NOT EXISTS skipped the table (and its FK constraints).
-- This migration adds the missing FK constraints so PostgREST can resolve
-- embedded resources (parts!inner, tickets cascade delete, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ticket_parts_used_ticket_id_fkey'
      AND table_name    = 'ticket_parts_used'
  ) THEN
    ALTER TABLE ticket_parts_used
      ADD CONSTRAINT ticket_parts_used_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ticket_parts_used_part_id_fkey'
      AND table_name    = 'ticket_parts_used'
  ) THEN
    ALTER TABLE ticket_parts_used
      ADD CONSTRAINT ticket_parts_used_part_id_fkey
      FOREIGN KEY (part_id) REFERENCES parts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ticket_parts_used_installed_by_fkey'
      AND table_name    = 'ticket_parts_used'
  ) THEN
    ALTER TABLE ticket_parts_used
      ADD CONSTRAINT ticket_parts_used_installed_by_fkey
      FOREIGN KEY (installed_by) REFERENCES profiles(id);
  END IF;
END $$;

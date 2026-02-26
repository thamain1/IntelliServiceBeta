CREATE TABLE IF NOT EXISTS ticket_parts_used (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  part_id      uuid NOT NULL REFERENCES parts(id),
  installed_by uuid REFERENCES profiles(id),
  quantity     integer NOT NULL DEFAULT 1,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE ticket_parts_used ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_ticket_parts_used"
  ON ticket_parts_used FOR SELECT TO authenticated USING (true);

CREATE POLICY "technicians_insert_ticket_parts_used"
  ON ticket_parts_used FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
        AND (
          tickets.assigned_to = auth.uid()
          OR EXISTS (
            SELECT 1 FROM ticket_assignments ta
            WHERE ta.ticket_id = ticket_parts_used.ticket_id
              AND ta.technician_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'dispatcher', 'office_manager', 'supervisor')
          )
        )
    )
  );

CREATE POLICY "admins_manage_ticket_parts_used"
  ON ticket_parts_used FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher', 'office_manager', 'supervisor')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dispatcher', 'office_manager', 'supervisor')
  ));

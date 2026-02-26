-- user_preferences: per-user JSON preferences (notifications, theme, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences  jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_preferences"
  ON user_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_all_preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'office_manager')
  ));

-- role_permissions: per-role permission arrays managed by admins
CREATE TABLE IF NOT EXISTS role_permissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role         text NOT NULL,
  permissions  text[],
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT role_permissions_role_key UNIQUE (role)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_role_permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins_manage_role_permissions"
  ON role_permissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'office_manager')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'office_manager')
  ));

-- Seed default role permissions
INSERT INTO role_permissions (role, permissions) VALUES
  ('admin',       ARRAY['tickets.view','tickets.create','tickets.edit','tickets.delete','tickets.assign','tickets.approve',
                        'customers.view','customers.create','customers.edit','customers.delete',
                        'invoices.view','invoices.create','invoices.edit','invoices.send','invoices.void',
                        'accounting.view','accounting.journal','accounting.reconcile','accounting.reports',
                        'inventory.view','inventory.adjust','inventory.order',
                        'reports.view','reports.export',
                        'settings.view','settings.edit',
                        'users.view','users.create','users.edit']),
  ('dispatcher',  ARRAY['tickets.view','tickets.create','tickets.edit','tickets.assign',
                        'customers.view','customers.create','customers.edit',
                        'invoices.view',
                        'inventory.view','inventory.order',
                        'reports.view']),
  ('technician',  ARRAY['tickets.view',
                        'customers.view',
                        'inventory.view'])
ON CONFLICT (role) DO NOTHING;
